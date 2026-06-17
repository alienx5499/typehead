import { HashRing } from './hashRing.js';

export interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

export interface CacheStats {
    hits: number;
    misses: number;
    invalidations: number;
    sets: number;
    get hitRate(): number;
}

export class DistributedCache<T> {
    private shards: Map<string, Map<string, CacheEntry<T>>> = new Map();
    private ring: HashRing;
    private stats = { hits: 0, misses: 0, invalidations: 0, sets: 0 };

    constructor(
        nodes: string[],
        public readonly ttlMs: number
    ) {
        this.ring = new HashRing(nodes, 100);
        for (const n of nodes) this.shards.set(n, new Map());
    }

    get(key: string): T | undefined {
        const node = this.ring.getNode(key);
        const shard = this.shards.get(node);
        if (!shard) return undefined;
        const entry = shard.get(key);
        if (!entry) {
            this.stats.misses++;
            return undefined;
        }
        if (entry.expiresAt < Date.now()) {
            shard.delete(key);
            this.stats.misses++;
            return undefined;
        }
        this.stats.hits++;
        return entry.value;
    }

    set(key: string, value: T): void {
        const node = this.ring.getNode(key);
        const shard = this.shards.get(node);
        if (!shard) return;
        shard.set(key, { value, expiresAt: Date.now() + this.ttlMs });
        this.stats.sets++;
    }

    invalidate(key: string): boolean {
        const node = this.ring.getNode(key);
        const shard = this.shards.get(node);
        if (!shard) return false;
        const ok = shard.delete(key);
        if (ok) this.stats.invalidations++;
        return ok;
    }

    invalidatePrefix(prefix: string): number {
        let n = 0;
        for (const shard of this.shards.values()) {
            for (const k of shard.keys()) {
                if (k.startsWith(prefix)) {
                    shard.delete(k);
                    n++;
                }
            }
        }
        if (n > 0) this.stats.invalidations += n;
        return n;
    }

    routeFor(key: string): string {
        return this.ring.getNode(key);
    }

    getStats(): CacheStats {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total === 0 ? 0 : this.stats.hits / total;
        return { ...this.stats, hitRate };
    }

    resetStats(): void {
        this.stats = { hits: 0, misses: 0, invalidations: 0, sets: 0 };
    }
}
