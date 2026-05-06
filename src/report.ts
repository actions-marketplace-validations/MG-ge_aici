import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RunResult, ToolCall } from "./types.js";

export async function writeReports(result: RunResult, reportDir = ".aici"): Promise<void> {
  const resolvedDir = path.resolve(reportDir);
  await mkdir(resolvedDir, { recursive: true });
  await writeFile(path.join(resolvedDir, "aici-report.json"), `${JSON.stringify(result, null, 2)}\n`);
  await writeFile(path.join(resolvedDir, "aici-report.md"), renderMarkdown(result));
  await writeFile(path.join(resolvedDir, "aici-report.html"), renderHtml(result));
}

export function renderMarkdown(result: RunResult): string {
  const status = result.passed ? "PASS" : "FAIL";
  const categories = summarizeCategories(result);
  const lines = [
    `# Aici: ${status}`,
    "",
    `Tests: ${result.results.filter((item) => item.passed).length}/${result.results.length} passed`,
    "",
    "| Category | Passed | Total |",
    "|---|---:|---:|",
    ...categories.map((category) => `| ${category.name} | ${category.passed} | ${category.total} |`),
    "",
    "| Test | Status | Model | Tool Calls | Latency | Cost | Failed Checks |",
    "|---|---:|---|---|---:|---:|---|",
  ];

  for (const test of result.results) {
    const failed = test.checks.filter((check) => !check.passed);
    lines.push(
      `| ${escapeTable(test.name)} | ${test.passed ? "PASS" : "FAIL"} | ${escapeTable(test.model ?? "-")} | ${escapeTable(renderToolCalls(test.toolCalls))} | ${test.latencyMs ?? "-"}ms | ${
        test.costUsd === undefined ? "-" : `$${test.costUsd.toFixed(6)}`
      } | ${escapeTable(
        failed.map((check) => `${check.name}: ${check.message}`).join("; ") || "-",
      )} |`,
    );
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

export function renderHtml(result: RunResult): string {
  const passedCount = result.results.filter((item) => item.passed).length;
  const status = result.passed ? "PASS" : "FAIL";
  const categoryCards = summarizeCategories(result).map((category) => `<article class="metric">
      <span>${escapeHtml(category.name)}</span>
      <strong>${category.passed}/${category.total}</strong>
    </article>`).join("\n");
  const rows = result.results.map((test) => {
    const failed = test.checks.filter((check) => !check.passed);
    return `<tr>
      <td>
        <strong>${escapeHtml(test.name)}</strong>
        <span>${escapeHtml(test.provider ?? "fixture")}${test.model ? ` / ${escapeHtml(test.model)}` : ""}</span>
      </td>
      <td><span class="pill ${test.passed ? "pass" : "fail"}">${test.passed ? "PASS" : "FAIL"}</span></td>
      <td>${escapeHtml(renderToolCalls(test.toolCalls))}</td>
      <td>${test.latencyMs ?? "-"}ms</td>
      <td>${test.costUsd === undefined ? "-" : `$${test.costUsd.toFixed(6)}`}</td>
      <td>${escapeHtml(failed.map((check) => `${check.name}: ${check.message}`).join("; ") || "-")}</td>
    </tr>`;
  }).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" href="data:,">
  <title>Aici: ${status}</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #10151f;
      --muted: #637083;
      --paper: #f7f3ea;
      --panel: #fffaf0;
      --line: #ded5c5;
      --pass: #0f7a55;
      --fail: #b42318;
      --accent: #1f4e79;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, rgba(31, 78, 121, 0.16), transparent 32rem),
        linear-gradient(135deg, #f7f3ea 0%, #ede4d3 100%);
      font: 15px/1.5 ui-sans-serif, "Avenir Next", "Segoe UI", sans-serif;
    }
    main { max-width: 1120px; margin: 0 auto; padding: 56px 24px; }
    header {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      align-items: flex-start;
      margin-bottom: 28px;
    }
    h1 { margin: 0 0 8px; font-size: clamp(34px, 5vw, 64px); letter-spacing: -0.05em; line-height: 0.95; }
    .lede { max-width: 660px; color: var(--muted); font-size: 18px; margin: 0; }
    .card {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 26px;
      box-shadow: 0 24px 80px rgba(56, 43, 24, 0.12);
      overflow: hidden;
    }
    .score {
      min-width: 190px;
      padding: 22px;
      text-align: right;
    }
    .score strong { display: block; font-size: 42px; line-height: 1; }
    .score span { color: var(--muted); }
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }
    .metric {
      padding: 16px 18px;
      background: rgba(255, 250, 240, 0.72);
      border: 1px solid var(--line);
      border-radius: 20px;
    }
    .metric span { display: block; color: var(--muted); font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; }
    .metric strong { display: block; margin-top: 4px; font-size: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 16px 18px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
    th { color: var(--muted); font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; }
    td span { display: block; color: var(--muted); font-size: 13px; }
    tr:last-child td { border-bottom: 0; }
    .pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 64px;
      border-radius: 999px;
      padding: 4px 10px;
      color: white;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.06em;
    }
    .pill.pass { background: var(--pass); }
    .pill.fail { background: var(--fail); }
    footer { color: var(--muted); margin-top: 18px; font-size: 13px; }
    @media (max-width: 760px) {
      header { display: block; }
      .score { margin-top: 18px; text-align: left; }
      table { display: block; overflow-x: auto; white-space: nowrap; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>Aici</h1>
        <p class="lede">Regression report for prompt behavior, structured output, tool calls, latency, and known cost.</p>
      </div>
      <section class="card score">
        <strong>${status}</strong>
        <span>${passedCount}/${result.results.length} tests passed</span>
      </section>
    </header>
    <section class="metrics">
${categoryCards}
    </section>
    <section class="card">
      <table>
        <thead>
          <tr>
            <th>Test</th>
            <th>Status</th>
            <th>Tool Calls</th>
            <th>Latency</th>
            <th>Cost</th>
            <th>Failed Checks</th>
          </tr>
        </thead>
        <tbody>
${rows}
        </tbody>
      </table>
    </section>
    <footer>Generated by Aici. Keep this artifact with CI logs for release evidence.</footer>
  </main>
</body>
</html>
`;
}

type CategorySummary = {
  name: string;
  passed: number;
  total: number;
};

function summarizeCategories(result: RunResult): CategorySummary[] {
  const categories = new Map<string, CategorySummary>();

  for (const test of result.results) {
    for (const check of test.checks) {
      const name = categorizeCheck(check.name);
      const category = categories.get(name) ?? { name, passed: 0, total: 0 };
      category.total += 1;
      category.passed += check.passed ? 1 : 0;
      categories.set(name, category);
    }
  }

  return [...categories.values()];
}

function categorizeCheck(name: string): string {
  if (name === "execution") {
    return "Execution";
  }

  if (name.startsWith("toolCall")) {
    return "Tool Calls";
  }

  if (name === "maxLatencyMs") {
    return "Latency";
  }

  if (name === "maxCostUsd") {
    return "Cost";
  }

  if (name === "noExpectations") {
    return "Config";
  }

  return "Output";
}

function renderToolCalls(toolCalls: ToolCall[] = []): string {
  if (toolCalls.length === 0) {
    return "-";
  }

  return toolCalls.map((toolCall) => toolCall.name).join(", ");
}

function escapeTable(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}
