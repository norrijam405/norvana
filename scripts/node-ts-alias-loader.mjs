import { statSync } from "node:fs";
import { dirname, extname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = process.cwd();

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function candidateUrl(basePath) {
  const candidates = extname(basePath)
    ? [basePath]
    : [basePath + ".ts", basePath + ".tsx", resolvePath(basePath, "index.ts")];
  for (const candidate of candidates) {
    if (isFile(candidate)) return pathToFileURL(candidate).href;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const mapped = candidateUrl(resolvePath(root, "src", specifier.slice(2)));
    if (mapped) return { url: mapped, shortCircuit: true };
  }

  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    context.parentURL?.startsWith("file:") &&
    !extname(specifier)
  ) {
    const parentDir = dirname(fileURLToPath(context.parentURL));
    const mapped = candidateUrl(resolvePath(parentDir, specifier));
    if (mapped) return { url: mapped, shortCircuit: true };
  }

  return nextResolve(specifier, context);
}
