# Claude Code Skills

Skills are invoked with `/skill-name [arguments]` in any Claude Code session.

---

## `/work-on <id>`

Sets the active work item context so all other skills can be run without passing an ID every time.

**Usage:**
```
/work-on 42        # set active work item
/work-on           # show current active work item and its status
```

**Output:** Writes `.claude/current-workitem`; prints spec folder status (requirement.md, plan.md, etc.)

---

## `/analyze-requirement [id]`

Fetches an Azure DevOps work item, analyzes it, and writes a structured specification with requirements, acceptance criteria, and examples.

**Usage:**
```
/analyze-requirement 42
/analyze-requirement    # uses context ID
```

**Output:** `specs/<work-item-type>/<id>-<title-slug>/requirement.md`

**Requires:** `.claude/.env` file with `AZURE_DEVOPS_PAT`, `AZURE_DEVOPS_ORG_URL`, `AZURE_DEVOPS_PROJECT`

---

## `/update-ticket [id]`

Updates an Azure DevOps work item — add a structured comment, update story points or state, create linked test cases, or update any field.

**Usage:**
```
/update-ticket 42
/update-ticket    # uses context ID
```

**Output:** Changes written back to Azure DevOps; test case work items created if requested

**Requires:** `.claude/.env` with `AZURE_DEVOPS_PAT`, `AZURE_DEVOPS_ORG_URL`, `AZURE_DEVOPS_PROJECT`; optionally `requirement.md` and `plan.md` for richer auto-generated comments

---

## `/write-plan [id]`

Reads a `requirement.md` and generates a detailed implementation plan by exploring the codebase.

**Usage:**
```
/write-plan 42
```

**Output:** `specs/<work-item-type>/<id>-<title-slug>/plan.md`

**Requires:** `requirement.md` to exist (run `/analyze-requirement` first)

---

## `/update-plan [id] [instructions]`

Revises an existing `plan.md` based on your feedback. Accepts inline instructions or a `feedback.md` file.

**Usage:**
```
/update-plan 42 remove the Redis step and add unit tests
/update-plan I prefer postgres over sqlite   # uses context ID

# or write specs/.../<id>-slug/feedback.md then:
/update-plan
```

**Output:** `plan.md` updated in-place; `feedback.md` deleted after use

**Requires:** `plan.md` to exist (run `/write-plan` first)

---

## `/implement-plan [id]`

Executes the approved `plan.md` step by step, making all code changes described in it.

**Usage:**
```
/implement-plan 42
/implement-plan    # uses context ID
```

**Output:** All files created/modified as specified in `plan.md`

**Requires:** `plan.md` to exist and be reviewed (run `/write-plan` first, optionally `/update-plan`)

---

## `/write-tests [id]`

Reads the requirement and the implemented code to generate a `tests.md` test plan covering unit and integration tests.

**Usage:**
```
/write-tests 42
/write-tests       # uses context ID
```

**Output:** `specs/<work-item-type>/<id>-<title-slug>/tests.md`

**Requires:** `requirement.md` and `plan.md` to exist (run `/implement-plan` first)

---

## `/implement-tests [id]`

Executes the approved `tests.md` step by step, writing all test files described in it. On subsequent runs, implements only the delta vs the last run.

**Usage:**
```
/implement-tests 42
/implement-tests   # uses context ID
```

**Output:** All test files created/modified as specified in `tests.md`

**Requires:** `tests.md` to exist and be reviewed (run `/write-tests` first)

---

## `/write-e2e-tests [id]`

Explores the app's routes, pages, and user flows to generate an `e2e-tests.md` Playwright test plan. Can be used standalone (no work item needed).

**Usage:**
```
/write-e2e-tests 42
/write-e2e-tests   # uses context ID, or runs standalone
```

**Output:** `specs/<work-item-type>/<id>-<title-slug>/e2e-tests.md` (or `e2e-tests.md` in project root if standalone)

**Requires:** Application code to explore (runs best after `/implement-plan`)

---

## `/implement-e2e-tests [id]`

Bootstraps Playwright config and Page Object Models, then writes all Playwright spec files from `e2e-tests.md`. On subsequent runs, implements only the delta.

**Usage:**
```
/implement-e2e-tests 42
/implement-e2e-tests   # uses context ID, or finds e2e-tests.md in project root
```

**Output:** `playwright.config.ts`, `e2e/pages/*.ts` (POMs), `e2e/*.spec.ts` test files

**Requires:** `e2e-tests.md` to exist and be reviewed (run `/write-e2e-tests` first)

---

## `/commit [message]`

Commits staged and unstaged changes with a message prefixed by the active work item ID, then pushes to GitHub.

**Usage:**
```
/commit fix the date picker          # uses context ID → "#42 fix the date picker"
/commit 42 fix the date picker       # explicit ID
/commit                              # auto-generates message from diff
```

**Output:** Commit created and pushed to GitHub

**Requires:** `.claude/current-workitem` (or pass ID inline); GitHub remote configured with auth (SSH or credential manager)

---

## `/scaffold`

Scaffolds a Next.js app (App Router, TypeScript, Tailwind v4, Drizzle ORM) with Docker Compose and PostgreSQL 16 into `app/`. Follows the architecture defined in `docs/architecture.md`.

**Usage:**
```
/scaffold
```

**Output:** `app/` directory with Next.js project, Drizzle ORM, Vitest, Docker Compose, and environment config

**Requires:** `docs/architecture.md` to exist; `pnpm` installed

---

## Typical workflow

```
/work-on 42               # set active work item (do this once)
/analyze-requirement       # fetch work item → requirement.md
/write-plan                # generate plan   → plan.md
# review plan.md ...
/update-plan <notes>       # revise plan if needed
/implement-plan            # execute the plan → code changes
/update-ticket             # post comment, update story points/state, create test cases
/write-tests               # generate unit/integration test plan → tests.md
# review tests.md ...
/implement-tests           # write unit/integration tests → test files
/write-e2e-tests           # generate Playwright plan → e2e-tests.md
# review e2e-tests.md ...
/implement-e2e-tests       # write Playwright specs → e2e/*.spec.ts
/commit fix the thing      # commit + push to GitHub
```
