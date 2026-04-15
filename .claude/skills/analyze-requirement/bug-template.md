# [Bug #<ID>] <Full Title>

---

## 1. Summary

**Observed behavior:** <What is happening — the symptom as reported.>

**Expected behavior:** <What should happen instead.>

**Impact:** <Who is affected, how severe, how often. Use: Critical / High / Medium / Low.>

---

## 2. Reproduction

**Environment:** <Browser / OS / app version / user role / any relevant config. "Unknown" if not reported.>

**Preconditions:**
- <State or data required before the steps>

**Steps to reproduce:**
1. <Step>
2. <Step>
3. <Step>

**Actual result:** <What happens after the steps.>

**Expected result:** <What should happen after the steps.>

**Reproducibility:** Always / Intermittent / Once / Unable to reproduce.

---

## 3. Evidence

- <Logs, stack traces, screenshots, error IDs, correlation IDs, timestamps — or "None provided">
- <Link to related monitoring dashboards, Sentry issues, etc.>

---

## 4. Root Cause Analysis

**Status:** Confirmed / Suspected / Unknown

**Hypothesis / Finding:** <What is (or is likely) broken and why. Reference file paths and symbols where known, e.g. [src/lib/foo.ts:42](app/src/lib/foo.ts#L42). If unknown, list investigation leads.>

**Related code / area:** <Module, component, or subsystem. "Not yet identified" if unknown.>

**Regression?** <Yes + suspected commit/PR, or No, or Unknown.>

---

## 5. Proposed Solution

**Approach:** <Short description of the fix direction. Mark `[ASSUMPTION]` where unverified.>

**Alternatives considered:**
- <Alternative and why it was rejected, or "None">

**Risks & side effects:**
- <What else this change could affect>

**Out of scope:**
- <Related issues that will NOT be addressed here>

---

## 6. Acceptance Criteria

- **AC1:** Given <precondition>, when <action>, then <bug no longer occurs / expected behavior>.
- **AC2:** Given <regression guard precondition>, when <action>, then <no regression in related flow>.

<Every reported symptom MUST have at least one AC that verifies it is fixed.>

---

## 7. Effort & Priority

- **Estimated effort:** XS (<1h) / S (<0.5d) / M (0.5–2d) / L (2–5d) / XL (>5d)
- **Priority:** P0 (fix now) / P1 (this sprint) / P2 (backlog) / P3 (won't fix soon)
- **Recommendation:** <Fix now / Defer / Needs more info / Won't fix — with a one-line justification. Bugs unrelated to current context or not worth fixing now should be marked here.>

---

## 8. Dependencies

- <Other work items, services, or fixes this depends on, or "None identified">

---
