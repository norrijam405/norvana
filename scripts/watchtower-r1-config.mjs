import { pathToFileURL } from "node:url";

export const WATCHTOWER_R1_ENABLED = false;

export function requireWatchtowerR1Enabled(
  enabled = WATCHTOWER_R1_ENABLED
) {
  if (enabled !== true) {
    throw new Error(
      "Watchtower R1 recurring Local Producer observe is source-disabled."
    );
  }

  return true;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    requireWatchtowerR1Enabled();
    process.stdout.write("WATCHTOWER_R1_ENABLED\n");
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
