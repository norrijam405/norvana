/**
 * Fail-closed CJ replay-admission contract, until durable DB uniqueness exists.
 * An HTTP Idempotency-Key cannot be honored using only in-process state or a
 * pre-insert SELECT (which races across Vercel instances).
 * Do not misrepresent successful receipt readback as request deduplication.
 */
export type CjRetryDecision =
  | { permit: false; httpStatus: 409; code: "CJ_IDEMPOTENCY_NOT_CONFIGURED"; retrySafe: false }
  | { permit: true; code: "CJ_OBSERVATION_WITHOUT_REPLAY_GUARANTEE"; retrySafe: false };
export function decideCjRetryAdmission(idempotencyKey: string | null): CjRetryDecision {
  // Even an empty supplied header declares a request-identity intent.
  if (idempotencyKey !== null) {
    return { permit: false, httpStatus: 409, code: "CJ_IDEMPOTENCY_NOT_CONFIGURED", retrySafe: false };
  }
  return { permit: true, code: "CJ_OBSERVATION_WITHOUT_REPLAY_GUARANTEE", retrySafe: false };
}
export const CJ_REPLAY_CAPABILITY = Object.freeze({
  schemaVersion: "acre-era-cj-replay-gate-v0",
  persistedRequestIdentity: false,
  atomicUniqueness: false,
  replayResultReadback: false,
  automaticRetryAllowed: false,
  requestKeyHeader: "Idempotency-Key",
  activationRequires: [
    "SCOPED_ADMIN_IDENTITY",
    "ATOMIC_UNIQUE_REQUEST_KEY",
    "REQUEST_PAYLOAD_FINGERPRINT",
    "COMPLETED_RECEIPT_AND_RESPONSE_READBACK",
    "CONCURRENT_REPLAY_TESTS",
  ] as const,
});
