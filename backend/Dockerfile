FROM node:26
WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@9
ENV DB_PATH=/app/data/typehead.db SNAPSHOT_PATH=/app/data/pending_writes.json
COPY package.json ./
RUN pnpm install
COPY . .
RUN pnpm build
RUN mkdir -p /app/data && pnpm seed
ENV PORT=4002 NODE_ID=node-1
EXPOSE 4002
CMD ["pnpm", "start"]
