# Quickstart

**Last updated:** 2026-05-06

## 1. Install

```bash
npm install
npm run build
```

For published usage:

```bash
npx @mgicloud/aici init --config aici.yml
```

## 2. Create A Test

```yaml
$schema: ./schemas/aici.schema.json
version: 1
tests:
  - name: support-response-schema
    mockOutputFile: examples/basic/output.json
    expect:
      contains:
        - approved
      jsonSchema: examples/basic/schema.json
```

Start with fixture tests. They make CI deterministic before you add live provider checks.

## 3. Run Locally

```bash
npm run dev -- run --config examples/basic/aici.yml
```

Reports are written to `.aici/aici-report.md`, `.aici/aici-report.json`, and `.aici/aici-report.html`.

## 4. Add Live Provider Checks

```bash
npm run live:openai
npm run live:openai-tool
```

The live OpenAI commands expect `OPENAI_API_KEY` in the environment.

Use live checks for high-value prompts only. Keep most regression coverage fixture-based to avoid flaky CI and avoid unnecessary model spend.

## 5. Add GitHub Actions

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

Store provider keys as GitHub Actions secrets. Do not commit `.env` files or raw API keys.
