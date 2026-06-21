FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@9
ENV DB_PATH=/app/data/typehead.db SNAPSHOT_PATH=/app/data/pending_writes.json
COPY package.json ./
RUN pnpm install
COPY . .
RUN mkdir -p /app/data
COPY data/ngrams_raw.txt /app/data/ngrams_raw.txt
RUN pnpm --filter @typehead/backend build
RUN DB_PATH=/app/data/typehead.db DATA_PATH=/app/data/ngrams_raw.txt node dist/scripts/seed.js
ENV PORT=4002 NODE_ID=node-1
EXPOSE 4002
CMD ["pnpm", "start"]
