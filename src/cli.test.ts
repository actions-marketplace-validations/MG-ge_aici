import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);

test("run rejects unapproved provider endpoints before reading provider secrets", async () => {
  const directory = path.join(tmpdir(), `aici-cli-${process.pid}-${Date.now()}`);
  await mkdir(directory, { recursive: true });
  const configPath = path.join(directory, "aici.yml");
  await writeFile(configPath, `version: 1
provider:
  type: openai
  model: gpt-5.4-mini
tests:
  - name: live
    prompt: Return ok
`);

  await assert.rejects(
    execFileAsync(process.execPath, [
      "--import",
      "tsx",
      "src/cli.ts",
      "run",
      "--config",
      configPath,
      "--allow-provider-endpoint",
      "https://api.anthropic.com/v1/messages",
    ], {
      cwd: path.dirname(import.meta.dirname),
      env: withoutProviderSecrets(process.env),
    }),
    (error: unknown) => {
      assert.equal((error as { code?: number }).code, 1);
      const stderr = String((error as { stderr?: string }).stderr ?? "");
      assert.match(stderr, /unapproved provider endpoints/u);
      assert.doesNotMatch(stderr, /Missing API key env var/u);
      return true;
    },
  );
});

function withoutProviderSecrets(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const clean = { ...env };
  delete clean.OPENAI_API_KEY;
  delete clean.ANTHROPIC_API_KEY;
  return clean;
}
