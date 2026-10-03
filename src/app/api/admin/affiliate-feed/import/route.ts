import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import { evaluateAffiliateDestination } from "@/lib/commerce/affiliate-policy";
import { providerBySlug } from "@/lib/commerce/provider-registry";

function clean(value: unknown, max: number) {
  return String(value || "").trim().slice(0, max);
}

function slugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function httpsUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("HTTPS_REQUIRED");
  return url.toString();
}

export async function POST(req: NextRequest) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const providerSlug = clean(body.providerSlug, 120);
  const externalProductId = clean(body.externalProductId, 255);
  const name = clean(body.name, 255);
  const description = clean(body.description, 5000);
  const brandName = clean(body.brandName, 255) || null;
  const externalSellerName = clean(body.externalSellerName, 255);
  const destinationUrl = clean(body.destinationUrl, 1500);
  const imageUrlRaw = clean(body.imageUrl, 1500);
  const rightsEvidenceRef = clean(body.rightsEvidenceRef, 1500);
  const programEvidenceRef = clean(body.programEvidenceRef, 1500);
  const priceObservedAt = clean(body.priceObservedAt, 80);
  const price = Number(body.price);

  const provider = providerBySlug(providerSlug);
  if (!provider || !provider.models.includes("AFFILIATE_REFERRAL")) {
    return NextResponse.json({ error: "Provider is not an approved affiliate definition." }, { status: 400 });
  }

  if (!externalProductId || !name || !externalSellerName || !destinationUrl) {
    return NextResponse.json({ error: "Missing required product/feed identity." }, { status: 400 });
  }

  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "Price must be a non-negative number." }, { status: 400 });
  }

  if (body.programApproved !== true || body.imageRightsConfirmed !== true) {
    return NextResponse.json(
      { error: "Affiliate approval and image-use rights must both be explicitly confirmed." },
      { status: 409 }
    );
  }

  if (!rightsEvidenceRef || !programEvidenceRef) {
    return NextResponse.json(
      { error: "Program and image-rights evidence references are required." },
      { status: 409 }
    );
  }

  const destination = evaluateAffiliateDestination({
    providerSlug,
    destinationUrl,
  });
  if (!destination.ok) {
    return NextResponse.json({ error: destination.reason, code: destination.code }, { status: 409 });
  }

  let imageUrl: string | null = null;
  if (imageUrlRaw) {
    try {
      imageUrl = httpsUrl(imageUrlRaw);
    } catch {
      return NextResponse.json({ error: "Affiliate image URL must use HTTPS." }, { status: 400 });
    }
  }

  const slug = `affiliate-${slugPart(providerSlug)}-${slugPart(externalProductId)}`;
  const evidence = {
    affiliateProgramApproved: true,
    programEvidenceRef,
    imageRightsConfirmed: true,
    rightsEvidenceRef,
    priceObservedAt: priceObservedAt || null,
    destinationHost: destination.url.hostname.toLowerCase(),
    importedAt: new Date().toISOString(),
  };

  const [existing] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);

  const values = {
    name,
    slug,
    description,
    price,
    compareAtPrice: null,
    cost: 0,
    niche: clean(body.niche, 100) || "affiliate",
    status: "draft",
    inventory: 0,
    supplierId: null,
    supplierSku: null,
    commerceModel: "AFFILIATE_REFERRAL",
    sourceProviderSlug: providerSlug,
    brandName,
    productCondition: "NEW",
    authorizationState: "AFFILIATE_PROGRAM_APPROVED",
    imageRightsState: imageUrl ? "AFFILIATE_FEED_AUTHORIZED" : "LEGACY_UNVERIFIED",
    externalCheckoutUrl: destination.url.toString(),
    externalSellerName,
    affiliateNetwork: clean(body.affiliateNetwork, 120) || null,
    affiliateProgram: provider.name,
    externalProductId,
    productEvidence: evidence,
    images: imageUrl ? [imageUrl] : [],
    tags: Array.isArray(body.tags)
      ? body.tags.map((tag) => clean(tag, 60)).filter(Boolean).slice(0, 20)
      : [],
  };

  if (existing) {
    const [updated] = await db
      .update(products)
      .set(values)
      .where(eq(products.id, existing.id))
      .returning();

    return NextResponse.json({
      imported: true,
      mode: "AFFILIATE_FEED_DRAFT_UPSERT",
      productId: updated.id,
      slug: updated.slug,
      status: updated.status,
      authority: "DRAFT_ONLY_NO_AUTO_PUBLISH",
    });
  }

  const [created] = await db.insert(products).values(values).returning();
  return NextResponse.json(
    {
      imported: true,
      mode: "AFFILIATE_FEED_DRAFT_UPSERT",
      productId: created.id,
      slug: created.slug,
      status: created.status,
      authority: "DRAFT_ONLY_NO_AUTO_PUBLISH",
    },
    { status: 201 }
  );
}
