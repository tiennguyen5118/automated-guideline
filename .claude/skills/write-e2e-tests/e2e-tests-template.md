# E2E Test Plan (Playwright): <Feature or App Name>

**Work Item:** <Type> #<ID> *(omit if standalone)*
**Requirement:** [requirement.md](./requirement.md) *(omit if standalone)*

---

## Playwright Setup

| Item | Detail |
|------|--------|
| Config file | `playwright.config.ts` |
| Test folder | `e2e/` |
| Base URL | `http://localhost:3000` (or as configured) |
| Dev server command | `npm run dev` |
| Run command | `npx playwright test` |
| Run single file | `npx playwright test e2e/todos.spec.ts` |
| Browsers | chromium (default), firefox, webkit |
| Install command | `npm install -D @playwright/test && npx playwright install` |

> **Setup needed:** *(list any missing config files or installs detected; "None" if Playwright is already configured)*

---

## Test Cases

Derived from Acceptance Criteria. Written in business language — any developer, tester, or stakeholder should understand what is being verified.

> **Type**: Happy / Negative / Edge
> Developers: execute these test cases locally as smoke tests before PR.
> Testers: use these as the basis for test execution at every stage (Local → PR → Dev → Staging).

### AC1 — <criterion summary>

| # | Test Case | Precondition | Steps | Expected Result | Type |
|---|-----------|--------------|-------|-----------------|------|
| TC-1.1 | <name> | <setup> | <actions> | <outcome> | Happy |
| TC-1.2 | <name> | <setup> | <actions> | <outcome> | Negative |
| TC-1.3 | <name> | <setup> | <actions> | <outcome> | Edge |

### AC2 — <criterion summary>

| # | Test Case | Precondition | Steps | Expected Result | Type |
|---|-----------|--------------|-------|-----------------|------|
| TC-2.1 | <name> | <setup> | <actions> | <outcome> | Happy |

*(Repeat for each acceptance criterion)*

---

## Test Files

**Every Test Case above MUST have exactly one matching test row below (1:1 mapping). Every test row below MUST trace back to a Test Case. Do not combine multiple TCs into a single test or use "variant" notes.**

### `e2e/<flow-name>.spec.ts`
**Flow:** <human-readable name of the user journey>
**Base URL path:** `/` or `/todos` etc.

| Test | Preconditions | Steps | Expected |
|------|---------------|-------|----------|
| <test name matching TC-X.Y> | <seed data / auth state> | <numbered user actions> | <visible assertions> |

*(One table per spec file; one row per `test()` block)*

---

## Page Object Models

| Class | File | Wraps | Key methods |
|-------|------|-------|-------------|
| `TodoPage` | `e2e/pages/todo.page.ts` | `/todos` | `addTodo(text)`, `deleteTodo(index)`, `getTodoTexts()` |

*(Omit section if no reuse is needed)*

---

## Global Fixtures / Setup

- **Auth state**: e.g. save logged-in cookie to `e2e/.auth/user.json` via `globalSetup`
- **Seed data**: e.g. reset DB before each test via API call in `beforeEach`
- **MSW / API mocking**: note if network requests should be intercepted

*(Omit if no shared setup is needed)*

---

## Traceability

Maps business test cases to their Playwright test implementations.

| Test Case | Covered by |
|-----------|------------|
| TC-1.1 — <test case name> | `e2e/<file>.spec.ts` :: <exact test name from Test Files> |
| TC-1.2 — <test case name> | `e2e/<file>.spec.ts` :: <exact test name from Test Files> |
| TC-2.1 — <test case name> | Unit/Integration (out of scope — see `/write-tests`) |

> Every TC with a Playwright test MUST map to exactly one test row in Test Files (1:1). Do not use "variant", "partial", or combine multiple TCs into one test.

> Test cases that don't require a browser are out of scope for E2E — cover them in `/write-tests`.

*(Omit if standalone — no requirement.md)*

---

## Out of Scope

List flows explicitly NOT covered here and why.

---

## Open Questions

List any ambiguities. Leave empty if none.
