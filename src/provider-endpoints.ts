import type { AiciProvider } from "./types.js";

export const OPENAI_BASE_URL = "https://api.openai.com/v1";
export const ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1";

export function getProviderRequestUrl(provider: AiciProvider): string {
  if (provider.type === "anthropic") {
    return `${ANTHROPIC_BASE_URL}/messages`;
  }

  const baseUrl = provider.type === "openai"
    ? OPENAI_BASE_URL
    : normalizeProviderBaseUrl(provider.baseUrl);

  const api = provider.api ?? (provider.type === "openai" ? "responses" : "chat-completions");
  return `${baseUrl}/${api === "responses" ? "responses" : "chat/completions"}`;
}

export function getProviderApiKeyEnv(provider: AiciProvider): string {
  if (provider.apiKeyEnv) {
    return provider.apiKeyEnv;
  }

  return provider.type === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY";
}

export function normalizeProviderBaseUrl(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`Provider baseUrl must be an absolute URL.`);
  }

  if (parsed.username || parsed.password) {
    throw new Error(`Provider baseUrl must not include credentials.`);
  }

  if (parsed.search || parsed.hash) {
    throw new Error(`Provider baseUrl must not include query strings or fragments.`);
  }

  if (parsed.protocol !== "https:" && !isLocalHttpUrl(parsed)) {
    throw new Error(`Provider baseUrl must use https, except localhost or loopback http URLs for local models.`);
  }

  return parsed.toString().replace(/\/+$/u, "");
}

function isLocalHttpUrl(value: URL): boolean {
  return value.protocol === "http:" && (
    value.hostname === "localhost"
    || value.hostname === "127.0.0.1"
    || value.hostname === "::1"
    || value.hostname === "[::1]"
  );
}
