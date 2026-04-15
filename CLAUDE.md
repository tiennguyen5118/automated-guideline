# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack web application built with Next.js (App Router), TypeScript, Tailwind CSS v4, and Drizzle ORM backed by PostgreSQL 16. Source control is on GitHub; work items are tracked in Azure DevOps.

## Repository Layout

```
./
├── app/              ← Next.js application (frontend + backend + docker-compose)
│   ├── src/app/      ← App Router pages, layouts, API routes
│   ├── src/components/
│   ├── src/lib/
│   ├── src/db/       ← Drizzle ORM schema + migrations
│   └── tests/e2e/    ← Playwright tests
├── docs/             ← architecture.md
└── specs/            ← requirement.md, plan.md, tests.md per work item
```

## Common Commands

All commands run from `app/`:

```bash
# Dev server
pnpm dev

# Unit tests (Vitest)
pnpm test
pnpm test -- --run src/path/to/file.test.ts   # single test

# E2E tests (Playwright)
pnpm exec playwright test

# Lint & type-check
pnpm exec eslint .
pnpm exec tsc --noEmit

# Database migrations (Drizzle Kit)
pnpm drizzle-kit generate    # create migration from schema changes
pnpm drizzle-kit migrate     # apply migrations

# Local Postgres
docker compose up db -d
```

## Architecture Notes

- **Server Components** fetch data directly via Drizzle; **Client Components** call Route Handlers (`src/app/api/`).
- Environment variables are validated at startup with `zod`. Local config lives in `app/.env.local` (copy from `.env.example`).
- Vite is only used for Vitest — Next.js uses its own bundler (Turbopack in dev, webpack in prod).
- Production runs behind Nginx + Cloudflare on a Linux VM via Docker Compose.

## Coding Principles

Apply these on every edit, not just new features:

1. **Think before coding.** Surface assumptions and tradeoffs. If a request has multiple reasonable interpretations, name them before picking one. Don't hide confusion.
2. **Simplicity first.** Write the minimum code that solves the stated problem. No speculative abstractions, no flexibility for hypothetical future needs, no error handling for cases that can't happen. Ask: would a senior engineer call this overcomplicated?
3. **Surgical changes.** Match the surrounding style. Don't refactor unbroken code. Only remove imports/functions that *your* change rendered obsolete — leave pre-existing dead code alone.
4. **Goal-driven execution.** Turn the request into a verifiable success criterion (a test, a command, an observable behavior) and loop until it passes, rather than stopping at "looks right".

## Workflow — Skills & Work Items

This repo uses Claude Code skills for a structured dev workflow tied to Azure DevOps work items:

1. `/work-on <id>` — set active work item, switch to `feat/<id>-<slug>` or `fix/<id>-<slug>` branch
2. `/analyze-requirement <id>` — fetch work item from Azure DevOps, write `specs/<type>/<id>-<slug>/requirement.md`
3. `/write-plan` — generate `plan.md` from the requirement
4. `/implement-plan` — execute the plan step by step
5. `/write-tests` / `/implement-tests` — unit/integration test plan and implementation
6. `/write-e2e-tests` / `/implement-e2e-tests` — Playwright E2E test plan and implementation
7. `/commit <message>` — commit with `#<id>` prefix, push using Azure DevOps PAT from `.env`
8. `/update-ticket` — sync spec artifacts back to Azure DevOps work item

The active work item ID is stored in `.claude/current-workitem`.

## Branch Strategy

GitHub Flow: feature branches off `main`, PRs back to `main`. Branch naming: `feat/<id>-<slug>` for features, `fix/<id>-<slug>` for bugs.
