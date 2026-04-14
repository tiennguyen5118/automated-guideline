---
name: write-plan
description: Read a requirement.md from specs/<workitem-type>/<id>-<short-title>/ and generate an implementation plan.md in the same directory for review before coding begins.
---

Generate an implementation plan from a requirement file.

$ARGUMENTS can be: a work item ID, a path to `requirement.md`, a spec folder path, or empty (uses `.claude/current-workitem`).

## Step 1 — Resolve the requirement file

- Number → glob `specs/**/<number>-*/requirement.md`, use first match.
- Ends with `requirement.md` → use directly.
- Folder → append `/requirement.md`.
- Empty → read ID from `.claude/current-workitem`, then glob.
- Not found → print error, stop.

## Step 2 — Read requirement.md, docs, and explore the codebase

1. Read `requirement.md` fully.
2. Read `docs/architecture.md` and `docs/convention.md` to ground the plan in the project's architectural decisions and coding conventions. Do NOT skip this — plans that violate these docs will be rejected.
3. Identify which files, modules, and directories are likely affected.
4. Read key files to understand existing patterns and how the docs are applied in practice.

## Step 3 — Write plan.md

Read the template at `.claude/skills/write-plan/plan-template.md` and use it as the output format. Write `plan.md` in the same directory as `requirement.md`.

**Rules:**
- Be specific: reference actual file paths, function names, types, and patterns found in the codebase.
- Follow `docs/architecture.md` (layering, data flow, tech choices) and `docs/convention.md` (naming, file structure, style). Call out any deliberate deviation and why.
- Do not invent architecture that doesn't exist — follow existing conventions.
- **UI/UX rule:** Any new UI must read as a serious enterprise application — restrained, professional, and discreet. The audience is hardcore domain users and UI/UX experts; avoid flashy colors, playful illustrations, emoji, marketing gradients, and avoid a plain black-and-white look that feels unfinished. Use a muted, considered palette with clear hierarchy, dense-but-legible typography, and quiet interaction states. Call out colors, spacing, and component choices in the plan.
- If the codebase is empty/new, note that and propose a sensible initial structure.
- The plan is for human review. Make it clear and reviewable, not a vague outline.

## Step 4 — Print the path of `plan.md` and a one-line summary of the approach.
