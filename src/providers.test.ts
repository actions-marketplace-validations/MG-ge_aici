import assert from "node:assert/strict";
import test from "node:test";
import { callProvider } from "./providers.js";
import type { AiciProvider, AiciTest } from "./types.js";

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.AICI_TEST_API_KEY;
});

test("sends function tools to chat completions providers", async () => {
  process.env.AICI_TEST_API_KEY = "test-key";
  let requestBody: unknown;

  globalThis.fetch = async (_url, init) => {
    requestBody = JSON.parse(String(init?.body)) as unknown;
    return jsonResponse({
      choices: [
        {
          message: {
            content: null,
            tool_calls: [
              {
                type: "function",
                function: {
                  name: "lookup_order",
                  arguments: "{\"order_id\":\"A123\",\"include_refunds\":true}",
                },
              },
            ],
          },
        },
      ],
      usage: {
        prompt_tokens: 12,
        completion_tokens: 8,
      },
    });
  };

  const result = await callProvider(
    chatProvider(),
    toolTest("chat-tool"),
    "Check order A123.",
    process.cwd(),
  );

  assert.equal(result.toolCalls?.[0]?.name, "lookup_order");
  assert.deepEqual(result.toolCalls?.[0]?.arguments, { order_id: "A123", include_refunds: true });
  assert.deepEqual(getPath(requestBody, ["tools", 0, "function", "name"]), "lookup_order");
  assert.deepEqual(getPath(requestBody, ["tool_choice", "function", "name"]), "lookup_order");
});

test("sends function tools to Responses API providers", async () => {
  process.env.AICI_TEST_API_KEY = "test-key";
  let requestBody: unknown;

  globalThis.fetch = async (_url, init) => {
    requestBody = JSON.parse(String(init?.body)) as unknown;
    return jsonResponse({
      output: [
        {
          type: "function_call",
          name: "lookup_order",
          arguments: "{\"order_id\":\"A123\",\"include_refunds\":true}",
        },
      ],
      usage: {
        input_tokens: 12,
        output_tokens: 8,
      },
    });
  };

  const result = await callProvider(
    responsesProvider(),
    toolTest("responses-tool"),
    "Check order A123.",
    process.cwd(),
  );

  assert.equal(result.toolCalls?.[0]?.name, "lookup_order");
  assert.deepEqual(result.toolCalls?.[0]?.arguments, { order_id: "A123", include_refunds: true });
  assert.deepEqual(getPath(requestBody, ["tools", 0, "name"]), "lookup_order");
  assert.deepEqual(getPath(requestBody, ["tool_choice", "name"]), "lookup_order");
});

function chatProvider(): AiciProvider {
  return {
    type: "openai-compatible",
    api: "chat-completions",
    apiKeyEnv: "AICI_TEST_API_KEY",
    baseUrl: "https://example.test/v1",
    model: "test-model",
  };
}

function responsesProvider(): AiciProvider {
  return {
    type: "openai",
    api: "responses",
    apiKeyEnv: "AICI_TEST_API_KEY",
    model: "test-model",
  };
}

function toolTest(name: string): AiciTest {
  return {
    name,
    toolChoice: {
      name: "lookup_order",
    },
    tools: [
      {
        name: "lookup_order",
        description: "Look up an order.",
        strict: true,
        parameters: {
          type: "object",
          required: ["order_id"],
          properties: {
            order_id: {
              type: "string",
            },
          },
        },
      },
    ],
  };
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
}

function getPath(value: unknown, path: Array<string | number>): unknown {
  let current = value;

  for (const segment of path) {
    if (typeof current !== "object" || current === null) {
      return undefined;
    }

    current = (current as Record<string | number, unknown>)[segment];
  }

  return current;
}
