# [User Story #44] Automated Visual Guidelines

---

## 1. Intent

**What:** Provide a web tool that ingests text-heavy policies, guidelines, or procedure announcements and automatically renders them as visual artifacts (flowcharts, infographics, step-by-step diagrams) that users can view and share.

**Why:** Current guidelines and policy announcements are text-heavy, hard to follow, and take roughly a week to produce in a readable form. Visualizing them improves readability, adoption, and reduces authoring time.

---

## 2. Model

| Term | Definition |
|------|-----------|
| Guideline | A source document (policy, procedure, or announcement) submitted by an author as plain text or Markdown. |
| Visualization | A generated visual representation of a Guideline — e.g. flowchart, infographic, or step diagram. |
| Author | The user who submits the source text and reviews/publishes the resulting visualization. |
| Reader | The end user who consumes the published Visualization. |
| Generation Job | An async task that converts a Guideline into one or more Visualizations. [ASSUMPTION] |

---

## 3. Requirements & Acceptance Criteria

### 3.1 Requirements

- **R1:** The system MUST allow an Author to submit a Guideline as text (paste or upload) via the web UI.
- **R2:** The system MUST automatically convert the submitted Guideline into at least one Visualization format (flowchart for procedural content, infographic for declarative/policy content). [ASSUMPTION — exact formats]
- **R3:** The system MUST render the Visualization in the browser and allow the Author to preview it before publishing.
- **R4:** The system SHOULD let the Author edit or regenerate the Visualization (e.g. tweak steps, re-run generation with adjusted input) before publishing.
- **R5:** The system MUST persist submitted Guidelines and generated Visualizations so they can be retrieved later. [ASSUMPTION — storage in the project's PostgreSQL instance via Drizzle]
- **R6:** The system SHOULD allow Readers to view a published Visualization via a shareable URL.
- **R7:** The system SHOULD reduce end-to-end time from raw text to published visual from ~1 week to under 1 hour. [ASSUMPTION — target derived from stated current completion time]
- **R8:** The system MAY support exporting a Visualization as an image (PNG/SVG) or PDF. [ASSUMPTION]
- **R9:** The system MUST surface a clear error state when generation fails (e.g. input too long, model error) rather than silently producing nothing.

### 3.2 Acceptance Criteria

- **AC1 (R1):** Given an authenticated Author on the submission page, when they paste guideline text and click "Generate", then the submission is accepted and a Generation Job is created.
- **AC2 (R2, R3):** Given a successful Generation Job for a procedural guideline (contains numbered steps or ordered actions), when generation completes, then a flowchart Visualization is rendered in the preview pane.
- **AC3 (R2, R3):** Given a successful Generation Job for a declarative policy (no clear ordering), when generation completes, then an infographic-style Visualization is rendered in the preview pane.
- **AC4 (R4):** Given a preview is shown, when the Author edits the source text and clicks "Regenerate", then a new Visualization replaces the previous preview.
- **AC5 (R5, R6):** Given the Author clicks "Publish", when publishing succeeds, then the Visualization is stored and accessible at a stable shareable URL.
- **AC6 (R9):** Given a Generation Job fails (e.g. upstream model error), when the Author returns to the preview, then a visible error message explains the failure and offers a retry action.
- **AC7 (R1):** Given empty input, when the Author clicks "Generate", then the system blocks submission and shows a validation message.
- **AC8 (R7):** Given a typical guideline (≤ 2,000 words), when "Generate" is clicked, then the first preview appears within 60 seconds. [ASSUMPTION — latency target]

---

## 4. Boundaries

**In scope:**
- Web UI for submitting guideline text and viewing the generated Visualization.
- Automatic selection between at least two visualization styles (flowchart vs. infographic) based on content shape. [ASSUMPTION]
- Persistence of Guidelines and Visualizations.
- Shareable read-only URL for published Visualizations.

**Out of scope:**
- Authoring from non-text sources (images, audio, video).
- Collaborative real-time editing between multiple Authors.
- Translation/localization of guidelines.
- Approval workflows, role-based publishing gates, or e-signature.
- Analytics on Reader engagement.

**Ambiguity policy:** The raw work item provides only pain points and high-level ideas with no explicit acceptance criteria. Assumptions above are marked `[ASSUMPTION]` and should be validated with the product owner before implementation.

---

## 5. Dependencies

- An LLM / diagram-generation capability to convert prose into structured visual data (e.g. Claude API producing Mermaid or a structured JSON graph). [ASSUMPTION]
- A client-side diagram renderer (e.g. Mermaid, React Flow) to draw flowcharts in the browser. [ASSUMPTION]
- PostgreSQL 16 + Drizzle ORM (per project architecture) for persistence.
- Next.js App Router for UI and Route Handlers for the generation API.

---

## 6. Examples

### Example 1: Procedural policy → flowchart
- **Input:** Author pastes: *"To request leave: 1) Submit form in HR portal. 2) Manager reviews within 2 business days. 3) If approved, HR updates the leave balance. 4) Employee receives email confirmation."*
- **Expected output:** A flowchart Visualization with four sequential nodes (Submit → Manager review → HR update → Email confirm) and a decision branch at "Manager review" for approved/rejected. Preview appears within 60 seconds; Author can publish and receive a shareable URL.

### Example 2: Empty / oversized input (edge case)
- **Input:** Author submits an empty textbox, or pastes a 50,000-word document that exceeds the generator's input limit.
- **Expected output:** For empty input, submission is blocked with a validation message ("Please paste guideline text"). For oversized input, the Generation Job fails fast with a clear error ("Guideline exceeds maximum length of N words — please shorten or split") and a retry action; no partial Visualization is rendered.

---
