import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { suppliers, supplierCredentials } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireRecoveryAdmin } from "@/lib/admin-guard";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = requireRecoveryAdmin(req);
  if (gate) return gate;

  try {
    const { id } = await params;
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, parseInt(id)));
    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }
    
    // Get credentials (but hide sensitive data)
    const [creds] = await db
      .select()
      .from(supplierCredentials)
      .where(eq(supplierCredentials.supplierId, parseInt(id)));

    return NextResponse.json({
      ...supplier,
      hasCredentials: !!creds,
      credentialFields: creds ? {
        hasApiKey: !!creds.apiKey,
        hasAccessToken: !!creds.accessToken,
        shopDomain: creds.shopDomain || null,
      } : null,
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
  try {
    const { id } = await params;
    const body = await req.json();
    
    // Update supplier
    const [supplier] = await db
      .update(suppliers)
      .set({
        name: body.name,
        type: body.type,
        platform: body.platform,
        url: body.url,
        contactEmail: body.contactEmail,
        notes: body.notes,
        niches: body.niches,
        isActive: body.isActive,
        autoFulfill: body.autoFulfill,
      })
      .where(eq(suppliers.id, parseInt(id)))
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
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Delete credentials first
    await db.delete(supplierCredentials).where(eq(supplierCredentials.supplierId, parseInt(id)));
    
    // Delete supplier
    await db.delete(suppliers).where(eq(suppliers.id, parseInt(id)));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Supplier DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 });
  }
}
