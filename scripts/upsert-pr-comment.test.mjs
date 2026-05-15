import assert from "node:assert/strict";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  buildCommentBody,
  findExistingBotComment,
  ghClient,
  upsertPullRequestComment,
} from "./upsert-pr-comment.mjs";

test("builds a sticky PR comment body", () => {
  assert.equal(buildCommentBody("# Aici\n\nPASS"), "<!-- aici-report -->\n\n# Aici\n\nPASS");
});

test("finds only bot comments with the Aici marker", () => {
  const comments = [
    { id: 1, body: "<!-- aici-report -->\nold", user: { type: "User" } },
    { id: 2, body: "human note", user: { type: "Bot" } },
    { id: 3, body: "<!-- aici-report -->\nold", user: { type: "Bot" } },
  ];

  assert.equal(findExistingBotComment(comments)?.id, 3);
});

test("updates an existing sticky PR comment", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "aici-comment-"));
  const reportFile = path.join(directory, "aici-report.md");
  await writeFile(reportFile, "# Aici\n\nFAIL");
  const calls = [];

  try {
    const result = await upsertPullRequestComment({
      repository: "MG-ge/aici",
      pullRequestNumber: "42",
      reportFile,
      gh: {
        async listComments(repository, pullRequestNumber) {
          calls.push(["list", repository, pullRequestNumber]);
          return [{ id: 99, body: "<!-- aici-report -->\nold", user: { type: "Bot" } }];
        },
        async updateComment(repository, commentId, body) {
          calls.push(["update", repository, commentId, body]);
        },
        async createComment() {
          calls.push(["create"]);
        },
      },
    });

    assert.deepEqual(result, { action: "updated", commentId: 99 });
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0], ["list", "MG-ge/aici", "42"]);
    assert.equal(calls[1][0], "update");
    assert.equal(calls[1][2], 99);
    assert.match(String(calls[1][3]), /# Aici\n\nFAIL/u);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("creates a sticky PR comment when one does not exist", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "aici-comment-"));
  const reportFile = path.join(directory, "aici-report.md");
  await writeFile(reportFile, "# Aici\n\nPASS");
  const calls = [];

  try {
    const result = await upsertPullRequestComment({
      repository: "MG-ge/aici",
      pullRequestNumber: "42",
      reportFile,
      gh: {
        async listComments(repository, pullRequestNumber) {
          calls.push(["list", repository, pullRequestNumber]);
          return [];
        },
        async updateComment() {
          calls.push(["update"]);
        },
        async createComment(repository, pullRequestNumber, body) {
          calls.push(["create", repository, pullRequestNumber, body]);
          return { id: 101 };
        },
      },
    });

    assert.deepEqual(result, { action: "created", commentId: 101 });
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0], ["list", "MG-ge/aici", "42"]);
    assert.equal(calls[1][0], "create");
    assert.equal(calls[1][2], "42");
    assert.match(String(calls[1][3]), /# Aici\n\nPASS/u);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("skips when the report file does not exist", async () => {
  const result = await upsertPullRequestComment({
    repository: "MG-ge/aici",
    pullRequestNumber: "42",
    reportFile: path.join(tmpdir(), "aici-missing-report.md"),
    gh: {
      async listComments() {
        throw new Error("listComments should not be called");
      },
      async updateComment() {
        throw new Error("updateComment should not be called");
      },
      async createComment() {
        throw new Error("createComment should not be called");
      },
    },
  });

  assert.deepEqual(result, { action: "skipped", reason: "report-not-found" });
});

test("uses gh api to update an existing PR comment", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "aici-gh-client-"));
  const fakeGh = path.join(directory, "gh");
  const callsFile = path.join(directory, "calls.ndjson");

  await writeFile(fakeGh, `#!/usr/bin/env node
import { appendFileSync } from "node:fs";

const args = process.argv.slice(2);
appendFileSync(${JSON.stringify(callsFile)}, JSON.stringify(args) + "\\n");

if (args[0] !== "api") {
  process.exit(2);
}

if (args.includes("PATCH")) {
  process.stdout.write("{}");
} else {
  process.stdout.write(JSON.stringify([
    { id: 77, body: "<!-- aici-report -->\\nold", user: { type: "Bot" } }
  ]));
}
`);
  await chmod(fakeGh, 0o755);

  try {
    const gh = ghClient(fakeGh);
    const comments = await gh.listComments("MG-ge/aici", "42");
    const existing = findExistingBotComment(comments);

    await gh.updateComment("MG-ge/aici", existing.id, "<!-- aici-report -->\n\n# Aici\n\nFAIL");

    const calls = (await readFile(callsFile, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));

    assert.deepEqual(calls[0], [
      "api",
      "repos/MG-ge/aici/issues/42/comments",
      "--paginate",
    ]);
    assert.deepEqual(calls[1].slice(0, 5), [
      "api",
      "--method",
      "PATCH",
      "repos/MG-ge/aici/issues/comments/77",
      "--field",
    ]);
    assert.match(calls[1][5], /^body=<!-- aici-report -->\n\n# Aici\n\nFAIL$/u);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
