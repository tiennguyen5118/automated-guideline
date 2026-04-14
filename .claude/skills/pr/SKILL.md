---
name: pr
description: Open a GitHub pull request from the current branch to main, with title prefixed by the active work item ID and body summarizing commits + linking the Azure DevOps work item.
---

Open a pull request from the current branch to `main`.

$ARGUMENTS can be:
- Empty — auto-generate title from latest commit subject.
- A title override (e.g. `add purchase order list view`) — used as the PR title.

## Step 1 — Resolve work item ID

Read `.claude/current-workitem`. If present, use as `<id>`. If missing, print a warning and continue without an `#<id>` prefix.

## Step 2 — Preflight

Run each check; stop on the first failure.

1. `git rev-parse --abbrev-ref HEAD` — capture as `<branch>`. If `<branch>` is `main`, print "Refusing to open a PR from main." and stop.
2. `git status --porcelain` — if non-empty, print "Working tree is dirty. Run /commit first." and stop.
3. `git fetch origin main` then `git rev-list --count origin/main..HEAD` — if `0`, print "No commits ahead of origin/main." and stop.
4. `gh auth status` — if not authenticated, print "Run `gh auth login` first." and stop.

## Step 3 — Push branch

```bash
git push -u origin HEAD
```

If push fails, print the error and stop. Do NOT retry.

## Step 4 — Check for an existing PR

```bash
gh pr view --json url,state 2>/dev/null
```

If an open PR exists for `<branch>`, print its URL and stop.

## Step 5 — Build title

- If `$ARGUMENTS` is non-empty → `<title> = $ARGUMENTS`.
- Else → `<title> = git log -1 --pretty=%s`.
- Strip any leading `#<number> ` from `<title>`.
- If `<id>` is resolved, set `<title> = "#<id> <title>"`.

## Step 6 — Build body

Collect commit subjects: `git log origin/main..HEAD --pretty=%s --reverse`.

Body template (via heredoc):

```
## Summary
- <commit subject 1>
- <commit subject 2>
...

## Work Item
AB#<id>    # omit this section if no <id>

## Test plan
- [ ] pnpm test
- [ ] pnpm exec playwright test
- [ ] pnpm exec tsc --noEmit
```

## Step 7 — Create the PR

```bash
gh pr create --base main --head "<branch>" \
  --title "<title>" \
  --body "$(cat <<'EOF'
<body>
EOF
)"
```

## Step 8 — Output

Print the PR URL returned by `gh`. On failure, print the error and stop. Do NOT retry.
