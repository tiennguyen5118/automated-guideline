# Next.js + TypeScript Coding Convention

Stack: Next.js 15 App Router, React 19, TypeScript 5, Tailwind v4, Drizzle ORM, PostgreSQL.
Sources: Next.js docs, React docs, TypeScript handbook, Airbnb/Google style, ESLint `next/core-web-vitals`.

---

## 1. File & Folder Naming

| Kind | Case | Example |
|---|---|---|
| Folder | `kebab-case` | `user-profile/` |
| Route segment | `kebab-case`, explicit full word | `app/order-history/page.tsx` |
| Dynamic segment | `[camelCase]` | `app/orders/[orderId]/page.tsx` |

Route segments must be explicit, descriptive words. Never use single letters or cryptic abbreviations (e.g. `g/`, `u/`, `p/`) — use `guidelines/`, `users/`, `products/`. A reader should understand what a segment represents from its name alone, without context. Short-link style paths belong behind a rewrite/redirect, not in the folder tree.
| React component file | `PascalCase.tsx` | `UserCard.tsx` |
| Hook file | `camelCase.ts` starting `use` | `useAuth.ts` |
| Util / lib | `kebab-case.ts` | `format-date.ts` |
| Type-only file | `*.types.ts` | `order.types.ts` |
| Schema / validator | `*.schema.ts` | `order.schema.ts` |
| Test | `*.test.ts(x)` co-located | `UserCard.test.tsx` |
| E2E | `*.spec.ts` in `tests/e2e/` | `checkout.spec.ts` |
| Constants | `SCREAMING_SNAKE` inside `constants.ts` | `MAX_RETRY = 3` |
| Config | `.yaml` not `.yml` | `docker-compose.yaml` |

One default export per component file; file name === export name.

---

## 2. Project Structure (App Router)

```
src/
  app/                      routes only (page, layout, loading, error, route)
    (group)/                route groups, no URL impact
    api/<resource>/route.ts Route Handlers
  components/
    ui/                     primitives (Button, Input) — no business logic
    app/                    route-scoped components; subfolders mirror src/app/ segments 1:1
                            (e.g. src/app/admin/page.tsx → src/components/app/admin/*)
    auth/                   auth-related components
    icons/                  icon components
    landing/                landing page components
    layout/                 layout components (header, footer, shells)
  contexts/                 React Context providers (AuthContext, ThemeContext, …) + index.ts barrel
  services/                 data/API clients and domain services (api.ts, ai.ts, users.ts, …) + index.ts barrel
  hooks/                    shared hooks
  lib/                      cross-cutting utils (db, auth, logger, fetcher, zod schemas, server actions)
  db/                       Drizzle schema + migrations
  types/                    shared global types
  styles/                   globals.css, tailwind layers
```

Rule: import direction is `app → contexts → components → services → hooks → lib`. Never upward. No `features/` folder — group code by kind (component / context / service / hook / lib), not by feature.

`src/components/app/` mirrors `src/app/` route structure: each route segment that needs components gets a matching subfolder. Route files (`page.tsx`, `layout.tsx`) stay thin and compose function components from the parallel `components/app/<segment>/` folder. Route root (`src/app/page.tsx`) maps to `components/app/home/`. Cross-route reusable pieces go under `components/ui/`, `components/layout/`, etc. — not `components/app/`.

---

## 3. TypeScript

- `"strict": true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`.
- Prefer `type` for unions/primitives, `interface` for object shapes that may extend.
- No `any`. Use `unknown` + narrowing. Escape hatch: `// eslint-disable-next-line` with reason.
- No non-null `!` except after explicit guard.
- `as const` for literal tuples/config objects.
- Enums: avoid; use `as const` object + `type X = typeof X[keyof typeof X]`.
- Return types: explicit on exported functions; inferred on local.
- Discriminated unions for state: `{ status: 'idle' } | { status: 'ok'; data: T } | { status: 'error'; error: E }`.
- `import type { ... }` for type-only imports.
- Path alias `@/*` → `src/*`. No `../../..`.

---

## 4. React Components

- Function components only. No `React.FC`.
- Props: named `<Name>Props`, exported if reused.
- Destructure props in signature. Default via `=` in destructure.
- Server Component by default. Add `'use client'` only when needed (state, effects, browser APIs, event handlers).
- Keep client components leaf-level; push `'use client'` down the tree.
- One component per file. Sub-components allowed if private and < 30 LOC.
- Order inside component: hooks → derived values → handlers → effects → early returns → JSX.
- Keys: stable IDs, never array index unless list is static.
- Conditional render: `cond && <X/>` only when `cond` is boolean; otherwise ternary.

```tsx
type UserCardProps = { user: User; onSelect?: (id: string) => void };

export function UserCard({ user, onSelect }: UserCardProps) {
  const fullName = `${user.first} ${user.last}`;
  return <button onClick={() => onSelect?.(user.id)}>{fullName}</button>;
}
```

