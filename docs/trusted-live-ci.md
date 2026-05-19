# Trusted Live CI

**Last updated:** 2026-05-15

Use this pattern when live provider checks need API keys.

## Rule

Do not run live provider checks with provider secrets on untrusted pull-request configs, prompts, schemas, fixtures, or tool definitions.

Use two workflows:

- Pull-request workflow: fixture-only, no provider secrets.
- Trusted live workflow: runs only after config changes are trusted.

## Pull Request Workflow

```yaml
name: Aici PR

on:
  pull_request:

jobs:
  fixture-gate:
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
          upload-artifact: true
```

This workflow should use `mockOutput`, `mockOutputFile`, `mockToolCalls`, or `mockToolCallsFile`. It should not expose `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or other provider keys.

## Trusted Live Workflow

```yaml
name: Aici Live

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  live-provider-gate:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v6
      - uses: MG-ge/aici@v0.1.7
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        with:
          config: examples/openai/aici.yml
          allow-provider-secrets: true
          allowed-provider-endpoints: https://api.openai.com/v1/responses
          pr-comment: false
```

This job fails before provider API keys are read if the config points at an endpoint that is not in `allowed-provider-endpoints`.

## Strict Egress

Aici enforces endpoint allowlists for its own provider calls. It is not a process-level network sandbox for every command in the CI job.

For fixture-only pull-request checks, use Docker `--network none` to run Aici with no outbound network path. See [Docker Strict Mode](./docker-strict-mode.md).

For strict egress enforcement:

- Put live checks in a dedicated job with no unrelated commands after secrets are exposed.
- Use a self-hosted runner, CI network policy, or container/firewall layer to restrict outbound traffic.
- Allow only the provider domains your config declares.
- Keep `aici audit --json` as a machine-readable preflight artifact.

GitHub-hosted runners do not provide a stable YAML-only domain allowlist that Aici can configure for the entire job. Treat runner egress as infrastructure policy, not application config.

## Local Preflight

```bash
npx @mgicloud/aici audit --config examples/openai/aici.yml --json
npx @mgicloud/aici run \
  --config examples/openai/aici.yml \
  --allow-provider-endpoint https://api.openai.com/v1/responses
```

## Review Checklist

Before enabling `allow-provider-secrets: true`, review:

- `aici.yml`
- prompt files
- input files
- schemas
- mock fixtures
- tool definitions
- `apiKeyEnv` names
- provider endpoint audit output

If any of those changed in an untrusted PR, keep the PR workflow fixture-only.
