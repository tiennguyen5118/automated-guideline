# Architecture

## Tech Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| Frontend & Backend | Next.js (App Router) | latest stable, TypeScript |
| Styling | Tailwind CSS | v4 |
| Database | PostgreSQL | 16 |
| ORM | Drizzle ORM + Drizzle Kit | schema-first, SQL migrations |
| E2E Testing | Playwright | runs against dev or preview |
| Unit Testing | Vitest | uses Vite under the hood |
| Linting | ESLint | flat config (`eslint.config.mjs`) |
| Reverse Proxy | Nginx | terminates HTTPS via Cloudflare |
| Hosting | Linux VM | Docker Compose |
| CDN / DNS | Cloudflare | DNS, SSL, caching |
| Source Control | GitHub | `main` trunk, feature branches |
| Task Board | Azure DevOps | work items, sprints |

## Repository Layout

```
/<project-name>/
├── app/                          ← Next.js application root
│   ├── public/                   ← static assets
│   ├── src/
│   │   ├── app/                  ← App Router (pages, layouts, route handlers)
│   │   │   ├── (auth)/           ← route group for auth pages
│   │   │   ├── api/              ← Route Handlers (REST endpoints)
│   │   │   ├── layout.tsx        ← root layout
│   │   │   └── page.tsx          ← home page
│   │   ├── components/           ← React components
│   │   │   ├── ui/               ← generic UI primitives
│   │   │   └── features/         ← feature-specific components
│   │   ├── lib/                  ← shared utilities, helpers, constants
│   │   ├── db/                   ← Drizzle ORM
│   │   │   ├── schema.ts         ← table definitions
│   │   │   ├── index.ts          ← db client export
│   │   │   └── migrations/       ← generated SQL migrations
│   │   ├── actions/              ← Server Actions
│   │   └── types/                ← shared TypeScript types
│   ├── tests/
│   │   └── e2e/                  ← Playwright specs + page objects
│   ├── drizzle.config.ts
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── playwright.config.ts
│   ├── vitest.config.ts
│   ├── eslint.config.mjs
│   ├── tsconfig.json
│   ├── package.json
│   ├── .env.example
│   ├── .env.local                ← local secrets (git-ignored)
│   ├── Dockerfile                ← multi-stage production build
│   └── docker-compose.yaml        ← Postgres + Nginx + Next.js app
├── docs/
│   └── architecture.md           ← this file
├── specs/                        ← requirement, plan, test specs per work item
│   └── <workitem-type>/
│       └── <id>-<slug>/
│           ├── requirement.md
│           ├── plan.md
│           ├── tests.md
│           └── e2e-tests.md
└── README.md
```

## Application Architecture

### Frontend

- **Server Components** (default) fetch data directly via Drizzle — no API round-trip.
- **Client Components** (`"use client"`) call Route Handlers under `src/app/api/` when they need server interaction (mutations, real-time data).
- **Server Actions** in `src/actions/` handle form submissions and mutations that don't need a REST endpoint.
- Tailwind CSS v4 for all styling — no CSS modules or external UI libraries unless explicitly added.

### Backend

- Next.js Route Handlers (`src/app/api/`) serve as the REST API layer.
- Business logic lives in `src/lib/` — route handlers and server actions orchestrate, they don't contain logic directly.
- Environment variables are validated at startup using `zod` schemas.

### Database

- PostgreSQL 16 as the single data store.
- Drizzle ORM for type-safe queries; Drizzle Kit for schema-first migration generation.
- Schema is defined in `src/db/schema.ts`. Run `pnpm drizzle-kit generate` to create migrations, `pnpm drizzle-kit migrate` to apply them.
- Connection string is read from the `DATABASE_URL` environment variable.

## Infrastructure

### Local Development

```bash
cd app
docker compose up db -d          # start Postgres only
pnpm dev                         # start Next.js dev server (Turbopack)
```

### Production (Linux VM)

```
┌─────────────┐      ┌─────────────┐      ┌─────────────────┐      ┌──────────┐
│ Cloudflare  │ ===> │   Nginx     │ ===> │  Next.js App    │ ===> │ Postgres │
│ (DNS + SSL) │ 443  │ (reverse    │ 3000 │  (Node.js)      │ 5432 │          │
│             │      │  proxy)     │      │                 │      │          │
└─────────────┘      └─────────────┘      └─────────────────┘      └──────────┘
```

- **Cloudflare** handles DNS, SSL termination (Full Strict), and edge caching.
- **Nginx** listens on port 443, proxies to the Next.js container on port 3000. Handles SSL certificates from Cloudflare Origin CA.
- **Next.js** runs in production mode (`next start`) inside a Docker container.
- **PostgreSQL 16** runs as a Docker container with a named volume for persistence.

All services are defined in `app/docker-compose.yaml`.

### Docker Compose Services

| Service | Image | Ports | Notes |
|---|---|---|---|
| `app` | Built from `./Dockerfile` | 3000 (internal) | Next.js standalone build |
| `db` | `postgres:16-alpine` | 5432 | Named volume `pgdata` |
| `nginx` | `nginx:alpine` | 80, 443 | Mounts `nginx/default.conf` and certs |

## Testing Strategy

| Type | Tool | Location | Command |
|---|---|---|---|
| Unit / Integration | Vitest | `app/src/**/*.test.ts` | `pnpm test` |
| E2E | Playwright | `app/tests/e2e/` | `pnpm exec playwright test` |
| Type checking | TypeScript | — | `pnpm exec tsc --noEmit` |
| Linting | ESLint | — | `pnpm exec eslint .` |

## Branch Strategy

GitHub Flow with Azure DevOps work item integration:

- `main` is the production branch — always deployable.
- Feature branches: `feat/<id>-<slug>` (e.g., `feat/42-add-login`).
- Bug fix branches: `fix/<id>-<slug>` (e.g., `fix/58-date-picker`).
- PRs merge into `main` via squash merge.
- Commit messages are prefixed with the work item ID: `#42 add login page`.

## Environment Variables

Defined in `app/.env.local` (local) and container environment (production):

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | `postgresql://user:pass@db:5432/appdb` |
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL | `https://example.com` |

Additional variables are added as needed and documented in `app/.env.example`.
