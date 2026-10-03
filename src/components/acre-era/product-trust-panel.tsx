import type { ReactNode } from "react";

type ReviewLike = {
  rating: number;
  fulfillmentRating?: number | null;
  purchaseExperienceRating?: number | null;
  verificationState?: string | null;
};

type ProductLike = {
  name: string;
  reviewCount: number;
  supplierId?: number | null;
  commerceModel?: string | null;
  sourceProviderSlug?: string | null;
  brandName?: string | null;
  authorizationState?: string | null;
  imageRightsState?: string | null;
  externalSellerName?: string | null;
  tags?: string[];
};

function average(values: Array<number | null | undefined>) {
  const clean = values.filter((value): value is number => typeof value === "number" && value > 0);
  if (!clean.length) return null;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function Signal({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-soil/10 bg-cream p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-1 font-semibold text-soil">{value}</p>
      {children}
    </div>
  );
}

export function ProductTrustPanel({
  product,
  reviews,
}: {
  product: ProductLike;
  reviews: ReviewLike[];
}) {
  const productRating = average(reviews.map((review) => review.rating));
  const fulfillmentRating = average(reviews.map((review) => review.fulfillmentRating));
  const experienceRating = average(reviews.map((review) => review.purchaseExperienceRating));
  const verifiedCount = reviews.filter((review) =>
    ["NORVANA_PURCHASE", "EXTERNAL_PURCHASE"].includes(review.verificationState || "")
  ).length;

  const sourceLabel =
    product.commerceModel === "AFFILIATE_REFERRAL"
      ? `Referral · ${product.externalSellerName || product.sourceProviderSlug || "partner"}`
      : product.commerceModel === "AUTHORIZED_DISTRIBUTOR"
        ? "Authorized distribution"
        : product.commerceModel === "BRAND_DIRECT"
          ? "Brand direct"
          : product.commerceModel === "LUXURY_DROPSHIP"
            ? "Luxury supplier"
            : product.supplierId
              ? "Qualified supplier"
              : "Acre Era catalog";

  const stage =
    reviews.length >= 10
      ? "Established customer signal"
      : reviews.length > 0
        ? "Learning from early buyers"
        : "New Find — still proving itself";

  return (
    <section className="mt-8 rounded-[2rem] border border-soil/10 bg-sage-wash p-6 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-leaf">Acre Era Passport</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-soil">Why it’s here</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            {product.name} is in the curated catalog because it fits an active customer-use case. Acre Era separates what we know from what is still being proven instead of hiding uncertainty behind one star score.
          </p>
        </div>
        <span className="badge bg-wheat/35 text-soil">{stage}</span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Signal label="Source" value={sourceLabel} />
        <Signal label="Authorization" value={(product.authorizationState || "UNVERIFIED").replaceAll("_", " ")} />
        <Signal label="Image rights" value={(product.imageRightsState || "UNVERIFIED").replaceAll("_", " ")} />
        <Signal label="Purchase evidence" value={verifiedCount ? `${verifiedCount} verified review${verifiedCount === 1 ? "" : "s"}` : "No verified review yet"} />
        <Signal label="Product" value={productRating ? `${productRating.toFixed(1)} / 5` : "Not enough evidence"} />
        <Signal
          label="Delivery + buying"
          value={
            fulfillmentRating || experienceRating
              ? [fulfillmentRating && `${fulfillmentRating.toFixed(1)} delivery`, experienceRating && `${experienceRating.toFixed(1)} buying`]
                  .filter(Boolean)
                  .join(" · ")
              : "Still collecting signal"
          }
        />
      </div>

      <p className="mt-5 text-xs leading-5 text-muted">
        Passport data is descriptive, not a guarantee. Delivery, supplier, inventory, and price can change; Acre Era keeps execution authority separate from what this page displays.
      </p>
    </section>
  );
}
