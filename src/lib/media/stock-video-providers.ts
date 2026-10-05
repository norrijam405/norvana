export type StockVideoCandidate = {
  provider: "PIXABAY" | "COVERR";
  externalId: string;
  title: string;
  pageUrl: string | null;
  videoUrl: string | null;
  previewUrl: string | null;
  posterUrl: string | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  contributor: string | null;
  attributionRequired: boolean;
  rightsState: "REQUIRES_REVIEW";
};

export type StockVideoSearchInput = {
  query: string;
  limit?: number;
  orientation?: "ANY" | "LANDSCAPE" | "PORTRAIT";
};

function safeLimit(value: number | undefined) {
  if (!Number.isFinite(value)) return 12;
  return Math.min(30, Math.max(3, Math.floor(value as number)));
}

export async function searchPixabayVideos(
  input: StockVideoSearchInput,
  apiKey = process.env.PIXABAY_API_KEY
): Promise<StockVideoCandidate[]> {
  if (!apiKey) throw new Error("PIXABAY_API_KEY_REQUIRED");
  if (!input.query.trim()) throw new Error("STOCK_VIDEO_QUERY_REQUIRED");

  const url = new URL("https://pixabay.com/api/videos/");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", input.query.trim());
  url.searchParams.set("safesearch", "true");
  url.searchParams.set("order", "popular");
  url.searchParams.set("per_page", String(safeLimit(input.limit)));

  const response = await fetch(url, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`PIXABAY_SEARCH_FAILED_${response.status}`);

  const payload = await response.json() as {
    hits?: Array<Record<string, unknown>>;
  };

  return (payload.hits ?? []).flatMap((hit) => {
    const videos = hit.videos && typeof hit.videos === "object"
      ? hit.videos as Record<string, Record<string, unknown>>
      : {};
    const rendition = videos.medium ?? videos.small ?? videos.large ?? videos.tiny;
    const videoUrl = typeof rendition?.url === "string" ? rendition.url : null;
    const posterUrl = typeof rendition?.thumbnail === "string" ? rendition.thumbnail : null;
    if (!videoUrl) return [];

    return [{
      provider: "PIXABAY" as const,
      externalId: String(hit.id ?? ""),
      title: typeof hit.tags === "string" ? hit.tags : `Pixabay video ${String(hit.id ?? "")}`,
      pageUrl: typeof hit.pageURL === "string" ? hit.pageURL : null,
      videoUrl,
      previewUrl: videoUrl,
      posterUrl,
      width: Number.isFinite(Number(rendition?.width)) ? Number(rendition.width) : null,
      height: Number.isFinite(Number(rendition?.height)) ? Number(rendition.height) : null,
      durationSeconds: null,
      contributor: typeof hit.user === "string" ? hit.user : null,
      attributionRequired: false,
      rightsState: "REQUIRES_REVIEW" as const,
    }];
  });
}

export async function searchCoverrVideos(
  input: StockVideoSearchInput,
  apiKey = process.env.COVERR_API_KEY
): Promise<StockVideoCandidate[]> {
  if (!apiKey) throw new Error("COVERR_API_KEY_REQUIRED");
  if (!input.query.trim()) throw new Error("STOCK_VIDEO_QUERY_REQUIRED");

  const url = new URL("https://api.coverr.co/videos");
  url.searchParams.set("query", input.query.trim());
  url.searchParams.set("urls", "true");
  url.searchParams.set("sort", "popular");
  url.searchParams.set("page_size", String(safeLimit(input.limit)));

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`COVERR_SEARCH_FAILED_${response.status}`);

  const payload = await response.json() as {
    hits?: Array<Record<string, unknown>>;
  };

  return (payload.hits ?? []).map((hit) => {
    const urls = hit.urls && typeof hit.urls === "object"
      ? hit.urls as Record<string, unknown>
      : {};

    return {
      provider: "COVERR" as const,
      externalId: String(hit.id ?? ""),
      title: typeof hit.title === "string" ? hit.title : `Coverr video ${String(hit.id ?? "")}`,
      pageUrl: null,
      videoUrl: typeof urls.mp4 === "string" ? urls.mp4 : null,
      previewUrl: typeof urls.mp4_preview === "string" ? urls.mp4_preview : null,
      posterUrl: typeof hit.poster === "string" ? hit.poster : null,
      width: Number.isFinite(Number(hit.max_width)) ? Number(hit.max_width) : null,
      height: Number.isFinite(Number(hit.max_height)) ? Number(hit.max_height) : null,
      durationSeconds: Number.isFinite(Number(hit.duration)) ? Number(hit.duration) : null,
      contributor: null,
      attributionRequired: true,
      rightsState: "REQUIRES_REVIEW" as const,
    };
  });
}

export async function searchStockVideos(input: StockVideoSearchInput) {
  const providers: Array<Promise<StockVideoCandidate[]>> = [];

  if (process.env.PIXABAY_API_KEY) providers.push(searchPixabayVideos(input));
  if (process.env.COVERR_API_KEY) providers.push(searchCoverrVideos(input));

  if (!providers.length) {
    return {
      candidates: [] as StockVideoCandidate[],
      unavailableProviders: ["PIXABAY_API_KEY_REQUIRED", "COVERR_API_KEY_REQUIRED"],
    };
  }

  const settled = await Promise.allSettled(providers);
  const candidates = settled.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );
  const errors = settled.flatMap((result) =>
    result.status === "rejected"
      ? [result.reason instanceof Error ? result.reason.message : String(result.reason)]
      : []
  );

  return {
    candidates,
    unavailableProviders: errors,
  };
}
