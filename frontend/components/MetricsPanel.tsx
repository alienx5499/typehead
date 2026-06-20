'use client';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { MetricsSnapshot } from '../lib/types';

const REFRESH_MS = 2000;

function pct(v: number) {
    return (v * 100).toFixed(1) + '%';
}

function ms(v: number) {
    return v < 1000 ? v.toFixed(1) + 'ms' : (v / 1000).toFixed(2) + 's';
}

export function MetricsPanel() {
    const [m, setM] = useState<MetricsSnapshot | null>(null);

    useEffect(() => {
        let cancelled = false;
        const tick = () =>
            api
                .metrics()
                .then((d) => !cancelled && setM(d))
                .catch(() => !cancelled || undefined);
        tick();
        const id = setInterval(tick, REFRESH_MS);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, []);

    return (
        <div className="border border-[var(--color-line-strong)] bg-[var(--color-surface)]">
            <div className="border-b border-[var(--color-line-strong)] px-6 py-3 font-mono text-xs uppercase tracking-wider text-[var(--color-fg)]">
                system
            </div>
            {!m ? (
                <div className="px-6 py-5 font-mono text-sm text-[var(--color-muted)]">
                    loading...
                </div>
            ) : (
                <dl className="divide-y divide-[var(--color-line)] font-mono text-sm">
                    <Row k="uptime" v={ms(m.uptimeMs / 1000)} />
                    <Row k="requests" v={String(m.requests.total)} />
                    <Row k="latency p50" v={ms(m.latencyMs.p50)} />
                    <Row k="latency p95" v={ms(m.latencyMs.p95)} />
                    <Row k="cache hit rate" v={pct(m.cache.hitRate)} />
                    <Row k="cache hits" v={String(m.cache.hits)} />
                    <Row k="cache misses" v={String(m.cache.misses)} />
                    <Row k="invalidations" v={String(m.cache.invalidations)} />
                    <Row k="writes queued" v={String(m.writes.queued)} />
                    <Row k="writes flushed" v={String(m.writes.flushed)} />
                    <Row k="writes replayed" v={String(m.writes.replayed)} />
                </dl>
            )}
        </div>
    );
}

function Row({ k, v }: { k: string; v: string }) {
    return (
        <div className="flex items-center justify-between px-6 py-3">
            <dt className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                {k}
            </dt>
            <dd className="tabular-nums text-[var(--color-fg)]">{v}</dd>
        </div>
    );
}
