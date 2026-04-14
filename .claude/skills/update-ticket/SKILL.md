---
name: update-ticket
description: Partially update an Azure DevOps work item based on which spec files exist — requirement.md updates Requirement, Acceptance Criteria, and State; plan.md posts a comment and sets Story Points and Due Date; e2e-tests.md creates child Test Case work items.
---

Partially update an Azure DevOps work item. Operations auto-detected based on which spec files exist:

- **requirement.md exists** → update Specification field, Acceptance Criteria field, set state to Active
- **plan.md exists** → post structured comment, set Story Points and Due Date
- **e2e-tests.md exists** → create child Test Case work items from the Test Cases section
- All paths fire in same run if their files exist.

$ARGUMENTS: a work item ID, or empty (uses `.claude/current-workitem`).

## Step 1 — Resolve ID and credentials

- Number → use as ID. Empty → read `.claude/current-workitem`. Missing → error, stop.
- Read `.env` for `AZURE_DEVOPS_PAT`, `AZURE_DEVOPS_ORG_URL`, `AZURE_DEVOPS_PROJECT`. Missing → error, stop.

## Step 2 — Fetch current work item

```bash
curl -s -u ":$PAT" "$ORG_URL/$PROJECT/_apis/wit/workitems/$ID?\$expand=all&api-version=7.0"
```
Extract `System.Title` and `System.State`. On error → print and stop.

## Step 3 — Locate spec files

Glob `specs/**/<ID>-*/requirement.md`. Derive spec folder. Check for `requirement.md` (→ Path A), `plan.md` (→ Path B), and `e2e-tests.md` (→ Path C). None exists → print warning, stop.

---

### Path A — requirement.md: Update fields

1. Extract sections 1-6 (Intent through Examples) as `SPEC_MARKDOWN`.
2. Extract `### 3.2 Acceptance Criteria` content as `AC_MARKDOWN`.
3. **Convert markdown to HTML** before sending — Azure DevOps rich text fields require HTML, not markdown. Apply these conversions:
   - `## Heading` → `<h2>Heading</h2>`, `### Heading` → `<h3>Heading</h3>`, etc.
   - `**bold**` → `<strong>bold</strong>`, `*italic*` → `<em>italic</em>`
   - `- item` / `* item` → `<ul><li>item</li></ul>` (group consecutive list items)
   - Numbered lists `1. item` → `<ol><li>item</li></ol>`
   - `| col | col |` tables → `<table><tr><td>...</td></tr></table>`
   - `` `code` `` → `<code>code</code>`
   - Blank lines between paragraphs → `<p>...</p>` wrapping
   - `---` → `<hr/>`
   - Escape `"` as `\"` in the JSON payload.