---

## 5. Server vs Client

| Concern | Server Component | Client Component |
|---|---|---|
| Data fetch | direct DB / `fetch` | via Server Action or Route Handler |
| Secrets | allowed | forbidden |
| State/effects | no | yes |
| `params`/`searchParams` | `await` (Next 15) | via hooks |

- Never import server-only modules from client. Use `import 'server-only'` in sensitive files.
- Use `import 'client-only'` in browser-only modules.

---

## 6. Data Fetching & Caching

- Server Components: `await` directly. Parallelize with `Promise.all`.
- `fetch` options:
  - static: `{ cache: 'force-cache' }` (default when no dynamic API).
  - dynamic: `{ cache: 'no-store' }`.
  - revalidate: `{ next: { revalidate: 60, tags: ['order'] } }`.
- Mutations use **Server Actions**; tag-invalidate with `revalidateTag`/`revalidatePath`.
- Loading UI: `loading.tsx` + `<Suspense>` for streaming.
- Error UI: `error.tsx` (client) per segment.
- `not-found.tsx` for 404.

---

## 7. Server Actions

- File: `lib/actions/<domain>.ts` (or colocated under `services/` when tightly bound to a service), starts with `'use server'`.
- Always validate input with Zod before use.
- Return shape: `{ ok: true; data } | { ok: false; error: string }`. Never throw to client.
- Authorize inside the action; never trust client.

```ts
'use server';
export async function createOrder(input: unknown) {
  const parsed = OrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'INVALID' } as const;
  const user = await requireUser();
  const order = await db.insert(orders).values({ ...parsed.data, userId: user.id }).returning();
  revalidateTag('orders');
  return { ok: true, data: order[0] } as const;
}
```

---

## 8. Route Handlers (API)

- Location: `app/api/<resource>/route.ts`. One resource per folder.
- Export named HTTP verbs: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- Request validation with Zod. Response typed via `NextResponse.json<T>()`.
- Status codes: 200 ok, 201 created, 204 no-body, 400 validation, 401 unauth, 403 forbidden, 404 missing, 409 conflict, 422 semantic, 500 server.
- Error body: `{ error: { code: string; message: string; details?: unknown } }`.
- No business logic in handlers; delegate to `services/<domain>.ts`.
- Set `export const dynamic`/`revalidate`/`runtime` explicitly when non-default.

---

## 9. Database (Drizzle)

- Schema per domain: `db/schema/<entity>.ts`; barrel `db/schema/index.ts`.
- Table names: `snake_case` plural (`order_items`). Columns: `snake_case`.
- Always `id` = `uuid` PK, `created_at`, `updated_at` timestamps with default `now()`.
- Soft delete via `deleted_at` when required; never hard-delete audited rows.
- Migrations: generate via `pnpm drizzle-kit generate`; review SQL; never edit applied migration.
- Queries in `services/<domain>.ts` (or `lib/repo/<domain>.ts` for lower-level repos). No raw SQL in components.
- Transactions for multi-write operations.

---

## 10. Validation

- Zod for every boundary: Route Handler input, Server Action input, env vars, external API responses.
- One schema per shape, colocated: `order.schema.ts`. Infer types: `type Order = z.infer<typeof OrderSchema>`.
- Env validation in `lib/env.ts`, imported at app start.

---

## 11. Styling (Tailwind v4)

- Utility-first. No inline `style` except dynamic values.
- Class order via `prettier-plugin-tailwindcss`.
- Merge classes with `cn()` helper (clsx + tailwind-merge).
- Design tokens in `@theme` block in `globals.css`.
- No arbitrary values when a token exists.
- Reusable variants via `class-variance-authority` (cva).
- Dark mode via `class` strategy.

---

## 12. State Management

Hierarchy (pick lowest that works):
1. URL (`searchParams`) for shareable state.
2. Server state via RSC / Server Actions.
3. React local `useState`.
4. React Context for low-frequency tree state.
5. Zustand for cross-tree client state.
6. TanStack Query only for complex client caching not covered by RSC.

No Redux in new code.

---

## 13. Forms

- `react-hook-form` + `zodResolver`.
- Server Action as submit handler where possible (`<form action={action}>`).
- Show field errors from Zod `flatten().fieldErrors`.
- Disable submit while `pending` (`useFormStatus`).

---

## 14. Functions

- Pure where possible. One responsibility.
- Max ~40 LOC per function; split if longer.
- Max 3 positional params; beyond that use options object.
- Name: verb-first (`getUser`, `buildUrl`, `isAdmin`, `hasAccess`).
- Booleans prefixed `is/has/can/should`.
- Async functions end with action verb; return `Promise<T>`.
- Early return over nested `if`. Guard clauses first.
- No side effects in module scope except constants.

