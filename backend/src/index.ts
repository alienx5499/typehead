import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { openDb, initSchema } from './db.js';
import { DistributedCache } from './cache.js';
import { BatchWriter } from './batchWriter.js';
import { Metrics } from './metrics.js';
import { buildRoutes } from './routes.js';
import type { Suggestion } from './suggest.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT ?? 4002);
const NODE_ID = process.env.NODE_ID ?? 'node-1';
const CACHE_NODES = (process.env.CACHE_NODES ?? 'node-1,node-2,node-3,node-4').split(',');
const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, '..', 'data', 'typehead.db');
const SNAPSHOT_PATH =
    process.env.SNAPSHOT_PATH ?? path.join(__dirname, '..', 'data', 'pending_writes.json');

async function main(): Promise<void> {
    const { db, persist } = await openDb({ path: DB_PATH });
    initSchema(db);

    const suggestCache = new DistributedCache<Suggestion[]>(CACHE_NODES, 60_000);
    const metrics = new Metrics();

    const writer = new BatchWriter({
        db,
        persist,
        snapshotPath: SNAPSHOT_PATH,
        flushIntervalMs: 2_000,
        maxBatch: 500,
    });
    writer.setMetricsSink((k, n) => metrics.recordWrite(k, n));
    writer.start();

    const routes = buildRoutes({ db, writer, suggestCache, metrics });

    const app = express();
    app.use(cors());
    app.use(express.json({ limit: '64kb' }));

    app.get('/api/suggest', routes.suggest);
    app.post('/api/search', routes.search);
    app.get('/api/cache/debug', routes.cacheDebug);
    app.get('/api/metrics', routes.metrics);
    app.get('/api/trending', routes.trending);
    app.get('/api/health', (_req, res) => res.json({ ok: true, node: NODE_ID }));

    app.use(
        (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
            // eslint-disable-next-line no-console
            console.error('[error]', err);
            res.status(500).json({ error: 'internal' });
        }
    );

    const server = app.listen(PORT, () => {
        // eslint-disable-next-line no-console
        console.log(`[typehead] node=${NODE_ID} listening on :${PORT}, db=${DB_PATH}`);
    });

    const shutdown = () => {
        // eslint-disable-next-line no-console
        console.log('[typehead] shutting down...');
        writer.stop();
        try {
            persist();
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[shutdown] persist failed', e);
        }
        server.close(() => process.exit(0));
        setTimeout(() => process.exit(1), 5_000).unref();
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

main().catch((e) => {
    // eslint-disable-next-line no-console
    console.error('[fatal]', e);
    fs.writeFileSync(path.join(__dirname, '..', 'data', 'crash.log'), String(e?.stack ?? e));
    process.exit(1);
});
