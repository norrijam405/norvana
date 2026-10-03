import { existsSync } from "node:fs";
import { runMerchizeCatalogReadOnlyProbe } from "../src/lib/supplier-gateway/merchize/live-client.ts";

const marker = "MERCHIZE_LIVE_PROBE_BUILD_ONCE";
const requiredBranch = "feature/2026-10-02-norvana-supplier-expansion-r0";

if (!existsSync(marker)) {
  console.log("MERCHIZE_BUILD_PROBE=SKIP_NO_MARKER");
  process.exit(0);
}

if (process.env.VERCEL_ENV !== "preview") {
  console.log("MERCHIZE_BUILD_PROBE=SKIP_NOT_PREVIEW");
  process.exit(0);
}

if (process.env.VERCEL_GIT_COMMIT_REF !== requiredBranch) {
  console.log("MERCHIZE_BUILD_PROBE=SKIP_WRONG_BRANCH");
  process.exit(0);
}

if (process.env.NORVANA_EXTERNAL_FULFILLMENT_ENABLED === "true") {
  console.error("MERCHIZE_BUILD_PROBE=FAIL_EXTERNAL_FULFILLMENT_MUST_BE_OFF");
  process.exit(31);
}

if (process.env.IGNIAQUA_FEDERATION_ENABLED === "true") {
  console.error("MERCHIZE_BUILD_PROBE=FAIL_FEDERATION_MUST_BE_OFF");
  process.exit(32);
}

const accessToken = process.env.NORVANA_MERCHIZE_ACCESS_TOKEN;
const baseUrl = process.env.NORVANA_MERCHIZE_BASE_URL;

if (!accessToken) {
  console.error("MERCHIZE_BUILD_PROBE=FAIL_ACCESS_TOKEN_NOT_BOUND");
  process.exit(33);
}
if (!baseUrl) {
  console.error("MERCHIZE_BUILD_PROBE=FAIL_BASE_URL_NOT_BOUND");
  process.exit(34);
}

try {
  const result = await runMerchizeCatalogReadOnlyProbe({ accessToken, baseUrl });
  console.log("MERCHIZE_BUILD_PROBE=" + JSON.stringify(result));
} catch (error) {
  const code = error instanceof Error ? error.message : "MERCHIZE_LIVE_PROBE_FAILED";
  console.error(
    "MERCHIZE_BUILD_PROBE=" +
      JSON.stringify({
        result: "FAIL",
        code,
        finalState: "STOPPED_NO_ORDER_NO_PUBLICATION",
      })
  );
  process.exit(39);
}
