import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getProviderApiKeyEnv, getProviderRequestUrl } from "./provider-endpoints.js";
import type { AiciConfig, AiciProvider } from "./types.js";

export type AuditReport = {
  configPath: string;
  providerEndpoints: AuditEndpoint[];
  judgeEndpoints: AuditEndpoint[];
  dependencies: AuditDependency[];
  sourceSummary: AuditSourceSummary;
  networkPolicy: {
    telemetry: false;
    aiciBackend: false;
    liveProviderCalls: string;
    judgeProviderCalls: string;
  };
};

export type AuditEndpoint = {
  kind: "provider" | "judge";
  scope: "config" | "test";
  test?: string;
  providerType: AiciProvider["type"];
  model: string;
  apiKeyEnv: string;
  endpoint: string;
};

export type AuditDependency = {
  name: string;
  version: string;
  license: string;
  source: string;
  direct: boolean;
};

export type AuditSourceSummary = {
  repository: string;
  sourcePath: string;
  files: number;
  loc: number;
};

export type AuditEndpointViolation = {
  endpoint: string;
  kind: AuditEndpoint["kind"];
  scope: AuditEndpoint["scope"];
  test?: string;
  providerType: AiciProvider["type"];
  model: string;
};

type PackageJson = {
  name?: string;
  version?: string;
  license?: string;
  repository?: string | { url?: string };
  homepage?: string;
  dependencies?: Record<string, string>;
};

export async function createAuditReport(config: AiciConfig, configPath: string): Promise<AuditReport> {
  return {
    configPath,
    providerEndpoints: collectProviderEndpoints(config),
    judgeEndpoints: [],
    dependencies: await collectDependencies(),
    sourceSummary: await summarizeSource(),
    networkPolicy: {
      telemetry: false,
      aiciBackend: false,
      liveProviderCalls: "Live checks call only the configured model provider endpoints listed in providerEndpoints.",
      judgeProviderCalls: "No judge provider is configured in this version. Future LLM-as-judge calls must be listed in judgeEndpoints.",
    },
  };
}

export function renderAuditReport(report: AuditReport): string {
  const lines = [
    "Aici audit",
    "",
    `config: ${report.configPath}`,
    "",
    "Provider endpoints:",
  ];

  if (report.providerEndpoints.length === 0) {
    lines.push("  none (fixture-only config)");
  } else {
    for (const endpoint of report.providerEndpoints) {
      const scope = endpoint.scope === "test" ? `test:${endpoint.test}` : "config";
      lines.push(`  endpoint: ${endpoint.endpoint}`);
      lines.push(`    scope: ${scope}`);
      lines.push(`    provider: ${endpoint.providerType}`);
      lines.push(`    model: ${endpoint.model}`);
      lines.push(`    apiKeyEnv: ${endpoint.apiKeyEnv}`);
    }
  }

  lines.push("", "Judge endpoints:");
  lines.push("  none (LLM-as-judge is not configured)");

  lines.push("", "Dependencies:");
  if (report.dependencies.length === 0) {
    lines.push("  none");
  } else {
    for (const dependency of report.dependencies) {
      const direct = dependency.direct ? "direct" : "transitive";
      lines.push(`  ${dependency.name}@${dependency.version} (${dependency.license}, ${direct})`);
      lines.push(`    source: ${dependency.source}`);
    }
  }

  lines.push(
    "",
    "Network policy:",
    "  telemetry: false",
    "  aiciBackend: false",
    "  No telemetry. No remote Aici backend.",
    `  Source: ${report.sourceSummary.repository}/tree/main/${report.sourceSummary.sourcePath} - ${report.sourceSummary.files} runtime files, ${report.sourceSummary.loc} LOC.`,
  );

  return `${lines.join("\n")}\n`;
}

export function findDisallowedProviderEndpoints(
  report: AuditReport,
  allowedEndpoints: string[],
): AuditEndpointViolation[] {
  const allowed = new Set(allowedEndpoints.map(normalizeEndpoint));

  return report.providerEndpoints
    .filter((endpoint) => !allowed.has(normalizeEndpoint(endpoint.endpoint)))
    .map((endpoint) => ({
      endpoint: endpoint.endpoint,
      kind: endpoint.kind,
      scope: endpoint.scope,
      test: endpoint.test,
      providerType: endpoint.providerType,
      model: endpoint.model,
    }));
}

export function renderEndpointViolations(violations: AuditEndpointViolation[]): string {
  const lines = ["Aici audit failed: unapproved provider endpoints."];

  for (const violation of violations) {
    const scope = violation.scope === "test" ? `test:${violation.test}` : "config";
    lines.push(`  - ${violation.endpoint} (${scope}, ${violation.providerType}, ${violation.model})`);
  }

  return `${lines.join("\n")}\n`;
}

