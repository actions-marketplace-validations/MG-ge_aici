# Data Handling

**Last updated:** 2026-05-08

This page explains what Aici reads, sends, stores, and reports in v0.1.

## Short Version

Aici is local/CI-first. It has no telemetry, no Aici-hosted backend, and does not store prompts on an Aici service.

When you run fixture tests, Aici reads local files and writes local reports.

When you run live provider tests, Aici sends configured prompts, inputs, and tools to the selected model provider.

## What Aici Reads

Aici reads files referenced from your config:

- `promptFile`
- `inputFile`
- `mockOutputFile`
- `mockToolCallsFile`
- `jsonSchema`
- tool `parametersFile`

File references are resolved relative to the config file and must stay inside the config directory. This prevents accidental reads from parent folders such as a home directory or sibling project.

## What Leaves Your Machine

Fixture tests:

- Nothing is sent to model providers.
- Checks run against local mock output or local mock tool calls.

Live provider tests:

- The configured prompt and input are sent to the provider.
- Tool names, descriptions, and JSON Schemas are sent when tools are configured.
- Provider API keys are sent only to the selected provider endpoint. `type: openai` and `type: anthropic` use the official provider endpoints; custom endpoints require `type: openai-compatible`.

Aici does not proxy live provider calls through an Aici server in v0.1. To review the exact endpoints a config may call, run:

```bash
npx @mgicloud/aici audit --config aici.yml
npx @mgicloud/aici audit --config aici.yml --json
```

The JSON form is intended for CI endpoint allowlists.

## What Aici Stores

Aici writes reports to the configured report directory, defaulting to `.aici`:

- `.aici/aici-report.md`
- `.aici/aici-report.json`
- `.aici/aici-report.html`

Reports may include test names, pass/fail status, failure messages, latency, known cost, model output, and normalized tool-call details. Configured redaction values are applied recursively to model output, failure messages, and tool-call details before reports are written.

## CI Artifact Risk

GitHub Actions can upload `.aici` as an artifact and can post Markdown to job summaries or PR comments.

Use these defaults for sensitive workflows:

- Keep broad coverage fixture-based.
- Avoid live checks that include customer data.
- Disable `pr-comment` for sensitive outputs.
- Disable artifact upload if reports may contain private data.
- Configure `redact` for tenant ids, emails, customer ids, and known sensitive fixture values.
- Do not run live checks with provider secrets against untrusted PR configs.

## Provider Risk

Provider retention and training policies are controlled by the model provider, not by Aici. Before sending production prompts or customer data to a live provider check, review that provider's current terms and data controls.

## Judge Boundary

Aici v0.1 does not use LLM-as-judge grading. If a future version adds judge models, those calls must be configured separately from `provider` and shown separately in `aici audit` under `judgeEndpoints`.

## Recommended Rollout

1. Start with fixture tests for structured output and tool-call contracts.
2. Add one or two live provider smoke tests only after fixture coverage is stable.
3. Review generated reports before enabling artifact upload or PR comments.
4. Add repository-level guidance for which prompts are allowed in CI.
