export interface MetricsSnapshot {
    uptimeMs: number;
    requests: {
        total: number;
        byRoute: Record<string, number>;
    };
    latencyMs: {
        p50: number;
        p95: number;
        count: number;
    };
    cache: {
        hits: number;
        misses: number;
        hitRate: number;
        invalidations: number;
    };
    writes: {
        queued: number;
        flushed: number;
        replayed: number;
    };
}

export class Metrics {
    private start = Date.now();
    private total = 0;
    private byRoute: Record<string, number> = {};
    private samples: number[] = [];
    private cacheStats = { hits: 0, misses: 0, invalidations: 0 };
    private writeStats = { queued: 0, flushed: 0, replayed: 0 };

    recordRequest(route: string, latencyMs: number): void {
        this.total++;
        this.byRoute[route] = (this.byRoute[route] ?? 0) + 1;
        this.samples.push(latencyMs);
        if (this.samples.length > 10_000) this.samples.shift();
    }

    setCacheStats(stats: { hits: number; misses: number; invalidations: number }): void {
        this.cacheStats = stats;
    }

    recordWrite(kind: 'queued' | 'flushed' | 'replayed', n = 1): void {
        this.writeStats[kind] += n;
    }

    snapshot(): MetricsSnapshot {
        const total = this.cacheStats.hits + this.cacheStats.misses;
        const hitRate = total === 0 ? 0 : this.cacheStats.hits / total;
        return {
            uptimeMs: Date.now() - this.start,
            requests: { total: this.total, byRoute: { ...this.byRoute } },
            latencyMs: {
                p50: this.percentile(50),
                p95: this.percentile(95),
                count: this.samples.length,
            },
            cache: { ...this.cacheStats, hitRate },
            writes: { ...this.writeStats },
        };
    }

    private percentile(p: number): number {
        if (this.samples.length === 0) return 0;
        const sorted = [...this.samples].sort((a, b) => a - b);
        const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
        return sorted[idx];
    }
}
