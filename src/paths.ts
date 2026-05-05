import path from "node:path";

export function resolveConfigFile(rootDir: string, filePath: string, label: string): string {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedPath = path.resolve(resolvedRoot, filePath);
  const relative = path.relative(resolvedRoot, resolvedPath);

  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    return resolvedPath;
  }

  throw new Error(`${label} must stay inside the config directory.`);
}
