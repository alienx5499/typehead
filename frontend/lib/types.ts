export interface Suggestion {
    q: string;
    count: number;
    trending: number;
}

export interface SuggestResponse {
    q: string;
    source: 'cache' | 'db';
    items: Suggestion[];
}

export interface TrendingItem {
    q: string;
    count: number;
    score: number;
}

export interface TrendingResponse {
    items: TrendingItem[];
}

export interface CacheDebugResponse {
    prefix: string;
    node: string;
    invalidated: number;
}

export interface MetricsSnapshot {
    uptimeMs: number;
    requests: { total: number; byRoute: Record<string, number> };
    latencyMs: { p50: number; p95: number; count: number };
    cache: { hits: number; misses: number; hitRate: number; invalidations: number };
    writes: { queued: number; flushed: number; replayed: number };
}
