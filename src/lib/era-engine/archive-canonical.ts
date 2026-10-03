import {
  canonicalJson,
  sha256CanonicalDigest,
} from "@/lib/evidence/canonical-json";

export function canonicalSnapshotJson(value: unknown) {
  return canonicalJson(value);
}

export function snapshotDigest(value: unknown) {
  return sha256CanonicalDigest(value);
}
