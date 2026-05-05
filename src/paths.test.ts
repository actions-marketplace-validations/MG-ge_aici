import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { resolveConfigFile } from "./paths.js";

test("resolves files inside the config directory", () => {
  const rootDir = path.resolve("examples/basic");
  const resolved = resolveConfigFile(rootDir, "schema.json", "schema");

  assert.equal(resolved, path.join(rootDir, "schema.json"));
});

test("rejects parent-directory escapes from config files", () => {
  const rootDir = path.resolve("examples/basic");

  assert.throws(
    () => resolveConfigFile(rootDir, "../../package.json", "fixture"),
    /inside the config directory/u,
  );
});

test("rejects absolute paths outside the config directory", () => {
  const rootDir = path.resolve("examples/basic");

  assert.throws(
    () => resolveConfigFile(rootDir, "/etc/passwd", "fixture"),
    /inside the config directory/u,
  );
});
