import { readFile } from "node:fs/promises";
import path from "node:path";
import { Ajv2020, type AnySchema } from "ajv/dist/2020.js";
import { callProvider } from "./providers.js";
import type { AiciConfig, AiciExpect, AiciTest, CheckResult, TestResult, ToolCall, ToolCallExpectation } from "./types.js";

export async function runTest(
  test: AiciTest,
  rootDir: string,
  defaultProvider?: AiciConfig["provider"],
): Promise<TestResult> {
  const execution = await executeTest(test, rootDir, defaultProvider);
  const checks = await runChecks(test.expect ?? {}, execution.output, rootDir, {
    latencyMs: execution.latencyMs,
    costUsd: execution.costUsd,
    toolCalls: execution.toolCalls,
  });

  return {
    name: test.name,
    passed: checks.every((check) => check.passed),
    checks,
    output: execution.output,
    latencyMs: execution.latencyMs,
    costUsd: execution.costUsd,
    inputTokens: execution.inputTokens,
    outputTokens: execution.outputTokens,
    toolCalls: execution.toolCalls,
    provider: execution.provider,
    model: execution.model,
  };
}

type TestExecution = {
  output: string;
  latencyMs: number;
  costUsd?: number;
  inputTokens?: number;
  outputTokens?: number;
  toolCalls?: ToolCall[];
  provider?: string;
  model?: string;
};

async function executeTest(
  test: AiciTest,
  rootDir: string,
  defaultProvider?: AiciConfig["provider"],
): Promise<TestExecution> {
  const startedAt = performance.now();

  if (typeof test.mockOutput === "string") {
    return {
      output: test.mockOutput,
      toolCalls: await resolveMockToolCalls(test, rootDir),
      latencyMs: Math.round(performance.now() - startedAt),
    };
  }

  if (typeof test.mockOutputFile === "string") {
    return {
      output: await readFile(path.resolve(rootDir, test.mockOutputFile), "utf8"),
      toolCalls: await resolveMockToolCalls(test, rootDir),
      latencyMs: Math.round(performance.now() - startedAt),
    };
  }

  if (test.mockToolCalls !== undefined || typeof test.mockToolCallsFile === "string") {
    return {
      output: "",
      toolCalls: await resolveMockToolCalls(test, rootDir),
      latencyMs: Math.round(performance.now() - startedAt),
    };
  }

  const provider = test.provider ?? defaultProvider;

  if (!provider) {
    throw new Error(`Test "${test.name}" needs a provider or mockOutput/mockOutputFile.`);
  }

  const prompt = await resolvePrompt(test, rootDir);
  return callProvider(provider, test, prompt, rootDir);
}

async function resolveMockToolCalls(test: AiciTest, rootDir: string): Promise<ToolCall[] | undefined> {
  if (test.mockToolCalls !== undefined) {
    return test.mockToolCalls;
  }

  if (typeof test.mockToolCallsFile === "string") {
    const raw = await readFile(path.resolve(rootDir, test.mockToolCallsFile), "utf8");
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      throw new Error(`Test "${test.name}" mockToolCallsFile must contain a JSON array.`);
    }

    return parsed as ToolCall[];
  }

  return undefined;
}

async function resolvePrompt(test: AiciTest, rootDir: string): Promise<string> {
  const promptParts = [];

  if (typeof test.prompt === "string") {
    promptParts.push(test.prompt);
  }

  if (typeof test.promptFile === "string") {
    promptParts.push(await readFile(path.resolve(rootDir, test.promptFile), "utf8"));
  }

  if (typeof test.input === "string") {
    promptParts.push(test.input);
  }

  if (typeof test.inputFile === "string") {
    promptParts.push(await readFile(path.resolve(rootDir, test.inputFile), "utf8"));
  }

  if (promptParts.length === 0) {
    throw new Error(`Test "${test.name}" needs prompt, promptFile, input, or inputFile for provider execution.`);
  }

  return promptParts.join("\n\n");
}

