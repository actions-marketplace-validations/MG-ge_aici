# Technical Architecture

**Last updated:** 2026-05-05

---

## Architecture Decision

Build the MVP as a **TypeScript CLI** with a GitHub Action wrapper.

Reasons:

- best fit for GitHub Actions and frontend/web developers
- easy distribution through npm
- strong JSON schema tooling
- enough ecosystem support for provider SDKs
- no server required for v1

---

## System Overview

```text
Developer Repo
├── aici.yml
├── prompts/
├── cases/
└── schemas/

aici CLI
├── config loader
├── provider clients
├── test runner
├── check engine
├── cost/latency tracker
└── report writer

GitHub Action
├── install CLI
├── run aici
├── upload report
└── comment on PR
```

---

## CLI Surface

### MVP Commands

```text
aici init
aici run
aici validate
```

### Later Commands

```text
aici generate
aici report
aici compare
```

---

## Config Shape

Default config file:

```yaml
version: 1
provider:
  type: openai
  model: gpt-5.4-mini
  apiKeyEnv: OPENAI_API_KEY

thresholds:
  maxCostUsd: 1.00
  maxLatencyMs: 5000

tests:
  - name: refund-policy-json
    prompt: prompts/support.md
    input: cases/refund-request.txt
    expect:
      contains:
        - refund
      jsonSchema: schemas/support-response.schema.json
      maxCostUsd: 0.03
      maxLatencyMs: 4000
```

The implementation should validate this config with a schema before running tests.

Tests may also use `mockOutput` or `mockOutputFile` instead of provider execution. Mocked tests are intended for deterministic examples and local check development.

---

## Core Modules

### Config Loader

Responsibilities:

- locate `aici.yml`
- parse YAML
- validate config schema
- resolve file paths relative to config location

### Provider Client

Responsibilities:

- normalize requests across providers
- return text output, raw response metadata, token usage, cost estimate, and latency

MVP interface:

```ts
type ProviderResult = {
  output: string
  inputTokens?: number
  outputTokens?: number
  costUsd?: number
  latencyMs: number
  raw?: unknown
}
```

### Check Engine

Responsibilities:

- run deterministic assertions first
- run LLM judge checks only when configured
- return structured pass/fail reasons

MVP checks:

- exact match
- contains
- regex
- JSON parse
- JSON schema
- max cost
- max latency
- LLM judge rubric

### Report Writer

Responsibilities:

- write `aici-report.md`
- write `aici-report.json`
- keep output readable in GitHub PR comments

---

## Cost Tracking

MVP should use a simple model pricing table committed with the CLI.

Rules:

- calculate cost when token usage is available
- mark cost as unknown when usage or model pricing is missing
- fail cost checks only when cost is known
- warn when cost cannot be calculated

---

## GitHub Action

Action inputs:

```yaml
config: aici.yml
comment: true
fail-on-regression: true
```

The action should:

- run the CLI
- upload JSON and Markdown reports
- comment on PR when possible
- preserve CLI exit code

---

## Hosted Path

Do not build this in MVP.

When added, hosted service should only store:

- run metadata
- test names
- pass/fail status
- cost and latency trends
- optional redacted output snippets

Avoid requiring users to send full prompts/responses to hosted storage by default.

---

## Technical Risks

- LLM nondeterminism can cause flaky CI failures
- provider token/cost metadata differs by provider
- LLM judge checks can become expensive and subjective
- broad framework integrations can bloat scope

Mitigations:

- deterministic checks first
- configurable retry count
- cost warnings when unknown
- no framework-specific integration in MVP
- examples instead of deep adapters
