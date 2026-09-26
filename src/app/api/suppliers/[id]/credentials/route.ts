import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { supplierCredentials, suppliers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSupplierConnector, type SupplierPlatform } from "@/lib/supplier-integrations";
import { requireRecoveryAdmin } from "@/lib/admin-guard";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = requireRecoveryAdmin(req);
  if (gate) return gate;

  try {
    const { id } = await params;
    const body = await req.json();
    const supplierId = parseInt(id);

    // Get supplier to know the platform
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, supplierId));
    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    // Delete existing credentials
    await db.delete(supplierCredentials).where(eq(supplierCredentials.supplierId, supplierId));

    // Insert new credentials
    const [creds] = await db
      .insert(supplierCredentials)
      .values({
        supplierId,
        apiKey: body.apiKey || null,
        apiSecret: body.apiSecret || null,
        accessToken: body.accessToken || null,
        shopDomain: body.shopDomain || null,
        webhookSecret: body.webhookSecret || null,
        additionalConfig: body.additionalConfig || {},
      })
      .returning();

    // Test connection if platform supports it
    if (supplier.platform) {
      const connector = createSupplierConnector(supplier.platform as SupplierPlatform, {
        apiKey: body.apiKey,
        apiSecret: body.apiSecret,
        accessToken: body.accessToken,
        shopDomain: body.shopDomain,
        additionalConfig: body.additionalConfig,
      });

      if (connector) {
        const testResult = await connector.testConnection();
        return NextResponse.json({
          credentials: { id: creds.id, supplierId },
          connectionTest: testResult,
        });
      }
    }

    return NextResponse.json({ credentials: { id: creds.id, supplierId } });
  } catch (error) {
    console.error("Credentials POST error:", error);
    return NextResponse.json({ error: "Failed to save credentials" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = requireRecoveryAdmin(req);
  if (gate) return gate;

  try {
    const { id } = await params;
    await db.delete(supplierCredentials).where(eq(supplierCredentials.supplierId, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Credentials DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete credentials" }, { status: 500 });
  }
}
