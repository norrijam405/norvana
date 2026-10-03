import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  productRouteObservations,
  productRoutes,
  products,
} from "@/db/schema";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import { evaluateAffiliateDestination } from "@/lib/commerce/affiliate-policy";
import { parseRouteDraft } from "@/lib/commerce/route-admin-validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseRouteDraft(body);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid route." },
      { status: 400 }
    );
  }

  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  if (parsed.routeType === "AFFILIATE_REFERRAL") {
    const destination = evaluateAffiliateDestination({
      providerSlug: parsed.providerSlug,
      destinationUrl: parsed.checkoutUrl,
    });
    if (!destination.ok) {
      return NextResponse.json(
        { error: destination.reason, code: destination.code },
        { status: 409 }
      );
    }
  }

  if (parsed.lastVerifiedAt && !Number.isFinite(parsed.lastVerifiedAt.getTime())) {
    return NextResponse.json({ error: "Route verification time is invalid." }, { status: 400 });
  }

  const [route] = await db
    .insert(productRoutes)
    .values({
      productId,
      ...parsed,
      status: "QUALIFYING",
      updatedAt: new Date(),
    })
    .returning();

  if (parsed.lastVerifiedAt) {
    await db.insert(productRouteObservations).values({
      routeId: route.id,
      itemPriceCents: route.itemPriceCents,
      shippingCents: route.shippingCents,
      estimatedTaxCents: route.estimatedTaxCents,
      totalCustomerPriceCents: route.totalCustomerPriceCents,
      stockState: "UNKNOWN",
      deliveryMinDays: route.deliveryMinDays,
      deliveryMaxDays: route.deliveryMaxDays,
      evidenceRef: route.evidenceRef,
      observedAt: parsed.lastVerifiedAt,
    });
  }

  return NextResponse.json(
    {
      route,
      authority: "ROUTE_QUALIFICATION_ONLY",
      nextGate: "ROUTE_ACTIVATION",
    },
    { status: 201 }
  );
}
