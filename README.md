# Search Typeahead

Production-style autocomplete with consistent hashing, distributed cache, time-decayed trending, batched writes.

## Stack

Frontend: Next.js 14, React 18, TypeScript
Backend: Express 4, TypeScript
Storage: better-sqlite3 (SQLite WAL)
Test: Vitest

## Run

```
pnpm install
pnpm --filter @typehead/backend seed
docker compose up -d --build
```

Frontend: http://localhost:4001
Backend: http://localhost:4002

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Liveness check |
| GET | `/api/suggest?q=` | Autocomplete (top 10) |
| POST | `/api/search` | Record search |
| GET | `/api/trending` | Top trending queries |
| GET | `/api/metrics` | Latency p50/p95, cache hit rate |
| GET | `/api/cache/debug?prefix=` | Inspect cache shard |