# [<WorkItemType> #<ID>] <Full Title>

---

## 1. Intent

**What:** <One or two sentences describing what this feature does — the observable change from a user's perspective.>

**Why:** <One or two sentences explaining the business or user value — why this feature exists.>

---

## 2. Model

Key domain concepts introduced or affected by this work item:

| Term | Definition |
|------|-----------|
| <Noun/Concept> | <Clear, concise definition as it applies to this feature> |

---

## 3. Requirements & Acceptance Criteria

### 3.1 Requirements

- **R1:** The system MUST <requirement derived from raw description>
- **R2:** The system SHOULD <requirement derived from raw description>
- **R3:** The system MAY <optional capability derived from raw description>

<Continue as needed. Each requirement gets a unique ID (R1, R2, ...) for traceability.>

### 3.2 Acceptance Criteria

- **AC1 (R1):** Given <precondition>, when <action>, then <expected outcome>.
- **AC2 (R1):** Given <precondition>, when <action>, then <expected outcome>.
- **AC3 (R2):** Given <precondition>, when <action>, then <expected outcome>.

<Each AC references the requirement(s) it verifies via the R-ID in parentheses. Generate from the raw Acceptance Criteria if they exist, or derive from the Requirements if the raw ACs are missing or say "Not specified". Every requirement MUST have at least one AC.>

---

## 4. Boundaries

**In scope:**
- <What is included in this work item>

**Out of scope:**
- <What is explicitly excluded — related things that will NOT be done>

**Ambiguity policy:** Where the raw work item is ambiguous, this spec has made assumptions marked with `[ASSUMPTION]`. These should be validated with the product owner before implementation begins.

---

## 5. Examples

### Example 1: <Short name>
- **Input:** <Describe the input or user action>
- **Expected output:** <Describe the expected system behavior>

### Example 2: <Short name (edge case)>
- **Input:** <Describe an edge case or invalid input>
- **Expected output:** <Describe how the system should respond>

<Include at least one valid and one invalid/edge-case example. Derive from the raw description, UI mockups, or tables if present.>

---
