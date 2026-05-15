import assert from "node:assert/strict";
import test from "node:test";
import {
  assertAllowedProviderEndpoints,
  createAuditReport,
  findDisallowedProviderEndpoints,
  renderAuditReport,
  renderEndpointViolations,
} from "./audit.js";
import type { AiciConfig } from "./types.js";

test("audit reports configured provider endpoints and empty judge boundary", async () => {
  const config: AiciConfig = {
    version: 1,
    provider: {
      type: "openai",
      model: "gpt-5.4-mini",
    },
    tests: [
      {
        name: "fixture",
        mockOutput: "ok",
      },
      {
        name: "compatible",
        provider: {
          type: "openai-compatible",
          model: "local-model",
          baseUrl: "https://models.example.test/v1/",
          apiKeyEnv: "LOCAL_MODEL_KEY",
        },
        prompt: "Return ok",
      },
      {
        name: "anthropic",
        provider: {
          type: "anthropic",
          model: "claude-haiku-4-5",
        },
        prompt: "Return ok",
      },
    ],
  };

  const report = await createAuditReport(config, "/tmp/aici.yml");
  assert.deepEqual(
    report.providerEndpoints.map((endpoint) => endpoint.endpoint),
    [
      "https://api.openai.com/v1/responses",
      "https://models.example.test/v1/chat/completions",
      "https://api.anthropic.com/v1/messages",
    ],
  );
  assert.deepEqual(report.judgeEndpoints, []);
  assert.equal(report.networkPolicy.telemetry, false);
  assert.equal(report.networkPolicy.aiciBackend, false);
});

test("audit human output is grep-friendly for endpoint allowlists", async () => {
  const config: AiciConfig = {
    version: 1,
    tests: [
      {
        name: "compatible",
        provider: {
          type: "openai-compatible",
          model: "local-model",
          baseUrl: "https://models.example.test/v1",
        },
        prompt: "Return ok",
      },
    ],
  };

  const report = await createAuditReport(config, "/tmp/aici.yml");
  const rendered = renderAuditReport(report);
  assert.match(rendered, /endpoint: https:\/\/models\.example\.test\/v1\/chat\/completions/u);
  assert.match(rendered, /No telemetry\. No remote Aici backend\./u);
  assert.match(rendered, /Judge endpoints:\n  none/u);
});

test("audit allowlist detects unapproved provider endpoints", async () => {
  const config: AiciConfig = {
    version: 1,
    provider: {
      type: "openai",
      model: "gpt-5.4-mini",
    },
    tests: [
      {
        name: "compatible",
        provider: {
          type: "openai-compatible",
          model: "local-model",
          baseUrl: "https://models.example.test/v1",
        },
        prompt: "Return ok",
      },
    ],
  };

  const report = await createAuditReport(config, "/tmp/aici.yml");
  const violations = findDisallowedProviderEndpoints(report, ["https://api.openai.com/v1/responses/"]);
  assert.deepEqual(violations.map((violation) => violation.endpoint), ["https://models.example.test/v1/chat/completions"]);
  assert.match(renderEndpointViolations(violations), /unapproved provider endpoints/u);
});

test("endpoint allowlist assertion rejects before live runs", async () => {
  const config: AiciConfig = {
    version: 1,
    provider: {
      type: "openai",
      model: "gpt-5.4-mini",
    },
    tests: [
      {
        name: "live",
        prompt: "Return ok",
      },
    ],
  };

  const report = await createAuditReport(config, "/tmp/aici.yml");

  assert.doesNotThrow(() => {
    assertAllowedProviderEndpoints(report, ["https://api.openai.com/v1/responses"]);
  });

  assert.throws(
    () => assertAllowedProviderEndpoints(report, ["https://api.anthropic.com/v1/messages"]),
    /unapproved provider endpoints/u,
  );
});
