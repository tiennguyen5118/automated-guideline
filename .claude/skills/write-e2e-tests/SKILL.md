---
name: write-e2e-tests
description: Explore the application and generate an e2e-tests.md Playwright test plan covering critical user flows. Run after /implement-plan. Can also be used standalone against any existing app.
---

Generate a Playwright E2E test plan by exploring the application's routes, pages, and user flows.

$ARGUMENTS can be: a work item ID, a path to a spec folder/requirement.md/plan.md, or empty (uses `.claude/current-workitem`, or standalone mode if no context exists).

## Step 1 — Resolve context

- Number → glob `specs/**/<number>-*/`, use first match as spec folder.
- Ends with `requirement.md` or `plan.md` → derive spec folder.
- Folder under `specs/` → use directly.
- Empty → try `.claude/current-workitem`. If missing, continue in **standalone mode** (no spec folder).

## Step 2 — Read context files (skip gracefully if absent)

- `requirement.md` — user stories and acceptance criteria
- `plan.md` — affected files and implemented routes/features

## Step 3 — Write business test cases

Derive test cases from each Acceptance Criterion in `requirement.md`. These are the **primary output** — they must be written in business language that any developer, tester, or stakeholder can understand.

For each AC, write test cases covering:
- **Happy path**: the AC's expected behavior when everything goes right.
- **Negative cases**: invalid input, missing data, unauthorized access, error conditions.
- **Edge cases**: boundary values, empty states, single-item lists, concurrent actions.

Number test cases as `TC-<AC#>.<seq>` (e.g. TC-1.1, TC-1.2, TC-2.1).

Each test case must specify: precondition, steps (user or system actions), and expected result — all in plain language, no code.

## Step 4 — Explore the application

- Find framework/router: `next.config.*`, `vite.config.*`, `app/`, `pages/`, `src/app/`, `routes/`.
- List all page/route files to derive navigable URLs.
- Find forms, buttons, interactive elements in page/component files.
- Find API routes or server actions that user flows trigger.
- Check for existing Playwright config (`playwright.config.*`, `e2e/`) and existing tests.
- Identify dev server command and base URL.

## Step 5 — Identify user flows to cover

Priority order:
1. **Happy paths** for every major feature (CRUD, login, checkout, etc.)
2. **Error paths** visible to users (validation, 404, auth redirect)
3. **Acceptance criteria** from requirement.md that require a browser
4. **Navigation/routing** (deep links, redirects, back/forward)

## Step 6 — Write e2e-tests.md

Read the template at `.claude/skills/write-e2e-tests/e2e-tests-template.md` and use it as the output format.

- If spec folder exists → write there.
- Otherwise → write to project root as `e2e-tests.md`.

**Rules:**
- **Every Test Case in the "Test Cases" section MUST have a dedicated, matching test row in the "Test Files" section.** There must be a 1:1 mapping — no "variant" notes, no combining multiple TCs into one test, no hand-waving in the Traceability table. If a TC exists, a corresponding test row must exist.
- **Every test row in "Test Files" MUST trace back to a Test Case.** If a test has no TC, add a TC for it first.
- Use role-based and text-based selectors (`getByRole`, `getByLabel`, `getByText`) over CSS selectors.
- Avoid `page.waitForTimeout()` — prefer auto-waiting, `waitForResponse`, `waitForURL`.
- Each `test()` must be independent — no shared mutable state.
- Specify exact button labels, input placeholders, and expected visible text.
- If no Playwright config exists, spell out what to create in "Setup needed".

## Step 7 — Print the path of `e2e-tests.md` and a one-line summary of flows covered.
