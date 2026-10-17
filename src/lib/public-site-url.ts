/** Public origin for metadata. Never derive a trusted domain from request headers. */
function configuredPublicOrigin(): string | null {
  const raw = process.env.NORVANA_SITE_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password ||
        url.search || url.hash || url.pathname !== "/") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function publicSiteUrl(): string {
  const configured = configuredPublicOrigin();
  if (configured) return configured;
  const deployment = process.env.VERCEL_URL;
  if (deployment && /^[a-z0-9.-]+\.vercel\.app$/i.test(deployment)) {
    return `https://${deployment}`;
  }
  return "https://norvana.vercel.app";
}

/** Preview/staging must not be indexed. A malformed configured URL cannot enable indexing. */
export function publicIndexingEnabled(): boolean {
  return process.env.VERCEL_ENV === "production" && configuredPublicOrigin() !== null;
}
