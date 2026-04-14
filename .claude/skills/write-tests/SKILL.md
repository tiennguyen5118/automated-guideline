---
name: write-tests
description: Read a requirement.md and the implemented code to generate a tests.md test plan covering unit and integration tests. Run after /implement-plan. For E2E tests use /write-e2e-tests.
---

Generate a test plan from a requirement file and the existing implementation.

$ARGUMENTS can be: a work item ID, a path to `requirement.md` or `plan.md`, a spec folder path, or empty (uses `.claude/current-workitem`).

## Step 1 — Resolve the spec folder

- Number → glob `specs/**/<number>-*/requirement.md`, derive folder from match.
- Ends with `requirement.md` or `plan.md` → derive folder from path.
- Folder → use directly.
- Empty → read ID from `.claude/current-workitem`, then glob.
- Not found → print error, stop.

## Step 2 — Read context and explore code

1. Read `requirement.md` fully (acceptance criteria, scope).
2. Read `plan.md` (affected files, implementation details).
3. Read every file listed in plan.md's "Affected Files" table.
4. Identify existing test infrastructure: framework, test folder conventions, helpers, fixtures, CI config.
5. Note what is already tested to avoid duplicates.

## Step 3 — Classify technical tests

- **Unit**: isolated logic — functions, classes, utilities, pure components. Mock all external dependencies.
- **Integration**: multiple units together — API routes + DB, service + repository, component + store. Real implementations with test doubles only at system boundaries.
- Skip any layer clearly out of scope and note why. E2E tests are out of scope — use `/write-e2e-tests`.

## Step 4 — Write tests.md

Read the template at `.claude/skills/write-tests/tests-template.md` and use it as the output format. Write `tests.md` in the spec folder.

**Structure order:** Test Infrastructure → Unit Tests → Integration Tests → Traceability → Out of Scope → Open Questions.

**Rules:**
- Use real file paths, function names, and variable names from actual code in the unit/integration sections.
- Do not invent test cases that cannot possibly fail. Every test must catch a real bug.
- Test behaviour, not implementation details. Unit tests should test public interfaces.
- If no test infrastructure exists, propose one in "Test Infrastructure" and note setup is a prerequisite.
- The plan is for human review. Make it clear and reviewable.

## Step 5 — Print the path of `tests.md` and a one-line summary of the test strategy.
