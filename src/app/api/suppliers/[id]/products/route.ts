import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { supplierProducts, products } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  try {
    const { id } = await params;
    const supplierId = parseInt(id);

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

// Import a supplier product to our catalog
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  try {
    const { id } = await params;
    const supplierId = parseInt(id);
    const body = await req.json();
    const { supplierProductId, markup = 2.0, niche, volumeNumber = 1 } = body;

    // Get supplier product
    const [supplierProduct] = await db
      .select()
      .from(supplierProducts)
      .where(eq(supplierProducts.id, supplierProductId));

    if (!supplierProduct) {
      return NextResponse.json({ error: "Supplier product not found" }, { status: 404 });
    }

    // Create slug
    const slug = supplierProduct.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Calculate retail price with markup
    const retailPrice = Math.round(supplierProduct.wholesalePrice * markup * 100) / 100;

    // Create product in our catalog
    const [product] = await db
      .insert(products)
      .values({
        name: supplierProduct.name,
        slug: `${slug}-${Date.now()}`, // Ensure unique
        description: supplierProduct.description,
        price: retailPrice,
        compareAtPrice: supplierProduct.retailPrice || null,
        cost: supplierProduct.wholesalePrice,
        niche: niche || supplierProduct.category || "general",
        volumeNumber,
        status: "active",
        supplierId,
        supplierSku: supplierProduct.sku,
        images: supplierProduct.images,
        inventory: supplierProduct.inventory,
        tags: [supplierProduct.category || "imported"].filter(Boolean),
      })
      .returning();

    // Mark as imported
    await db
      .update(supplierProducts)
      .set({ isImported: true, localProductId: product.id })
      .where(eq(supplierProducts.id, supplierProductId));

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
