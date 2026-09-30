const APPROVED_OBSERVE_PROOF_HOSTS = new Set([
  "ag.ok.gov",
  "ams.usda.gov",
  "www.ams.usda.gov",
]);

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export const MAX_OBSERVE_PROOF_REDIRECTS = 5;

export function assertApprovedObserveProofUrl(value) {
  let url;
  try {
    url = value instanceof URL ? new URL(value.toString()) : new URL(String(value));
  } catch {
    throw new Error("Observe-proof public source URL is invalid.");
  }

  if (url.protocol !== "https:") {
    throw new Error(`Observe-proof public source must use HTTPS: ${url.toString()}`);
  }

  if (url.username || url.password) {
    throw new Error("Observe-proof public source URL must not contain credentials.");
  }

  if (url.port && url.port !== "443") {
    throw new Error(
      `Observe-proof public source uses an unapproved port: ${url.toString()}`
    );
  }

  if (!APPROVED_OBSERVE_PROOF_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error(
      `Observe-proof public source host is not approved: ${url.hostname}`
    );
  }

  return url;
}

export async function fetchApprovedObserveProofHtml(
  startUrl,
  {
    fetchImpl = globalThis.fetch,
    maxRedirects = MAX_OBSERVE_PROOF_REDIRECTS,
    timeoutMs = 15_000,
  } = {}
) {
  if (typeof fetchImpl !== "function") {
    throw new Error("Observe-proof fetch implementation is unavailable.");
  }

  if (!Number.isInteger(maxRedirects) || maxRedirects < 0 || maxRedirects > 10) {
    throw new Error("Observe-proof redirect limit is invalid.");
  }

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 60_000) {
    throw new Error("Observe-proof fetch timeout is invalid.");
  }

  let currentUrl = assertApprovedObserveProofUrl(startUrl);
  let redirectsFollowed = 0;
  const redirectChain = [currentUrl.toString()];

  while (true) {
    currentUrl = assertApprovedObserveProofUrl(currentUrl);

    const response = await fetchImpl(currentUrl.toString(), {
      method: "GET",
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "Norvana-Watchtower-Observe-Proof/0.1",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (REDIRECT_STATUSES.has(response.status)) {
      if (redirectsFollowed >= maxRedirects) {
        throw new Error(
          `Observe-proof public source exceeded the redirect limit of ${maxRedirects}.`
        );
      }

      const location = response.headers.get("location");
      if (!location) {
        throw new Error(
          `Observe-proof redirect from ${currentUrl.toString()} omitted Location.`
        );
      }

      let nextUrl;
      try {
        nextUrl = new URL(location, currentUrl);
      } catch {
        throw new Error(
          `Observe-proof redirect from ${currentUrl.toString()} supplied an invalid Location.`
        );
      }

      // Validate the next hop before issuing any request to it.
      currentUrl = assertApprovedObserveProofUrl(nextUrl);
      redirectsFollowed += 1;
      redirectChain.push(currentUrl.toString());
      continue;
    }

    if (response.status >= 300 && response.status < 400) {
      throw new Error(
        `Observe-proof public source returned unsupported redirect status ${response.status}.`
      );
    }

    if (response.url) {
      const reportedUrl = assertApprovedObserveProofUrl(response.url);
      if (reportedUrl.toString() !== currentUrl.toString()) {
        throw new Error(
          "Observe-proof fetch changed URL without an explicitly validated redirect hop."
        );
      }
    }

    if (!response.ok) {
      throw new Error(
        `Observe-proof public source ${currentUrl.toString()} returned HTTP ${response.status}.`
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("text/html")) {
      throw new Error(
        `Observe-proof public source ${currentUrl.toString()} did not return HTML.`
      );
    }

    const html = await response.text();

    return {
      response,
      html,
      resolvedUrl: currentUrl,
      redirectCount: redirectsFollowed,
      redirectChain,
    };
  }
}
