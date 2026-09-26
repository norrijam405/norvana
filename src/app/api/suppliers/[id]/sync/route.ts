import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { suppliers, supplierCredentials, supplierProducts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSupplierConnector, type SupplierPlatform } from "@/lib/supplier-integrations";
import { requireRecoveryAdmin, requireSupplierConnectorsEnabled } from "@/lib/admin-guard";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = requireRecoveryAdmin(req);
  if (gate) return gate;
  const connectorGate = requireSupplierConnectorsEnabled();
  if (connectorGate) return connectorGate;

  try {
    const { id } = await params;
    const supplierId = parseInt(id);

    // Get supplier and credentials
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, supplierId));
    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const [creds] = await db
      .select()
      .from(supplierCredentials)
      .where(eq(supplierCredentials.supplierId, supplierId));

    if (!creds) {
      return NextResponse.json({ error: "No credentials configured" }, { status: 400 });
    }

    // Create connector
    const connector = createSupplierConnector(supplier.platform as SupplierPlatform, {
      apiKey: creds.apiKey || undefined,
      apiSecret: creds.apiSecret || undefined,
      accessToken: creds.accessToken || undefined,
      shopDomain: creds.shopDomain || undefined,
      additionalConfig: creds.additionalConfig as Record<string, string> | undefined,
    });

    if (!connector) {
      return NextResponse.json({ error: "Platform not supported for sync" }, { status: 400 });
    }

    // Sync products
    const result = await connector.syncProducts();

    if (!result.success) {
      return NextResponse.json({ error: result.errors.join(", ") }, { status: 500 });
    }

    // Upsert products
    let imported = 0;
    let updated = 0;

    for (const product of result.products) {
      const existing = await db
        .select()
        .from(supplierProducts)
        .where(eq(supplierProducts.externalId, product.externalId));

      if (existing.length > 0) {
        await db
          .update(supplierProducts)
          .set({
            name: product.name,
            description: product.description,
            wholesalePrice: product.wholesalePrice,
            retailPrice: product.retailPrice,
            inventory: product.inventory,
            category: product.category,
            images: product.images,
            variants: product.variants,
            lastSyncAt: new Date(),
          })
          .where(eq(supplierProducts.id, existing[0].id));
        updated++;
      } else {
        await db.insert(supplierProducts).values({
          supplierId,
          externalId: product.externalId,
          sku: product.sku,
          name: product.name,
          description: product.description,
          wholesalePrice: product.wholesalePrice,
          retailPrice: product.retailPrice,
          inventory: product.inventory,
          category: product.category,
          images: product.images,
          variants: product.variants,
        });
        imported++;
      }
    }

    return NextResponse.json({
      success: true,
      synced: result.products.length,
      imported,
      updated,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
