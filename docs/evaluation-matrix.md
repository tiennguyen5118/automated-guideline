# Evaluation Matrix

## Scoring Criteria

| # | Criterion | Weight | Scores HIGH when… | Scores LOW when… |
|---|-----------|--------|-------------------|------------------|
| 1 | **Innovation** | 25% | Non-obvious AI use; the feature is impossible without an LLM. | Could be done with a form + if/else. AI is cosmetic. |
| 2 | **Technical depth** | 25% | Exercises tool use, structured outputs, RAG, streaming, or evals. End-to-end type safety. | One `messages.create` call, no validation, no retries. |
| 3 | **UX / AI-nativeness** | 20% | AI appears throughout the flow (suggest, complete, explain, repair). Latency hidden via streaming. | AI is one button on one page. |
| 4 | **Impact / usefulness** | 15% | Solves a real, specific problem for a named user. Measurable outcome. | Generic demo; "anyone could use this." |
| 5 | **Demo polish** | 15% | Clear story, working live demo, visible AI reasoning, failure modes handled gracefully. | Broken happy path; no fallback when the model errors. |

> Replace rows above with the real rubric before running `/write-plan`. Adjust weights to sum to 100%.

## Demo / Pitch Requirements

- **Format:** _live demo / recorded video / slide deck_
- **Length:** _minutes_
- **Must showcase:** _e.g. live AI call, user input → AI output loop, graceful error recovery_

## Planning Checklist

Before a plan is considered "aligned", answer each:

- [ ] **Innovation:** what is the non-obvious AI use here? Could this ship without an LLM?
- [ ] **Technical depth:** which advanced capability does this exercise — tool use, RAG, structured outputs, streaming, evals?
- [ ] **UX:** where does the user *feel* the AI in this feature? Is there a streaming / suggestion / repair moment?
- [ ] **Impact:** who exactly is helped, and what measurable thing changes for them?
- [ ] **Demo:** how will this specifically be shown on stage? What's the 10-second wow?

## Worked Example (delete and replace per feature)

**Feature:** "Paste any policy text → generate an interactive visualization."

- Innovation: **High** — LLM classifies text shape (procedural vs declarative) and picks the right diagram type. No rules engine could do this robustly.
- Technical depth: **High** — structured JSON output, Zod-validated, schema-constrained Mermaid source.
- UX: **Medium** — one-shot generation; could stream node-by-node for higher score.
- Impact: **High for ops/HR teams** — replaces manual diagramming.
- Demo: paste a real HR policy on stage, show diagram rendering in <4s, then show graceful fallback when input is garbage.
