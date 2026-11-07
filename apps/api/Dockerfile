FROM node:26-bookworm-slim

WORKDIR /app

RUN npm install -g pnpm@12.16.1

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["pnpm", "start:dev"]