async function runChecks(
  expect: AiciExpect,
  output: string,
  rootDir: string,
  usage: { latencyMs?: number; costUsd?: number; toolCalls?: ToolCall[] },
): Promise<CheckResult[]> {
  const checks: CheckResult[] = [];

  if (expect.exact !== undefined) {
    checks.push({
      name: "exact",
      passed: output === expect.exact,
      message: output === expect.exact ? "Output matched exactly." : "Output did not match exactly.",
    });
  }

  for (const text of expect.contains ?? []) {
    checks.push({
      name: "contains",
      passed: output.includes(text),
      message: output.includes(text) ? `Found "${text}".` : `Missing "${text}".`,
    });
  }

  for (const pattern of expect.regex ?? []) {
    const regex = new RegExp(pattern, "u");
    checks.push({
      name: "regex",
      passed: regex.test(output),
      message: regex.test(output) ? `Matched /${pattern}/.` : `Did not match /${pattern}/.`,
    });
  }

  if (expect.json || expect.jsonSchema) {
    const parsed = parseJson(output);
    checks.push({
      name: "json",
      passed: parsed.ok,
      message: parsed.ok ? "Output is valid JSON." : parsed.error,
    });

    if (parsed.ok && expect.jsonSchema) {
      const schemaPath = path.resolve(rootDir, expect.jsonSchema);
      const schema = JSON.parse(await readFile(schemaPath, "utf8")) as AnySchema;
      const ajv = new Ajv2020({ allErrors: true });
      const validate = ajv.compile(schema);
      const valid = validate(parsed.value) === true;

      checks.push({
        name: "jsonSchema",
        passed: valid,
        message: valid
          ? `Output matches ${expect.jsonSchema}.`
          : ajv.errorsText(validate.errors, { separator: "; " }),
      });
    }
  }

  for (const [index, expectation] of (expect.toolCalls ?? []).entries()) {
    checks.push(...(await checkToolCall(expectation, usage.toolCalls ?? [], rootDir, index)));
  }

  if (expect.maxLatencyMs !== undefined) {
    const latencyMs = usage.latencyMs;
    checks.push({
      name: "maxLatencyMs",
      passed: latencyMs !== undefined && latencyMs <= expect.maxLatencyMs,
      message:
        latencyMs === undefined
          ? "Latency is unknown."
          : `${latencyMs}ms <= ${expect.maxLatencyMs}ms.`,
    });
  }

  if (expect.maxCostUsd !== undefined) {
    const costUsd = usage.costUsd;
    checks.push({
      name: "maxCostUsd",
      passed: costUsd !== undefined && costUsd <= expect.maxCostUsd,
      message:
        costUsd === undefined
          ? "Cost is unknown for this provider/model."
          : `$${costUsd.toFixed(6)} <= $${expect.maxCostUsd.toFixed(6)}.`,
    });
  }

  if (checks.length === 0) {
    checks.push({
      name: "noExpectations",
      passed: true,
      message: "No expectations configured.",
    });
  }

  return checks;
}

async function checkToolCall(
  expectation: ToolCallExpectation,
  toolCalls: ToolCall[],
  rootDir: string,
  expectationIndex: number,
): Promise<CheckResult[]> {
  const checks: CheckResult[] = [];
  const selected = selectToolCall(expectation, toolCalls);
  const label = expectation.name ?? `#${expectation.index ?? expectationIndex}`;

  if (!selected) {
    return [
      {
        name: "toolCall",
        passed: false,
        message: `Missing expected tool call ${label}.`,
      },
    ];
  }

  if (expectation.name !== undefined) {
    checks.push({
      name: "toolCall.name",
      passed: selected.name === expectation.name,
      message:
        selected.name === expectation.name
          ? `Called ${expectation.name}.`
          : `Expected ${expectation.name}, got ${selected.name}.`,
    });
  }

  const argumentText = stringifyForCheck(selected.arguments);

  for (const expectedText of expectation.argumentsContains ?? []) {
    checks.push({
      name: "toolCall.argumentsContains",
      passed: argumentText.includes(expectedText),
      message: argumentText.includes(expectedText)
        ? `Tool arguments contain "${expectedText}".`
        : `Tool arguments do not contain "${expectedText}".`,
    });
  }

  if (expectation.argumentsJsonSchema) {
    const schemaPath = path.resolve(rootDir, expectation.argumentsJsonSchema);
    const schema = JSON.parse(await readFile(schemaPath, "utf8")) as AnySchema;
    const ajv = new Ajv2020({ allErrors: true });
    const validate = ajv.compile(schema);
    const valid = validate(selected.arguments) === true;

    checks.push({
      name: "toolCall.argumentsJsonSchema",
      passed: valid,
      message: valid
        ? `Tool arguments match ${expectation.argumentsJsonSchema}.`
        : ajv.errorsText(validate.errors, { separator: "; " }),
    });
  }

  return checks.length > 0
    ? checks
    : [
        {
          name: "toolCall",
          passed: true,
          message: `Found expected tool call ${label}.`,
        },
      ];
}

function selectToolCall(expectation: ToolCallExpectation, toolCalls: ToolCall[]): ToolCall | undefined {
  if (expectation.index !== undefined) {
    return toolCalls[expectation.index];
  }

  if (expectation.name !== undefined) {
    return toolCalls.find((toolCall) => toolCall.name === expectation.name);
  }

  return toolCalls[0];
}

function stringifyForCheck(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value ?? null);
}

function parseJson(output: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(output) as unknown };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Output is not valid JSON.",
    };
  }
}
