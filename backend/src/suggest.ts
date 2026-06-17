import type { Db } from './db.js';
import { DistributedCache } from './cache.js';
import { trendingScore, normalizeQuery } from './trending.js';

export interface Suggestion {
    q: string;
    count: number;
    trending: number;
}

export interface SuggestOptions {
    db: Db;
    cache: DistributedCache<Suggestion[]>;
    limit?: number;
    minPrefixLen?: number;
}

export function makeSuggest(opts: SuggestOptions) {
    const limit = opts.limit ?? 10;
    const minPrefix = opts.minPrefixLen ?? 1;
    const cacheKey = (q: string, trending: boolean) => `suggest:${trending ? 't' : 'c'}:${q}`;

    return function suggest(
        rawQ: string,
        trending: boolean
    ): { source: 'cache' | 'db'; items: Suggestion[] } {
        const q = normalizeQuery(rawQ);
        if (q.length < minPrefix) return { source: 'db', items: [] };
        const key = cacheKey(q, trending);
        const cached = opts.cache.get(key);
        if (cached) return { source: 'cache', items: cached };
        const like = `${q}%`;
        const stmt = opts.db.prepare(
            `SELECT q, count, last_seen FROM queries WHERE q LIKE ? ORDER BY count DESC LIMIT ?`
        );
        const rows = stmt.all(like, limit) as { q: string; count: number; last_seen: number }[];
        const items: Suggestion[] = rows.map((row) => {
            const trending_ = trendingScore(row.count, row.last_seen);
            return { q: row.q, count: row.count, trending: trending_ };
        });
        opts.cache.set(key, items);
        return { source: 'db', items };
    };
}
