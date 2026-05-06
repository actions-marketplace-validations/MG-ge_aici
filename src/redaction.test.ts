import assert from "node:assert/strict";
import test from "node:test";
import { collectRedactionValues, redactTestResult, redactText } from "./redaction.js";

test.afterEach(() => {
  delete process.env.AICI_REDACTION_TEST_KEY;
});

test("redacts configured strings, bearer tokens, and provider env secrets", () => {
  process.env.AICI_REDACTION_TEST_KEY = "secret-value-123";
  const redactions = collectRedactionValues({
    version: 1,
    provider: {
      type: "openai",
      model: "test-model",
      apiKeyEnv: "AICI_REDACTION_TEST_KEY",
    },
    redact: ["customer@example.com"],
    tests: [{ name: "redaction", mockOutput: "ok" }],
  });

  const text = "Bearer sk-test-secret abc customer@example.com secret-value-123";
  const redacted = redactText(text, redactions);

  assert.equal(redacted.includes("customer@example.com"), false);
  assert.equal(redacted.includes("secret-value-123"), false);
  assert.equal(redacted.includes("sk-test-secret"), false);
});

test("redacts structured tool call arguments and raw provider payloads", () => {
  const redacted = redactTestResult({
    name: "tool-call-redaction",
    passed: true,
    output: "ok",
    checks: [{ name: "toolCall", passed: true, message: "found customer@example.com" }],
    toolCalls: [{
      name: "lookup_customer",
      arguments: {
        email: "customer@example.com",
        nested: ["Bearer opaque-bearer-token-123456"],
      },
      raw: {
        function: {
          arguments: "{\"email\":\"customer@example.com\"}",
        },
      },
    }],
  }, ["customer@example.com"]);

  const serialized = JSON.stringify(redacted);
  assert.equal(serialized.includes("customer@example.com"), false);
  assert.equal(serialized.includes("opaque-bearer-token-123456"), false);
  assert.match(serialized, /\[REDACTED\]/u);
});
