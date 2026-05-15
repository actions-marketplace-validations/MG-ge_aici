# Aici

> Local-first AI quality gates for pull requests.

**Status:** v0.1.2 launched
**Last updated:** 2026-05-08
**Owner:** MG

---

## Install

```bash
npx @mgicloud/aici init --config aici.yml
npx @mgicloud/aici run --config aici.yml
```

Use `aici.yml` to test prompt behavior, JSON contracts, tool calls, cost, and latency before a pull request is merged. Aici has no telemetry and no Aici-hosted backend; live checks call only the provider endpoint you configure.

---

## Who It Is For

Aici is for developers who already ship LLM features and need a small, reviewable release gate before deploy.

Good fits:

- JSON or structured-output workflows that break downstream code when shape changes.
- Tool/function-calling agents where the model must call the right tool with valid arguments.
- Support, extraction, classification, and API-wrapper prompts that need regression tests.
- Teams that want GitHub Actions evidence without adopting a full tracing, hosted eval, or governance platform.
- Security-conscious repos that need to see exactly which provider endpoints an AI test can call.

Not a good fit yet:

- Hosted prompt observability.
- Human annotation workflows.
- Managed eval datasets.
- Hosted generation or proxying production traffic.

---

## Strategic Frame

Aici is a no-phone-home, self-serve developer tool. It should be bought and adopted like a CI utility, not sold like an enterprise governance platform.

The product promise:

> Before a PR merges, prove your AI output still matches the contract without sending eval data to an eval vendor.

The first product surface is:

- open-source CLI
- GitHub Action
- YAML test cases
- Markdown/HTML reports
- audit output for provider endpoints, dependencies, and network policy
- optional hosted history later, only if users ask for it

This is one product, not five separate tools. Structured output tests, cost guards, eval templates, and synthetic edge cases are features inside the same release-gate workflow.

Name model:

- **Aici** is the brand and CLI.
- `@mgicloud/aici` is the npm package.
- `aici` is the command.
- `aici.yml` is the stable config file.
- "AI quality gate" is the category descriptor, not the primary brand.

---

## MVP Scaffold

The current scaffold includes a TypeScript CLI that can validate config and run deterministic checks against fixture outputs.

```bash
npm install
npm run verify
npm run check
npm run build
npm run sample
npm run sample:root
npm run sample:tool
npm run validate:openai
npm run validate:openai-tool
npm run validate:anthropic
npm run validate:anthropic-tool
```

Sample command:

```bash
npm run dev -- run --config examples/basic/aici.yml
```

The sample writes reports to `.aici/aici-report.md`, `.aici/aici-report.json`, and `.aici/aici-report.html`.

Network audit:

```bash
npm run dev -- audit --config aici.yml
npm run dev -- audit --config aici.yml --json
npm run dev -- audit --config examples/openai/aici.yml --allow-provider-endpoint https://api.openai.com/v1/responses
```

The audit prints configured provider endpoints, runtime dependencies, source summary, and the network policy. Fixture-only configs show no provider endpoints.

Failure-path sample:

```bash
npm run sample:fail
```

This should exit non-zero and show a JSON Schema failure.

Tool-call sample:

```bash
npm run sample:tool
```

This validates a normalized tool/function call and its arguments against JSON Schema.

Live provider example:

```bash
npm run live:openai
```

Live tool-call example:

```bash
npm run live:openai-tool
```

Live Claude examples:

```bash
ANTHROPIC_API_KEY=... npm run live:anthropic
ANTHROPIC_API_KEY=... npm run live:anthropic-tool
```

Live provider scripts expect `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in the environment.

The default sample stays provider-free so CI and local checks remain deterministic.

Do not run live provider checks with provider secrets against untrusted pull request configs, prompts, schemas, or tool definitions. The GitHub Action blocks guarded provider secret env vars on pull-request events unless `allow-provider-secrets: true` is set.

Config schema:

```bash
npm run schema
```

Use `schemas/aici.schema.json` for editor validation.

GitHub Actions:

```yaml
name: Aici

on:
  pull_request:

jobs:
  aici:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      issues: write
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: npm
      - uses: ./
        with:
          config: aici.yml
          pr-comment: true
```

---

## Documents

| # | Document | Description |
|---|---|---|
| 01 | [Product Strategy](./01-product-strategy.md) | Positioning, category, wedge, and what not to build |
| 02 | [PRD](./02-prd.md) | Product requirements and v1 scope |
| 03 | [Technical Architecture](./03-technical-architecture.md) | CLI, config, checks, providers, reports, and hosted path |
| 04 | [Business & Pricing](./04-business-pricing.md) | Pricing, packaging, and commercial model |
| 05 | [Implementation Plan](./05-implementation-plan.md) | Workstreams, acceptance criteria, and sequencing |
| 06 | [Roadmap](./06-roadmap.md) | 30/60/90-day roadmap and launch plan |

## Technical Docs

| Document | Description |
|---|---|
| [Config Reference](./docs/config-reference.md) | `aici.yml` fields, providers, and checks |
| [Quickstart](./docs/quickstart.md) | Five-minute local and GitHub Action setup |
| [Examples Guide](./docs/examples.md) | Which example or template to start from |
| [GitHub Action](./docs/github-action.md) | Action inputs, PR comments, and workflow setup |
| [Data Handling](./docs/data-handling.md) | What leaves your machine and what is stored |
| [Network Audit](./docs/network-audit.md) | `aici audit`, endpoint allowlists, and provider/judge boundaries |
| [Security](./docs/security.md) | Redaction, secrets, and CI artifact guidance |
| [Release Checklist](./docs/release-checklist.md) | Checks before publishing v1 |

## Feedback

If Aici does not fit your LLM workflow yet, open a GitHub issue with the smallest failing example you can share:

- [Product feedback](https://github.com/MG-ge/aici/issues/new?template=feedback.yml)
- [Bug report](https://github.com/MG-ge/aici/issues/new?template=bug_report.yml)
