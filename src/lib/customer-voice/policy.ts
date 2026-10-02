export type BuyerType = "INDIVIDUAL" | "BUSINESS";
export type ReviewVerificationState =
  | "UNVERIFIED"
  | "NORVANA_PURCHASE"
  | "EXTERNAL_PURCHASE";
export type ReviewModerationState = "PUBLISHED" | "HELD" | "REMOVED";

export type ReviewSubmissionInput = {
  productId: number;
  author: string;
  rating: number;
  title: string;
  body: string;
  buyerType?: BuyerType;
  businessName?: string;
  orderNumber?: string;
  purchaseEmail?: string;
};

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\r\n/g, "\n").trim();
  if (!normalized || normalized.length > maxLength) return null;
  return normalized;
}

export function validateReviewSubmission(input: unknown) {
  if (!input || typeof input !== "object") {
    return { ok: false as const, reason: "Review payload must be an object." };
  }

  const value = input as Record<string, unknown>;
  const productId = Number(value.productId);
  const rating = Number(value.rating);
  const author = cleanText(value.author, 80);
  const title = cleanText(value.title, 160);
  const body = cleanText(value.body, 3000);
  const buyerType: BuyerType =
    value.buyerType === "BUSINESS" ? "BUSINESS" : "INDIVIDUAL";
  const businessName =
    buyerType === "BUSINESS" && typeof value.businessName === "string"
      ? value.businessName.trim().slice(0, 160)
      : "";
  const orderNumber =
    typeof value.orderNumber === "string"
      ? value.orderNumber.trim().slice(0, 80)
      : "";
  const purchaseEmail =
    typeof value.purchaseEmail === "string"
      ? value.purchaseEmail.trim().toLowerCase().slice(0, 255)
      : "";

  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return { ok: false as const, reason: "A valid product is required." };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false as const, reason: "Rating must be an integer from 1 to 5." };
  }
  if (!author) {
    return { ok: false as const, reason: "Display name is required and must be 80 characters or fewer." };
  }
  if (!title) {
    return { ok: false as const, reason: "Review title is required and must be 160 characters or fewer." };
  }
  if (!body || body.length < 5) {
    return { ok: false as const, reason: "Review must contain at least 5 characters and no more than 3000." };
  }
  if (buyerType === "BUSINESS" && !businessName) {
    return { ok: false as const, reason: "Business name is required for a business-buyer review." };
  }
  if ((orderNumber && !purchaseEmail) || (!orderNumber && purchaseEmail)) {
    return {
      ok: false as const,
      reason: "Order number and purchase email must be supplied together for purchase verification.",
    };
  }

  return {
    ok: true as const,
    value: {
      productId,
      rating,
      author,
      title,
      body,
      buyerType,
      businessName: businessName || null,
      orderNumber: orderNumber || null,
      purchaseEmail: purchaseEmail || null,
    },
  };
}

export function reviewVisibilityDecision() {
  // R0 deliberately does not score sentiment. Positive and negative reviews
  // receive the same publication path. Only structural validation occurs here.
  return { moderationState: "PUBLISHED" as const };
}

export function containsProduct(orderItems: unknown, productId: number) {
  if (!Array.isArray(orderItems)) return false;
  return orderItems.some((item) => {
    if (!item || typeof item !== "object") return false;
    return Number((item as Record<string, unknown>).productId) === productId;
  });
}

export function publicReviewShape<T extends Record<string, unknown>>(review: T) {
  return review;
}
