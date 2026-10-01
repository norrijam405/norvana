import { pathToFileURL } from "node:url";

export const OBSERVE_PROOF_BASE_URL =
  "https://norvana-k2f4sadfk-norrijam405-2107s-projects.vercel.app";

const NORVANA_PREVIEW_HOST =
  /^norvana-[a-z0-9]+-norrijam405-2107s-projects\.vercel\.app$/;

export function requirePinnedObserveProofBaseUrl(
  value = OBSERVE_PROOF_BASE_URL
) {
  if (value === "__NORVANA_CONTROLLED_PREVIEW_NOT_PINNED__") {
    throw new Error(
      "Observe-proof destination is not pinned to an exact controlled Preview."
    );
  }

  let url;
  try {
    url = new URL(String(value));
  } catch {
    throw new Error("Observe-proof destination is not a valid URL.");
  }

  if (url.protocol !== "https:") {
    throw new Error("Observe-proof destination must use HTTPS.");
  }

  if (url.username || url.password) {
    throw new Error("Observe-proof destination must not contain URL credentials.");
  }

  if (url.port && url.port !== "443") {
    throw new Error("Observe-proof destination must not use a custom port.");
  }

  if (!NORVANA_PREVIEW_HOST.test(url.hostname.toLowerCase())) {
    throw new Error(
      "Observe-proof destination is not an approved Norvana controlled Preview host."
    );
  }

  if (
    (url.pathname && url.pathname !== "/") ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "Observe-proof destination must be an origin-only URL with no path, query, or fragment."
    );
  }

  return url.origin;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const origin = requirePinnedObserveProofBaseUrl();
    process.stdout.write(origin + "\n");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}
