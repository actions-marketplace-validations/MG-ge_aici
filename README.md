# Aici

> Local-first AI quality gates for pull requests.

**Status:** v0.1.8
**Last updated:** 2026-05-15
**License:** MIT

Aici is a no-phone-home CLI and GitHub Action for testing LLM outputs before a pull request merges. It checks prompt responses, JSON contracts, tool calls, cost, and latency from a repo-local `aici.yml`.

The core product is free and open source. There is no Aici backend, no telemetry, and no hosted prompt storage.

## Install In 5 Minutes

```bash
npx @mgicloud/aici init --config aici.yml
npx @mgicloud/aici run --config aici.yml
```

`init` creates a self-contained fixture test:

- `aici.yml`
- `aici-example.output.json`
- `aici-example.schema.json`

The starter test is deterministic and does not call a model provider. Reports are written to `.aici/aici-report.md`, `.aici/aici-report.json`, and `.aici/aici-report.html`.

## What It Tests

- Text contracts: exact match, contains, regex.
- JSON contracts: parse checks and JSON Schema.
- Tool/function calls: expected tool name and argument schema.
- Runtime budgets: latency and known provider cost.
- Provider smoke tests: OpenAI, Anthropic, and OpenAI-compatible endpoints.

## Example Config

```yaml
version: 1
tests:
  - name: support-response-schema
    mockOutputFile: aici-example.output.json
    expect:
      json: true
      jsonSchema: aici-example.schema.json
      contains:
        - approved
```

## GitHub Actions

For broad pull-request coverage, start fixture-only:

```yaml
name: Aici PR Gate

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
      - uses: MG-ge/aici@v0.1.8
        with:
          config: aici.yml
          pr-comment: true
```

Release tags use a bundled Action CLI and do not run `npm ci` or rebuild the project by default.

Run live provider checks with secrets only from trusted branches, protected merge queues, scheduled jobs, or maintainer-approved workflows. Do not expose provider secrets to untrusted PR configs, prompts, schemas, fixtures, or tool definitions.

For trusted live jobs, enforce endpoint allowlists:

```yaml
- uses: MG-ge/aici@v0.1.8
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  with:
    config: examples/openai/aici.yml
    allow-provider-secrets: true
    allowed-provider-endpoints: https://api.openai.com/v1/responses
```

## Network Audit

Inspect network behavior before running live checks:

```bash
npx @mgicloud/aici audit --config aici.yml
npx @mgicloud/aici audit --config aici.yml --json
npx @mgicloud/aici run --config examples/openai/aici.yml \
  --allow-provider-endpoint https://api.openai.com/v1/responses
```

`aici audit` reports:

- configured provider endpoints
- empty judge endpoints in v0.1
- dependencies with license/source
- source file count and LOC
- `telemetry: false`
- `aiciBackend: false`

Aici enforces provider endpoint allowlists for its own live provider calls. It is not a process-level network sandbox for unrelated commands in the same CI job.

For fixture-only PR gates, you can run Aici inside Docker with `--network none` so the container has no outbound network path.

## Live Providers

OpenAI:

```bash
OPENAI_API_KEY=... npx @mgicloud/aici run --config examples/openai/aici.yml
```

Anthropic:

```bash
ANTHROPIC_API_KEY=... npx @mgicloud/aici run --config examples/anthropic/aici.yml
```

OpenAI-compatible providers require `type: openai-compatible` and `baseUrl`. Remote compatible endpoints must use HTTPS. Plain HTTP is allowed only for localhost and loopback local-model endpoints.

## Reports

Aici writes:

- Markdown for job summaries and PR comments.
- JSON for machine-readable artifacts.
- HTML for local review.

Reports may include model outputs and normalized tool-call arguments. Use `redact` for tenant ids, emails, customer ids, or known sensitive fixture values.

## Docs

| Document | Description |
|---|---|
| [Quickstart](./docs/quickstart.md) | Install, first test, and GitHub Actions setup |
| [Config Reference](./docs/config-reference.md) | `aici.yml` fields, providers, and checks |
| [Examples Guide](./docs/examples.md) | Which example or template to start from |
| [Recipes](./docs/recipes.md) | Copy-paste support, extraction, tool-agent, live, and local-model setups |
| [GitHub Action](./docs/github-action.md) | Action inputs, PR comments, artifacts, and trusted live checks |
| [Trusted Live CI](./docs/trusted-live-ci.md) | Safe workflow split for provider secrets and endpoint allowlists |
| [Docker Strict Mode](./docs/docker-strict-mode.md) | Run fixture checks in a no-network container |
| [Data Handling](./docs/data-handling.md) | What leaves your machine and what is stored |
| [Network Audit](./docs/network-audit.md) | Endpoint audit, allowlists, and provider/judge boundaries |
| [Security](./docs/security.md) | Redaction, secrets, artifacts, and CI guidance |
| [Troubleshooting](./docs/troubleshooting.md) | Common install, config, provider, and CI failures |
| [Release Checklist](./docs/release-checklist.md) | Checks before publishing |

## Development

```bash
npm install
npm run verify
npm run security:audit
```

Useful local commands:

```bash
npm run sample
npm run sample:tool
npm run sample:fail
npm run validate:openai
npm run validate:anthropic
```

## Feedback

Open an issue with the smallest sanitized example you can share:

- [Product feedback](https://github.com/MG-ge/aici/issues/new?template=feedback.yml)
- [Bug report](https://github.com/MG-ge/aici/issues/new?template=bug_report.yml)

Do not open public issues for vulnerabilities or secret-handling bugs. Use the security policy instead.
