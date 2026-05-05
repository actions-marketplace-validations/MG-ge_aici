export type AiciConfig = {
  version: 1;
  provider?: AiciProvider;
  redact?: string[];
  tests: AiciTest[];
};

export type AiciProvider = {
  type: "openai" | "openai-compatible" | "anthropic";
  model: string;
  api?: "responses" | "chat-completions" | "messages";
  apiKeyEnv?: string;
  baseUrl?: string;
  apiVersion?: string;
  timeoutMs?: number;
  retries?: number;
  temperature?: number;
  maxOutputTokens?: number;
};

export type AiciTest = {
  name: string;
  provider?: AiciProvider;
  prompt?: string;
  promptFile?: string;
  input?: string;
  inputFile?: string;
  tools?: AiciToolDefinition[];
  toolChoice?: AiciToolChoice;
  mockOutput?: string;
  mockOutputFile?: string;
  mockToolCalls?: ToolCall[];
  mockToolCallsFile?: string;
  expect?: AiciExpect;
};

export type AiciExpect = {
  exact?: string;
  contains?: string[];
  regex?: string[];
  json?: boolean;
  jsonSchema?: string;
  toolCalls?: ToolCallExpectation[];
  maxLatencyMs?: number;
  maxCostUsd?: number;
};

export type ToolCall = {
  name: string;
  arguments?: unknown;
  raw?: unknown;
};

export type AiciToolDefinition = {
  name: string;
  description?: string;
  parameters?: unknown;
  parametersFile?: string;
  strict?: boolean;
};

export type AiciToolChoice = "auto" | "none" | "required" | { name: string };

export type ToolCallExpectation = {
  name?: string;
  index?: number;
  argumentsContains?: string[];
  argumentsJsonSchema?: string;
};

export type CheckResult = {
  name: string;
  passed: boolean;
  message: string;
};

export type TestResult = {
  name: string;
  passed: boolean;
  checks: CheckResult[];
  output: string;
  latencyMs?: number;
  costUsd?: number;
  inputTokens?: number;
  outputTokens?: number;
  toolCalls?: ToolCall[];
  provider?: string;
  model?: string;
};

export type RunResult = {
  passed: boolean;
  results: TestResult[];
};
