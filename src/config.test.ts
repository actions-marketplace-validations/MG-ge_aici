import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import test from "node:test";
import { loadConfig } from "./config.js";

test("provider config allows official OpenAI and Anthropic without baseUrl", async () => {
  await withConfig(`
version: 1
provider:
  type: openai
  model: gpt-5.4-mini
tests:
  - name: openai-smoke
    mockOutput: ok
`, async (configPath) => {
    const loaded = await loadConfig(configPath);
    assert.equal(loaded.config.provider?.type, "openai");
  });

  await withConfig(`
version: 1
provider:
  type: anthropic
  model: claude-haiku-4-5
tests:
  - name: anthropic-smoke
    mockOutput: ok
`, async (configPath) => {
    const loaded = await loadConfig(configPath);
    assert.equal(loaded.config.provider?.type, "anthropic");
  });
});

test("provider config requires baseUrl only for openai-compatible", async () => {
  await withConfig(`
version: 1
provider:
  type: openai-compatible
  model: test-model
  baseUrl: https://example.test/v1
tests:
  - name: compatible-smoke
    mockOutput: ok
`, async (configPath) => {
    const loaded = await loadConfig(configPath);
    assert.equal(loaded.config.provider?.type, "openai-compatible");
    assert.equal(loaded.config.provider?.baseUrl, "https://example.test/v1");
  });
});

test("provider config rejects baseUrl for official providers", async () => {
  await assert.rejects(
    withConfig(`
version: 1
provider:
  type: openai
  model: gpt-5.4-mini
  baseUrl: https://proxy.example.test/v1
tests:
  - name: openai-smoke
    mockOutput: ok
`, (configPath) => loadConfig(configPath)),
    /Config field `provider`\.baseUrl is only allowed for openai-compatible providers\./,
  );

  await assert.rejects(
    withConfig(`
version: 1
tests:
  - name: anthropic-smoke
    provider:
      type: anthropic
      model: claude-haiku-4-5
      baseUrl: https://proxy.example.test/v1
    mockOutput: ok
`, (configPath) => loadConfig(configPath)),
    /Test "anthropic-smoke" field `provider`\.baseUrl is only allowed for openai-compatible providers\./,
  );
});

test("provider config rejects openai-compatible without baseUrl", async () => {
  await assert.rejects(
    withConfig(`
version: 1
provider:
  type: openai-compatible
  model: test-model
tests:
  - name: compatible-smoke
    mockOutput: ok
`, (configPath) => loadConfig(configPath)),
    /Config field `provider`\.baseUrl is required for openai-compatible providers\./,
  );
});

async function withConfig<T>(
  contents: string,
  callback: (configPath: string) => Promise<T>,
): Promise<T> {
  const directory = await mkdtemp(path.join(tmpdir(), "aici-config-"));
  const configPath = path.join(directory, "aici.yml");

  try {
    await writeFile(configPath, contents.trimStart());
    return await callback(configPath);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
