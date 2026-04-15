---
name: commit
description: Commit staged and unstaged changes with a message prefixed by the active Azure DevOps work item ID using the Azure Boards GitHub integration syntax (e.g. "AB#16 fix date picker"), then push to GitHub.
---

Commit current changes with a work-item-prefixed message, then push to GitHub.

Source is hosted on GitHub; work items are tracked in Azure Boards. Use the `ABAB#<id>` prefix — Azure Boards' GitHub app recognizes it and links the commit/PR to the work item. Plain `AB#<id>` would be auto-linked to a GitHub issue instead, so avoid it.

$ARGUMENTS can be:
- A commit message (e.g. `fix the date picker`) — uses ID from `.claude/current-workitem`
- An ID + message (e.g. `42 fix the date picker`) — uses provided ID
- Empty — auto-generates message from diff

## Step 1 — Resolve ID and message

- Empty → read `.claude/current-workitem` for ID; message will be auto-generated.
- Starts with number + space → number is ID, rest is message.
- Starts with non-numeric → read `.claude/current-workitem` for ID, full text is message.
- No ID resolved → print error, stop.

## Step 2 — Check for changes

Run `git status` (never `-uall`) and `git diff`. If no changes → "Nothing to commit." and stop.

## Step 3 — Auto-generate message (if none provided)

Run `git diff` and `git log --oneline -5`. Write a concise 1-sentence message focusing on "why". Do not include `AB#<id>` prefix — it's added automatically.

## Step 4 — Stage and commit

1. `git status` to identify files.
2. Stage files by name (`git add <file1> <file2>`). Skip `.env`, credentials, tokens — warn if present.
3. Commit with format `AB#<id> <message>`:
   ```bash
   git commit -m "$(cat <<'EOF'
   AB#<id> <message>
   EOF
   )"
   ```

## Step 5 — Push to remote

1. If current branch has no upstream, or upstream is `origin/main` while current branch is not `main`, push with `git push -u origin HEAD:refs/heads/<current-branch>` to set upstream to the feature branch. Otherwise `git push origin HEAD`.
2. If push fails, print the error. Do NOT retry.

## Step 6 — Output

```
Committed and pushed: AB#<id> <message>
<short hash> → <branch>
```

If push fails: `Committed: AB#<id> <message> (push failed — check git remote / auth)`
If commit fails (e.g. pre-commit hook): print error, stop. Do NOT amend or retry.
