import { readFile } from "node:fs/promises";
import path from "node:path";
import type { AiciProvider, AiciTest, AiciToolChoice, AiciToolDefinition, ToolCall } from "./types.js";

export type ProviderCall = {
  output: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  toolCalls?: ToolCall[];
  provider: string;
  model: string;
};

type ChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
      tool_calls?: ChatToolCall[];
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    input_tokens?: number;
    output_tokens?: number;
  };
};

type ChatToolCall = {
  type?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
};

type ResponsesOutputItem = {
  type?: string;
  name?: string;
  arguments?: unknown;
  content?: Array<{
    text?: string;
    type?: string;
  }>;
};

type ResponsesResponse = {
  output_text?: string;
  output?: ResponsesOutputItem[];
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
};

const MODEL_PRICING_USD_PER_1M_TOKENS: Record<string, { input: number; output: number }> = {
  "gpt-5.4-mini": { input: 0.15, output: 0.6 },
  "gpt-5.4": { input: 2, output: 8 },
  "gpt-5.3-mini": { input: 0.15, output: 0.6 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4.1": { input: 2, output: 8 },
};

export async function callProvider(
  provider: AiciProvider,
  test: AiciTest,
  prompt: string,
  rootDir: string,
): Promise<ProviderCall> {
  if (provider.type === "openai" || provider.type === "openai-compatible") {
    return callOpenAiCompatible(provider, test, prompt, rootDir);
  }

  throw new Error(`Unsupported provider type: ${(provider as AiciProvider).type}`);
}

async function callOpenAiCompatible(
  provider: AiciProvider,
  test: AiciTest,
  prompt: string,
  rootDir: string,
): Promise<ProviderCall> {
  const apiKeyEnv = provider.apiKeyEnv ?? "OPENAI_API_KEY";
  const apiKey = process.env[apiKeyEnv];

  if (!apiKey) {
    throw new Error(`Missing API key env var ${apiKeyEnv} for test "${test.name}".`);
  }

  const baseUrl = stripTrailingSlash(
    provider.baseUrl ?? (provider.type === "openai" ? "https://api.openai.com/v1" : ""),
  );

  if (!baseUrl) {
    throw new Error(`Provider "${provider.type}" requires baseUrl.`);
  }

  const api = provider.api ?? (provider.type === "openai" ? "responses" : "chat-completions");
  const request = api === "responses"
    ? () => callResponsesApi(provider, test, prompt, apiKey, baseUrl, rootDir)
    : () => callChatCompletionsApi(provider, test, prompt, apiKey, baseUrl, rootDir);

  return withRetries(request, provider.retries ?? 1);
}

async function callResponsesApi(
  provider: AiciProvider,
  test: AiciTest,
  prompt: string,
  apiKey: string,
  baseUrl: string,
  rootDir: string,
): Promise<ProviderCall> {
  const startedAt = performance.now();
  const tools = await resolveTools(test, rootDir);
  const response = await fetchWithTimeout(`${baseUrl}/responses`, {
    method: "POST",
    headers: {
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
      input: prompt,
      temperature: provider.temperature ?? 0,
      max_output_tokens: provider.maxOutputTokens,
      ...(tools.length > 0 ? { tools: tools.map(toResponsesTool), tool_choice: toResponsesToolChoice(test.toolChoice) } : {}),
    }),
  }, provider.timeoutMs);
  const latencyMs = Math.round(performance.now() - startedAt);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Provider request failed for "${test.name}" (${response.status}): ${body}`);
  }

  const body = (await response.json()) as ResponsesResponse;
  const output = body.output_text ?? extractResponsesText(body);
  const toolCalls = extractResponsesToolCalls(body);

  if (typeof output !== "string" && toolCalls.length === 0) {
    throw new Error(`Provider response for "${test.name}" did not include text output.`);
  }

  const inputTokens = body.usage?.input_tokens;
  const outputTokens = body.usage?.output_tokens;

  return {
    output: output ?? "",
    latencyMs,
    inputTokens,
    outputTokens,
    costUsd: estimateCost(provider.model, inputTokens, outputTokens),
    toolCalls,
    provider: provider.type,
    model: provider.model,
  };
}

async function callChatCompletionsApi(
  provider: AiciProvider,
  test: AiciTest,
  prompt: string,
  apiKey: string,
  baseUrl: string,
  rootDir: string,
): Promise<ProviderCall> {
  const startedAt = performance.now();
  const tools = await resolveTools(test, rootDir);
  const response = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [{ role: "user", content: prompt }],
      temperature: provider.temperature ?? 0,
      max_tokens: provider.maxOutputTokens,
      ...(tools.length > 0 ? { tools: tools.map(toChatTool), tool_choice: toChatToolChoice(test.toolChoice) } : {}),
    }),
  }, provider.timeoutMs);
  const latencyMs = Math.round(performance.now() - startedAt);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Provider request failed for "${test.name}" (${response.status}): ${body}`);
  }

  const body = (await response.json()) as ChatResponse;
  const message = body.choices?.[0]?.message;
  const output = message?.content;
  const toolCalls = extractChatToolCalls(message?.tool_calls ?? []);

  if (typeof output !== "string" && toolCalls.length === 0) {
    throw new Error(`Provider response for "${test.name}" did not include text output.`);
  }

  const inputTokens = body.usage?.prompt_tokens ?? body.usage?.input_tokens;
  const outputTokens = body.usage?.completion_tokens ?? body.usage?.output_tokens;

  return {
    output: output ?? "",
    latencyMs,
    inputTokens,
    outputTokens,
    costUsd: estimateCost(provider.model, inputTokens, outputTokens),
    toolCalls,
    provider: provider.type,
    model: provider.model,
  };
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 30_000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function withRetries<T>(request: () => Promise<T>, retries: number): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await request();
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        await delay(250 * 2 ** attempt);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function extractResponsesText(body: ResponsesResponse): string | undefined {
  const parts = body.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter((text): text is string => typeof text === "string");

  return parts && parts.length > 0 ? parts.join("\n") : undefined;
}

