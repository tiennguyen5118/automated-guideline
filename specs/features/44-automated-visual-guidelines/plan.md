# Implementation Plan: Automated Visual Guidelines

**Work Item:** User Story #44
**Requirement:** [requirement.md](./requirement.md)

---

## Summary

Build a Next.js feature that lets an Author paste a policy/procedure text, runs an LLM-backed Generation Job to produce a structured diagram representation (Mermaid), renders it client-side, and lets the Author regenerate, edit, and publish a read-only shareable page. Guidelines, generations, and published visualizations are persisted in PostgreSQL via Drizzle. This plan covers the MVP vertical slice satisfying AC1–AC8; export (R8) and auth hardening are deferred.

---

## Approach

- **Data model**: three tables — `guidelines` (source text + latest draft pointer), `generations` (each run of the LLM with status/output/error), `publications` (immutable snapshot referenced by a public slug). Keeps job history for retry/audit and cleanly separates draft vs published state.
- **Generation strategy**: a single Server Action invokes the Anthropic Claude API (`claude-sonnet-4-6`) with a structured prompt that classifies the content as `procedural` vs `declarative` and returns Mermaid source (`flowchart TD` for procedural, a constrained Mermaid layout used as an "infographic" card grid for declarative). Mermaid is chosen over React Flow because the LLM can emit it as text, and it renders offline in the browser via the `mermaid` package — no custom layout engine.
- **Rendering**: client-only `<MermaidDiagram/>` component (dynamic import, `ssr: false`) takes the Mermaid source string and renders SVG. The Author page is a Server Component shell hydrating a small client island for the editor/preview. The public published page is a pure Server Component that reads from DB and renders the island read-only.
- **Async model**: MVP runs generation inline inside the Server Action with a 60s timeout (AC8 target). No queue/worker — the `generations` table still records `status: pending|ok|error` so a future worker can take over without schema change. `revalidatePath` refreshes the draft page after generation/publish.
- **Validation & errors**: Zod at every boundary (Server Action input, env, LLM response shape). Server Action returns the `{ ok: true; data } | { ok: false; error }` shape per convention. Errors from the model surface as the `error` string shown on the preview card with a "Retry" button (AC6).
- **UI tone**: serious enterprise feel — neutral slate/zinc palette with a single desaturated indigo accent for primary actions, generous but dense spacing (`gap-6`, `px-6 py-5`), 14px body / 13px metadata, subtle 1px hairline borders (`border-zinc-200 dark:border-zinc-800`), no gradients, no emoji, no illustrations. Quiet hover/focus states (`hover:bg-zinc-50`, `focus-visible:ring-1 ring-zinc-400`). Two-pane layout on the editor page: left = source textarea + controls, right = preview/status. Typography via `next/font` (Geist Sans for UI, Geist Mono for the Mermaid source drawer).

---

## Affected Files

