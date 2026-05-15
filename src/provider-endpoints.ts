import type { AiciProvider } from "./types.js";

export const OPENAI_BASE_URL = "https://api.openai.com/v1";
export const ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1";

export function getProviderRequestUrl(provider: AiciProvider): string {
  if (provider.type === "anthropic") {
    return `${ANTHROPIC_BASE_URL}/messages`;
  }

  const baseUrl = provider.type === "openai"
    ? OPENAI_BASE_URL
    : stripTrailingSlash(provider.baseUrl);

  const api = provider.api ?? (provider.type === "openai" ? "responses" : "chat-completions");
  return `${baseUrl}/${api === "responses" ? "responses" : "chat/completions"}`;
}

export function getProviderApiKeyEnv(provider: AiciProvider): string {
  if (provider.apiKeyEnv) {
    return provider.apiKeyEnv;
  }

  return provider.type === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY";
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/u, "");
}
