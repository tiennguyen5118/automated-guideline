---
name: update-plan
description: Update an existing plan.md in specs/<workitem-type>/<id>-<short-title>/ based on inline instructions or a feedback.md file in the same directory.
---

Update an existing implementation plan based on revision instructions.

$ARGUMENTS is: `[id] [inline instructions]`
- First token is a number → work item ID + rest is inline instruction.
- Starts with non-numeric text or empty → read ID from `.claude/current-workitem`.

Examples: `/update-plan 42 remove the Redis step`, `/update-plan I prefer postgres over sqlite`, `/update-plan` (uses feedback.md only).

## Steps

1. **Resolve spec folder**: glob `specs/**/<id>-*/`, use first match. If not found, print error, stop.

2. **Read `plan.md`** from spec folder. If missing → "No plan.md found. Run /write-plan first." and stop.

3. **Read `requirement.md`** from same folder for context.

4. **Collect instructions**: inline text from args + contents of `feedback.md` (if it exists in spec folder). If both empty → "No instructions provided." and stop.

5. **Re-explore codebase** if changes touch specific files or areas.

6. **Rewrite `plan.md` in-place**: apply requested changes only. Preserve unaffected sections. Keep same format.

7. **Delete `feedback.md`** if it was used.

8. **Print summary** of what changed:
   ```
   Updated plan.md for <Type> #<ID>:
   - Removed: <step>
   - Added: <step>
   - Clarified: <detail>
   ```

**Notes:** Do not regenerate from scratch — only apply requested changes. If ambiguous, make reasonable interpretation and note it.
