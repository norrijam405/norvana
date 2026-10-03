import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { actionReceipts, productRoutes } from "@/db/schema";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";

function clean(value: unknown, max: number) {
  return String(value || "").trim().slice(0, max);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  const { id } = await params;
  const routeId = Number(id);
  if (!Number.isInteger(routeId) || routeId <= 0) {
    return NextResponse.json({ error: "Invalid route id." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const suspensionEvidenceRef = clean(body.suspensionEvidenceRef, 1500);
  const reason = clean(body.reason, 1000);

  if (!suspensionEvidenceRef) {
    return NextResponse.json(
      { error: "Suspension evidence reference is required." },
      { status: 409 }
    );
  }

  const [route] = await db
    .select()
    .from(productRoutes)
    .where(eq(productRoutes.id, routeId))
    .limit(1);

  if (!route) return NextResponse.json({ error: "Route not found." }, { status: 404 });
  if (route.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Only ACTIVE routes can be suspended." },
      { status: 409 }
    );
  }

  try {
    const suspended = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(productRoutes)
        .set({
          status: "SUSPENDED",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(productRoutes.id, routeId),
            eq(productRoutes.status, "ACTIVE"),
            eq(productRoutes.updatedAt, route.updatedAt)
          )
        )
        .returning();

      if (!updated) throw new Error("ROUTE_CHANGED_BEFORE_SUSPENSION");

      await tx.insert(actionReceipts).values({
        actionType: "PRODUCT_ROUTE_SUSPEND",
        authorityClass: "ACT",
        subjectType: "product_route",
        subjectId: String(updated.id),
        status: "PASS",
        actor: "owner",
        details: {
          productId: updated.productId,
          routeType: updated.routeType,
          providerSlug: updated.providerSlug,
          suspensionEvidenceRef,
          reason,
        },
      });

      return updated;
    });

    return NextResponse.json({
      route: suspended,
      authority: "ADMIN_ACT_ROUTE_SUSPENSION",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ROUTE_SUSPENSION_FAILED" },
      { status: 409 }
    );
  }
}
