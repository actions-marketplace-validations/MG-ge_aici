# GitHub Action

**Last updated:** 2026-05-06

## Inputs

| Input | Default | Description |
|---|---|---|
| `config` | `aici.yml` | Path to config file |
| `report-dir` | `.aici` | Output directory for reports |
| `install` | `true` | Run `npm ci` |
| `build` | `true` | Run `npm run build` |
| `comment` | `true` | Append Markdown report to job summary |
| `pr-comment` | `false` | Add/update sticky PR comment |
| `upload-artifact` | `true` | Upload report directory |
| `allow-provider-secrets` | `false` | Permit live provider checks with provider API-key env vars during `pull_request` or `pull_request_target` events |
| `provider-secret-envs` | `OPENAI_API_KEY ANTHROPIC_API_KEY` | Space or comma separated provider secret env var names guarded during pull-request events |

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
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: npm
      - uses: ./
        with:
          config: examples/basic/aici.yml
```

## PR Comments

```yaml
permissions:
  contents: read
  pull-requests: write
  issues: write
```

```yaml
- uses: ./
  with:
    config: aici.yml
    pr-comment: true
```

The action uses a sticky marker so each PR has one updated report comment instead of a new comment on every run.

## Live Provider Checks On Pull Requests

Run live provider checks with API-key secrets only for trusted configs. Do not expose `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or other provider secrets to workflows that execute an untrusted pull request's `aici.yml`, prompts, schemas, or tool definitions.

For public repositories and forked PRs, keep the PR workflow fixture-only. Run live provider smoke tests on trusted branches, protected merge queues, scheduled jobs, or a separate maintainer-approved workflow after reviewing the config changes.

The Action blocks pull-request runs when guarded provider secret env vars are present unless `allow-provider-secrets: true` is set. Use that opt-in only after reviewing the config and every referenced prompt, schema, input, fixture, and tool definition.

```yaml
- uses: ./
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  with:
    config: examples/openai/aici.yml
    allow-provider-secrets: true
```

For custom `apiKeyEnv` names, extend the guard list:

```yaml
- uses: ./
  env:
    AICI_PROVIDER_KEY: ${{ secrets.AICI_PROVIDER_KEY }}
  with:
    config: aici.yml
    provider-secret-envs: OPENAI_API_KEY ANTHROPIC_API_KEY AICI_PROVIDER_KEY
```
