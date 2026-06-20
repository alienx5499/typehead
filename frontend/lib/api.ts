import type {
    SuggestResponse,
    TrendingResponse,
    CacheDebugResponse,
    MetricsSnapshot,
} from './types';

const BASE =
    typeof window === 'undefined'
        ? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002')
        : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002');

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${url}`, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return res.json() as Promise<T>;
}

export const api = {
    suggest(q: string, trending: boolean, signal?: AbortSignal): Promise<SuggestResponse> {
        const params = new URLSearchParams({ q, trending: trending ? '1' : '0' });
        return fetchJson<SuggestResponse>(`/api/suggest?${params}`, { signal });
    },
    search(q: string): Promise<{ status: string; q: string }> {
        return fetchJson('/api/search', { method: 'POST', body: JSON.stringify({ q }) });
    },
    trending(): Promise<TrendingResponse> {
        return fetchJson<TrendingResponse>('/api/trending');
    },
    cacheDebug(prefix: string): Promise<CacheDebugResponse> {
        return fetchJson<CacheDebugResponse>(
            `/api/cache/debug?prefix=${encodeURIComponent(prefix)}`
        );
    },
    metrics(): Promise<MetricsSnapshot> {
        return fetchJson<MetricsSnapshot>('/api/metrics');
    },
    health(): Promise<{ ok: boolean; node: string }> {
        return fetchJson('/api/health');
    },
};
