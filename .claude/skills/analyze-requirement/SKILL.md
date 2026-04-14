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

Read the template at `.claude/skills/scan-requirement/requirement-template.md` and use it as the output format.

**Analysis rules:**
- Treat raw Description and Acceptance Criteria as **input to analyze**, not content to dump.
- Identify core intent, domain nouns, functional requirements, boundary conditions, dependencies, and examples.
- Infer missing information and mark with `[ASSUMPTION]`.
- If Acceptance Criteria are missing/vague, generate testable Given/When/Then criteria from the description.
- Use RFC 2119: MUST (hard requirement), SHOULD (strong recommendation), MAY (optional).
- Every requirement needs a unique ID (R1, R2, ...) and at least one AC referencing it.
- Include at least one valid and one edge-case example.

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
