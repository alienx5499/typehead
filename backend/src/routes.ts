import type { Request, Response, NextFunction } from 'express';
import type { Db } from './db.js';
import type { BatchWriter } from './batchWriter.js';
import type { Metrics } from './metrics.js';
import { makeSuggest, type Suggestion } from './suggest.js';
import { normalizeQuery, trendingScore } from './trending.js';
import type { DistributedCache } from './cache.js';

export interface RoutesDeps {
    db: Db;
    writer: BatchWriter;
    suggestCache: DistributedCache<Suggestion[]>;
    metrics: Metrics;
}

function timing<T>(res: Response, route: string, metrics: Metrics, fn: () => T): T {
    const start = Date.now();
    try {
        return fn();
    } finally {
        metrics.recordRequest(route, Date.now() - start);
        const s = metrics.snapshot();
        res.setHeader('X-Latency-P50', String(s.latencyMs.p50));
        res.setHeader('X-Latency-P95', String(s.latencyMs.p95));
    }
}

export function buildRoutes(deps: RoutesDeps) {
    const suggest = makeSuggest({ db: deps.db, cache: deps.suggestCache });

    return {
        suggest: (req: Request, res: Response, next: NextFunction) => {
            try {
                const q = String(req.query.q ?? '').slice(0, 200);
                const trending = String(req.query.trending ?? '') === '1';
                const result = timing(res, '/api/suggest', deps.metrics, () =>
                    suggest(q, trending)
                );
                res.json({ q, source: result.source, items: result.items });
            } catch (e) {
                next(e);
            }
        },

        search: (req: Request, res: Response, next: NextFunction) => {
            try {
                timing(res, '/api/search', deps.metrics, () => undefined);
                const q = String(req.body?.q ?? '').slice(0, 200);
                const norm = normalizeQuery(q);
                if (norm.length === 0) {
                    res.status(400).json({ error: 'q required' });
                    return;
                }
                deps.writer.enqueue(norm);
                res.json({ message: 'Searched', q: norm });
            } catch (e) {
                next(e);
            }
        },

        cacheDebug: (req: Request, res: Response, next: NextFunction) => {
            try {
                timing(res, '/api/cache/debug', deps.metrics, () => undefined);
                const prefix = String(req.query.prefix ?? '');
                const normalized = normalizeQuery(prefix);
                const node = (deps.suggestCache.routeFor(`suggest:c:${normalized}`) ||
                    deps.suggestCache.routeFor(normalized)) as string;
                const invalidated = prefix
                    ? deps.suggestCache.invalidatePrefix(`suggest::${prefix}`)
                    : 0;
                res.json({ prefix: normalized, node, invalidated });
            } catch (e) {
                next(e);
            }
        },

        metrics: (_req: Request, res: Response, next: NextFunction) => {
            try {
                timing(res, '/api/metrics', deps.metrics, () => undefined);
                const s = deps.metrics.snapshot();
                const cs = deps.suggestCache.getStats();
                s.cache = {
                    ...s.cache,
                    hits: cs.hits,
                    misses: cs.misses,
                    invalidations: cs.invalidations,
                    hitRate: cs.hitRate,
                };
                res.json(s);
            } catch (e) {
                next(e);
            }
        },

        trending: (_req: Request, res: Response, next: NextFunction) => {
            try {
                timing(res, '/api/trending', deps.metrics, () => undefined);
                const rows = deps.db
                    .prepare(
                        'SELECT q, count, last_seen FROM queries ORDER BY count DESC LIMIT 1000'
                    )
                    .all() as { q: string; count: number; last_seen: number }[];
                const ranked = rows
                    .map((r) => ({
                        q: r.q,
                        count: r.count,
                        score: trendingScore(r.count, r.last_seen),
                    }))
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 10);

                res.json({ items: ranked });
            } catch (e) {
                next(e);
            }
        },
    };
}