| File | Change Type | Description |
|------|-------------|-------------|
| `app/package.json` | Modify | Add deps: `zod`, `@anthropic-ai/sdk`, `mermaid`, `react-hook-form`, `@hookform/resolvers`, `clsx`, `tailwind-merge`, `pino`, `nanoid` |
| `app/.env.example` | Create | Document `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `ANTHROPIC_API_KEY`, `GENERATION_TIMEOUT_MS` |
| `app/src/lib/env.ts` | Create | Zod-validated env loader |
| `app/src/lib/cn.ts` | Create | `cn()` = clsx + tailwind-merge |
| `app/src/lib/logger.ts` | Create | Pino logger |
| `app/src/lib/errors.ts` | Create | `ValidationError`, `GenerationError`, `NotFoundError` |
| `app/src/db/schema.ts` | Modify | Define `guidelines`, `generations`, `publications` tables |
| `app/src/db/migrations/0000_init.sql` | Create | Generated via `drizzle-kit generate` |
| `app/src/features/guidelines/schemas.ts` | Create | Zod: `CreateGuidelineInput`, `GenerateInput`, `PublishInput`, `MermaidGenerationResult` |
| `app/src/features/guidelines/repo.ts` | Create | Drizzle queries: `insertGuideline`, `updateGuidelineText`, `insertGeneration`, `markGenerationOk/Error`, `getGuidelineWithLatestGeneration`, `insertPublication`, `getPublicationBySlug` |
| `app/src/features/guidelines/llm.ts` | Create | `generateVisualization(text)` — calls Anthropic, returns `{ kind: 'flowchart'|'infographic'; mermaid: string }`; enforces timeout + input length cap (≤ 2000 words) |
| `app/src/features/guidelines/service.ts` | Create | Orchestration: `createGuideline`, `runGeneration`, `publishGuideline` |
| `app/src/features/guidelines/actions.ts` | Create | `'use server'` — `createGuidelineAction`, `regenerateAction`, `publishAction`; Zod-validated, `{ ok, ... }` return shape |
| `app/src/components/ui/Button.tsx` | Create | `cva`-based primary/secondary/ghost variants |
| `app/src/components/ui/Textarea.tsx` | Create | Labeled textarea with error slot |
| `app/src/components/ui/Card.tsx` | Create | Bordered surface primitive |
| `app/src/components/ui/StatusBadge.tsx` | Create | Neutral pill for `pending/ok/error` |
| `app/src/components/features/guidelines/MermaidDiagram.tsx` | Create | `'use client'`, dynamic `mermaid` import, renders SVG from source; surfaces parse errors |
| `app/src/components/features/guidelines/GuidelineEditor.tsx` | Create | `'use client'`, two-pane layout, react-hook-form, calls Server Actions, shows pending/ok/error states |
| `app/src/components/features/guidelines/PreviewPane.tsx` | Create | Wraps `MermaidDiagram`, empty/pending/error/ok visuals, retry button |
| `app/src/app/layout.tsx` | Modify | Apply Geist font, set base slate palette, add `<header>` with product name only |
| `app/src/app/globals.css` | Modify | Tailwind v4 `@theme` tokens (neutral + single indigo accent, radius, shadow) |
| `app/src/app/page.tsx` | Modify | Landing: brief description + "New guideline" CTA linking to `/guidelines/new` |
| `app/src/app/guidelines/new/page.tsx` | Create | Server Component: creates a draft on first paste via action, renders `GuidelineEditor` |
| `app/src/app/guidelines/[guidelineId]/page.tsx` | Create | Server Component: loads draft + latest generation, renders `GuidelineEditor` hydrated with data |
| `app/src/app/guidelines/[guidelineId]/loading.tsx` | Create | Skeleton of two-pane layout |
| `app/src/app/guidelines/[guidelineId]/error.tsx` | Create | Client error boundary with reset |
| `app/src/app/g/[slug]/page.tsx` | Create | Public read-only published visualization |
| `app/src/app/g/[slug]/not-found.tsx` | Create | 404 for unknown slug |
| `app/src/app/api/health/route.ts` | Create | `GET` returns `{ ok: true }` — smoke test endpoint |
| `app/drizzle.config.ts` | Verify | Points to `src/db/schema.ts` and `src/db/migrations` |
| `app/tailwind.config.ts` | Skip | Tailwind v4 uses CSS-based config via `@theme` — no JS config file |

---

## Implementation Steps

### Step 1: Dependencies, env, and shared lib
- **Files:** `package.json`, `.env.example`, `src/lib/env.ts`, `src/lib/cn.ts`, `src/lib/logger.ts`, `src/lib/errors.ts`
- **What:** Install deps; add env schema (DATABASE_URL, ANTHROPIC_API_KEY, NEXT_PUBLIC_APP_URL, GENERATION_TIMEOUT_MS default 60000); create `cn`, pino logger (server-only), error subclasses.
- **How:** `env.ts` uses `z.object(...).parse(process.env)` at module top; export typed `env`. `cn(...inputs)` = `twMerge(clsx(inputs))`.

### Step 2: Database schema & migration
- **Files:** `src/db/schema.ts`, `src/db/migrations/*`
- **What:** Three tables with uuid PK, `created_at`, `updated_at`.
  - `guidelines(id, title text, source_text text not null, created_at, updated_at)`
  - `generations(id, guideline_id fk, status text check in (pending,ok,error), kind text null check in (flowchart,infographic), mermaid text null, error text null, created_at, updated_at)`
  - `publications(id, guideline_id fk, generation_id fk, slug text unique not null, title text, mermaid text not null, kind text not null, created_at)`
- **How:** Drizzle `pgTable` with `uuid().defaultRandom().primaryKey()`, `timestamp().defaultNow().notNull()`. Run `pnpm drizzle-kit generate` to produce SQL; commit it.

### Step 3: Feature schemas & repo
- **Files:** `features/guidelines/schemas.ts`, `features/guidelines/repo.ts`
- **What:** Zod schemas for inputs + Mermaid result; repo functions wrapping Drizzle queries (no raw SQL).
- **How:** `CreateGuidelineInput = z.object({ title: z.string().trim().max(200).optional(), sourceText: z.string().trim().min(1, 'Please paste guideline text').max(20000) })`. Repo exports small focused functions; transactions via `db.transaction` where publish writes two rows.

### Step 4: LLM client
- **Files:** `features/guidelines/llm.ts`
- **What:** `generateVisualization(sourceText)` — validates word count ≤ 2000, calls Anthropic with a system prompt that requires a single JSON object `{ kind: 'flowchart'|'infographic', mermaid: string }`, parses with Zod, enforces `GENERATION_TIMEOUT_MS` via `AbortController`.
- **How:** Use `@anthropic-ai/sdk`, model `claude-sonnet-4-6`, `max_tokens: 2000`. Prompt instructs: classify procedural vs declarative → emit `flowchart TD` for procedural, or a Mermaid flowchart with grouped subgraphs styled as an infographic card grid for declarative. Strip code fences before `JSON.parse`. Throw `GenerationError('TIMEOUT'|'OVERSIZED'|'MODEL_ERROR'|'INVALID_OUTPUT', cause)`.

### Step 5: Service + Server Actions
- **Files:** `features/guidelines/service.ts`, `features/guidelines/actions.ts`
- **What:** Service orchestrates repo + llm; actions validate input, call service, return `{ ok, data | error }`, call `revalidatePath`.
- **How:**
  - `createGuidelineAction(input)` → insert guideline + pending generation → run `generateVisualization` → mark ok/error → return `{ ok: true, data: { guidelineId } }` and redirect client-side to `/guidelines/:id`.
  - `regenerateAction({ guidelineId, sourceText })` → update guideline text → new pending generation → run → mark ok/error.
  - `publishAction({ guidelineId })` → load latest ok generation (reject otherwise) → insert publication with `slug = nanoid(10)` → return slug.
  - All catch `GenerationError` and map to user-facing messages; unknown errors logged with pino and mapped to generic "Generation failed".

### Step 6: UI primitives & tokens
- **Files:** `app/globals.css`, `components/ui/*`
- **What:** Tailwind v4 `@theme` with tokens: `--color-bg: #fafafa`, `--color-surface: #ffffff`, `--color-border: #e4e4e7`, `--color-fg: #18181b`, `--color-muted: #52525b`, `--color-accent: #4f46e5` (indigo-600, used sparingly), `--radius-card: 6px`. Button variants: primary (accent bg, white fg), secondary (surface + border), ghost. All with `focus-visible:ring-1 ring-zinc-400`.
- **How:** Single accent only on primary CTAs ("Generate", "Publish"). Destructive/retry uses zinc-900 outline, not red — errors communicated via copy + a small `StatusBadge` in a warning-neutral tone (`bg-amber-50 text-amber-900 border-amber-200`), used sparingly.

### Step 7: Mermaid rendering island
- **Files:** `components/features/guidelines/MermaidDiagram.tsx`
- **What:** Client component that accepts `source: string`, renders SVG.
- **How:** `'use client'`; `useEffect` imports `mermaid` dynamically, calls `mermaid.initialize({ startOnLoad: false, theme: 'neutral' })` once, then `mermaid.render(id, source)` → `dangerouslySetInnerHTML` with the returned SVG. Wrap in try/catch; on failure, surface a compact error block with the parse message. Ensure `ssr: false` via `next/dynamic` where it's imported.

### Step 8: Editor + preview UI
- **Files:** `components/features/guidelines/GuidelineEditor.tsx`, `PreviewPane.tsx`
- **What:** Two-pane editor (grid `lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6`). Left: title input, source textarea (monospace, min-h-80), "Generate"/"Regenerate" button, validation errors. Right: `PreviewPane` showing one of:
  - empty: muted placeholder card "Paste guideline text, then Generate."
  - pending: skeleton + spinner + "Generating — typically under 60 seconds"
  - ok: `MermaidDiagram` + kind badge + "Publish" + "View source" disclosure (mono drawer)
  - error: message + "Retry" button (re-invokes regenerate)
- **How:** `react-hook-form` with `zodResolver(GenerateInput)`, `useFormStatus`/`useTransition` for pending state. State derived from server props + optimistic pending flag. On publish success, show inline card with shareable URL and a "Copy link" button.

### Step 9: App routes
- **Files:** `app/layout.tsx`, `app/page.tsx`, `app/guidelines/new/page.tsx`, `app/guidelines/[guidelineId]/page.tsx`, `app/guidelines/[guidelineId]/{loading,error}.tsx`, `app/g/[slug]/page.tsx`, `app/g/[slug]/not-found.tsx`, `app/api/health/route.ts`
- **What:** Wire Server Components to repo; public `/g/[slug]` renders title, date, kind, and the diagram, no edit controls.
- **How:** `params` is awaited (Next 15+). Public page uses `notFound()` when slug missing. Layout header = product name + subtle divider; footer minimal.

### Step 10: Manual verification against ACs
- **Files:** n/a
- **What:** Run `pnpm dev`, exercise the golden path and edge cases:
  1. Paste leave-request procedure (Example 1) → flowchart appears within 60s → publish → open `/g/:slug` in incognito.
  2. Paste a declarative policy paragraph → infographic-style Mermaid renders.
  3. Submit empty textarea → validation blocks (AC7).
  4. Paste > 2000 words → service returns `OVERSIZED` error with retry (AC6, Example 2).
  5. Temporarily break `ANTHROPIC_API_KEY` → MODEL_ERROR path renders retry card.
  6. Edit source, click Regenerate → preview replaces (AC4).
- **How:** Document any gaps; do not mark complete if any AC fails.

---

## Acceptance Criteria Mapping

| Criterion | How It Is Satisfied |
|-----------|---------------------|
| AC1 | `createGuidelineAction` inserts `guidelines` + pending `generations` row on submit |
| AC2 | LLM prompt emits `kind: 'flowchart'` for procedural input; `MermaidDiagram` renders it |
| AC3 | LLM prompt emits `kind: 'infographic'` (subgraph-grid Mermaid) for declarative input; same renderer |
| AC4 | `regenerateAction` updates source and inserts a new generation; preview re-renders on server round-trip |
| AC5 | `publishAction` inserts `publications` with nanoid slug; `/g/[slug]` Server Component serves read-only view |
| AC6 | Generation errors mark the row `error` with message; PreviewPane shows message + Retry |
| AC7 | Zod `min(1)` on `sourceText` + HTML `required`; react-hook-form shows field error, action refuses submission |
| AC8 | 60s `AbortController` timeout on the Anthropic call; pending state communicates expected latency |

---

## Out of Scope

- Authentication/authorization (single-tenant assumed; add in a follow-up).
- Export to PNG/SVG/PDF (R8 — `mermaid.render` already returns SVG, so a download button is a small follow-up).
- Collaborative editing, approval workflows, role gates (explicitly out per requirement §4).
- Background worker / queue — generation runs inline for MVP; schema supports future worker without migration.
- Rate limiting and per-user quotas on the Anthropic call.
- Custom theming of the Mermaid output beyond the default `neutral` theme.

---
