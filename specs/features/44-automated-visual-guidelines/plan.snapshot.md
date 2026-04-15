# Implementation Plan: Automated Visual Guidelines

**Work Item:** User Story #44
**Requirement:** [requirement.md](./requirement.md)

---

## Summary

Build a Next.js feature that lets an Author paste a guideline, runs an LLM-backed generation job that emits a Mermaid diagram spec (flowchart for procedural / infographic-style "mindmap" for declarative content), renders the result client-side, and supports regenerate + publish to a shareable URL. Guidelines and their Visualizations are persisted in PostgreSQL via Drizzle. The system is minimal, server-rendered where possible, and uses Server Actions for mutations.

---

## Approach

- **Synchronous generation over async job queue.** AC8 caps first preview at 60s which fits comfortably inside a Route Handler / Server Action timeout; introducing a worker, queue, or polling layer is speculative complexity. The `generation_jobs` table still exists (per the requirement's Model) but is written synchronously — one row per generation attempt, recording `status`, `error`, `latency_ms`. This leaves an upgrade path if we later move to a queue without reshaping data.
- **LLM via Anthropic SDK on the server.** The model is prompted to classify the input (`procedural` vs `declarative`) and emit a **Mermaid** source string (`flowchart TD …` or `mindmap …`). Mermaid gives us text-only generation (no image parsing), in-browser rendering, deterministic storage, and trivial editing. Alternative (structured JSON → React Flow) was rejected: more moving parts and a custom renderer for zero user-visible benefit.
- **Client renders Mermaid with `next/dynamic({ ssr: false })`.** Mermaid touches `window`; isolating it to a leaf client component keeps the rest of the tree RSC.
- **Publish = flip a boolean + expose `/published/[slug]`.** No separate "published copy" table; the latest visualization flagged `is_published` is what `/published/[slug]` renders. Regenerate replaces the current draft visualization; publishing snapshots `mermaid_source` into an immutable `published_visualizations` row so later edits don't mutate the shared URL.
- **No auth in this slice.** The requirement says "authenticated Author" but the project has no auth module yet. We stub an `Author` via a cookie-scoped session ID so rows have an owner column ready for real auth later. Flagged as a deliberate deviation below.

### UI/UX direction

Serious enterprise tool. The audience is policy authors and UI/UX reviewers — this must not look like a consumer AI demo.

- **Palette.** Neutral slate. Background `zinc-50` (light) / `zinc-950` (dark). Surfaces `white` / `zinc-900`. Borders `zinc-200` / `zinc-800`. Text `zinc-900` / `zinc-100`. Single accent: `indigo-600` for primary action and focus ring only — no gradients, no illustrations, no emoji.
- **Typography.** `next/font` Inter for UI, JetBrains Mono for the Mermaid source view. Base 14px, tabular numerals, tight tracking on headings.
- **Layout.** Two-pane editor on `≥ lg`: left = source textarea + controls, right = live preview. Stacks on narrow viewports. Max content width 1440px. Dense-but-breathable spacing (8/12/16/24 rhythm).
- **Components.** Use `components/ui/` primitives (Button, Textarea, Card, Alert, Badge, Spinner) built with `cva`. Button variants: `primary | secondary | ghost | destructive`. Quiet interaction: `hover:bg-zinc-100`, 150ms transitions, no scale transforms.
- **States.** Loading = `Spinner` + `"Generating visualization…"` + disabled Generate button (`useFormStatus`). Error = `Alert` with `role="alert"` in red-800 on red-50 surface, retry button. Empty = muted helper text in the preview pane ("Paste a guideline and click Generate").
- **Accessibility.** All controls labeled, focus-visible ring (`ring-2 ring-indigo-600 ring-offset-2`), keyboard-reachable Regenerate/Publish, Mermaid SVG gets `role="img"` + `aria-label` derived from the guideline title.

---

## Affected Files

| File | Change Type | Description |
|------|-------------|-------------|
| `app/package.json` | Modify | Add deps: `zod`, `mermaid`, `@anthropic-ai/sdk`, `clsx`, `tailwind-merge`, `class-variance-authority`, `pino`, `react-hook-form`, `@hookform/resolvers`. Add scripts: `db:generate`, `db:migrate`, `typecheck`, `lint`, `e2e`. |
| `app/.env.example` | Create | Document `DATABASE_URL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `NEXT_PUBLIC_APP_URL`, `SESSION_COOKIE_NAME`. |
| `app/src/lib/env.ts` | Create | Zod-validated env loader; crash fast on missing. |
| `app/src/lib/logger.ts` | Create | `pino` logger; `logger.child({ op })`. |
| `app/src/lib/cn.ts` | Create | `cn()` helper (`clsx` + `tailwind-merge`). |
| `app/src/lib/errors.ts` | Create | `ValidationError`, `GenerationError`, `NotFoundError`. |
| `app/src/lib/session.ts` | Create | Cookie-based anonymous author ID (stub for real auth). `getOrCreateAuthorId()`. |
| `app/src/lib/slug.ts` | Create | `generateSlug()` — 10-char base32 nanoid, URL-safe. |
| `app/src/app/globals.css` | Modify | Replace default tokens with enterprise palette `@theme` block; import Inter + JetBrains Mono via `next/font` in `layout.tsx`. |
| `app/src/app/layout.tsx` | Modify | Apply font classes, set lang, metadata, root container. |
| `app/src/app/page.tsx` | Modify | Landing: brief product description + CTA → `/guidelines/new`. Replaces Next boilerplate. |
| `app/src/app/guidelines/new/page.tsx` | Create | Server Component; renders `GuidelineEditor` client component. |
| `app/src/app/guidelines/[guidelineId]/page.tsx` | Create | Draft editor for an existing guideline; loads row via Drizzle and hydrates `GuidelineEditor`. `params` awaited per Next 15. |
| `app/src/app/published/[slug]/page.tsx` | Create | Public read-only view of a published visualization. `generateMetadata` for sharing. `notFound()` when missing. |
| `app/src/app/published/[slug]/not-found.tsx` | Create | 404 for invalid slug. |
| `app/src/app/api/guidelines/[guidelineId]/route.ts` | Create | `GET` returns guideline + latest visualization as JSON (used by regenerate flow's optimistic refresh). |
| `app/src/components/ui/Button.tsx` | Create | `cva` variants. |
| `app/src/components/ui/Textarea.tsx` | Create | Labeled textarea w/ char counter. |
| `app/src/components/ui/Alert.tsx` | Create | `role="alert"` with `variant: info | error`. |
| `app/src/components/ui/Card.tsx` | Create | Surface container. |
| `app/src/components/ui/Spinner.tsx` | Create | Accessible spinner. |
| `app/src/components/app/guidelines/GuidelineEditor.tsx` | Create | `'use client'`. Two-pane editor. Uses `react-hook-form` + Zod resolver, calls Server Actions. |
| `app/src/components/app/guidelines/MermaidPreview.tsx` | Create | `'use client'`, `next/dynamic({ ssr: false })` Mermaid renderer. Resets on source change; captures render errors into `Alert`. |
| `app/src/components/app/guidelines/PublishBar.tsx` | Create | Shows published URL + copy-link affordance after publish. |
| `app/src/components/app/published/PublishedView.tsx` | Create | RSC-rendered wrapper that streams the Mermaid client component for read-only view. |
| `app/src/services/guidelines.ts` | Create | DB access: `createGuideline`, `getGuidelineById`, `updateGuidelineSource`. |
| `app/src/services/visualizations.ts` | Create | `upsertDraftVisualization`, `publishVisualization`, `getPublishedBySlug`. |
| `app/src/services/generation-jobs.ts` | Create | `recordJob({ guidelineId, status, latencyMs, error })`. |
| `app/src/services/ai.ts` | Create | `generateVisualization(text)` → `{ kind, mermaidSource }`. Wraps Anthropic SDK with a tuned system prompt, enforces max input length (2,000 words hard cap, 25,000 char absolute), retries once on transient errors. |
| `app/src/lib/actions/guidelines.ts` | Create | `'use server'`. Actions: `generateAction`, `regenerateAction`, `publishAction`. All Zod-validate input, return `{ ok, data } \| { ok, error }`. `revalidatePath` on publish. |
| `app/src/lib/schemas/guideline.schema.ts` | Create | `GuidelineInputSchema` (non-empty, ≤ 25,000 chars). |
| `app/src/db/schema.ts` | Modify | Replace empty stub with barrel re-export. |
| `app/src/db/schema/guidelines.ts` | Create | Table. |
| `app/src/db/schema/visualizations.ts` | Create | Table (draft). |
| `app/src/db/schema/published-visualizations.ts` | Create | Table (immutable snapshot). |
| `app/src/db/schema/generation-jobs.ts` | Create | Table. |
| `app/src/db/schema/index.ts` | Create | Barrel. |
| `app/src/db/migrations/0000_init.sql` | Create | Generated via `drizzle-kit generate`. Committed. |
| `app/drizzle.config.ts` | Modify | Point at `src/db/schema/index.ts`, output `src/db/migrations`. |
| `app/src/app/guidelines/new/loading.tsx` | Create | Skeleton for editor segment. |
| `app/src/app/guidelines/new/error.tsx` | Create | `'use client'` segment error boundary. |
| `app/src/app/published/[slug]/loading.tsx` | Create | Skeleton for published view. |

No tests in this plan — `/write-tests` and `/write-e2e-tests` run afterward.

---

## Data Model

All tables follow convention (§9): `id uuid PK`, `created_at`, `updated_at`, snake_case plural table names.

**`guidelines`**
- `id uuid pk`, `author_id text not null` (session ID stub), `title text not null` (first 80 chars of source until we prompt the LLM for one), `source_text text not null`, `created_at`, `updated_at`.

**`visualizations`** (the working/draft output; one per guideline, replaced on regenerate)
- `id uuid pk`, `guideline_id uuid references guidelines(id) on delete cascade`, `kind text not null check (kind in ('flowchart','infographic'))`, `mermaid_source text not null`, `created_at`, `updated_at`.
- Unique index on `guideline_id`.

**`published_visualizations`** (immutable snapshot served at `/published/[slug]`)
- `id uuid pk`, `guideline_id uuid references guidelines(id)`, `slug text not null unique`, `kind text not null`, `mermaid_source text not null`, `title text not null`, `published_at timestamptz not null default now()`.

**`generation_jobs`**
- `id uuid pk`, `guideline_id uuid references guidelines(id) on delete cascade`, `status text not null check (status in ('succeeded','failed'))`, `error text`, `latency_ms integer`, `created_at`.

---

## Implementation Steps

### Step 1 — Dependencies, env, and foundation utilities
- **Files:** `package.json`, `.env.example`, `src/lib/env.ts`, `src/lib/logger.ts`, `src/lib/cn.ts`, `src/lib/errors.ts`, `src/lib/slug.ts`, `src/lib/session.ts`.
- **What:** Install runtime deps. Stand up env validation, logger, `cn`, custom error classes, slug generator, and cookie-based author session.
- **How:** `env.ts` exports a `z.object({ DATABASE_URL, ANTHROPIC_API_KEY, ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-6'), NEXT_PUBLIC_APP_URL, SESSION_COOKIE_NAME: z.string().default('ag_author') }).parse(process.env)`. `session.ts` reads/sets an HttpOnly cookie holding a uuid; returns `authorId`. `slug.ts` uses `crypto.randomUUID()` → base32 truncated 10 chars.

### Step 2 — Drizzle schema + initial migration
- **Files:** `src/db/schema/*.ts`, `src/db/schema/index.ts`, `drizzle.config.ts`, `src/db/migrations/0000_init.sql`.
- **What:** Define four tables and generate the initial migration.
- **How:** Use `pgTable`, `uuid('id').primaryKey().defaultRandom()`, `timestamp('created_at').defaultNow().notNull()`. Add unique index on `visualizations.guideline_id` and on `published_visualizations.slug`. Run `pnpm drizzle-kit generate`. Review the emitted SQL and commit it.

### Step 3 — Services layer
- **Files:** `src/services/guidelines.ts`, `src/services/visualizations.ts`, `src/services/generation-jobs.ts`.
- **What:** CRUD functions, each with explicit return types.
- **How:** All queries go through `db` from `src/db`. `upsertDraftVisualization({ guidelineId, kind, mermaidSource })` uses `onConflictDoUpdate` on `guideline_id`. `publishVisualization({ guidelineId })` opens a transaction: read draft, insert `published_visualizations` row with a new slug, return slug.

### Step 4 — AI service (generation)
- **Files:** `src/services/ai.ts`.
- **What:** Call Anthropic API; return `{ kind: 'flowchart' | 'infographic', mermaidSource: string }`.
- **How:** Import `Anthropic` from `@anthropic-ai/sdk`. System prompt instructs the model to: (1) classify content as `procedural` (ordered steps / decisions) or `declarative` (policy / principles); (2) emit a single JSON object `{"kind":"flowchart"|"infographic","mermaid":"…"}`; (3) use `flowchart TD` for procedural, `mindmap` for declarative; (4) escape node labels. Parse with Zod (`z.object({ kind: z.enum(['flowchart','infographic']), mermaid: z.string().min(1) })`). Enforce `sourceText.length <= 25_000` before call → throw `ValidationError('TOO_LONG')`. On SDK transient error, retry once with 500 ms backoff. Log `{ event: 'ai.generate', kind, latency_ms }`.

### Step 5 — Server Actions
- **Files:** `src/lib/actions/guidelines.ts`, `src/lib/schemas/guideline.schema.ts`.
- **What:** `generateAction(formData) → { ok, data: { guidelineId, kind, mermaid } } | { ok:false, error }`. `regenerateAction({ guidelineId, sourceText })`. `publishAction({ guidelineId }) → { ok:true, data: { slug, url } }`.
- **How:** Each action: `'use server'`, Zod-validate, resolve `authorId` via session, wrap core work in `try/catch`, record a `generation_jobs` row with `status` + `latency_ms`, never throw to client. `publishAction` calls `revalidatePath('/published/' + slug)`.

### Step 6 — UI primitives and design tokens
- **Files:** `src/app/globals.css`, `src/app/layout.tsx`, `src/components/ui/*`.
- **What:** Define enterprise palette, load fonts, build Button/Textarea/Alert/Card/Spinner with `cva`.
- **How:** In `globals.css` `@theme`: `--color-surface`, `--color-surface-muted`, `--color-border`, `--color-text`, `--color-text-muted`, `--color-accent: #4f46e5` (indigo-600), `--color-danger: #b91c1c`. Remove the legacy `@media prefers-color-scheme` block; use Tailwind's `dark:` class strategy instead. In `layout.tsx`: `const inter = Inter({ subsets:['latin'], variable:'--font-sans' })`, `const mono = JetBrains_Mono({ subsets:['latin'], variable:'--font-mono' })`, apply on `<html>`.

### Step 7 — Editor page and Mermaid preview
- **Files:** `src/app/guidelines/new/page.tsx`, `src/app/guidelines/[guidelineId]/page.tsx`, `src/components/app/guidelines/GuidelineEditor.tsx`, `src/components/app/guidelines/MermaidPreview.tsx`, `src/app/guidelines/new/loading.tsx`, `src/app/guidelines/new/error.tsx`.
- **What:** Two-pane editor: textarea (left), live preview + action bar (right). Generate → calls `generateAction`; result populates preview. Regenerate → `regenerateAction`. Publish → `publishAction` then show shareable URL via `PublishBar`.
- **How:** `GuidelineEditor` uses `useFormState` / `useFormStatus` for pending state, `react-hook-form` for client validation (non-empty, ≤25,000 chars), discriminated-union state `{ status: 'idle' | 'generating' | 'ready' | 'error'; … }`. `MermaidPreview` lazy-loaded via `next/dynamic(() => import('./MermaidPreview'), { ssr: false, loading: () => <Spinner/> })`; inside it, `useEffect` calls `mermaid.initialize({ startOnLoad: false, theme: 'neutral' })` once and `mermaid.render(id, source)` on each source change, catching parse errors into an `Alert`.

### Step 8 — Published view and shareable URL
- **Files:** `src/app/published/[slug]/page.tsx`, `src/app/published/[slug]/not-found.tsx`, `src/app/published/[slug]/loading.tsx`, `src/components/app/published/PublishedView.tsx`.
- **What:** Read-only public page rendering the snapshot.
- **How:** Server Component: `const row = await getPublishedBySlug(params.slug); if (!row) notFound();`. Pass `mermaidSource` + `title` into `<PublishedView>` which composes `<MermaidPreview readOnly source={...} />`. `generateMetadata` sets `title` + `openGraph`. No edit controls.

### Step 9 — Landing page + API route
- **Files:** `src/app/page.tsx`, `src/app/api/guidelines/[guidelineId]/route.ts`.
- **What:** Replace boilerplate landing with a restrained intro + primary CTA to `/guidelines/new`. Add `GET` route for fetching a guideline snapshot (used by client after regenerate to re-fetch canonical state).
- **How:** Landing is an RSC, single-column hero with `h1`, supporting paragraph, `<Button variant="primary" asChild>`. Route Handler: Zod-parse `guidelineId`, delegate to `services/guidelines.getGuidelineById` + `services/visualizations.getDraft`, return `NextResponse.json(...)` with the documented error envelope on failure.

### Step 10 — Manual verification
- **What:** Run `pnpm dev`, walk through example 1 (procedural → flowchart), example 2 (empty + oversized → validation errors), regenerate with tweaked text, publish, open shareable URL in a new browser session, verify no author cookie is required. Run `pnpm exec tsc --noEmit` and `pnpm exec eslint .`.

---

## Acceptance Criteria Mapping

| Criterion | How It Is Satisfied |
|-----------|---------------------|
| AC1 (R1) submit → job created | `generateAction` validates input, inserts `guidelines` row, then a `generation_jobs` row on completion (Step 5). |
| AC2 (R2/R3) procedural → flowchart preview | AI service emits `kind:'flowchart'` Mermaid `flowchart TD`; `MermaidPreview` renders it (Steps 4, 7). |
| AC3 (R2/R3) declarative → infographic preview | AI service emits `kind:'infographic'` Mermaid `mindmap`; same renderer (Steps 4, 7). |
| AC4 (R4) edit + regenerate → preview replaced | `regenerateAction` updates `guidelines.source_text` and upserts draft visualization; `GuidelineEditor` refreshes preview state (Steps 3, 5, 7). |
| AC5 (R5/R6) publish → stable URL | `publishAction` snapshots into `published_visualizations` with unique `slug`; `/published/[slug]` renders it (Steps 3, 5, 8). |
| AC6 (R9) failure → visible error + retry | Actions return `{ ok:false, error }`; `GuidelineEditor` shows `Alert` with retry button calling the same action (Steps 5, 7). |
| AC7 (R1) empty input → validation message | `GuidelineInputSchema.min(1)` enforced both client-side (RHF) and server-side (action); inline field error + disabled submit (Steps 5, 7). |
| AC8 (R7) ≤2,000 words → preview < 60s | Synchronous call path, 25,000-char cap, single retry; no queue overhead. Measured via `generation_jobs.latency_ms`. |

---

## Deliberate Deviations

- **No real auth.** Convention §17 requires auth checks; we use an anonymous cookie-scoped `author_id` as a stand-in so the column exists without gating progress. To be replaced when the auth module lands; flagged in `author_id` column comment and `session.ts`.
- **No `contexts/` or `hooks/` folders yet.** Convention lists them as part of the canonical tree but this feature needs neither. Creating empty scaffolding would be speculative.

---

## Out of Scope

- Authentication, authorization, and role-based gating.
- Approval workflows, multi-author collaboration, comments.
- Non-text inputs (PDF, DOCX, images, audio).
- Localization / translation.
- PNG/SVG/PDF export (R8, marked MAY).
- Reader analytics.
- Background job queue / worker process.
- Rate limiting (to be added with auth).

---
