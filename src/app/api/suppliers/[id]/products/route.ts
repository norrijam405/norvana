import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { supplierProducts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  try {
    const { id } = await params;
    const supplierId = Number(id);
    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      return NextResponse.json({ error: "Invalid supplier id." }, { status: 400 });
    }

    const items = await db
      .select()
      .from(supplierProducts)
      .where(eq(supplierProducts.supplierId, supplierId))
      .orderBy(desc(supplierProducts.lastSyncAt));

    return NextResponse.json(items);
  } catch (error) {
    console.error("Supplier products GET error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  _context: { params: Promise<{ id: string }> }
) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  return NextResponse.json(
    {
      error: "Supplier product publication/import is locked in Norvana R0.",
      code: "NORVANA_SUPPLIER_PUBLICATION_LOCKED_R0",
      authority: "OBSERVE_RECOMMEND_ONLY",
      next:
        "Scout may recommend a supplier product, but publication requires a later explicit approved product-publication path.",
    },
    { status: 409 }
  );
}
