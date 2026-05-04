# Product Requirements Document

**Last updated:** 2026-05-05  
**Status:** Draft v1  
**Scope:** MVP through v1.0

---

## Product Definition

AI Quality Gate is a developer-first CLI and GitHub Action for testing LLM workflows before deploy.

It runs test cases against prompts, model calls, structured outputs, tool calls, cost budgets, and latency budgets, then returns a pass/fail result suitable for CI.

---

## Problem Statement

Teams shipping LLM features change prompts, models, schemas, tools, and surrounding code frequently. These changes can silently regress output quality, JSON validity, tool-call behavior, cost, or latency.

Most small teams do not want a full observability platform just to catch these failures before merge.

They need a lightweight release gate that works like normal CI.

---

## Goals

1. Provide a CLI that runs LLM regression tests locally and in CI.
2. Provide a GitHub Action that comments a clear report on pull requests.
3. Support structured output checks as a first-class use case.
4. Support cost and latency thresholds per test and per run.
5. Provide starter template packs for common AI workflows.
6. Keep setup simple enough for a developer to try in under 10 minutes.

---

## Non-Goals

- sales-led enterprise platform
- production tracing proxy
- full observability dashboard in v1
- prompt management system
- human annotation queues
- model hosting
- agent orchestration
- broad AI governance suite

---

## MVP User Flow

1. Developer installs the CLI.
2. Developer adds an `aici.yml` config file.
3. Developer adds a few test cases.
4. Developer runs `aici run`.
5. CLI executes tests against configured model providers.
6. CLI prints pass/fail output.
7. CLI writes a Markdown report.
8. GitHub Action publishes the report on a pull request.

---

## MVP Capabilities

### CLI

Command:

```text
aici run
```

Required behavior:

- load config from `aici.yml`
- execute tests sequentially by default
- support provider credentials from environment variables
- exit non-zero when configured thresholds fail
- generate Markdown report

### GitHub Action

Required behavior:

- install/run CLI
- upload report as an artifact
- comment summary on PR
- fail the workflow when `aici run` fails

### Test Inputs

Support:

- inline prompts
- prompt files
- inline variables
- JSON/text fixtures

### Checks

MVP checks:

- exact match
- contains
- regex
- JSON parse
- JSON schema
- max cost
- max latency
- LLM judge with a rubric

### Providers

MVP providers:

- OpenAI-compatible endpoint
- OpenAI official API

Near-term providers:

- Anthropic
- Google Gemini
- local OpenAI-compatible servers

### Reports

MVP report:

- total pass/fail
- failed tests
- expected vs actual summary
- cost by test
- latency by test
- model/provider used

---

## Template Packs

Initial packs:

- structured JSON extraction
- customer support bot
- tool-call agent

Each pack includes:

- example config
- example prompts
- example fixtures
- recommended checks

---

## Hosted Features (Post-MVP)

Only after CLI adoption:

- hosted run history
- trend charts
- Slack alerts
- team projects
- private template storage

Hosted features must not be required to use the CLI or GitHub Action.

---

## Acceptance Criteria

MVP is complete when:

- `aici run` executes at least one real provider-backed test
- JSON schema failure causes a non-zero exit
- cost and latency thresholds can fail a run
- Markdown report is generated
- GitHub Action works in a sample repo
- docs allow setup in under 10 minutes
