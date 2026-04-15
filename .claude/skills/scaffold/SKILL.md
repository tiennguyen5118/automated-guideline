---
name: scaffold
description: Scaffold a Next.js app (App Router, TypeScript, Tailwind v4, Drizzle ORM) with Docker Compose running PostgreSQL 16 into an `app/` folder at the current project root. Follows the architecture defined in `docs/architecture.md` and the conventions in `docs/convention.md`.
---

Scaffold a full-stack project in the current working directory. No arguments needed.

The current working directory is the project root (same level as `.claude/`). All paths below are relative to it:

```
./
├── .claude/          ← already exists
├── app/              ← Next.js app + docker-compose.yaml (created by this skill)
└── docs/
    ├── architecture.md  ← already exists — use this as the reference for project structure
    └── convention.md    ← already exists — use this as the reference for coding conventions
```

## Step 1 — Read architecture.md and convention.md

Read `docs/architecture.md` to understand the expected project structure and technology choices, and `docs/convention.md` to understand the coding conventions, before proceeding.

## Step 2 — Scaffold Next.js app

Run from the project root:

```bash
pnpm create next-app@latest app \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --no-turbopack \
  --import-alias "@/*" \
  --yes
```

## Step 3 — Install additional dependencies

Run from `app/`:

```bash
cd app
pnpm add drizzle-orm pg
pnpm add -D drizzle-kit vitest @vitejs/plugin-react vite @playwright/test tsx @types/pg
```

## Step 4 — Create Drizzle DB module

Create `app/src/db/schema.ts`:
```ts
// Define your Drizzle ORM tables here.
// Example:
// import { pgTable, serial, text } from "drizzle-orm/pg-core";
// export const users = pgTable("users", { id: serial("id").primaryKey(), name: text("name") });
export {};
```

Create `app/src/db/index.ts`:
```ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

export const db = drizzle(pool, { schema });
```

## Step 5 — Create app/drizzle.config.ts

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

## Step 6 — Create app/vite.config.ts (Vitest)

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
```

Add a `test` script to `app/package.json` if not already present:
```json
"test": "vitest"
```

## Step 7 — Create app/.env.example

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/appdb
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

Copy it to `.env`:
```bash
cp app/.env.example app/.env
```

## Step 8 — Create app/Dockerfile

Set `output: "standalone"` in `app/next.config.ts` so the build emits `.next/standalone`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

Create `app/Dockerfile`:

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

Create `app/.dockerignore`:

```
node_modules
.next
.git
.env*
!.env.example
npm-debug.log
Dockerfile
.dockerignore
tests
playwright-report
test-results
README.md
```

## Step 9 — Create app/docker-compose.yaml

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/appdb
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: appdb
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d appdb"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  pgdata:
```

## Step 10 — Print summary

Print:
```
Scaffold complete.

Next steps:
  1. Edit app/.env if DATABASE_URL needs changing
  2. cd app && docker compose up db -d
  3. cd app && pnpm drizzle-kit migrate
  4. pnpm dev         → http://localhost:3000
  5. pnpm test        → Vitest unit tests
```
