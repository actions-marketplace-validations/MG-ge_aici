# Quickstart

**Last updated:** 2026-05-15

## 1. Create A Passing Fixture Test

```bash
npx @mgicloud/aici init --config aici.yml
npx @mgicloud/aici run --config aici.yml
```

This creates:

- `aici.yml`
- `aici-example.output.json`
- `aici-example.schema.json`

The first test is fixture-only. It does not call a model provider and should pass immediately.

Fixture tests come first because they are cheap, deterministic, and reviewable in a PR. They prove the contract catches the failure you care about before live model behavior, provider latency, or API spend enter the loop.

## 2. Commit The Starter Files

```bash
git add aici.yml aici-example.output.json aici-example.schema.json
git commit -m "Add Aici quality gate"
```

Keep broad pull-request coverage fixture-based first. Add live provider checks only after the local contract is stable.

## 3. Add GitHub Actions

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
      - uses: MG-ge/aici@v0.1.7
        with:
          config: aici.yml
          pr-comment: true
```

For sensitive outputs, set `pr-comment: false` and review `.aici/aici-report.json` before enabling artifacts or comments.

## 4. Add A Live Provider Smoke Test

OpenAI:

```yaml
version: 1
provider:
  type: openai
  model: gpt-5.4-mini
tests:
  - name: support-response-live
    prompt: Return {"decision":"approved","reason":"ok"} as JSON.
    expect:
      json: true
      jsonSchema: aici-example.schema.json
```

Run it locally:

```bash
OPENAI_API_KEY=... npx @mgicloud/aici run \
  --config aici.yml \
  --allow-provider-endpoint https://api.openai.com/v1/responses
```

## 5. Use Secrets Only In Trusted Workflows

Do not run live checks with provider secrets against untrusted PR configs, prompts, schemas, fixtures, or tool definitions.

For trusted live jobs:

```yaml
- uses: MG-ge/aici@v0.1.7
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  with:
    config: aici.yml
    allow-provider-secrets: true
    allowed-provider-endpoints: https://api.openai.com/v1/responses
```

Use live checks for high-value prompts only. Keep most regression coverage fixture-based to avoid flaky CI and unnecessary model spend.

For the full trusted workflow split, see [Trusted Live CI](./trusted-live-ci.md).

## 6. Audit Network Behavior

```bash
npx @mgicloud/aici audit --config aici.yml
npx @mgicloud/aici audit --config aici.yml --json
```

Fixture-only configs show no provider endpoints. Live provider configs show the exact OpenAI, Anthropic, or OpenAI-compatible endpoint Aici may call. Aici has no telemetry and no remote Aici backend.
