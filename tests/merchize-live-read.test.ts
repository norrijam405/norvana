import test from "node:test";
import assert from "node:assert/strict";
import { __merchizeLiveProbeInternals } from "../src/lib/supplier-gateway/merchize/live-client.ts";

test("Merchize live probe rejects non-Merchize hosts", () => {
  assert.throws(
    () => __merchizeLiveProbeInternals.safeBaseUrl("https://example.com/api"),
    /MERCHIZE_BASE_URL_HOST_NOT_ALLOWED/
  );
});

test("Merchize catalog probe only constructs the documented read path", () => {
  const url = __merchizeLiveProbeInternals.catalogUrl("https://api.merchize.com/");
  assert.equal(url.protocol, "https:");
  assert.equal(url.pathname, "/product/catalog");
  assert.equal(url.searchParams.get("limit"), "1");
  assert.equal(url.searchParams.get("page"), "1");
});
