# Product Strategy

**Last updated:** 2026-05-06

---

## Thesis

The best solo-founder version is not an AI observability platform, governance suite, or generic eval dashboard.

It is:

> **A small, sharp CI tool for LLM regressions.**

Developers already understand CI. They do not need to be educated on why tests should fail a release. The product should plug into that mental model.

---

## Category

**Primary category:** LLM CI / AI regression testing  
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

> Developers who want AI tests in CI without adopting a full observability platform.

---

## Initial Buyer

**Primary buyer:** solo developers, founding engineers, and small teams shipping LLM features.

They have:

- prompts in production
- structured outputs or tool calls
- occasional model/prompt regressions
- concern about cost spikes
- no ML platform team

They do not want:

- sales calls
- enterprise onboarding
- complex dashboards
- proxy-based tracing as a prerequisite

---

## Product Shape

One product:

```text
Aici
├── regression checks
├── structured output checks
├── cost budgets
├── latency budgets
├── template packs
└── synthetic edge-case generation
```

The product promise is not "observe every AI call."

The product promise is:

> Fail the PR when an LLM workflow regresses.

Brand model:

- **Aici** is the product, CLI, and package name.
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
- no dashboard required
- no tracing proxy required
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
