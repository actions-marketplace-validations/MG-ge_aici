# Config Reference

**Last updated:** 2026-05-05

---

## Minimal Fixture Test

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

Use `mockOutput` or `mockOutputFile` for deterministic tests and examples.

All file fields are resolved relative to the config file directory and must stay inside that directory. This applies to prompt, input, mock output, mock tool-call, JSON Schema, and tool `parametersFile` references.

---

## Tool-Call Fixture Test

```yaml
version: 1
tests:
  - name: order-lookup-tool-call
    mockToolCallsFile: tool-calls.json
    expect:
      toolCalls:
        - name: lookup_order
          argumentsContains:
            - A123
          argumentsJsonSchema: schema.json
```

Tool calls are normalized into a provider-neutral shape:

```json
[
  {
    "name": "lookup_order",
    "arguments": {
      "order_id": "A123"
    }
  }
]
```

Use `mockToolCalls` or `mockToolCallsFile` for deterministic tool-call tests. Live provider calls currently normalize OpenAI Responses and chat-completions style function calls.

---

## OpenAI Test

```yaml
$schema: ../../schemas/aici.schema.json
version: 1
provider:
  type: openai
  model: gpt-5.4-mini
  api: responses
  apiKeyEnv: OPENAI_API_KEY
  timeoutMs: 30000
  retries: 1
  temperature: 0
  maxOutputTokens: 300
tests:
  - name: refund-policy-json
    promptFile: prompt.md
    inputFile: input.txt
    expect:
      contains:
        - approved
      jsonSchema: schema.json
      maxLatencyMs: 10000
      maxCostUsd: 0.02
```

OpenAI defaults to the Responses API. OpenAI-compatible providers default to chat completions.

---

## Anthropic Claude Test

```yaml
$schema: ../../schemas/aici.schema.json
version: 1
provider:
  type: anthropic
  model: claude-haiku-4-5
  api: messages
  apiKeyEnv: ANTHROPIC_API_KEY
  timeoutMs: 30000
  retries: 1
  temperature: 0
  maxOutputTokens: 300
tests:
  - name: refund-policy-json-claude
    promptFile: prompt.md
    inputFile: input.txt
    expect:
      contains:
        - approved
      jsonSchema: schema.json
      maxLatencyMs: 10000
      maxCostUsd: 0.02
```

Anthropic providers use the Messages API. Use `claude-haiku-4-5` for low-cost smoke tests, and move to Sonnet/Opus only for checks where stronger reasoning is worth the cost.

---

## Live Tool-Call Test

```yaml
$schema: ../../schemas/aici.schema.json
version: 1
provider:
  type: openai
  model: gpt-5.4-mini
  api: responses
  apiKeyEnv: OPENAI_API_KEY
tests:
  - name: forced-order-lookup-tool
    promptFile: prompt.md
    toolChoice:
      name: lookup_order
    tools:
      - name: lookup_order
        description: Look up an order by id before answering.
        parametersFile: lookup-order.parameters.json
        strict: true
    expect:
      toolCalls:
        - name: lookup_order
          argumentsJsonSchema: lookup-order.parameters.json
```

`tools` are sent to live providers. For OpenAI Responses, tools are serialized as function tools. For OpenAI-compatible chat completions, tools are serialized in chat-completions function-tool format. For Anthropic Messages, tools are serialized with `input_schema`, and `toolChoice: required` maps to Anthropic's `any`.

---

## Provider Fields

| Field | Required | Description |
|---|---:|---|
| `type` | yes | `openai`, `openai-compatible`, or `anthropic` |
| `model` | yes | Provider model id |
| `api` | no | `responses`, `chat-completions`, or `messages` |
| `apiKeyEnv` | no | Environment variable containing API key |
| `baseUrl` | for compatible providers | Base URL ending before `/responses`, `/chat/completions`, or `/messages` |
| `apiVersion` | no | Provider API version header, currently used by Anthropic |
| `timeoutMs` | no | Request timeout, default `30000` |
| `retries` | no | Retry count after first failed attempt, default `1` |
| `temperature` | no | Generation temperature, default `0` |
| `maxOutputTokens` | no | Output token cap |

---

## Test Fields

| Field | Description |
|---|---|
| `prompt` / `promptFile` | Prompt text or prompt file for live provider execution |
| `input` / `inputFile` | Additional input appended after the prompt |
| `tools` | Function tools available to the model |
| `toolChoice` | `auto`, `none`, `required`, or `{ name: "tool_name" }` |
| `mockOutput` / `mockOutputFile` | Deterministic text fixture output |
| `mockToolCalls` / `mockToolCallsFile` | Deterministic normalized tool-call fixture |
| `expect` | Checks that determine pass/fail |

---

## Tool Fields

| Field | Description |
|---|---|
| `name` | Tool/function name, 1-64 characters using letters, numbers, underscores, or dashes |
| `description` | Natural-language description shown to the model |
| `parameters` | Inline JSON Schema object for function arguments |
| `parametersFile` | JSON Schema file for function arguments |
| `strict` | Request strict argument adherence when supported by the provider |

---

## Checks

| Check | Description |
|---|---|
| `exact` | Output must exactly match string |
| `contains` | Output must include each string |
| `regex` | Output must match each regex |
| `json` | Output must parse as JSON |
| `jsonSchema` | Output must match JSON Schema |
| `toolCalls` | Expected tool/function calls must be present |
| `maxLatencyMs` | Test latency must be below threshold |
| `maxCostUsd` | Known provider cost must be below threshold |

Cost checks fail when cost is unknown. This is intentional for CI reliability; remove `maxCostUsd` for providers that do not return token usage or are not in the pricing table yet.

---

## Redaction

```yaml
version: 1
redact:
  - customer@example.com
```

AI Quality Gate automatically redacts values from configured provider API-key environment variables and common bearer/API-key patterns in error messages and reports. Use `redact` for additional customer ids, emails, tenant names, or fixture secrets that must not appear in CI artifacts.

---

## Tool-Call Expectations

| Field | Description |
|---|---|
| `name` | Expected tool/function name |
| `index` | Select tool call by zero-based index instead of by name |
| `argumentsContains` | String fragments that must appear in serialized arguments |
| `argumentsJsonSchema` | JSON Schema file that validates normalized tool arguments |

If `index` is omitted, the runner selects the first tool call matching `name`. If both `index` and `name` are omitted, it selects the first tool call.
