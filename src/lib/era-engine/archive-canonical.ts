import {
  canonicalJson,
  sha256CanonicalDigest,
} from "../evidence/canonical-json.ts";

export function canonicalSnapshotJson(value: unknown) {
  return canonicalJson(value);
}

export function snapshotDigest(value: unknown) {
  return sha256CanonicalDigest(value);
}