4. PATCH all three fields using the HTML-converted values (`SPEC_HTML`, `AC_HTML`):
   ```bash
   curl -s -u ":$PAT" -X PATCH -H "Content-Type: application/json-patch+json" \
     "$ORG_URL/$PROJECT/_apis/wit/workitems/$ID?api-version=7.0" \
     -d '[
       {"op":"add","path":"/fields/Custom.Specification","value":"<SPEC_HTML>"},
       {"op":"add","path":"/fields/Microsoft.VSTS.Common.AcceptanceCriteria","value":"<AC_HTML>"},
       {"op":"add","path":"/fields/System.State","value":"Active"}
     ]'
   ```
   On failure (e.g. `Custom.Specification` field doesn't exist), print the error, continue to Path B.

---

### Path B — plan.md: Comment + Story Points + Due Date

**B1. Generate comment** with four sections from plan.md:
- **Technical Approach** (2-4 sentences from Approach/Summary)
- **Solution Description** (3-6 bullets: components, files, libraries)
- **Estimated Due Date** (sum hours ÷ 6h/day, skip weekends, from today, format YYYY-MM-DD)
- **Estimated Hours** (size each step individually, not flat rate):
  - Scaffolding/config → 0.5-1h
  - Simple single-file → 1-2h
  - Multi-file feature → 2-4h
  - Complex integration → 3-5h
  - Verification → 0.5-1h

**B2. Post comment:**
```bash
curl -s -u ":$PAT" -X POST -H "Content-Type: application/json" \
  "$ORG_URL/$PROJECT/_apis/wit/workitems/$ID/comments?api-version=7.0" \
  -d "{\"text\": \"<escaped comment>\"}"
```

**B3. Calculate:** Story Points = total hours ÷ 4, round to nearest (1,2,3,5,8,13). Due Date = upper-bound hours ÷ 6h/day, skip weekends.

**B4. PATCH Story Points and Due Date:**
```bash
curl -s -u ":$PAT" -X PATCH -H "Content-Type: application/json-patch+json" \
  "$ORG_URL/$PROJECT/_apis/wit/workitems/$ID?api-version=7.0" \
  -d '[
    {"op":"add","path":"/fields/Microsoft.VSTS.Scheduling.StoryPoints","value":<SP>},
    {"op":"add","path":"/fields/Microsoft.VSTS.Scheduling.DueDate","value":"<DATE>"}
  ]'
```

---

### Path C — e2e-tests.md: Create child Test Case work items

**C1. Parse test cases** from the `## Test Cases` section of `e2e-tests.md`. Each row in the test case tables represents one test case. Extract these fields per row:

| e2e-tests.md column | Maps to |
|----------------------|---------|
| `#` (e.g. TC-1.1) | Test Case title prefix |
| `Test Case` | Test Case title (combined: `[#<parent-ID>] <TC-#> <Test Case>`) |
| `Precondition` | `Microsoft.VSTS.TCM.LocalDataSource` (preconditions field) |
| `Steps` | Steps XML (see C2) |
| `Expected Result` | Expected result within Steps XML |
| `Type` | Tag on the work item (Happy / Negative / Edge) |

**C2. Build Steps XML** for each test case. Azure DevOps Test Cases use an XML format for steps:
```xml
<steps id="0" last="<N>">
  <step id="<i>" type="ValidateStep">
    <parameterizedString isformatted="true">&lt;DIV&gt;&lt;P&gt;Step text here&lt;/P&gt;&lt;/DIV&gt;</parameterizedString>
    <parameterizedString isformatted="true">&lt;DIV&gt;&lt;P&gt;Expected result here&lt;/P&gt;&lt;/DIV&gt;</parameterizedString>
    <description/>
  </step>
</steps>
```
- Parse the numbered steps from the `Steps` column (split on numbered items like `1.`, `2.`, etc.)
- The **last step** should include the `Expected Result` as the expected-result parameterizedString
- Earlier steps should have an empty expected-result parameterizedString

**C3. Check for existing child Test Cases** before creating duplicates:
```bash
curl -s -u ":$PAT" -X POST -H "Content-Type: application/json" \
  "$ORG_URL/$PROJECT/_apis/wit/wiql?api-version=7.0" \
  -d '{"query": "SELECT [System.Id], [System.Title] FROM WorkItemLinks WHERE ([Source].[System.Id] = <ID>) AND ([System.Links.LinkType] = '\''System.LinkTypes.Hierarchy-Forward'\'') AND ([Target].[System.WorkItemType] = '\''Test Case'\'') MODE (MustContain)"}'
```
Extract existing child Test Case titles. Skip creation for any test case whose title already exists as a child.

**C4. Create each Test Case work item** with a parent link to the original work item:
```bash
curl -s -u ":$PAT" -X POST -H "Content-Type: application/json-patch+json" \
  "$ORG_URL/$PROJECT/_apis/wit/workitems/\$Test%20Case?api-version=7.0" \
  -d '[
    {"op":"add","path":"/fields/System.Title","value":"[#<PARENT_ID>] <TC_NUMBER> <TC_TITLE>"},
    {"op":"add","path":"/fields/Microsoft.VSTS.TCM.Steps","value":"<STEPS_XML>"},
    {"op":"add","path":"/fields/Microsoft.VSTS.TCM.LocalDataSource","value":"<PRECONDITION>"},
    {"op":"add","path":"/fields/System.Tags","value":"<TYPE>"},
    {"op":"add","path":"/fields/System.AreaPath","value":"<PROJECT>"},
    {"op":"add","path":"/relations/-","value":{"rel":"System.LinkTypes.Hierarchy-Reverse","url":"$ORG_URL/_apis/wit/workitems/<PARENT_ID>","attributes":{"name":"Parent"}}}
  ]'
```

**C5. Logging:** Print each test case as it is created:
```
  ✓ Created Test Case #<new-id>: [#<parent-id>] TC-1.1 Drag third task to first position
  ✓ Created Test Case #<new-id>: [#<parent-id>] TC-1.2 Drag first task to last position
  ⊘ Skipped TC-2.1 (already exists as #<existing-id>)
```

---

## Step 4 — Summary

```
Update complete for #<ID>: <Title>
  ✓/✗ Requirement updated
  ✓/✗ Acceptance Criteria updated
  ✓/✗ State → Active
  ✓/✗ Comment added
  ✓/✗ Story Points → <SP>
  ✓/✗ Due Date → <DATE>
  ✓/✗ Test Cases created: <N> new, <M> skipped (already existed)
Work item: <ORG_URL>/<PROJECT>/_workitems/edit/<ID>
```

Only show operations that were attempted. ✓ for success, ✗ for failure. Escape `"` as `\"` in curl JSON payloads.
Escape `<`, `>`, `&` as `&lt;`, `&gt;`, `&amp;` in Steps XML values.
