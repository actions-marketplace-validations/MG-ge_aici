import { readFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import type { AiciConfig, AiciProvider } from "./types.js";

export type LoadedConfig = {
  config: AiciConfig;
  configPath: string;
  rootDir: string;
};

export async function loadConfig(configPath = "aici.yml"): Promise<LoadedConfig> {
  const resolvedPath = path.resolve(configPath);
  const raw = await readFile(resolvedPath, "utf8");
  const parsed = YAML.parse(raw) as unknown;
  const config = validateConfigShape(parsed);

  return {
    config,
    configPath: resolvedPath,
    rootDir: path.dirname(resolvedPath),
  };
}

function validateConfigShape(value: unknown): AiciConfig {
  if (!isRecord(value)) {
    throw new Error("Config must be a YAML object.");
  }

  if (value.version !== 1) {
    throw new Error("Config field `version` must be 1.");
  }

  if (value.$schema !== undefined && typeof value.$schema !== "string") {
    throw new Error("Config field `$schema` must be a string.");
  }

  if (value.provider !== undefined) {
    validateProvider(value.provider, "Config field `provider`");
  }

  if (value.redact !== undefined && !isStringArray(value.redact)) {
    throw new Error("Config field `redact` must be an array of strings.");
  }

  if (!Array.isArray(value.tests) || value.tests.length === 0) {
    throw new Error("Config field `tests` must be a non-empty array.");
  }

  for (const [index, test] of value.tests.entries()) {
    if (!isRecord(test)) {
      throw new Error(`Test at index ${index} must be an object.`);
    }

    if (typeof test.name !== "string" || test.name.trim() === "") {
      throw new Error(`Test at index ${index} must have a non-empty string \`name\`.`);
    }

    if (test.mockOutput !== undefined && typeof test.mockOutput !== "string") {
      throw new Error(`Test "${test.name}" field \`mockOutput\` must be a string.`);
    }

    if (test.mockOutputFile !== undefined && typeof test.mockOutputFile !== "string") {
      throw new Error(`Test "${test.name}" field \`mockOutputFile\` must be a string.`);
    }

    if (test.mockToolCalls !== undefined && !Array.isArray(test.mockToolCalls)) {
      throw new Error(`Test "${test.name}" field \`mockToolCalls\` must be an array.`);
    }

    if (Array.isArray(test.mockToolCalls)) {
      validateToolCallArray(test.mockToolCalls, `Test "${test.name}" field \`mockToolCalls\``);
    }

    if (test.mockToolCallsFile !== undefined && typeof test.mockToolCallsFile !== "string") {
      throw new Error(`Test "${test.name}" field \`mockToolCallsFile\` must be a string.`);
    }

    if (test.tools !== undefined) {
      validateTools(test.tools, `Test "${test.name}" field \`tools\``);
    }

    if (test.toolChoice !== undefined) {
      validateToolChoice(test.toolChoice, `Test "${test.name}" field \`toolChoice\``);
    }

    if (test.expect !== undefined) {
      validateExpect(test.expect, `Test "${test.name}" field \`expect\``);
    }

    if (test.provider !== undefined) {
      validateProvider(test.provider, `Test "${test.name}" field \`provider\``);
    }
  }

  return value as AiciConfig;
}

function validateProvider(value: unknown, label: string): AiciProvider {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object.`);
  }

  if (value.type !== "openai" && value.type !== "openai-compatible" && value.type !== "anthropic") {
    throw new Error(`${label}.type must be "openai", "openai-compatible", or "anthropic".`);
  }

  if (typeof value.model !== "string" || value.model.trim() === "") {
    throw new Error(`${label}.model must be a non-empty string.`);
  }

  if (value.apiKeyEnv !== undefined && typeof value.apiKeyEnv !== "string") {
    throw new Error(`${label}.apiKeyEnv must be a string.`);
  }

  if (value.api !== undefined && value.api !== "responses" && value.api !== "chat-completions" && value.api !== "messages") {
    throw new Error(`${label}.api must be "responses", "chat-completions", or "messages".`);
  }

  if (value.baseUrl !== undefined && typeof value.baseUrl !== "string") {
    throw new Error(`${label}.baseUrl must be a string.`);
  }

  if (value.apiVersion !== undefined && typeof value.apiVersion !== "string") {
    throw new Error(`${label}.apiVersion must be a string.`);
  }

  validateOptionalNumber(value.timeoutMs, `${label}.timeoutMs`);
  validateOptionalNumber(value.retries, `${label}.retries`);
  validateOptionalNumber(value.temperature, `${label}.temperature`);
  validateOptionalNumber(value.maxOutputTokens, `${label}.maxOutputTokens`);

  if (value.type === "openai-compatible" && typeof value.baseUrl !== "string") {
    throw new Error(`${label}.baseUrl is required for openai-compatible providers.`);
  }

  if (value.type === "anthropic" && value.api !== undefined && value.api !== "messages") {
    throw new Error(`${label}.api must be "messages" for anthropic providers.`);
  }

  return value as AiciProvider;
}

function validateExpect(value: unknown, label: string): void {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object.`);
  }

  if (value.toolCalls !== undefined && !Array.isArray(value.toolCalls)) {
    throw new Error(`${label}.toolCalls must be an array.`);
  }

  if (Array.isArray(value.toolCalls)) {
    for (const [index, expectation] of value.toolCalls.entries()) {
      validateToolCallExpectation(expectation, `${label}.toolCalls[${index}]`);
    }
  }
}