---

## 15. Error Handling

- Throw `Error` subclasses: `ValidationError`, `NotFoundError`, `AuthError`, `ConflictError`.
- Never swallow errors. Log with context: `logger.error({ err, userId, op })`.
- User-facing messages never expose internals.
- Catch at boundaries only (Route Handler, Server Action, error.tsx).

---

## 16. Logging & Observability

- `pino` (server) via `lib/logger.ts`. Never `console.log` in committed code.
- Log levels: `trace|debug|info|warn|error|fatal`.
- Structured logs: `{ event, ...ctx }`.
- Request ID via middleware, propagated to logs.

---

## 17. Security

- Validate + sanitize all external input.
- CSRF: Server Actions built-in; custom endpoints require origin check.
- Headers via `next.config.ts` (`strict-transport-security`, `x-content-type-options`, `referrer-policy`, CSP).
- Auth checks in every Server Action, Route Handler, and page accessing private data — never rely on middleware alone.
- Secrets only in server env; never prefixed `NEXT_PUBLIC_`.
- No `dangerouslySetInnerHTML` without sanitizer.

---

## 18. Performance

- Images: `next/image` always. Set `width`/`height` or `fill` + `sizes`.
- Fonts: `next/font`. No `@import` Google fonts.
- Code-split heavy client components with `next/dynamic`, `ssr: false` only if truly browser-only.
- Memoize only after measuring. Don't `useMemo`/`useCallback` by default.
- Prefer `Suspense` streaming over blocking `await`.
- Bundle check: `@next/bundle-analyzer` in CI.

---

## 19. Accessibility

- Semantic HTML first. `<button>` for actions, `<a>` for navigation.
- All interactive elements keyboard reachable, focus-visible.
- `aria-*` only when semantics insufficient.
- Label every form control. Associate errors via `aria-describedby`.
- Color contrast ≥ WCAG AA.
- `eslint-plugin-jsx-a11y` enforced.

---

## 20. Testing

| Layer | Tool | Location |
|---|---|---|
| Unit | Vitest + RTL | `*.test.ts(x)` co-located |
| Integration | Vitest + real DB (test schema) | `tests/integration/` |
| E2E | Playwright | `tests/e2e/*.spec.ts` |

- AAA pattern: Arrange / Act / Assert.
- One behavior per test; name: `it('returns 401 when token missing')`.
- No snapshot tests for dynamic UI.
- Mock at network boundary (MSW), not module internals.
- Coverage target: 80% lines on `services/` and `lib/`.

---

## 21. Imports

Order (enforced by `eslint-plugin-import`):
1. Node builtins
2. External packages
3. `@/` aliases
4. Relative `./`
5. Styles / assets

Blank line between groups. No unused imports. No default re-exports from barrels except `index.ts` public API.

---

## 22. Formatting & Lint

- Prettier: `semi: true`, `singleQuote: true`, `trailingComma: 'all'`, `printWidth: 100`, `tabWidth: 2`.
- ESLint: `next/core-web-vitals`, `@typescript-eslint/recommended-type-checked`, `jsx-a11y`, `import`.
- Line length: soft 100, hard 120.
- LF line endings, UTF-8, final newline.
- No commented-out code. Delete it; git preserves history.

---

## 23. Comments & Docs

- Default: no comments. Name things well.
- Comment only the **why**, never the **what**.
- JSDoc on exported public APIs of `lib/` and shared types.
- No TODO without an issue ID: `// TODO(#123): ...`.

---

## 24. Git & Commits

- Conventional Commits: `feat|fix|chore|refactor|docs|test|perf|build|ci(scope): subject`.
- Subject ≤ 72 chars, imperative mood.
- Branch: `feat/<id>-<slug>` / `fix/<id>-<slug>`.
- One logical change per PR. PR description links work item.
- Rebase over merge for feature branches; squash on merge to `main`.

---

## 25. Environment & Config

- `.env` (dev), never committed. `.env.example` is source of truth for keys.
- Validated in `lib/env.ts` with Zod at startup; crash fast on missing.
- Client-exposed vars must start with `NEXT_PUBLIC_`.
- No runtime `process.env.X` reads outside `lib/env.ts`.

---

## 26. Internationalization (if used)

- `next-intl` or built-in i18n routing.
- No hardcoded user-facing strings; all via message catalog.
- Keys in `dot.case`: `order.summary.total`.

---

## 27. Do / Don't Quick Reference

Do: RSC first, Zod at boundaries, Server Actions for mutations, `next/image`, explicit return types on exports, early returns, small components.

Don't: `any`, `React.FC`, default exports outside `page/layout/route`, business logic in route handlers, `console.log`, barrel files re-exporting everything, prop drilling past 2 levels, premature memoization, `useEffect` for data fetching on server-available data.
