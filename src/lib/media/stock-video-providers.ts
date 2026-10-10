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
  reviewFlags: Array<
    "AI_GENERATED" |
    "PORTRAIT_ORIENTATION" |
    "BRAND_TERM" |
    "PEOPLE_PRESENT" |
    "MEDICAL_OR_HEALTH_CLAIM_RISK"
  >;
};

export type StockVideoSearchInput = {
  query: string;
  limit?: number;
  orientation?: "ANY" | "LANDSCAPE" | "PORTRAIT";
};


const BRAND_TERMS = [
  "apple",
  "macbook",
  "nike",
  "adidas",
  "gucci",
  "louis vuitton",
  "chanel",
  "samsung",
] as const;

function reviewFlagsFor(title: string, width: number | null, height: number | null) {
  const normalized = title.toLowerCase();
  const flags: StockVideoCandidate["reviewFlags"] = [];

  if (/\bai[ -]?generated\b|\bai created\b|\bartificial intelligence\b/.test(normalized)) {
    flags.push("AI_GENERATED");
  }
  if (width !== null && height !== null && height > width) {
    flags.push("PORTRAIT_ORIENTATION");
  }
  if (BRAND_TERMS.some((brand) => normalized.includes(brand))) {
    flags.push("BRAND_TERM");
  }
  if (/\b(person|people|woman|women|man|men|boy|girl|child|children|family|model|athlete|runner)\b/.test(normalized)) {
    flags.push("PEOPLE_PRESENT");
  }
  if (/\b(acne|treatment|therapy|medical|healthcare|anti-aging|dermatology|skin health|disease|virus|pandemic)\b/.test(normalized)) {
    flags.push("MEDICAL_OR_HEALTH_CLAIM_RISK");
  }

  return flags;
}

function orientationMatches(
  orientation: StockVideoSearchInput["orientation"],
  width: number | null,
  height: number | null
) {
  if (!orientation || orientation === "ANY" || width === null || height === null) return true;
  return orientation === "LANDSCAPE" ? width >= height : height > width;
}

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

    const title =
      typeof hit.tags === "string" ? hit.tags : `Pixabay video ${String(hit.id ?? "")}`;
    const width = Number.isFinite(Number(rendition?.width)) ? Number(rendition.width) : null;
    const height = Number.isFinite(Number(rendition?.height)) ? Number(rendition.height) : null;
    if (!orientationMatches(input.orientation, width, height)) return [];

    return [{
      provider: "PIXABAY" as const,
      externalId: String(hit.id ?? ""),
      title,
      pageUrl: typeof hit.pageURL === "string" ? hit.pageURL : null,
      videoUrl,
      previewUrl: videoUrl,
      posterUrl,
      width,
      height,
      durationSeconds: null,
      contributor: typeof hit.user === "string" ? hit.user : null,
      attributionRequired: false,
      rightsState: "REQUIRES_REVIEW" as const,
      reviewFlags: reviewFlagsFor(title, width, height),
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

    const title =
      typeof hit.title === "string" ? hit.title : `Coverr video ${String(hit.id ?? "")}`;
    const width = Number.isFinite(Number(hit.max_width)) ? Number(hit.max_width) : null;
    const height = Number.isFinite(Number(hit.max_height)) ? Number(hit.max_height) : null;

    return {
      provider: "COVERR" as const,
      externalId: String(hit.id ?? ""),
      title,
      pageUrl: null,
      videoUrl: typeof urls.mp4 === "string" ? urls.mp4 : null,
      previewUrl: typeof urls.mp4_preview === "string" ? urls.mp4_preview : null,
      posterUrl: typeof hit.poster === "string" ? hit.poster : null,
      width,
      height,
      durationSeconds: Number.isFinite(Number(hit.duration)) ? Number(hit.duration) : null,
      contributor: null,
      attributionRequired: true,
      rightsState: "REQUIRES_REVIEW" as const,
      reviewFlags: reviewFlagsFor(title, width, height),
    };
  }).filter((candidate) =>
    orientationMatches(input.orientation, candidate.width, candidate.height)
  );
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
