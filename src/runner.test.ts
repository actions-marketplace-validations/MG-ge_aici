import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { loadConfig } from "./config.js";
import { runConfig } from "./runner.js";

test("runs passing fixture config", async () => {
  const loaded = await loadConfig("examples/basic/aici.yml");
  const result = await runConfig(loaded.config, loaded.rootDir);

  assert.equal(result.passed, true);
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0]?.checks.some((check) => check.name === "jsonSchema"), true);
});

test("runs failing fixture config as a normal failed result", async () => {
  const loaded = await loadConfig("examples/failing/aici.yml");
  const result = await runConfig(loaded.config, loaded.rootDir);

  assert.equal(result.passed, false);
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0]?.checks.some((check) => check.name === "jsonSchema" && !check.passed), true);
});

test("runs tool-call fixture config", async () => {
  const loaded = await loadConfig("examples/tool-call/aici.yml");
  const result = await runConfig(loaded.config, loaded.rootDir);

  assert.equal(result.passed, true);
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0]?.toolCalls?.[0]?.name, "lookup_order");
  assert.equal(
    result.results[0]?.checks.some((check) => check.name === "toolCall.argumentsJsonSchema"),
    true,
  );
});

test("missing provider is reported as execution failure", async () => {
  const result = await runConfig(
    {
      version: 1,
      tests: [{ name: "missing-provider", prompt: "Return ok" }],
    },
    path.resolve("."),
  );

  assert.equal(result.passed, false);
  assert.equal(result.results[0]?.checks[0]?.name, "execution");
});

test("config file references cannot escape config directory", async () => {
  const result = await runConfig(
    {
      version: 1,
      tests: [{ name: "path-escape", mockOutputFile: "../../package.json" }],
    },
    path.resolve("examples/basic"),
  );

  assert.equal(result.passed, false);
  assert.match(result.results[0]?.checks[0]?.message ?? "", /inside the config directory/u);
});
