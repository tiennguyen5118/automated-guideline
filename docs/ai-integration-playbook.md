# AI Integration Playbook

Product-level rules for building AI features in this repo. Complements the `claude-api` skill (which covers SDK mechanics). When in doubt, **mirror [app/src/services/ai.ts](../app/src/services/ai.ts)**.

## Reference Implementation

[app/src/services/ai.ts](../app/src/services/ai.ts) is the canonical shape for every AI service file. A new service (e.g. `src/services/summarize.ts`, `src/services/classify.ts`) must have:

- `import 'server-only';` at the top — prevents accidental client bundling.
- Anthropic client constructed **once** at module scope using `env.ANTHROPIC_API_KEY` ([app/src/services/ai.ts:28](../app/src/services/ai.ts#L28)).
- System prompt as a module-level `const` — not inlined, not built per-request. Enables prompt caching later.
- **Zod schema** for the response, parsed via `safeParse`. See [app/src/services/ai.ts:10-13](../app/src/services/ai.ts#L10-L13).
- Typed errors from `@/lib/errors`: `ValidationError` for bad input, `GenerationError` for bad model output with a machine-readable code (`MODEL_BAD_JSON`, `MODEL_BAD_SHAPE`, `MODEL_ERROR`).
- Helpers: `extractText(message)` ([app/src/services/ai.ts:35-40](../app/src/services/ai.ts#L35-L40)) and `parseJsonResponse(raw)` ([app/src/services/ai.ts:42-55](../app/src/services/ai.ts#L42-L55)).
- **Structured logging:** event names `ai.<domain>`, `ai.<domain>.retry`, `ai.<domain>.failed`, always including `latency_ms`. Never log full prompts at `info`.
- **Single retry** with 500ms backoff on non-validation errors ([app/src/services/ai.ts:83-99](../app/src/services/ai.ts#L83-L99)). Don't retry on `ValidationError` / `GenerationError`.
- **Input limits** enforced before calling the model — see `MAX_CHARS` at [app/src/services/ai.ts:8](../app/src/services/ai.ts#L8).

If your new service doesn't match this shape, document why in the plan.

## Model Selection

Configure via `env.ANTHROPIC_MODEL`; **never hardcode**.

| Use case | Model | ID |
|----------|-------|----|
| Default | Sonnet 4.6 | `claude-sonnet-4-6` |
| Deep reasoning, complex tool use | Opus 4.6 | `claude-opus-4-6` |
| Latency-critical / high-volume / cheap | Haiku 4.5 | `claude-haiku-4-5-20251001` |

Add the env var to `lib/env.ts` Zod schema and document the default in `.env.example`.

## Structured Outputs

Default to **JSON-only responses validated by Zod** — the pattern at [app/src/services/ai.ts:10-13](../app/src/services/ai.ts#L10-L13) and [app/src/services/ai.ts:42-55](../app/src/services/ai.ts#L42-L55).

Rules:
- Ask the model to output "ONLY a single JSON object, no prose, no code fences" in the system prompt ([app/src/services/ai.ts:25-26](../app/src/services/ai.ts#L25-L26)).
- Still strip accidental ``` fences defensively ([app/src/services/ai.ts:43](../app/src/services/ai.ts#L43)).
- Zod `safeParse` and throw `GenerationError` on shape mismatch — do not attempt to repair malformed JSON in-process.
- For richer flows (multi-step, model-chooses-shape), use **tool use** with `input_schema` instead of freeform JSON.

## Prompt Caching

When the system prompt exceeds ~1KB or is reused across requests, pass it as a cached block:

```ts
system: [
  { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
],
```

See the `claude-api` skill for full caching rules (minimum token thresholds, cache key behavior).

## Streaming

Use `client.messages.stream()` for any UI where progressive output improves perceived latency (generations > ~1s). Wire through a Route Handler that returns a `ReadableStream`:

- Route: `src/app/api/<domain>/route.ts` — delegates to the service's streaming variant.
- Service exports `generateXStream(input): AsyncIterable<Chunk>`.
- Client reads with `fetch` + `response.body.getReader()` or a hook under `src/hooks/`.

Never stream directly from a React Server Component — streaming is a client-interaction pattern.

## Tool Use / Agents

When the model needs to call back into app logic:

- Each tool's handler is a typed function already exported from `src/services/<domain>.ts`. Don't write tool handlers in the AI service — it *orchestrates*, it doesn't own business logic.
- `input_schema` is a JSON Schema; derive it from a Zod schema using `zod-to-json-schema` for single source of truth.
- Loop: call → if `stop_reason === 'tool_use'`, execute the tool, append `tool_result`, call again. Cap at 5 iterations.

## RAG

If retrieval is needed:

- Retrieval lives in `src/services/<domain>.ts` (e.g. `searchDocs`), not in the AI service.
- Pass top-k snippets in the user message, each tagged with a stable `source_id`.
- Response schema includes a `citations: { source_id: string, quote: string }[]` field — enforce via Zod.

## Evals

Every non-trivial AI service ships with an eval harness:

- Fixture inputs in `src/services/__fixtures__/<domain>.json`.
- A Vitest test under `src/services/<domain>.eval.test.ts` (or colocated) that runs the real service against fixtures and asserts:
  - Zod schema passes
  - Latency under a ceiling (e.g. p95 < 5s)
  - Spot-check specific field values for a handful of inputs
- Gate behind `ANTHROPIC_EVAL=1` so evals don't run in normal CI unless explicitly enabled.

## Safety & Limits

- **Input length:** enforce before the model call ([app/src/services/ai.ts:71-76](../app/src/services/ai.ts#L71-L76)).
- **PII in logs:** never log full prompts or full responses at `info`. Log event + metadata + `latency_ms` only. At `debug`, truncate to 200 chars.
- **Rate limits:** a service should gracefully degrade, not crash. Return a typed error the UI can show.
- **Client bundling:** `import 'server-only'` at the top of every AI service. The `@anthropic-ai/sdk` package must never appear in a client bundle.

## Client-Side Usage

Client components → **Route Handler** (`src/app/api/<domain>/route.ts`) → **Service** (`src/services/<domain>.ts`) → `@anthropic-ai/sdk`.

- Route handler validates the request body with Zod, calls the service, returns `{ ok: true, data } | { ok: false, error }`.
- No business logic in the route handler — it's a thin wrapper (convention §15).
- For mutations triggered from a form, prefer a **Server Action** in `src/actions/` over a Route Handler.

## Using This Template for a New Hackathon

1. `pnpm` install and boot Postgres: `docker compose up db -d && cd app && pnpm install && pnpm dev`.
2. Fill in [docs/evaluation-matrix.md](evaluation-matrix.md) with the real rubric **before** running `/write-plan`.
3. Review this playbook's defaults — only change them if the competition demands it.
4. Pick the target model for `env.ANTHROPIC_MODEL` based on the latency/quality tradeoff in the rubric.
5. Run the standard workflow: `/work-on <id>` → `/analyze-requirement` → `/write-plan` → `/implement-plan`.
