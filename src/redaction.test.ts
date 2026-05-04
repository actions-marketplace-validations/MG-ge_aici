import assert from "node:assert/strict";
import test from "node:test";
import { collectRedactionValues, redactText } from "./redaction.js";

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
