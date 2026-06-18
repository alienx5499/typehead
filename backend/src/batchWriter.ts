import fs from 'node:fs';
import path from 'node:path';
import type { Db } from './db.js';

export interface BatchWriterOptions {
    db: Db;
    persist: () => void;
    snapshotPath: string;
    flushIntervalMs: number;
    maxBatch: number;
}

interface QueuedWrite {
    q: string;
    delta: number;
    ts: number;
}

export class BatchWriter {
    private queue: QueuedWrite[] = [];
    private timer: NodeJS.Timeout | null = null;
    private flushed = 0;
    private replayed = 0;
    private onFlush: ((kind: 'queued' | 'flushed' | 'replayed', n: number) => void) | null = null;

    constructor(public readonly opts: BatchWriterOptions) {}

    setMetricsSink(sink: (kind: 'queued' | 'flushed' | 'replayed', n: number) => void): void {
        this.onFlush = sink;
    }

    start(): void {
        this.replayIfCrashed();
        this.timer = setInterval(() => this.flush(), this.opts.flushIntervalMs);
    }

    stop(): void {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
        this.flush();
    }

    enqueue(q: string, delta = 1): void {
        this.queue.push({ q, delta, ts: Date.now() });
        this.onFlush?.('queued', 1);
        if (this.queue.length >= this.opts.maxBatch) this.flush();
    }

    private replayIfCrashed(): void {
        if (!fs.existsSync(this.opts.snapshotPath)) return;
        try {
            const raw = fs.readFileSync(this.opts.snapshotPath, 'utf8');
            const entries = JSON.parse(raw) as QueuedWrite[];
            this.queue.push(...entries);
            this.replayed = entries.length;
            this.onFlush?.('replayed', entries.length);
            fs.unlinkSync(this.opts.snapshotPath);
        } catch {
            // corrupt snapshot, drop it
            fs.unlinkSync(this.opts.snapshotPath);
        }
    }

    flush(): void {
        if (this.queue.length === 0) return;
        const batch = this.queue;
        this.queue = [];
        const seen = new Map<string, { delta: number; ts: number }>();
        for (const w of batch) {
            const prev = seen.get(w.q);
            if (prev) {
                prev.delta += w.delta;
                prev.ts = Math.max(prev.ts, w.ts);
            } else {
                seen.set(w.q, { delta: w.delta, ts: w.ts });
            }
        }
        const upsert = this.opts.db.prepare(`
 INSERT INTO queries (q, count, first_seen, last_seen, trending_score)
 VALUES (?, ?, ?, ?, 0)
 ON CONFLICT(q) DO UPDATE SET
 count = count + excluded.count,
 last_seen = MAX(last_seen, excluded.last_seen)
 `);
        const lookup = this.opts.db.prepare(`SELECT first_seen FROM queries WHERE q = ?`);
        const txn = this.opts.db.transaction(
            (entries: Iterable<[string, { delta: number; ts: number }]>) => {
                for (const [q, { delta, ts }] of entries) {
                    const existing = lookup.get(q) as { first_seen: number } | undefined;
                    const firstSeen = existing ? existing.first_seen : ts;
                    upsert.run(q, delta, firstSeen, ts);
                }
            }
        );
        try {
            txn(seen.entries());
        } catch (e) {
            // better-sqlite3 transactions auto-rollback on throw
            throw e;
        }
        this.opts.persist();
        this.flushed += seen.size;
        this.onFlush?.('flushed', seen.size);
    }
}
