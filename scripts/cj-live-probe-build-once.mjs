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
  const diagnosticExit =
    code === "CJ_CATALOG_EMPTY" ? 41 :
    code === "CJ_PRODUCT_DETAIL_MISSING" ? 42 :
    code === "CJ_PRODUCT_VARIANT_MISSING" ? 43 :
    code === "CJ_VARIANT_DETAIL_MISSING" ? 44 :
    code.includes("/product/listV2") ? 61 :
    code.includes("/product/query") ? 62 :
    code.includes("/product/variant/queryByVid") ? 63 :
    code.includes("/product/stock/queryByVid") ? 64 :
    code.includes("/product/globalWarehouseList") ? 65 :
    code.includes("/logistic/freightCalculate") ? 66 :
    code === "CJ_PRODUCT_REQUIRED_ID_OR_SKU_MISSING" ? 71 :
    code === "CJ_VARIANT_REQUIRED_ID_OR_SKU_MISSING" ? 72 :
    code === "CJ_FREIGHT_METHOD_MISSING" ? 73 :
    code === "CJ_FREIGHT_PRICE_MISSING" ? 74 :
    code === "CJ_NON_JSON_RESPONSE" ? 75 :
    code === "CJ_RESPONSE_INVALID" ? 76 :
    79;
  process.exit(diagnosticExit);
}
