import { existsSync } from "node:fs";

if (!existsSync("CJ_AUTH_PROBE_BUILD_ONCE")) {
  console.log("CJ_AUTH_PROBE=SKIP_NO_MARKER");
  process.exit(0);
}

if (process.env.VERCEL_ENV !== "preview") {
  console.log("CJ_AUTH_PROBE=SKIP_NOT_PREVIEW");
  process.exit(0);
}

const apiKey = process.env.NORVANA_CJ_API_KEY;
if (!apiKey) {
  console.error("CJ_AUTH_PROBE=FAIL_CREDENTIAL_NOT_BOUND");
  process.exit(32);
}

try {
  const response = await fetch(
    "https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken",
    {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ apiKey }),
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    }
  );

  let body;
  try {
    body = await response.json();
  } catch {
    console.error("CJ_AUTH_PROBE=FAIL_NON_JSON");
    process.exit(33);
  }

  const ok =
    response.ok &&
    body &&
    typeof body === "object" &&
    body.code === 200 &&
    body.result !== false &&
    body.success !== false &&
    typeof body.data?.accessToken === "string" &&
    body.data.accessToken.length > 0;

  if (!ok) {
    console.error(
      "CJ_AUTH_PROBE=" +
        JSON.stringify({
          result: "FAIL",
          httpStatus: response.status,
          providerCode:
            body && typeof body === "object" && typeof body.code === "number"
              ? body.code
              : null,
          providerMessage:
            body && typeof body === "object" && typeof body.message === "string"
              ? body.message
              : null,
        })
    );
    process.exit(31);
  }

  console.log(
    "CJ_AUTH_PROBE=" +
      JSON.stringify({
        result: "PASS",
        accessTokenObtained: true,
        tokenPrinted: false,
        tokenPersisted: false,
      })
  );
} catch (error) {
  console.error(
    "CJ_AUTH_PROBE=" +
      JSON.stringify({
        result: "FAIL_NETWORK_OR_TIMEOUT",
        code: error instanceof Error ? error.name : "UNKNOWN",
      })
  );
  process.exit(34);
}
