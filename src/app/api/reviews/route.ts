import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews, products } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [review] = await db.insert(reviews).values(body).returning();

    // Update product rating and review count
    await db.execute(sql`
      UPDATE products SET
        review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = ${body.productId}),
        rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = ${body.productId})
      WHERE id = ${body.productId}
    `);

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Reviews POST error:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