function extractChatToolCalls(toolCalls: ChatToolCall[]): ToolCall[] {
  const normalized: ToolCall[] = [];

  for (const toolCall of toolCalls) {
    const name = toolCall.function?.name;

    if (typeof name === "string" && name.length > 0) {
      normalized.push({
        name,
        arguments: parseToolArguments(toolCall.function?.arguments),
        raw: toolCall,
      });
    }
  }

  return normalized;
}

function extractResponsesToolCalls(body: ResponsesResponse): ToolCall[] {
  const normalized: ToolCall[] = [];

  for (const item of body.output ?? []) {
    if (typeof item.name === "string" && item.name.length > 0) {
      normalized.push({
        name: item.name,
        arguments: parseToolArguments(item.arguments),
        raw: item,
      });
    }
  }

  return normalized;
}

function parseToolArguments(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

type ResolvedTool = {
  name: string;
  description?: string;
  parameters?: unknown;
  strict?: boolean;
};

async function resolveTools(test: AiciTest, rootDir: string): Promise<ResolvedTool[]> {
  const tools: ResolvedTool[] = [];

  for (const tool of test.tools ?? []) {
    tools.push({
      name: tool.name,
      description: tool.description,
      parameters: await resolveToolParameters(tool, rootDir),
      strict: tool.strict,
    });
  }

  return tools;
}

async function resolveToolParameters(tool: AiciToolDefinition, rootDir: string): Promise<unknown> {
  if (typeof tool.parametersFile === "string") {
    return JSON.parse(await readFile(path.resolve(rootDir, tool.parametersFile), "utf8")) as unknown;
  }

  return tool.parameters;
}

function toResponsesTool(tool: ResolvedTool): Record<string, unknown> {
  return compactObject({
    type: "function",
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    strict: tool.strict,
  });
}

function toChatTool(tool: ResolvedTool): Record<string, unknown> {
  return {
    type: "function",
    function: compactObject({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      strict: tool.strict,
    }),
  };
}

function toResponsesToolChoice(toolChoice: AiciToolChoice | undefined): unknown {
  if (!toolChoice) {
    return "auto";
  }

  if (typeof toolChoice === "string") {
    return toolChoice;
  }

  return {
    type: "function",
    name: toolChoice.name,
  };
}

function toChatToolChoice(toolChoice: AiciToolChoice | undefined): unknown {
  if (!toolChoice) {
    return "auto";
  }

  if (typeof toolChoice === "string") {
    return toolChoice;
  }

  return {
    type: "function",
    function: {
      name: toolChoice.name,
    },
  };
}

function compactObject(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function estimateCost(model: string, inputTokens?: number, outputTokens?: number): number | undefined {
  const pricing = MODEL_PRICING_USD_PER_1M_TOKENS[model];

  if (!pricing || inputTokens === undefined || outputTokens === undefined) {
    return undefined;
  }

  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
