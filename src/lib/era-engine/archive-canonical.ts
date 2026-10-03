import { createHash } from "node:crypto";

function stable(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, stable(nested)])
    );
  }
  return value;
}

export function canonicalSnapshotJson(value: unknown) {
  return JSON.stringify(stable(value));
}

export function snapshotDigest(value: unknown) {
  return createHash("sha256").update(canonicalSnapshotJson(value)).digest("hex");
}
