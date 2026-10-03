import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eraEvents, eraProducts, eras, products } from "@/db/schema";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import { parseEraProductAssignment } from "@/lib/era-engine/admin-validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  const { id } = await params;
  const eraId = Number(id);
  if (!Number.isInteger(eraId) || eraId <= 0) {
    return NextResponse.json({ error: "Invalid Era id." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseEraProductAssignment(body);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid Era product assignment." },
      { status: 400 }
    );
  }

  const [[era], [product]] = await Promise.all([
    db.select({ id: eras.id }).from(eras).where(eq(eras.id, eraId)).limit(1),
    db.select({ id: products.id, status: products.status }).from(products).where(eq(products.id, parsed.productId)).limit(1),
  ]);

  if (!era) return NextResponse.json({ error: "Era not found." }, { status: 404 });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  try {
    const [assignment] = await db
      .insert(eraProducts)
      .values({ eraId, ...parsed, status: "ACTIVE" })
      .returning();

    await db.insert(eraEvents).values({
      eraId,
      eventType: "PRODUCT_ASSIGNED",
      actor: "owner",
      payload: {
        assignmentId: assignment.id,
        productId: parsed.productId,
        productStatusAtAssignment: product.status,
        role: parsed.role,
      },
    });

    return NextResponse.json(
      {
        assignment,
        authority: "CURATION_ONLY",
        note: "Era membership does not publish the product or change its commerce/source truth.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Era product assignment failed:", error);
    return NextResponse.json({ error: "Product is already assigned to this Era." }, { status: 409 });
  }
}
