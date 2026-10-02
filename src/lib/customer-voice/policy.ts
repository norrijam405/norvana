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
  fulfillmentRating?: number | null;
  purchaseExperienceRating?: number | null;
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
  const fulfillmentRating =
    value.fulfillmentRating === undefined ||
    value.fulfillmentRating === null ||
    value.fulfillmentRating === ""
      ? null
      : Number(value.fulfillmentRating);
  const purchaseExperienceRating =
    value.purchaseExperienceRating === undefined ||
    value.purchaseExperienceRating === null ||
    value.purchaseExperienceRating === ""
      ? null
      : Number(value.purchaseExperienceRating);
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
    return { ok: false as const, reason: "Product rating must be an integer from 1 to 5." };
  }
  for (const [label, optionalRating] of [
    ["Fulfillment rating", fulfillmentRating],
    ["Purchase-experience rating", purchaseExperienceRating],
  ] as const) {
    if (
      optionalRating !== null &&
      (!Number.isInteger(optionalRating) || optionalRating < 1 || optionalRating > 5)
    ) {
      return {
        ok: false as const,
        reason: label + " must be an integer from 1 to 5 when supplied.",
      };
    }
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
      fulfillmentRating,
      purchaseExperienceRating,
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

export function productQuantityFromOrder(orderItems: unknown, productId: number) {
  if (!Array.isArray(orderItems)) return 0;
  return orderItems.reduce((total, item) => {
    if (!item || typeof item !== "object") return total;
    const row = item as Record<string, unknown>;
    if (Number(row.productId) !== productId) return total;
    const quantity = Number(row.quantity);
    return Number.isInteger(quantity) && quantity > 0 ? total + quantity : total;
  }, 0);
}

export function containsProduct(orderItems: unknown, productId: number) {
  return productQuantityFromOrder(orderItems, productId) > 0;
}

export function purchaseQuantityBand(quantity: number) {
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  if (quantity >= 50) return "50+ units";
  if (quantity >= 10) return "10–49 units";
  if (quantity >= 2) return "2–9 units";
  return "1 unit";
}

export function publicReviewShape<T extends Record<string, unknown>>(review: T) {
  return review;
}
