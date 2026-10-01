import { pathToFileURL } from "node:url";

export const WATCHTOWER_R1_MANUAL_CONFIRMATION =
  "RUN_LOCAL_PRODUCER_R1";

export function requireWatchtowerR1Trigger({
  eventName,
  confirmation,
}) {
  if (eventName === "schedule") return "schedule";

  if (
    eventName === "workflow_dispatch" &&
    String(confirmation || "") === WATCHTOWER_R1_MANUAL_CONFIRMATION
  ) {
    return "workflow_dispatch";
  }

  throw new Error(
    "Watchtower R1 requires the daily schedule or exact controlled manual confirmation."
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const mode = requireWatchtowerR1Trigger({
      eventName: process.env.GITHUB_EVENT_NAME || "",
      confirmation:
        process.env.NORVANA_WATCHTOWER_R1_CONFIRMATION || "",
    });
    process.stdout.write(mode + "\n");
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
