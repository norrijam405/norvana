import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eraProducts, eras, products } from "@/db/schema";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";

type PlacementTarget = "MARKET" | "GOODS" | "FINDS";

function textValue(value: unknown, max = 255) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function numberValue(value: unknown) {
  if (value === null || value === undefined || typeof value === "boolean" || (typeof value === "string" && !value.trim())) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isUniqueConflict(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; cause?: unknown };
  return candidate.code === "23505" || (candidate.cause !== undefined && isUniqueConflict(candidate.cause));
}

function targetForLane(lane: string): PlacementTarget {
  const value = lane.toLowerCase();
  if (/(farm|produce|fresh|grocery|food|market|garden|wellness)/.test(value)) return "MARKET";
  if (/(premium|style|fashion|travel|electronics|computer|luxury|finds)/.test(value)) return "FINDS";
  return "GOODS";
}

function nicheFor(target: PlacementTarget, lane: string) {
  if (target === "MARKET") {
    const value = lane.toLowerCase();
    if (value.includes("produce") || value.includes("farm") || value.includes("fresh")) return "food";
    if (value.includes("garden")) return "garden";
    if (value.includes("wellness")) return "wellness";
    return "grocery";
  }
  return lane.split("/").pop()?.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "general";
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 180);
}

function eraMatches(target: PlacementTarget, era: { slug: string; name: string }) {
  const haystack = `${era.slug} ${era.name}`.toLowerCase();
  if (target === "MARKET") return haystack.includes("market");
  if (target === "FINDS") return haystack.includes("find");
  return haystack.includes("goods");
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

  const name = textValue(body.name);
  const lane = textValue(body.lane) || "general";
  const sourceType = textValue(body.sourceType).toUpperCase() || "SUPPLIER";
  const sourceProviderSlug = textValue(body.sourceProviderSlug, 120) || null;
  const sourceName = textValue(body.sourceName) || null;
  const sourceKey = textValue(body.sourceKey) || null;
  const supplierSku = textValue(body.supplierSku, 100) || null;
  const producerId = numberValue(body.producerId);
  const productCost = numberValue(body.productCost);
  const shippingCost = numberValue(body.shippingCost);
  const target = targetForLane(lane);

  // Supplier economics must not be silently converted into an invalid zero-cost offer.
  if ((body.productCost !== undefined && (productCost === null || productCost < 0)) ||
      (body.shippingCost !== undefined && (shippingCost === null || shippingCost < 0))) {
    return NextResponse.json({ error: "Product and shipping costs must be finite nonnegative numbers." }, { status: 400 });
  }

  // Remote product identifiers must be scoped to an identified provider.
  if ((supplierSku || sourceKey) && !sourceProviderSlug) {
    return NextResponse.json({ error: "Provider identity is required for supplier SKU or source key placement." }, { status: 400 });
  }

  if (!supplierSku && !sourceKey) {
    return NextResponse.json(
      { error: "A supplier SKU or source product key is required for deterministic staging.", code: "VENDOR_IDENTITY_REQUIRED" },
      { status: 400 }
    );
  }

  if (!name) {
    return NextResponse.json({ error: "Product name is required." }, { status: 400 });
  }

  if (sourceType === "FARM" && !sourceName && !producerId) {
    return NextResponse.json(
      { error: "Farm placement requires a producer name or producer id." },
      { status: 400 }
    );
  }

  // Bounded qualification of optional farm and wholesale facts.
  // Missing details stay unverified at staging; malformed supplied facts are rejected.
  const pickupStart = textValue(body.pickupStart, 40);
  const pickupEnd = textValue(body.pickupEnd, 40);
  const casePack = body.casePack === undefined ? null : numberValue(body.casePack);
  const minimumOrder = body.minimumOrder === undefined ? null : numberValue(body.minimumOrder);

  if (sourceType === "FARM") {
    if (target !== "MARKET") {
      return NextResponse.json({ error: "Farm products must be staged in Market Era.", code: "FARM_ERA_MISMATCH" }, { status: 400 });
    }
    if (pickupStart || pickupEnd) {
      const start = Date.parse(pickupStart);
      const end = Date.parse(pickupEnd);
      if (!pickupStart || !pickupEnd || !Number.isFinite(start) || !Number.isFinite(end) || end <= start || end <= Date.now()) {
        return NextResponse.json({ error: "Farm pickup window must have a valid start and later end.", code: "FARM_PICKUP_WINDOW_INVALID" }, { status: 400 });
      }
    }
  }
  if (sourceType === "WHOLESALE") {
    if ((body.casePack !== undefined && (!Number.isInteger(casePack) || casePack! <= 0)) ||
        (body.minimumOrder !== undefined && (!Number.isInteger(minimumOrder) || minimumOrder! <= 0))) {
      return NextResponse.json({ error: "Wholesale case pack and minimum order must be positive integers.", code: "WHOLESALE_QUANTITY_INVALID" }, { status: 400 });
    }
  }

  const evidence = {
    authority: "MERCHANDISING_STAGE_ONLY_NO_PUBLICATION",
    placementTarget: target,
    sourceType,
    sourceName,
    sourceKey,
    producerId,
    supplierSku,
    shippingCost,
    qualificationFacts: {
      pickupStart: sourceType === "FARM" ? pickupStart || null : null,
      pickupEnd: sourceType === "FARM" ? pickupEnd || null : null,
      casePack: sourceType === "WHOLESALE" ? casePack : null,
      minimumOrder: sourceType === "WHOLESALE" ? minimumOrder : null,
    },
    routeEvidence: body.routeEvidence && typeof body.routeEvidence === "object" ? body.routeEvidence : {},
    stagedAt: new Date().toISOString(),
  };

  let existing: typeof products.$inferSelect | undefined;
  try {
    const [skuMatch] = supplierSku
      ? await db.select().from(products)
          .where(and(eq(products.supplierSku, supplierSku), eq(products.sourceProviderSlug, sourceProviderSlug!))).limit(1)
      : [undefined];
    const [externalMatch] = sourceKey
      ? await db.select().from(products)
          .where(and(eq(products.externalProductId, sourceKey), eq(products.sourceProviderSlug, sourceProviderSlug!))).limit(1)
      : [undefined];

    if (skuMatch && externalMatch && skuMatch.id !== externalMatch.id) {
      return NextResponse.json(
        { error: "Supplier SKU and external product ID belong to different catalog records.", code: "VENDOR_IDENTITY_MISMATCH" },
        { status: 409 }
      );
    }
    existing = skuMatch ?? externalMatch;
  } catch (error) {
    console.error("Placement lookup failed:", error);
    return NextResponse.json({ error: "Product catalog is not ready for placement." }, { status: 503 });
  }

  // A vendor can provide both identifiers. They must resolve to the same record.
  // Otherwise SKU-first lookup could overwrite another variant's external identity.
  if (existing && sourceKey && existing.externalProductId && existing.externalProductId !== sourceKey) {
    return NextResponse.json(
      { error: "Supplier SKU and external product ID identify different records.", code: "VENDOR_IDENTITY_MISMATCH" },
      { status: 409 }
    );
  }
  if (existing && supplierSku && existing.supplierSku && existing.supplierSku !== supplierSku) {
    return NextResponse.json(
      { error: "Supplier SKU and external product ID identify different records.", code: "VENDOR_IDENTITY_MISMATCH" },
      { status: 409 }
    );
  }

  // Staging must never silently demote an already public product.
  if (existing && existing.status !== "staged") {
    return NextResponse.json({ error: "Existing non-staged product requires separate publication-aware review." }, { status: 409 });
  }

  let product: typeof products.$inferSelect;
  try {
  if (existing) {
    const [updated] = await db
      .update(products)
      .set({
        name,
        niche: nicheFor(target, lane),
        status: "staged",
        inventory: 0,
        cost: productCost ?? existing.cost ?? 0,
        sourceProviderSlug: sourceProviderSlug ?? existing.sourceProviderSlug,
        externalSellerName: sourceName ?? existing.externalSellerName,
        externalProductId: sourceKey ?? existing.externalProductId,
        supplierSku: supplierSku ?? existing.supplierSku,
        authorizationState: "UNVERIFIED",
        imageRightsState: "PENDING_VERIFICATION",
        productEvidence: { ...(existing.productEvidence || {}), ...evidence },
      })
      .where(eq(products.id, existing.id))
      .returning();
    product = updated;
  } else {
    const uniqueSuffix = [sourceProviderSlug || sourceType.toLowerCase(), supplierSku || sourceKey || Date.now().toString()].join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const [created] = await db
      .insert(products)
      .values({
        name,
        slug: `${slugify(name)}-${uniqueSuffix}`.slice(0, 255),
        description: "",
        price: 0,
        cost: productCost ?? 0,
        niche: nicheFor(target, lane),
        status: "staged",
        inventory: 0,
        commerceModel: "PREVIEW_ONLY",
        sourceProviderSlug,
        externalSellerName: sourceName,
        externalProductId: sourceKey,
        supplierSku,
        authorizationState: "UNVERIFIED",
        imageRightsState: "PENDING_VERIFICATION",
        productEvidence: evidence,
        tags: [target.toLowerCase(), sourceType.toLowerCase(), "watchtower-staged"],
      })
      .returning();
    product = created;
  }
  } catch (error) {
    if (isUniqueConflict(error)) {
      return NextResponse.json({ error: "Supplier product identity already exists; refresh before retrying.", code: "VENDOR_PRODUCT_CONFLICT" }, { status: 409 });
    }
    console.error("Placement persistence failed:", error);
    return NextResponse.json({ error: "Product could not be staged. Please retry after checking the catalog.", code: "PLACEMENT_PERSISTENCE_FAILED" }, { status: 503 });
  }

  let eraAssignment: { id: number; eraId: number; productId: number } | null = null;
  let assignmentPending = false;

  try {
    const eraRows = await db.select({ id: eras.id, slug: eras.slug, name: eras.name }).from(eras);
    const era = eraRows.find((row) => eraMatches(target, row));
    if (!era) {
      assignmentPending = true;
    } else {
      const [existingAssignment] = await db
        .select({ id: eraProducts.id, eraId: eraProducts.eraId, productId: eraProducts.productId })
        .from(eraProducts)
        .where(eq(eraProducts.productId, product.id))
        .limit(1);

      if (existingAssignment?.eraId === era.id) {
        eraAssignment = existingAssignment;
      } else {
        const [assignment] = await db
          .insert(eraProducts)
          .values({
            eraId: era.id,
            productId: product.id,
            role: "STANDARD",
            curationReason: `Watchtower one-click placement to ${target} from ${sourceType} source.`,
            evidenceRef: sourceKey || supplierSku || undefined,
            status: "ACTIVE",
          })
          .onConflictDoNothing()
          .returning({ id: eraProducts.id, eraId: eraProducts.eraId, productId: eraProducts.productId });
        eraAssignment = assignment ?? null;
      }
    }
  } catch {
    assignmentPending = true;
  }

  return NextResponse.json(
    {
      productId: product.id,
      productStatus: product.status,
      target,
      eraAssignment,
      placementState: assignmentPending ? `STAGED_FOR_${target}_ERA_ASSIGNMENT_PENDING` : `STAGED_IN_${target}_ERA`,
      authority: "MERCHANDISING_STAGE_ONLY_NO_PUBLICATION",
      note: "Placement does not publish the product, activate checkout, or grant fulfillment authority.",
    },
    { status: existing ? 200 : 201 }
  );
}
