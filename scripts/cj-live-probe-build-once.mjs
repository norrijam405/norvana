import { existsSync } from "node:fs";
import { runCJLiveReadOnlyProbe } from "../src/lib/supplier-gateway/cj/live-client.ts";

const marker = "CJ_LIVE_PROBE_BUILD_ONCE";

if (!existsSync(marker)) {
  console.log("CJ_BUILD_PROBE=SKIP_NO_MARKER");
  process.exit(0);
}

if (process.env.VERCEL_ENV !== "preview") {
  console.log("CJ_BUILD_PROBE=SKIP_NOT_PREVIEW");
  process.exit(0);
}

const apiKey = process.env.NORVANA_CJ_API_KEY;
if (!apiKey) {
  console.error("CJ_BUILD_PROBE=FAIL_CREDENTIAL_NOT_BOUND");
  process.exit(2);
}

try {
  const result = await runCJLiveReadOnlyProbe(apiKey);

  console.log(
    "CJ_BUILD_PROBE=" +
      JSON.stringify({
        result: result.result,
        mode: result.mode,
        accessTokenObtained: result.authentication.accessTokenObtained,
        tokenReturnedToClient: result.authentication.tokenReturnedToClient,
        tokenPersistedByProbe: result.authentication.tokenPersistedByProbe,
        productRead: Boolean(result.catalog.firstProductId),
        variantRead: Boolean(result.variant.id),
        stockState: result.variant.stockState,
        warehouseCount: result.warehouse.availableWarehouseCount,
        freightQuoteCount: result.freight.quoteCount,
        finalState: result.finalState,
      })
  );
} catch (error) {
  const code = error instanceof Error ? error.message : "CJ_LIVE_PROBE_FAILED";
  console.error(
    "CJ_BUILD_PROBE=" +
      JSON.stringify({
        result: "FAIL",
        code,
        finalState: "STOPPED_NO_ORDER_NO_PUBLICATION",
      })
  );
  process.exit(3);
}
