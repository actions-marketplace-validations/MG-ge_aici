# Recipes

**Last updated:** 2026-05-15

Copy these shapes into your repo and adapt the file names.

## Support Bot JSON Contract

Use this when downstream code expects a stable support response shape.

```yaml
version: 1
tests:
  - name: support-refund-response
    mockOutputFile: support-refund.output.json
    expect:
      json: true
      jsonSchema: support-response.schema.json
      contains:
        - approved
```

`support-response.schema.json`:

```json
{
  "type": "object",
  "required": ["decision", "reason"],
  "additionalProperties": false,
  "properties": {
    "decision": { "enum": ["approved", "rejected", "needs_review"] },
    "reason": { "type": "string", "minLength": 1 }
  }
}
```

## Extraction Contract

Use this when an LLM fills fields for an API or database write.

```yaml
version: 1
tests:
  - name: invoice-extraction
    mockOutputFile: invoice.output.json
    expect:
      json: true
      jsonSchema: invoice.schema.json
```

Keep the first fixture small. Add more examples only after the first schema failure is easy to understand.

## Tool-Calling Agent

Use this when an agent must call a specific tool with valid arguments.

```yaml
version: 1
tests:
  - name: order-lookup-tool
    mockToolCallsFile: order.tool-calls.json
    expect:
      toolCalls:
        - name: lookup_order
          argumentsJsonSchema: lookup-order.schema.json
```

`order.tool-calls.json`:

```json
[
  {
    "name": "lookup_order",
    "arguments": {
      "order_id": "A123",
      "include_refunds": true
    }
  }
]
```

## Live OpenAI Smoke Test

Use one or two live checks for prompts where real model behavior matters.

```yaml
version: 1
provider:
  type: openai
  model: gpt-5.4-mini
tests:
  - name: refund-policy-live
    promptFile: refund-policy.prompt.md
    inputFile: refund-policy.input.txt
    expect:
      json: true
      jsonSchema: support-response.schema.json
      maxLatencyMs: 4000
      maxCostUsd: 0.01
```

Run with an endpoint allowlist:

```bash
OPENAI_API_KEY=... npx @mgicloud/aici run \
  --config aici.yml \
  --allow-provider-endpoint https://api.openai.com/v1/responses
```

## Local Model Smoke Test

Use `openai-compatible` for local servers and custom gateways.

```yaml
version: 1
provider:
  type: openai-compatible
  model: local-model
  baseUrl: http://localhost:11434/v1
tests:
  - name: local-json-smoke
    prompt: Return {"decision":"approved","reason":"ok"} as JSON.
    expect:
      json: true
      jsonSchema: support-response.schema.json
```

Remote compatible endpoints must use HTTPS. Plain HTTP is only allowed for localhost and loopback.

## Why Fixture Tests First

Fixture tests are cheap, deterministic, and reviewable. They prove that your contract catches the failure you care about before you spend money on live model calls.

Start with fixtures when:

- the expected JSON shape is known
- a tool call must have a specific argument shape
- a regression can be represented by a saved bad output
- the PR should fail without provider flakiness

Add live checks later when the prompt/model interaction itself is the thing under test.
