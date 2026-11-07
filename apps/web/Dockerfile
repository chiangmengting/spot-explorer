FROM node:26-bookworm-slim AS builder

WORKDIR /app

RUN npm install -g pnpm@12.16.1

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

ARG API_INTERNAL_URL=http://api:3000
ENV API_INTERNAL_URL=${API_INTERNAL_URL}

RUN pnpm build

FROM node:26-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
