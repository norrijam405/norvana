import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const productReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.productId, product.id))
      .orderBy(desc(reviews.createdAt));
    return NextResponse.json({ ...product, reviews: productReviews });
  } catch (error) {
    console.error("Product GET error:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
