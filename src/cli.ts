#!/usr/bin/env node
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
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
  const targetDir = path.dirname(path.resolve(target));
  const outputFile = path.join(targetDir, "aici-example.output.json");
  const schemaFile = path.join(targetDir, "aici-example.schema.json");
  const writeFlag = options.force ? "w" : "wx";
  const sample = `version: 1
tests:
  - name: support-response-schema
    mockOutputFile: aici-example.output.json
    expect:
      json: true
      jsonSchema: aici-example.schema.json
      contains:
        - approved
`;

  if (!options.force) {
    await assertDoesNotExist(target);
    await assertDoesNotExist(outputFile);
    await assertDoesNotExist(schemaFile);
  }

  await mkdir(targetDir, { recursive: true });
  await writeFile(target, sample, { flag: writeFlag });
  await writeFile(outputFile, `${JSON.stringify({
    decision: "approved",
    reason: "The response follows the contract.",
  }, null, 2)}\n`, { flag: writeFlag });
  await writeFile(schemaFile, `${JSON.stringify({
    type: "object",
    required: ["decision", "reason"],
    additionalProperties: false,
    properties: {
      decision: {
        enum: ["approved", "rejected"],
      },
      reason: {
        type: "string",
        minLength: 1,
      },
    },
  }, null, 2)}\n`, { flag: writeFlag });
  console.log(`Created ${target}`);
  console.log(`Created ${path.relative(process.cwd(), outputFile) || outputFile}`);
  console.log(`Created ${path.relative(process.cwd(), schemaFile) || schemaFile}`);
  console.log(`Run: aici run --config ${target}`);
}

async function assertDoesNotExist(target: string): Promise<void> {
  try {
    await access(target);
  } catch {
    return;
  }

  throw new Error(`${target} already exists. Use --force to overwrite.`);
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
