FROM node:26
WORKDIR /app
RUN npm install -g pnpm@9
COPY package.json ./
RUN pnpm install
COPY . .
RUN pnpm build
ENV NEXT_PUBLIC_API_URL=http://localhost:4002
ENV PORT=4001 HOSTNAME=0.0.0.0
EXPOSE 4001
CMD ["pnpm", "start"]
