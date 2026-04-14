---
name: work-on
description: Set the active work item context so other skills (write-plan, update-plan, implement-plan) don't need an explicit ID argument.
---

Set or display the active work item context.

$ARGUMENTS is either a work item ID (e.g. `42`) or empty (display current context).

## If $ARGUMENTS is a work item ID:

1. Write the ID to `.claude/current-workitem`.

2. Glob for the spec folder: `specs/**/<id>-*/requirement.md` (also try `plan.md`, `plan.snapshot.md`). Derive folder from the match.

3. If no spec folder found → print "Now working on #<id>. No spec folder found yet. Run /scan-requirement <id> to create one." and stop.

4. Check `git status --porcelain` — if dirty, print error and stop.

5. Switch to the correct branch:
   - `specs/bugs/` → `fix/<id>-<slug>`, `specs/features/` → `feat/<id>-<slug>`
   - Slug = folder name minus the `<id>-` prefix.
   - If already on correct branch, skip.
   - Otherwise: try `git checkout <branch>` first (existing branch). If fails, `git fetch origin develop` (fall back to `master`), then `git checkout -b <branch> origin/develop`.

6. Print status:
   ```
   Now working on #<id>
   Spec folder: specs/<type>/<id>-<slug>/
   Branch: <branch>

   Available:
     ✓/✗ requirement.md
     ✓/✗ plan.md
     ✓/✗ tests.md
     ✓/✗ e2e-tests.md
   ```

## If $ARGUMENTS is empty:

1. Read `.claude/current-workitem`. If missing → print "No active work item. Run /work-on <id> to set one." and stop.
2. Print the same status summary for the current active ID.
