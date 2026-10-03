import assert from "node:assert/strict";

const challengedCandidate = "4e3e411594c7b02b5918364abeeac91b6350f49c";
const findingId = "AE-LRP-R0-FC-01";

const now = new Date("2026-10-03T19:35:00.000Z");
const era = {
  lifecycleState: "ACTIVE",
  visibility: "PUBLIC",
  isPrimary: true,
  startAt: new Date("2026-10-03T19:36:00.000Z"),
  endAt: null,
};

// Exact semantic predicate used by the frozen proof's raw SQL current check:
// WHERE lifecycle_state='ACTIVE' AND visibility='PUBLIC' AND is_primary=true
const frozenProofRawSqlPredicate =
  era.lifecycleState === "ACTIVE" &&
  era.visibility === "PUBLIC" &&
  era.isPrimary === true;

// Equivalent schedule gate enforced by production isPublicEra(), which is
// called by resolveCurrentPublicEra() through resolvePublicEraBySlug().
function productionIsPublicEra(input, at) {
  if (input.visibility !== "PUBLIC") return false;
  if (!["ACTIVE", "CLOSED", "ARCHIVED"].includes(input.lifecycleState)) return false;

  if (input.lifecycleState === "ACTIVE") {
    if (input.startAt && at < input.startAt) return false;
    if (input.endAt && at >= input.endAt) return false;
  }

  return true;
}

const productionResolverWouldAccept =
  frozenProofRawSqlPredicate && productionIsPublicEra(era, now);

assert.equal(
  frozenProofRawSqlPredicate,
  true,
  "frozen proof predicate should accept the adversarial Era"
);
assert.equal(
  productionResolverWouldAccept,
  false,
  "production resolver should reject an ACTIVE Era before startAt"
);

console.log(JSON.stringify({
  findingId,
  challengedCandidate,
  status: "REPRODUCED",
  scenario: "ACTIVE/PUBLIC/primary Era whose startAt is still in the future",
  frozenProofRawSqlPredicate,
  productionResolverWouldAccept,
  consequence:
    "The proof harness can report currentEraResolved PASS without exercising production resolver semantics."
}, null, 2));
