import type { AiciConfig, AiciProvider, TestResult } from "./types.js";

const COMMON_SECRET_ENV_NAMES = [
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "GOOGLE_API_KEY",
  "GROQ_API_KEY",
  "MISTRAL_API_KEY",
  "TOGETHER_API_KEY",
  "OPENROUTER_API_KEY",
];

export function collectRedactionValues(config: AiciConfig): string[] {
  const values = new Set<string>();

  for (const value of config.redact ?? []) {
    addRedactionValue(values, value, 1);
  }

  for (const envName of collectProviderEnvNames(config)) {
    addRedactionValue(values, process.env[envName], 8);
  }

  for (const envName of COMMON_SECRET_ENV_NAMES) {
    addRedactionValue(values, process.env[envName], 8);
  }

  return [...values];
}

export function redactTestResult(result: TestResult, redactions: string[]): TestResult {
  return {
    ...result,
    output: redactText(result.output, redactions),
    checks: result.checks.map((check) => ({
      ...check,
      message: redactText(check.message, redactions),
    })),
  };
}

export function redactText(value: string, redactions: string[]): string {
  let result = value
    .replaceAll(/Bearer\s+[A-Za-z0-9._~+/=-]+/g, "Bearer [REDACTED]")
    .replaceAll(/\b(?:sk|rk|pk|org|proj)-[A-Za-z0-9_-]{12,}\b/g, "[REDACTED]");

  for (const secret of redactions) {
    result = result.replaceAll(secret, "[REDACTED]");
  }

  return result;
}

function collectProviderEnvNames(config: AiciConfig): string[] {
  const envNames = new Set<string>();
  addProviderEnvName(envNames, config.provider);

  for (const test of config.tests) {
    addProviderEnvName(envNames, test.provider);
  }

  return [...envNames];
}

function addProviderEnvName(envNames: Set<string>, provider?: AiciProvider): void {
  if (provider?.apiKeyEnv) {
    envNames.add(provider.apiKeyEnv);
  }
}

function addRedactionValue(values: Set<string>, value: string | undefined, minLength: number): void {
  if (value && value.length >= minLength) {
    values.add(value);
  }
}
