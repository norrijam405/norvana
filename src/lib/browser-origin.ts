export type BrowserOriginDecision =
  | { ok: true }
  | {
      ok: false;
      code:
        | "NORVANA_SAME_ORIGIN_REQUIRED"
        | "NORVANA_CROSS_ORIGIN_REJECTED"
        | "NORVANA_INVALID_ORIGIN"
        | "NORVANA_INVALID_REFERER"
        | "NORVANA_SAFE_READ_METHOD_REQUIRED";
      reason: string;
    };

function canonicalExpectedOrigin(value: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      url.origin !== raw
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function serializedOrigin(value: string | null) {
  const raw = String(value || "").trim();
  if (!raw || raw === "null") return null;

  try {
    const url = new URL(raw);
    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      url.username ||
      url.password ||
      url.origin !== raw
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function refererOrigin(value: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      url.username ||
      url.password
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function validateSupplementalSignals(input: {
  expectedOrigin: string;
  referer: string | null;
  secFetchSite: string | null;
}): BrowserOriginDecision {
  const secFetchSite = String(input.secFetchSite || "").trim().toLowerCase();
  if (secFetchSite && secFetchSite !== "same-origin") {
    return {
      ok: false,
      code: "NORVANA_CROSS_ORIGIN_REJECTED",
      reason: "Browser Fetch Metadata is not same-origin.",
    };
  }

  if (input.referer) {
    const origin = refererOrigin(input.referer);
    if (!origin) {
      return {
        ok: false,
        code: "NORVANA_INVALID_REFERER",
        reason: "Invalid request Referer.",
      };
    }

    if (origin !== input.expectedOrigin) {
      return {
        ok: false,
        code: "NORVANA_CROSS_ORIGIN_REJECTED",
        reason: "Cross-origin browser Referer rejected.",
      };
    }
  }

  return { ok: true };
}

export function evaluateAuthenticatedBrowserMutationOrigin(input: {
  origin: string | null;
  requestOrigin: string | null;
  referer: string | null;
  secFetchSite: string | null;
}): BrowserOriginDecision {
  const expectedOrigin = canonicalExpectedOrigin(input.requestOrigin);
  if (!expectedOrigin) {
    return {
      ok: false,
      code: "NORVANA_SAME_ORIGIN_REQUIRED",
      reason: "Same-origin browser request required.",
    };
  }

  if (!input.origin) {
    return {
      ok: false,
      code: "NORVANA_SAME_ORIGIN_REQUIRED",
      reason: "Same-origin browser mutation requires an explicit Origin.",
    };
  }

  const origin = serializedOrigin(input.origin);
  if (!origin) {
    return {
      ok: false,
      code: "NORVANA_INVALID_ORIGIN",
      reason: "Invalid serialized request Origin.",
    };
  }

  if (origin !== expectedOrigin) {
    return {
      ok: false,
      code: "NORVANA_CROSS_ORIGIN_REJECTED",
      reason: "Cross-origin browser mutation rejected.",
    };
  }

  return validateSupplementalSignals({
    expectedOrigin,
    referer: input.referer,
    secFetchSite: input.secFetchSite,
  });
}

export function evaluateAuthenticatedBrowserReadOrigin(input: {
  method: string;
  origin: string | null;
  requestOrigin: string | null;
  referer: string | null;
  secFetchSite: string | null;
}): BrowserOriginDecision {
  const method = String(input.method || "").toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    return {
      ok: false,
      code: "NORVANA_SAFE_READ_METHOD_REQUIRED",
      reason: "Safe-read browser boundary permits only GET or HEAD.",
    };
  }

  const expectedOrigin = canonicalExpectedOrigin(input.requestOrigin);
  if (!expectedOrigin) {
    return {
      ok: false,
      code: "NORVANA_SAME_ORIGIN_REQUIRED",
      reason: "Same-origin browser request required.",
    };
  }

  if (input.origin) {
    const origin = serializedOrigin(input.origin);
    if (!origin) {
      return {
        ok: false,
        code: "NORVANA_INVALID_ORIGIN",
        reason: "Invalid serialized request Origin.",
      };
    }

    if (origin !== expectedOrigin) {
      return {
        ok: false,
        code: "NORVANA_CROSS_ORIGIN_REJECTED",
        reason: "Cross-origin browser read rejected.",
      };
    }

    return validateSupplementalSignals({
      expectedOrigin,
      referer: input.referer,
      secFetchSite: input.secFetchSite,
    });
  }

  const secFetchSite = String(input.secFetchSite || "").trim().toLowerCase();
  const hasFetchMetadata = Boolean(secFetchSite);
  const hasReferer = Boolean(input.referer);

  if (!hasFetchMetadata && !hasReferer) {
    return {
      ok: false,
      code: "NORVANA_SAME_ORIGIN_REQUIRED",
      reason: "Same-origin browser read provenance is required.",
    };
  }

  const supplemental = validateSupplementalSignals({
    expectedOrigin,
    referer: input.referer,
    secFetchSite: input.secFetchSite,
  });
  if (!supplemental.ok) return supplemental;

  return { ok: true };
}
