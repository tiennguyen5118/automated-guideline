---
name: analyze-requirement
description: Fetch an Azure DevOps work item by ID, refine it into a structured spec, and write to specs/<workitem-type>/<id>-<short-title>/requirement.md
---

Fetch Azure DevOps work item $ARGUMENTS, refine the raw content into a structured specification, and write the result to a spec file.

## Step 1 — Resolve work item ID

- If $ARGUMENTS is a number, use it as the ID.
- If empty, read `.claude/current-workitem`. If missing, print error and stop.

Write the ID to `.claude/current-workitem`.

## Step 2 — Fetch the work item

Read `.claude/.env` for `AZURE_DEVOPS_PAT`, `AZURE_DEVOPS_ORG_URL`, `AZURE_DEVOPS_PROJECT`. If missing, print setup instructions and stop.

```bash
curl -s -u ":$PAT" "$ORG_URL/$PROJECT/_apis/wit/workitems/$ID?\$expand=all&api-version=7.0"
```

Extract: `System.WorkItemType`, `System.Title`, `System.Description` (strip HTML), `Microsoft.VSTS.Common.AcceptanceCriteria` (strip HTML), `System.State`, `System.AssignedTo.displayName`, `System.AreaPath`, `System.IterationPath`, `System.Tags`, `Microsoft.VSTS.Scheduling.StoryPoints`, `System.Parent`.

Strip HTML tags using: `sed 's/<[^>]*>//g'` and trim whitespace.

## Step 3 — Derive output path and branch

**Spec folder:** `specs/<type-folder>/<id>-<title-slug>/`
- `Bug` → `specs/bugs/`, anything else → `specs/features/`
- Slug: lowercase, first 6-8 meaningful words, spaces/special chars → `-`, max 60 chars, strip leading/trailing `-`

**Branch:** `fix/<id>-<slug>` for bugs, `feat/<id>-<slug>` for everything else.

Check `git status --porcelain` — if dirty, print error and stop.

If not already on the correct branch:
1. `git fetch origin main`
2. `git checkout --no-track -b <branch> origin/main`
3. On first push, use `git push -u origin <branch>` to set upstream to the feature branch (not main).

Create the spec directory with `mkdir -p`.

## Step 4 — Analyze and write requirement.md

Pick the template based on `System.WorkItemType`:
- **Bug** → `.claude/skills/analyze-requirement/bug-template.md`
- Anything else (User Story, Feature, Task, PBI, …) → `.claude/skills/analyze-requirement/requirement-template.md`

**Shared analysis rules:**
- Treat raw Description and Acceptance Criteria as **input to analyze**, not content to dump.
- Infer missing information and mark with `[ASSUMPTION]`.
- If Acceptance Criteria are missing/vague, generate testable Given/When/Then criteria.

**Feature/Story rules (requirement-template.md):**
- Identify core intent, domain nouns, functional requirements, boundary conditions, dependencies, and examples.
- Use RFC 2119: MUST / SHOULD / MAY.
- Every requirement needs a unique ID (R1, R2, …) and at least one AC referencing it.
- Include at least one valid and one edge-case example.

**Bug rules (bug-template.md):**
- Extract symptom, reproduction steps, environment, and evidence from the raw Description. Mark gaps as "Unknown" or "None provided" — do not fabricate repro steps.
- Investigate the codebase to identify likely root cause; cite file paths + line numbers when found. If the bug cannot be localized from the report alone, leave **Status: Unknown** and list investigation leads instead of guessing.
- Propose a fix direction, but do NOT implement it — this skill produces analysis only.
- Estimate effort and priority. If the bug is unrelated to current project context, already fixed, or not worth fixing now, say so explicitly in **Recommendation** (e.g. "Defer — unrelated to active scope" or "Won't fix — obsolete after X") and keep the rest of the template minimal.
- Every reported symptom MUST have at least one AC verifying it is fixed (unless Recommendation is Won't fix).

## Step 5 — Confirm

```
Now working on #<ID>
Spec folder: specs/<type-folder>/<id>-<title-slug>/
Branch: <branch-name>
```

## Error handling

- No ID and no `.claude/current-workitem` → print error, stop.
- API error or non-200 → print error message, stop.
- Missing `.claude/.env` → print setup instructions for all 3 variables, stop.
