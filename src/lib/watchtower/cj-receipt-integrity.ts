/**
 * Read-only CJ observation-receipt consistency check.
 * A matching database row is NOT a signature, actor authorization, independent
 * source verification, or proof that an external CJ quote is correct.
 * This checker merely refuses to acknowledge inconsistent persisted data.
 */
export type CjReceiptIntegrityInput = {
  id: number;
  subjectId: string;
  actionType: string;
  status: string;
  details: unknown;
};
type CjReceiptPayload = Record<string, unknown>;
const obj = (input: unknown): Record<string, unknown> | null =>
  input !== null && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : null;
const ordered = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "undefined";
  if (Array.isArray(value)) return `[${value.map(ordered).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${JSON.stringify(k)}:${ordered(v)}`).join(",")}}`;
};
export function verifyCjReceiptReadback(
  stored: CjReceiptIntegrityInput | null | undefined,
  expectedId: number,
  payload: CjReceiptPayload
): { ok: boolean; code: "READBACK_MATCHED_NOT_INDEPENDENTLY_VERIFIED" | "RECEIPT_READBACK_MISMATCH" } {
  const reject = { ok: false as const, code: "RECEIPT_READBACK_MISMATCH" as const };
  if (!stored || !Number.isSafeInteger(expectedId) || expectedId <= 0 || stored.id !== expectedId) return reject;
  const details = obj(stored.details);
  if (!details || stored.actionType !== "CJ_VARIANT_QUALIFICATION" ||
      stored.subjectId !== String(payload.sku || "unknown") ||
      stored.status !== String(payload.state || "UNKNOWN").slice(0,30) ||
      details.schemaVersion !== "acre-era-cj-check-v1") return reject;
  const fields = ["sku","variant","stock","productCost","shippingCost","baseLandedCost","transitDays","reason"];
  for (const field of fields) {
    const expected = field === "reason" ? (payload.reason || payload.error || null) :
      field === "sku" || field === "variant" ? (payload[field] || null) :
      payload[field] ?? null;
    if (ordered(details[field] ?? null) !== ordered(expected)) return reject;
  }
  if (details.approved !== false || details.published !== false || details.ordered !== false) return reject;
  return { ok: true, code: "READBACK_MATCHED_NOT_INDEPENDENTLY_VERIFIED" };
}
