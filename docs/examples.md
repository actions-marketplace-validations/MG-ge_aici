# Examples Guide

**Last updated:** 2026-05-15

Use this guide to choose the smallest useful Aici setup for your LLM workflow.

For copy-paste production shapes, see [Recipes](./recipes.md).

## Start Here

Run the deterministic basic example:

```bash
npx @mgicloud/aici run --config examples/basic/aici.yml
```

This checks a fixture output against expected text and a JSON Schema. It does not call a model provider.

## Example Matrix

| Example | Use when | Provider call |
|---|---|---:|
| `examples/basic` | You need a minimal structured-output regression test | no |
| `examples/failing` | You want to see a CI failure and report output | no |
| `examples/tool-call` | You need to validate normalized tool/function calls | no |
| `examples/openai` | You want a live OpenAI JSON-output smoke test | yes |
| `examples/openai-tool-call` | You want a live OpenAI tool-call smoke test | yes |
| `examples/anthropic` | You want a live Claude JSON-output smoke test | yes |
| `examples/anthropic-tool-call` | You want a live Claude tool-call smoke test | yes |

## Template Matrix

Templates are copyable starting points for common production shapes.

| Template | Use when |
|---|---|
| `templates/support-bot` | Support response must keep a strict JSON contract |
| `templates/extraction` | Extraction output must match an API/database schema |
| `templates/classifier` | Classification must return a valid label and confidence |
| `templates/json-api-wrapper` | LLM output is wrapped behind an API response |
| `templates/tool-agent` | Agent must call a specific tool with valid arguments |

## Recommended First PR

Add one deterministic fixture test first:

```yaml
version: 1
tests:
  - name: support-response-schema
    mockOutputFile: output.json
    expect:
      contains:
        - approved
      jsonSchema: schema.json
```

Then wire it into GitHub Actions:

```yaml
- uses: MG-ge/aici@v0.1.9
  with:
    config: aici.yml
```

If you are using the package locally instead of the action, run:

```bash
npx @mgicloud/aici run --config aici.yml
```

## When To Add Live Checks

Add live provider checks only for high-value prompts where a real model response matters:

- Critical JSON contracts.
- Required tool calls.
- Business-critical refusal/approval policies.
- High-cost prompts that need budget guards.

Keep most coverage fixture-based so CI stays deterministic, fast, and cheap.

## What A Good Failure Looks Like

Aici should fail with a specific reason:

```text
FAIL 1 test

refund-policy-json
  - jsonSchema: missing "reason"
  - toolCall: expected lookup_order
```

If the failure does not tell you what changed, improve the test name, schema, or expectations before adding more cases.
