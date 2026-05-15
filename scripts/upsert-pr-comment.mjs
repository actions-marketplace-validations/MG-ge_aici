#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { execFile as execFileCallback } from "node:child_process";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
export const DEFAULT_MARKER = "<!-- aici-report -->";

export async function upsertPullRequestComment({
  repository,
  pullRequestNumber,
  reportFile,
  marker = DEFAULT_MARKER,
  gh = ghClient(),
}) {
  if (!repository) {
    throw new Error("AICI_REPOSITORY is required.");
  }

  if (!pullRequestNumber) {
    throw new Error("AICI_PULL_REQUEST_NUMBER is required.");
  }

  const report = await readReportIfPresent(reportFile);
  if (report === undefined) {
    return { action: "skipped", reason: "report-not-found" };
  }

  const body = buildCommentBody(report, marker);
  const comments = await gh.listComments(repository, pullRequestNumber);
  const existing = findExistingBotComment(comments, marker);

  if (existing) {
    await gh.updateComment(repository, existing.id, body);
    return { action: "updated", commentId: existing.id };
  }

  const created = await gh.createComment(repository, pullRequestNumber, body);
  return { action: "created", commentId: created.id };
}

async function readReportIfPresent(reportFile) {
  try {
    return await readFile(reportFile, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return undefined;
    }

    throw error;
  }
}

export function buildCommentBody(report, marker = DEFAULT_MARKER) {
  return `${marker}\n\n${report}`;
}

export function findExistingBotComment(comments, marker = DEFAULT_MARKER) {
  return comments.find((comment) => (
    comment
    && comment.user
    && comment.user.type === "Bot"
    && typeof comment.body === "string"
    && comment.body.includes(marker)
    && (typeof comment.id === "number" || typeof comment.id === "string")
  ));
}

export function ghClient(ghBin = "gh") {
  return {
    async listComments(repository, pullRequestNumber) {
      const { stdout } = await execFile(ghBin, [
        "api",
        `repos/${repository}/issues/${pullRequestNumber}/comments`,
        "--paginate",
      ], {
        maxBuffer: 10 * 1024 * 1024,
      });

      const parsed = JSON.parse(stdout);
      if (!Array.isArray(parsed)) {
        throw new Error("GitHub comments response must be an array.");
      }

      return parsed;
    },

    async updateComment(repository, commentId, body) {
      await execFile(ghBin, [
        "api",
        "--method",
        "PATCH",
        `repos/${repository}/issues/comments/${commentId}`,
        "--field",
        `body=${body}`,
      ], {
        maxBuffer: 10 * 1024 * 1024,
      });
      return { id: commentId };
    },

    async createComment(repository, pullRequestNumber, body) {
      const { stdout } = await execFile(ghBin, [
        "api",
        "--method",
        "POST",
        `repos/${repository}/issues/${pullRequestNumber}/comments`,
        "--field",
        `body=${body}`,
      ], {
        maxBuffer: 10 * 1024 * 1024,
      });

      return JSON.parse(stdout);
    },
  };
}

async function main() {
  const reportDir = process.env.AICI_REPORT_DIR ?? ".aici";
  const result = await upsertPullRequestComment({
    repository: process.env.AICI_REPOSITORY,
    pullRequestNumber: process.env.AICI_PULL_REQUEST_NUMBER,
    reportFile: `${reportDir}/aici-report.md`,
  });

  if (result.action === "skipped") {
    console.log("Report not found; skipping PR comment.");
    return;
  }

  console.log(`Aici PR comment ${result.action}${result.commentId ? `: ${result.commentId}` : ""}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
