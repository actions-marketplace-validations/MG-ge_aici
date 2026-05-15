# Network Audit

**Last updated:** 2026-05-08

Aici is designed as a no-phone-home AI quality gate. The CLI has no Aici-hosted backend and no telemetry. Live checks call only the model provider endpoints configured in `aici.yml`.

Use `aici audit` to make that claim reviewable before a workflow runs.

```bash
npx @mgicloud/aici audit --config aici.yml
npx @mgicloud/aici audit --config aici.yml --json
npx @mgicloud/aici audit --config aici.yml --allow-provider-endpoint https://api.openai.com/v1/responses
```

## What The Audit Shows

The audit report includes:

- Provider endpoints Aici may call for the config.
- Judge endpoints, currently empty because Aici does not have LLM-as-judge grading in v0.1.
- Runtime dependencies with version, license, source, and direct/transitive status.
- Source summary for the runtime CLI.
- Network policy flags for telemetry and Aici backend usage.

Fixture-only configs show no provider endpoints.

```text
Provider endpoints:
  none (fixture-only config)

Judge endpoints:
  none (LLM-as-judge is not configured)

Network policy:
  telemetry: false
  aiciBackend: false
  No telemetry. No remote Aici backend.
```

## CI Allowlist Example

Use `--allow-provider-endpoint` when CI should fail directly on unexpected endpoints:

```bash
npx @mgicloud/aici audit \
  --config aici.yml \
  --allow-provider-endpoint https://api.openai.com/v1/responses \
  --allow-provider-endpoint https://api.anthropic.com/v1/messages
```

If any configured provider endpoint is not listed, the command exits non-zero after printing the audit report.

Use `--json` when CI needs a custom machine-readable policy:

```bash
npx @mgicloud/aici audit --config aici.yml --json > aici-audit.json
node -e "
const audit = require('./aici-audit.json');
const allowed = new Set(['https://api.openai.com/v1/responses']);
for (const item of audit.providerEndpoints) {
  if (!allowed.has(item.endpoint)) {
    console.error('Unapproved provider endpoint:', item.endpoint);
    process.exit(1);
  }
}
"
```

## Provider And Judge Boundaries

`provider` is the model under test.

Future LLM-as-judge grading must use a separate `judge` config surface and appear in `judgeEndpoints`. That boundary matters because judge calls are a second network path, separate from the provider being evaluated.

In v0.1, Aici has no judge provider. All checks are deterministic local checks over fixture output or the live provider response.

## Limits

`aici audit` is a static config and package audit. It is not a network sandbox and does not intercept arbitrary process traffic. For high-security CI, combine it with runner-level egress controls, dependency review, and pinned versions.
