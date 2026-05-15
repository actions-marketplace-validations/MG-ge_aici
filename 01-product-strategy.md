# Product Strategy

**Last updated:** 2026-05-08

---

## Thesis

The best solo-founder version is not an AI observability platform, governance suite, or generic eval dashboard.

It is:

> **A local-first, no-phone-home AI quality gate for pull requests.**

Developers already understand CI. Security-minded teams also understand endpoint allowlists, dependency review, and small tools they can audit. The product should plug into both mental models.

---

## Category

**Primary category:** local-first AI quality gates  
**Secondary category:** lightweight eval runner  
**Avoided category:** enterprise AI observability/governance platform

The market already has broad platforms:

- LangSmith
- Braintrust
- Langfuse
- Galileo
- Promptfoo
- DeepEval
- OpenAI Evals

The opening is narrower:

> Developers who want PR-time AI contract checks without sending eval data to an eval vendor.

---

## Initial Buyer

**Primary buyer:** founding engineers, security-conscious AI teams, and small teams shipping LLM features through pull requests.

They have:

- prompts in production
- structured outputs or tool calls
- occasional model/prompt regressions
- concern about cost spikes
- no ML platform team
- discomfort with hidden telemetry, hosted eval state, or unreviewable provider traffic

They do not want:

- sales calls
- enterprise onboarding
- complex dashboards
- proxy-based tracing as a prerequisite
- a broad eval platform for a few contract checks

---

## Product Shape

One product:

```text
Aici
├── regression checks
├── structured output checks
├── cost budgets
├── latency budgets
├── endpoint audit
├── template packs
└── optional synthetic edge-case generation later
```

The product promise is not "observe every AI call."

The product promise is:

> Before a PR merges, prove your AI output still matches the contract without sending eval data to an eval vendor.

Brand model:

- **Aici** is the product and CLI command.
- `@mgicloud/aici` is the npm package.
- "AI quality gate" is the category descriptor.
- `aici.yml` is the stable config interface.

---

## Why One Product

The user does not experience five separate problems. They experience one release-risk problem:

> Will this AI workflow still behave correctly after I change the prompt, model, schema, tool, or code?

The five ideas map to one workflow:

- quality gate: should this release pass?
- structured output test: did JSON/tool output break?
- cost guard: did spend regress?
- template pack: what should I test?
- synthetic edge cases: how do I add coverage?

Splitting these into separate products would create separate positioning, pricing, docs, and support surfaces without creating separate buyer urgency.

---

## Differentiation

Do not compete on having the most complete eval platform.

Compete on:

- 10-minute setup
- CI-native workflow
- deterministic pass/fail output
- excellent Markdown PR reports
- first-class JSON/schema/tool-call checks
- no telemetry
- no Aici-hosted backend
- audit output for provider endpoints and dependencies
- safe defaults for untrusted pull requests
- no sales call required

---

## What Not To Build Yet

- full observability dashboard
- prompt management
- human annotation queues
- enterprise governance
- synthetic data platform
- agent orchestration
- hosted proxy/gateway
- complex RAG evaluation platform
- paid hosted history before repeated user pull
- Python/Rust/Go rewrite before validation

Those areas are crowded and heavier than the no-calls strategy can support early.

---

## Success Condition

The product is worth continuing if developers voluntarily add it to real repos and run it repeatedly in CI.

Early vanity metrics do not matter. The important signals are:

- repeat CI runs
- config files committed to repos
- PR comments generated
- users adding more test cases after first run
- inbound requests for hosted history or team features

## Current Strategic Decision

Do not chase Promptfoo feature parity. Promptfoo already owns the broad "LLM eval CLI/platform" lane and now has OpenAI distribution. Aici should stay narrower:

- PR-native
- local-first
- no-phone-home
- auditable endpoint behavior
- deterministic contract checks before broad LLM-as-judge metrics

The next paid product, if any, should be hosted history for teams that already use the free release gate. Do not build it until users ask for shared run history after adopting the CLI.
