import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/product-detail-client";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [product] = await db.select().from(products).where(eq(products.slug, slug));
  if (!product) notFound();

  const productReviews = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.productId, product.id), eq(reviews.moderationState, "PUBLISHED")))
    .orderBy(desc(reviews.createdAt));

  return <ProductDetailClient product={product} reviews={productReviews} />;
}
