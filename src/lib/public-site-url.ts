/** Public origin for metadata and crawler files. Never trust the incoming Host header. */
export function publicSiteUrl(): string {
  const configured = process.env.NORVANA_SITE_URL;
  if (configured) {
    try {
      const url = new URL(configured);
      if (url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash) {
        return url.origin;
      }
    } catch {
      // Fall through to a non-authoritative preview/default origin.
    }
  }
  const deployment = process.env.VERCEL_URL;
  if (deployment && /^[a-z0-9.-]+\.vercel\.app$/i.test(deployment)) {
    return `https://${deployment}`;
  }
  return "https://norvana.vercel.app";
}

/** Preview and staging hosts must not be search-indexed as the canonical shop. */
export function publicIndexingEnabled(): boolean {
  return process.env.VERCEL_ENV === "production" &&
    Boolean(process.env.NORVANA_SITE_URL?.startsWith("https://"));
}
