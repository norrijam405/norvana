export type BrowserReadOriginDecision =
  | { ok: true }
  | {
      ok: false;
      code:
        | "NORVANA_SAME_ORIGIN_REQUIRED"
        | "NORVANA_CROSS_ORIGIN_REJECTED"
        | "NORVANA_INVALID_ORIGIN"
        | "NORVANA_SAFE_READ_METHOD_REQUIRED";
      reason: string;
    };

function normalizedHost(value: string | null) {
  return String(value || "").trim().toLowerCase();
}

function urlHost(value: string) {
  const url = new URL(value);
  return url.host.toLowerCase();
}

export function evaluateAuthenticatedBrowserReadOrigin(input: {
  method: string;
  origin: string | null;
  host: string | null;
  referer: string | null;
  secFetchSite: string | null;
}): BrowserReadOriginDecision {
  const method = String(input.method || "").toUpperCase();
  const host = normalizedHost(input.host);

  if (!host) {
    return {
      ok: false,
      code: "NORVANA_SAME_ORIGIN_REQUIRED",
      reason: "Same-origin browser request required.",
    };
  }

  if (input.origin) {
    try {
      if (urlHost(input.origin) !== host) {
        return {
          ok: false,
          code: "NORVANA_CROSS_ORIGIN_REJECTED",
          reason: "Cross-origin browser read rejected.",
        };
      }
      return { ok: true };
    } catch {
      return {
        ok: false,
        code: "NORVANA_INVALID_ORIGIN",
        reason: "Invalid request origin.",
      };
    }
  }

  if (method !== "GET" && method !== "HEAD") {
    return {
      ok: false,
      code: "NORVANA_SAFE_READ_METHOD_REQUIRED",
      reason: "Origin-less browser requests are allowed only for safe reads.",
    };
  }

  if (String(input.secFetchSite || "").toLowerCase() === "same-origin") {
    return { ok: true };
  }

  if (input.referer) {
    try {
      if (urlHost(input.referer) === host) {
        return { ok: true };
      }
    } catch {
      // Fall through to fail-closed response.
    }
  }

  return {
    ok: false,
    code: "NORVANA_SAME_ORIGIN_REQUIRED",
    reason: "Same-origin browser request required.",
  };
}
