import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { actionReceipts, productRoutes } from "@/db/schema";
import { safePartnerCheckoutUrl } from "@/lib/commerce/route-engine";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const routeId = Number(id);
  if (!Number.isInteger(routeId) || routeId <= 0) {
    return NextResponse.json({ error: "Invalid route id." }, { status: 400 });
  }

  const [route] = await db
    .select()
    .from(productRoutes)
    .where(eq(productRoutes.id, routeId))
    .limit(1);

  if (!route || route.status !== "ACTIVE") {
    return NextResponse.json({ error: "Route unavailable." }, { status: 404 });
  }

  if (route.checkoutOwner !== "PARTNER") {
    return NextResponse.json(
      { error: "This route uses Acre Era checkout." },
      { status: 409 }
    );
  }

  const destination = safePartnerCheckoutUrl(route.checkoutUrl);
  if (!destination || !route.evidenceRef || !route.lastVerifiedAt) {
    return NextResponse.json(
      { error: "Partner route is not sufficiently verified." },
      { status: 409 }
    );
  }

  await db.insert(actionReceipts).values({
    actionType: "ROUTE_HANDOFF",
    authorityClass: "OBSERVE",
    subjectType: "product_route",
    subjectId: String(route.id),
    status: "PASS",
    actor: "customer",
    details: {
      providerSlug: route.providerSlug,
      destinationHost: destination.hostname.toLowerCase(),
      routeType: route.routeType,
    },
  });

  return NextResponse.redirect(destination, 302);
}
