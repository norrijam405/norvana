import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { suppliers, supplierCredentials } from "@/db/schema";
import { eq } from "drizzle-orm";
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

    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, supplierId));
    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const [creds] = await db
      .select()
      .from(supplierCredentials)
      .where(eq(supplierCredentials.supplierId, supplierId));

    return NextResponse.json({
      ...supplier,
      hasCredentials: !!creds,
      credentialFields: creds
        ? {
            hasApiKey: !!creds.apiKey,
            hasAccessToken: !!creds.accessToken,
            shopDomain: creds.shopDomain || null,
          }
        : null,
      r0ExecutionAuthority: "LOCKED",
    });
  } catch (error) {
    console.error("Supplier GET error:", error);
    return NextResponse.json({ error: "Failed to fetch supplier" }, { status: 500 });
  }
}

export async function PATCH(
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

    const body = await req.json();

    if (body.isActive === true) {
      return NextResponse.json(
        {
          error: "Supplier activation is locked in Norvana R0.",
          code: "NORVANA_SUPPLIER_ACTIVATION_LOCKED_R0",
        },
        { status: 409 }
      );
    }

    if (body.autoFulfill === true) {
      return NextResponse.json(
        {
          error: "Automatic supplier fulfillment is locked in Norvana R0.",
          code: "NORVANA_SUPPLIER_AUTO_FULFILL_LOCKED_R0",
        },
        { status: 409 }
      );
    }

    const updates: Record<string, unknown> = {};
    for (const key of ["name", "type", "platform", "url", "contactEmail", "notes", "niches"]) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (body.isActive === false) updates.isActive = false;
    if (body.autoFulfill === false) updates.autoFulfill = false;

    const [supplier] = await db
      .update(suppliers)
      .set(updates)
      .where(eq(suppliers.id, supplierId))
      .returning();

    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Supplier PATCH error:", error);
    return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 });
  }
}

export async function DELETE(
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

    await db
      .delete(supplierCredentials)
      .where(eq(supplierCredentials.supplierId, supplierId));

    await db.delete(suppliers).where(eq(suppliers.id, supplierId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Supplier DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 });
  }
}
