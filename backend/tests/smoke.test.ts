import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';

const BASE = process.env.TYPEHEAD_BASE ?? 'http://localhost:4002';

function get(path: string) {
    return new Promise<{ status: number; body: any }>((resolve, reject) => {
        const url = new URL(path, BASE);
        http.get(url, (res) => {
            let data = '';
            res.on('data', (c) => (data += c));
            res.on('end', () => {
                let parsed;
                try {
                    parsed = JSON.parse(data);
                } catch {
                    parsed = data;
                }
                resolve({ status: res.statusCode ?? 0, body: parsed });
            });
        }).on('error', reject);
    });
}

describe('typehead e2e', () => {
    it('health returns ok', async () => {
        const r = await get('/api/health');
        expect(r.status).toBe(200);
        expect(r.body.ok).toBe(true);
    });

    it('suggest returns items from db (cold miss -> db), then cache hit', async () => {
        const r1 = await get('/api/suggest?q=ja&trending=0');
        expect(r1.status).toBe(200);
        expect(r1.body.source).toBe('db');
        expect(r1.body.items.length).toBeGreaterThan(0);
        expect(r1.body.items[0].q).toMatch(/^ja/);

        const r2 = await get('/api/suggest?q=ja&trending=0');
        expect(r2.body.source).toBe('cache');
        expect(r2.body.items).toEqual(r1.body.items);
    });

    it('trending returns words sorted by count desc', async () => {
        const r = await get('/api/trending');
        expect(r.status).toBe(200);
        expect(r.body.items.length).toBeGreaterThan(0);
        for (let i = 1; i < r.body.items.length; i++) {
            expect(r.body.items[i - 1].count).toBeGreaterThanOrEqual(r.body.items[i].count);
        }
    });

    it('metrics exposes counters', async () => {
        const r = await get('/api/metrics');
        expect(r.status).toBe(200);
        expect(typeof r.body.requests.total).toBe('number');
        expect(typeof r.body.cache.hitRate).toBe('number');
        expect(r.body.cache.hitRate).toBeGreaterThanOrEqual(0);
        expect(r.body.cache.hitRate).toBeLessThanOrEqual(1);
    });
});
