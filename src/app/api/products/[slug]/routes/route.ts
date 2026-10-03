import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { productRoutes, products } from "@/db/schema";
import {
  findDominantCustomerRoute,
  isRouteFresh,
} from "@/lib/commerce/route-engine";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const [product] = await db
    .select({ id: products.id, slug: products.slug })
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.status, "active")))
    .limit(1);

  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const rows = await db
    .select({
      id: productRoutes.id,
      routeType: productRoutes.routeType,
      providerSlug: productRoutes.providerSlug,
      sellerName: productRoutes.sellerName,
      checkoutOwner: productRoutes.checkoutOwner,
      currency: productRoutes.currency,
      productCondition: productRoutes.productCondition,
      itemPriceCents: productRoutes.itemPriceCents,
      shippingCents: productRoutes.shippingCents,
      estimatedTaxCents: productRoutes.estimatedTaxCents,
      totalCustomerPriceCents: productRoutes.totalCustomerPriceCents,
      deliveryMinDays: productRoutes.deliveryMinDays,
      deliveryMaxDays: productRoutes.deliveryMaxDays,
      warrantySummary: productRoutes.warrantySummary,
      returnSummary: productRoutes.returnSummary,
      authorizationState: productRoutes.authorizationState,
      provenanceState: productRoutes.provenanceState,
      status: productRoutes.status,
      evidenceRef: productRoutes.evidenceRef,
      lastVerifiedAt: productRoutes.lastVerifiedAt,
    })
    .from(productRoutes)
    .where(
      and(
        eq(productRoutes.productId, product.id),
        eq(productRoutes.status, "ACTIVE")
      )
    )
    .orderBy(asc(productRoutes.totalCustomerPriceCents));

  const freshRoutes = rows.filter(
    (route) => route.evidenceRef && isRouteFresh(route)
  );

  const dominantRouteId = findDominantCustomerRoute(freshRoutes);

  return NextResponse.json(
    {
      productSlug: product.slug,
      routes: freshRoutes.map((route) => ({
        ...route,
        checkoutPath:
          route.checkoutOwner === "PARTNER"
            ? `/api/routes/${route.id}/checkout`
            : null,
        evidenceRef: undefined,
      })),
      dominantRouteId,
      comparisonBasis: "CUSTOMER_PRICE_DELIVERY_TRUST_ONLY",
      privateEconomicsUsedForRanking: false,
    },
    { headers: { "cache-control": "public, max-age=60, stale-while-revalidate=180" } }
  );
}
