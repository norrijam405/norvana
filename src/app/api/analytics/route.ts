import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, orders, subscribers } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const [productCount] = await db.select({ count: sql<number>`count(*)::int` }).from(products);
    const [orderCount] = await db.select({ count: sql<number>`count(*)::int` }).from(orders);
    const [subCount] = await db.select({ count: sql<number>`count(*)::int` }).from(subscribers);
    const [revenue] = await db.select({ total: sql<number>`COALESCE(sum(total), 0)` }).from(orders);

    // Sales by niche
    const nicheData = await db.execute(sql`
      SELECT p.niche, COUNT(*)::int as product_count, COALESCE(SUM(p.price), 0) as total_value
      FROM products p
      GROUP BY p.niche
      ORDER BY total_value DESC
    `);

    return NextResponse.json({
      products: productCount.count,
      orders: orderCount.count,
      subscribers: subCount.count,
      revenue: revenue.total,
      nicheBreakdown: nicheData.rows,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Analytics failed" }, { status: 500 });
  }
}
