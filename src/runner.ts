import { runTest } from "./checks.js";
import { collectRedactionValues, redactTestResult, redactText } from "./redaction.js";
import type { AiciConfig, RunResult, TestResult } from "./types.js";

export async function runConfig(config: AiciConfig, rootDir: string): Promise<RunResult> {
  const results: TestResult[] = [];
  const redactions = collectRedactionValues(config);

  for (const test of config.tests) {
    try {
      results.push(redactTestResult(await runTest(test, rootDir, config.provider), redactions));
    } catch (error) {
      results.push({
        name: test.name,
        passed: false,
        output: "",
        checks: [
          {
            name: "execution",
            passed: false,
            message: redactText(error instanceof Error ? error.message : String(error), redactions),
          },
        ],
      });
    }
  }

  return {
    passed: results.every((result) => result.passed),
    results,
  };
}
