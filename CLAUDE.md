# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Authoritative references (read before planning or editing):
- [docs/architecture.md](docs/architecture.md) — tech stack, repo layout, infra, testing matrix
- [docs/convention.md](docs/convention.md) — Next.js/TypeScript coding conventions (file naming, folder structure, TS rules, RSC/client split, Server Actions, Route Handlers, Drizzle, Tailwind v4, testing, etc.)

When these docs conflict with anything below, the docs win.

## Project Overview

Full-stack web app: Next.js 15 (App Router) + React 19 + TypeScript 5, Tailwind CSS v4, Drizzle ORM on PostgreSQL 16. Source control on GitHub; work items tracked in Azure DevOps. Production runs behind Nginx + Cloudflare on a Linux VM via Docker Compose.

## Repository Layout

```
./
├── app/                       ← Next.js application + docker-compose
│   ├── src/
│   │   ├── app/               ← App Router (pages, layouts, route handlers in api/)
│   │   ├── components/        ← ui/, app/ (mirrors src/app/ segments 1:1), auth/, icons/, landing/, layout/
│   │   ├── contexts/          ← React Context providers
│   │   ├── services/          ← data/API clients and domain services
│   │   ├── hooks/             ← shared hooks
│   │   ├── lib/               ← cross-cutting utils (db, auth, logger, zod, server actions)
│   │   ├── actions/           ← Server Actions
│   │   ├── db/                ← Drizzle schema/ + migrations/
│   │   └── types/             ← shared global types
│   └── tests/e2e/             ← Playwright specs + page objects
├── docs/                      ← architecture.md, convention.md
└── specs/<workitem-type>/<id>-<slug>/   ← requirement.md, plan.md, tests.md, e2e-tests.md
```

Import direction: `app → contexts → components → services → hooks → lib`. Never upward. Group by kind, not by feature (no `features/` folder). See [docs/convention.md](docs/convention.md) §2.

Route segments are explicit, descriptive `kebab-case` words (e.g. `guidelines/`, not `g/`). See §1.

## Common Commands

All commands run from `app/`:

```bash
# Dev server (Turbopack)
pnpm dev

# Unit tests (Vitest)
pnpm test
pnpm test -- --run src/path/to/file.test.ts

# E2E tests (Playwright)
pnpm exec playwright test

# Lint & type-check
pnpm exec eslint .
pnpm exec tsc --noEmit

# Database migrations (Drizzle Kit)
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# Local Postgres
docker compose up db -d
```

## Architecture Notes

- **Server Components** (default) fetch data directly via Drizzle — no API round-trip.
- **Client Components** (`'use client'`) call Route Handlers (`src/app/api/<resource>/route.ts`) or Server Actions.
- **Server Actions** in `src/actions/` (or colocated under `services/`) handle mutations; always Zod-validate input and return `{ ok: true; data } | { ok: false; error }`.
- **Route Handlers** delegate to `services/<domain>.ts`; no business logic in handlers.
- Environment variables validated at startup via Zod in `lib/env.ts`. Local config lives in `app/.env.local` (copy from `.env.example`). No `process.env.X` reads outside `lib/env.ts`.
- Tailwind v4 utility-first; tokens in `@theme` block in `globals.css`; merge classes with `cn()`.
- Vite is only used for Vitest — Next.js uses Turbopack (dev) / webpack (prod).

## Coding Principles

Apply on every edit, not just new features:

1. **Think before coding.** Surface assumptions and tradeoffs. If a request has multiple reasonable interpretations, name them before picking one.
2. **Simplicity first.** Minimum code that solves the stated problem. No speculative abstractions, no error handling for cases that can't happen.
3. **Surgical changes.** Match surrounding style. Don't refactor unbroken code. Only remove imports/functions your change rendered obsolete.
4. **Goal-driven execution.** Turn the request into a verifiable success criterion (test, command, observable behavior) and loop until it passes.
5. **Follow the conventions.** Before proposing routes, folders, or file names, consult [docs/convention.md](docs/convention.md) §1–§2.

## Workflow — Skills & Work Items

This repo uses Claude Code skills for a structured dev workflow tied to Azure DevOps work items:

1. `/work-on <id>` — set active work item, switch to `feat/<id>-<slug>` or `fix/<id>-<slug>`
2. `/analyze-requirement <id>` — fetch work item, write `specs/<type>/<id>-<slug>/requirement.md`
3. `/write-plan` — generate `plan.md` from the requirement
4. `/implement-plan` — execute the plan step by step
5. `/write-tests` / `/implement-tests` — unit/integration test plan and implementation
6. `/write-e2e-tests` / `/implement-e2e-tests` — Playwright E2E test plan and implementation
7. `/commit <message>` — commit with `#<id>` prefix, push
8. `/update-ticket` — sync spec artifacts back to Azure DevOps

Active work item ID is stored in `.claude/current-workitem`.

## Branch Strategy

GitHub Flow: feature branches off `main`, PRs back to `main` via squash merge. Branch naming: `feat/<id>-<slug>` or `fix/<id>-<slug>`. Commit subjects prefixed with `#<id>`, Conventional Commits style (see [docs/convention.md](docs/convention.md) §24).
