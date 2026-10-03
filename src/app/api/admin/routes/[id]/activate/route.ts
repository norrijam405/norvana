import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  actionReceipts,
  productRoutes,
} from "@/db/schema";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import {
  evaluateRouteActivationReadiness,
  routeActivationThresholdsFromEnv,
} from "@/lib/governance/activation";

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

  const activationEvidenceRef = clean(body.activationEvidenceRef, 1500);
  if (!activationEvidenceRef) {
    return NextResponse.json(
      { error: "Activation evidence reference is required." },
      { status: 409 }
    );
  }

  const thresholdResult = routeActivationThresholdsFromEnv();
  if (!thresholdResult.ok) {
    return NextResponse.json(
      { error: "Route activation policy is not configured.", code: thresholdResult.code },
      { status: 503 }
    );
  }

  const [route] = await db
    .select()
    .from(productRoutes)
    .where(eq(productRoutes.id, routeId))
    .limit(1);

  if (!route) return NextResponse.json({ error: "Route not found." }, { status: 404 });

  const readiness = evaluateRouteActivationReadiness(
    route,
    thresholdResult.policy
  );

  if (!readiness.ready) {
    return NextResponse.json(
      { error: "Route is not ready for activation.", blockers: readiness.blockers },
      { status: 409 }
    );
  }

  try {
    const activated = await db.transaction(async (tx) => {
      const now = new Date();
      const [updated] = await tx
        .update(productRoutes)
        .set({ status: "ACTIVE", updatedAt: now })
        .where(
          and(
            eq(productRoutes.id, routeId),
            eq(productRoutes.status, "QUALIFYING"),
            eq(productRoutes.updatedAt, route.updatedAt)
          )
        )
        .returning();

      if (!updated) throw new Error("ROUTE_CHANGED_BEFORE_ACTIVATION");

      await tx.insert(actionReceipts).values({
        actionType: "PRODUCT_ROUTE_ACTIVATE",
        authorityClass: "ACT",
        subjectType: "product_route",
        subjectId: String(updated.id),
        status: "PASS",
        actor: "owner",
        details: {
          productId: updated.productId,
          routeType: updated.routeType,
          providerSlug: updated.providerSlug,
          activationEvidenceRef,
          minContributionCents: thresholdResult.policy.minContributionCents,
          minContributionMarginBps: thresholdResult.policy.minContributionMarginBps,
        },
      });

      return updated;
    });

    return NextResponse.json({
      route: activated,
      authority: "ADMIN_ACT_WITH_EVIDENCE",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ROUTE_ACTIVATION_FAILED" },
      { status: 409 }
    );
  }
}
