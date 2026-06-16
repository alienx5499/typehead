import fs from 'node:fs';
import path from 'node:path';
import { openDb, initSchema } from '../src/db.js';

const SEED_COUNT = Number(process.env.SEED_COUNT ?? '100000');
const DATA_PATH = path.resolve(process.env.DATA_PATH ?? 'data/ngrams_raw.txt');

async function main() {
 const { db, persist } = await openDb({ path: path.resolve('dist/data/typehead.db') });
 initSchema(db);

 const raw = fs.readFileSync(DATA_PATH, 'utf8');
 const lines = raw.trim().split('\n').slice(0, SEED_COUNT);

 const stmt = db.prepare(`
 INSERT INTO queries (q, count, first_seen, last_seen, trending_score)
 VALUES (?, ?, ?, ?, 0)
 ON CONFLICT(q) DO UPDATE SET
 count = count + excluded.count,
 last_seen = MAX(last_seen, excluded.last_seen)
 `);

 const txn = db.transaction((rows: string[]) => {
 for (const line of rows) {
 const [q, countStr] = line.split('\t');
 if (!q || !countStr) continue;
 const count = Number(countStr);
 stmt.run(q, count, Date.now(), Date.now());
 }
 });

 console.log(`Seeding ${lines.length} queries from ${DATA_PATH}`);
 txn(lines);
 persist();
 console.log('Done.');
}

main().catch((e) => {
 console.error(e);
 process.exit(1);
});