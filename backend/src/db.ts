import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

export type Db = Database.Database;

export interface OpenOptions {
 path: string;
}

export function openDb(opts: OpenOptions): { db: Db; persist: () => void } {
 fs.mkdirSync(path.dirname(opts.path), { recursive: true });
 const db = new Database(opts.path);
 db.pragma('journal_mode = WAL');
 db.pragma('synchronous = NORMAL');
 const persist = () => {
 db.pragma('wal_checkpoint(TRUNCATE)');
 };
 return { db, persist };
}

export function initSchema(db: Db): void {
 db.exec(`
 CREATE TABLE IF NOT EXISTS queries (
 q TEXT PRIMARY KEY,
 count BIGINT NOT NULL DEFAULT 0,
 first_seen INTEGER NOT NULL,
 last_seen INTEGER NOT NULL,
 trending_score REAL NOT NULL DEFAULT 0
 );
 `);
 db.exec(`CREATE INDEX IF NOT EXISTS idx_queries_count ON queries(count DESC);`);
 db.exec(`CREATE INDEX IF NOT EXISTS idx_queries_trending ON queries(trending_score DESC);`);
}