function collectProviderEndpoints(config: AiciConfig): AuditEndpoint[] {
  const endpoints: AuditEndpoint[] = [];

  if (config.provider) {
    endpoints.push(toAuditEndpoint(config.provider, "config"));
  }

  for (const test of config.tests) {
    if (test.provider) {
      endpoints.push(toAuditEndpoint(test.provider, "test", test.name));
    }
  }

  return endpoints;
}

function toAuditEndpoint(provider: AiciProvider, scope: "config" | "test", test?: string): AuditEndpoint {
  return {
    kind: "provider",
    scope,
    test,
    providerType: provider.type,
    model: provider.model,
    apiKeyEnv: getProviderApiKeyEnv(provider),
    endpoint: getProviderRequestUrl(provider),
  };
}

async function collectDependencies(): Promise<AuditDependency[]> {
  const root = getPackageRoot();
  const rootPackage = await readPackageJson(path.join(root, "package.json"));
  const directNames = Object.keys(rootPackage.dependencies ?? {});
  const seen = new Map<string, AuditDependency>();

  for (const name of directNames) {
    await collectDependency(root, name, true, seen);
  }

  return [...seen.values()].sort((left, right) => left.name.localeCompare(right.name));
}

async function collectDependency(
  root: string,
  name: string,
  direct: boolean,
  seen: Map<string, AuditDependency>,
): Promise<void> {
  const manifestPath = path.join(root, "node_modules", name, "package.json");

  let manifest: PackageJson;
  try {
    manifest = await readPackageJson(manifestPath);
  } catch {
    seen.set(name, {
      name,
      version: "not-installed",
      license: "unknown",
      source: "not-installed",
      direct,
    });
    return;
  }

  if (!seen.has(name)) {
    seen.set(name, {
      name,
      version: manifest.version ?? "unknown",
      license: manifest.license ?? "unknown",
      source: packageSource(manifest),
      direct,
    });
  } else if (direct) {
    const existing = seen.get(name);
    if (existing) {
      existing.direct = true;
    }
  }

  for (const child of Object.keys(manifest.dependencies ?? {})) {
    if (!seen.has(child)) {
      await collectDependency(root, child, false, seen);
    }
  }
}

async function summarizeSource(): Promise<AuditSourceSummary> {
  const root = getPackageRoot();
  const rootPackage = await readPackageJson(path.join(root, "package.json"));
  const repository = repositoryUrl(rootPackage);
  const srcDir = path.join(root, "src");
  const distDir = path.join(root, "dist");
  const sourceDir = await pathExists(srcDir) ? srcDir : distDir;
  const sourcePath = path.relative(root, sourceDir) || path.basename(sourceDir);
  const files = await listRuntimeFiles(sourceDir);
  const loc = await countLines(files);

  return {
    repository,
    sourcePath,
    files: files.length,
    loc,
  };
}

async function listRuntimeFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listRuntimeFiles(fullPath));
    } else if (/\.(ts|js)$/u.test(entry.name) && !/\.test\.(ts|js)$/u.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

async function countLines(files: string[]): Promise<number> {
  let total = 0;

  for (const file of files) {
    const contents = await readFile(file, "utf8");
    total += contents.split(/\r?\n/u).length - (contents.endsWith("\n") ? 1 : 0);
  }

  return total;
}

async function readPackageJson(filePath: string): Promise<PackageJson> {
  return JSON.parse(await readFile(filePath, "utf8")) as PackageJson;
}

function packageSource(manifest: PackageJson): string {
  if (manifest.repository) {
    if (typeof manifest.repository === "string") {
      return normalizeRepositoryUrl(manifest.repository);
    }

    if (manifest.repository.url) {
      return normalizeRepositoryUrl(manifest.repository.url);
    }
  }

  return manifest.homepage ?? "unknown";
}

function repositoryUrl(manifest: PackageJson): string {
  if (manifest.repository) {
    if (typeof manifest.repository === "string") {
      return normalizeRepositoryUrl(manifest.repository);
    }

    if (manifest.repository.url) {
      return normalizeRepositoryUrl(manifest.repository.url);
    }
  }

  return manifest.homepage ?? "unknown";
}

function normalizeRepositoryUrl(value: string): string {
  if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(value)) {
    return `https://github.com/${value}`;
  }

  return value
    .replace(/^git\+/u, "")
    .replace(/^git:/u, "https:")
    .replace(/^github:/u, "https://github.com/")
    .replace(/\.git$/u, "");
}

function normalizeEndpoint(value: string): string {
  return value.replace(/\/+$/u, "");
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

function getPackageRoot(): string {
  return path.dirname(path.dirname(fileURLToPath(import.meta.url)));
}