function validateToolCallArray(value: unknown[], label: string): void {
  for (const [index, toolCall] of value.entries()) {
    if (!isRecord(toolCall)) {
      throw new Error(`${label}[${index}] must be an object.`);
    }

    if (typeof toolCall.name !== "string" || toolCall.name.trim() === "") {
      throw new Error(`${label}[${index}].name must be a non-empty string.`);
    }
  }
}

function validateToolCallExpectation(value: unknown, label: string): void {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object.`);
  }

  if (value.name !== undefined && typeof value.name !== "string") {
    throw new Error(`${label}.name must be a string.`);
  }

  if (
    value.index !== undefined
    && (typeof value.index !== "number" || !Number.isInteger(value.index) || value.index < 0)
  ) {
    throw new Error(`${label}.index must be a non-negative integer.`);
  }

  if (value.argumentsContains !== undefined && !isStringArray(value.argumentsContains)) {
    throw new Error(`${label}.argumentsContains must be an array of strings.`);
  }

  if (value.argumentsJsonSchema !== undefined && typeof value.argumentsJsonSchema !== "string") {
    throw new Error(`${label}.argumentsJsonSchema must be a string.`);
  }
}

function validateTools(value: unknown, label: string): void {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }

  for (const [index, tool] of value.entries()) {
    if (!isRecord(tool)) {
      throw new Error(`${label}[${index}] must be an object.`);
    }

    if (typeof tool.name !== "string" || !/^[A-Za-z0-9_-]{1,64}$/u.test(tool.name)) {
      throw new Error(`${label}[${index}].name must be 1-64 characters using letters, numbers, underscores, or dashes.`);
    }

    if (tool.description !== undefined && typeof tool.description !== "string") {
      throw new Error(`${label}[${index}].description must be a string.`);
    }

    if (tool.parametersFile !== undefined && typeof tool.parametersFile !== "string") {
      throw new Error(`${label}[${index}].parametersFile must be a string.`);
    }

    if (tool.parameters !== undefined && !isRecord(tool.parameters)) {
      throw new Error(`${label}[${index}].parameters must be an object.`);
    }

    if (tool.strict !== undefined && typeof tool.strict !== "boolean") {
      throw new Error(`${label}[${index}].strict must be a boolean.`);
    }
  }
}

function validateToolChoice(value: unknown, label: string): void {
  if (value === "auto" || value === "none" || value === "required") {
    return;
  }

  if (!isRecord(value)) {
    throw new Error(`${label} must be "auto", "none", "required", or an object with a name.`);
  }

  if (typeof value.name !== "string" || !/^[A-Za-z0-9_-]{1,64}$/u.test(value.name)) {
    throw new Error(`${label}.name must be 1-64 characters using letters, numbers, underscores, or dashes.`);
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function validateOptionalNumber(value: unknown, label: string): void {
  if (value !== undefined && (typeof value !== "number" || !Number.isFinite(value))) {
    throw new Error(`${label} must be a finite number.`);
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
