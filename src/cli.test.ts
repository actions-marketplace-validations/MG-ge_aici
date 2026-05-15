import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);

test("init creates a self-contained fixture config that passes", async () => {
  const directory = path.join(tmpdir(), `aici-init-${process.pid}-${Date.now()}`);
  const configPath = path.join(directory, "aici.yml");
  await mkdir(directory, { recursive: true });

  try {
    const init = await execFileAsync(process.execPath, [
      "--import",
      "tsx",
      "src/cli.ts",
      "init",
      "--config",
      configPath,
    ], {
      cwd: path.dirname(import.meta.dirname),
    });

    assert.match(init.stdout, /Created .+aici\.yml/u);
    assert.match(await readFile(configPath, "utf8"), /aici-example\.schema\.json/u);

    const run = await execFileAsync(process.execPath, [
      "--import",
      "tsx",
      "src/cli.ts",
      "run",
      "--config",
      configPath,
      "--report-dir",
      path.join(directory, ".aici"),
    ], {
      cwd: path.dirname(import.meta.dirname),
    });

    assert.match(run.stdout, /PASS 1 test/u);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

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
