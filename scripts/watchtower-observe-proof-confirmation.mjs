import { pathToFileURL } from "node:url";

export const REQUIRED_OBSERVE_PROOF_CONFIRMATION =
  "RUN_LOCAL_PRODUCER_OBSERVE_PROOF";

export function requireObserveProofConfirmation(value) {
  if (String(value || "") !== REQUIRED_OBSERVE_PROOF_CONFIRMATION) {
    throw new Error("Observe-proof confirmation does not match the exact required value.");
  }

  return REQUIRED_OBSERVE_PROOF_CONFIRMATION;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    requireObserveProofConfirmation(
      process.env.NORVANA_WATCHTOWER_OBSERVE_PROOF_CONFIRMATION
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
