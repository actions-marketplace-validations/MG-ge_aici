#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import {
  assertAllowedProviderEndpoints,
  createAuditReport,
  findDisallowedProviderEndpoints,
  renderAuditReport,
  renderEndpointViolations,
} from "./audit.js";
import { loadConfig } from "./config.js";
import { writeReports } from "./report.js";
import { runConfig } from "./runner.js";
import { AICI_CONFIG_SCHEMA } from "./schema.js";
import type { TestResult } from "./types.js";

type CliOptions = {
  config?: string;
  reportDir?: string;
  force?: boolean;
  json?: boolean;
  allowProviderEndpoint?: string[];
};

async function main(): Promise<void> {
  const [command = "help", ...args] = process.argv.slice(2);
  const options = parseOptions(args);

  if (command === "init") {
    await initConfig(options);
    return;
  }

  if (command === "validate") {
    const loaded = await loadConfig(options.config);
    console.log(`Valid config: ${loaded.configPath}`);
    return;
  }

  if (command === "audit") {
    const loaded = await loadConfig(options.config);
    const report = await createAuditReport(loaded.config, loaded.configPath);
    console.log(options.json ? JSON.stringify(report, null, 2) : renderAuditReport(report));

    if (options.allowProviderEndpoint && options.allowProviderEndpoint.length > 0) {
      const violations = findDisallowedProviderEndpoints(report, options.allowProviderEndpoint);
      if (violations.length > 0) {
        console.error(renderEndpointViolations(violations));
        process.exitCode = 1;
      }
    }

    return;
  }

  if (command === "schema") {
    console.log(JSON.stringify(AICI_CONFIG_SCHEMA, null, 2));
    return;
  }

  if (command === "run") {
    const loaded = await loadConfig(options.config);
    if (options.allowProviderEndpoint && options.allowProviderEndpoint.length > 0) {
      const report = await createAuditReport(loaded.config, loaded.configPath);
      assertAllowedProviderEndpoints(report, options.allowProviderEndpoint);
    }

    const result = await runConfig(loaded.config, loaded.rootDir);
    await writeReports(result, options.reportDir);
    printSummary(result.passed, result.results, options.reportDir ?? ".aici");
    process.exitCode = result.passed ? 0 : 1;
    return;
  }

  printHelp();
  process.exitCode = command === "help" || command === "--help" || command === "-h" ? 0 : 1;
}

function parseOptions(args: string[]): CliOptions {
  const options: CliOptions = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === "--config" && next) {
      options.config = next;
      index += 1;
    } else if (arg === "--report-dir" && next) {
      options.reportDir = next;
      index += 1;
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--allow-provider-endpoint" && next) {
      options.allowProviderEndpoint ??= [];
      options.allowProviderEndpoint.push(next);
      index += 1;
    }
  }

  return options;
}

async function initConfig(options: CliOptions): Promise<void> {
  const target = options.config ?? "aici.yml";
  const sample = `$schema: ./schemas/aici.schema.json
version: 1
provider:
  type: openai
  model: gpt-5.4-mini
  apiKeyEnv: OPENAI_API_KEY
tests:
  - name: example-json-output
    mockOutputFile: examples/basic/output.json
    expect:
      jsonSchema: examples/basic/schema.json
      contains:
        - approved
      maxLatencyMs: 1000
`;

  await writeFile(target, sample, { flag: options.force ? "w" : "wx" });
  console.log(`Created ${target}`);
}

function printSummary(passed: boolean, results: TestResult[], reportDir: string): void {
  const count = results.length;
  console.log(`${passed ? "PASS" : "FAIL"} ${count} test${count === 1 ? "" : "s"}`);

  for (const result of results.filter((item) => !item.passed)) {
    console.log(`\n${result.name}`);

    for (const check of result.checks.filter((item) => !item.passed)) {
      console.log(`  - ${check.name}: ${check.message}`);
    }
  }

  console.log(`Reports written to ${reportDir}/`);
}

function printHelp(): void {
  console.log(`aici

Commands:
  aici init [--config aici.yml] [--force]
  aici validate [--config aici.yml]
  aici audit [--config aici.yml] [--json] [--allow-provider-endpoint URL]
  aici schema
  aici run [--config aici.yml] [--report-dir .aici] [--allow-provider-endpoint URL]
`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
