# GitHub Action

**Last updated:** 2026-05-15

## Inputs

| Input | Default | Description |
|---|---|---|
| `config` | `aici.yml` | Path to config file |
| `report-dir` | `.aici` | Output directory for reports |
| `install` | `false` | Development escape hatch to run `npm ci` inside the action checkout |
| `build` | `false` | Development escape hatch to rebuild the CLI before execution |
| `comment` | `true` | Append Markdown report to job summary |
| `pr-comment` | `false` | Add/update sticky PR comment |
| `upload-artifact` | `true` | Upload report directory |
| `allow-provider-secrets` | `false` | Permit live provider checks with provider API-key env vars during `pull_request` or `pull_request_target` events |
| `provider-secret-envs` | `OPENAI_API_KEY ANTHROPIC_API_KEY` | Space or comma separated provider secret env var names guarded during pull-request events |
| `allowed-provider-endpoints` | empty | Space or comma separated provider request URLs allowed during `run`; when set, Aici fails before provider secrets are read if the config contains any other endpoint |

## Minimal Workflow

```yaml
name: Aici

on:
  pull_request:

jobs:
  aici:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: MG-ge/aici@v0.1.7
        with:
          config: aici.yml
```

Release tags run the bundled Action CLI from `action-dist/cli.js`. They do not run `npm ci` or rebuild the TypeScript project by default.

## PR Comments

```yaml
permissions:
  contents: read
  pull-requests: write
  issues: write
```

```yaml
- uses: MG-ge/aici@v0.1.7
  with:
    config: aici.yml
    pr-comment: true
```

The action uses a sticky marker so each PR has one updated report comment instead of a new comment on every run.

## Live Provider Checks On Pull Requests

Run live provider checks with API-key secrets only for trusted configs. Do not expose `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or other provider secrets to workflows that execute an untrusted pull request's `aici.yml`, prompts, schemas, or tool definitions.

For public repositories and forked PRs, keep the PR workflow fixture-only. Run live provider smoke tests on trusted branches, protected merge queues, scheduled jobs, or a separate maintainer-approved workflow after reviewing the config changes.

For a copy-paste two-workflow setup, see [Trusted Live CI](./trusted-live-ci.md).

The Action blocks pull-request runs when guarded provider secret env vars are present unless `allow-provider-secrets: true` is set. Use that opt-in only after reviewing the config and every referenced prompt, schema, input, fixture, and tool definition.

```yaml
- uses: MG-ge/aici@v0.1.7
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  with:
    config: examples/openai/aici.yml
    allow-provider-secrets: true
```

For custom `apiKeyEnv` names, extend the guard list:

```yaml
- uses: MG-ge/aici@v0.1.7
  env:
    AICI_PROVIDER_KEY: ${{ secrets.AICI_PROVIDER_KEY }}
  with:
    config: aici.yml
    provider-secret-envs: OPENAI_API_KEY ANTHROPIC_API_KEY AICI_PROVIDER_KEY
```

## Endpoint Audit In CI

Run `aici audit` before live checks if your repository has an approved provider endpoint list:

```yaml
- run: |
    npx @mgicloud/aici audit \
      --config aici.yml \
      --allow-provider-endpoint https://api.openai.com/v1/responses \
      --allow-provider-endpoint https://api.anthropic.com/v1/messages
```

For the composite Action, prefer enforcing the same allowlist on the live run itself:

```yaml
- uses: MG-ge/aici@v0.1.7
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  with:
    config: examples/openai/aici.yml
    allow-provider-secrets: true
    allowed-provider-endpoints: https://api.openai.com/v1/responses
```

With `allowed-provider-endpoints` set, the action invokes `aici run --allow-provider-endpoint ...`. Aici rejects unapproved provider URLs before reading provider API keys or sending provider requests.

Use `--json` for custom policies:

```yaml
- run: npx @mgicloud/aici audit --config aici.yml --json > aici-audit.json
- run: |
    node -e "
    const audit = require('./aici-audit.json');
    const allowed = new Set(['https://api.openai.com/v1/responses']);
    for (const endpoint of audit.providerEndpoints) {
      if (!allowed.has(endpoint.endpoint)) {
        console.error('Unapproved provider endpoint:', endpoint.endpoint);
        process.exit(1);
      }
    }
    "
```
