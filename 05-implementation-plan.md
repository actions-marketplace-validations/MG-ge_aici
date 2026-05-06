# Implementation Plan

**Last updated:** 2026-05-06

---

## Workstream 1 — CLI Core

**Goal:** Build the local runner.

**Outputs:**

- npm package scaffold
- `aici init`
- `aici validate`
- `aici run`
- config parser and schema validator
- deterministic check engine

**Acceptance criteria:**

- CLI loads `aici.yml`
- config errors are clear
- one sample test can pass and fail locally
- process exits non-zero on failure

---

## Workstream 2 — Provider Support

**Goal:** Run real LLM calls.

**Outputs:**

- OpenAI provider
- OpenAI-compatible provider
- token/cost/latency capture
- provider error handling

**Acceptance criteria:**

- real model call works from CLI
- missing API key gives clear error
- latency is recorded
- cost is estimated when token data and pricing are available

---

## Workstream 3 — Checks

**Goal:** Implement the useful MVP checks.

**Outputs:**

- exact match
- contains
- regex
- JSON parse
- JSON schema
- max cost
- max latency
- LLM judge rubric

**Acceptance criteria:**

- JSON schema failure fails the run
- cost threshold can fail the run
- latency threshold can fail the run
- LLM judge is opt-in

---

## Workstream 4 — Reports

**Goal:** Make output useful in PRs.

**Outputs:**

- terminal summary
- `aici-report.md`
- `aici-report.json`
- failure reason formatting

**Acceptance criteria:**

- report clearly shows failed tests
- report shows cost and latency by test
- report is readable as a GitHub PR comment

---

## Workstream 5 — GitHub Action

**Goal:** Make the product CI-native.

**Outputs:**

- action wrapper
- example workflow
- PR comment support
- artifact upload

**Acceptance criteria:**

- action runs in a sample repo
- action preserves CLI exit code
- report appears as artifact
- PR comment works when permissions allow

---

## Workstream 6 — Template Packs

**Goal:** Give developers useful starting points.

**Outputs:**

- structured JSON extraction pack
- customer support pack
- tool-call agent pack

**Acceptance criteria:**

- each pack includes config, prompt, cases, and schema/check examples
- docs explain when to use each pack

---

## Workstream 7 — Launch Surface

**Goal:** Make it understandable and installable.

**Outputs:**

- README
- docs site or docs folder
- example repo
- landing page
- GitHub Marketplace listing draft

**Acceptance criteria:**

- first install path takes under 10 minutes
- README includes real screenshots or report examples
- launch copy clearly says "CI for LLM apps"

---

## Sequencing

1. CLI core
2. deterministic checks
3. OpenAI provider
4. reports
5. GitHub Action
6. template packs
7. launch surface
8. hosted history only after adoption

---

## MVP Completion Checklist

- `aici run` works locally
- JSON schema tests work
- cost and latency budgets work
- Markdown report generated
- GitHub Action works
- sample repo demonstrates value
- docs are clear enough for self-serve install
