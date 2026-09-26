import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireRecoveryAdmin } from "@/lib/admin-guard";

function generateOrderNumber() {
  const prefix = "NRV";
  const num = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${num}`;
}

export async function GET(req: NextRequest) {
  const gate = requireRecoveryAdmin(req);
  if (gate) return gate;

  try {
    const all = await db.select().from(orders).orderBy(desc(orders.createdAt));
    return NextResponse.json(all);
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gate = requireRecoveryAdmin(req);
  if (gate) return gate;

  try {
    const body = await req.json();
    const orderNumber = generateOrderNumber();
    const [order] = await db
      .insert(orders)
      .values({ ...body, orderNumber })
      .returning();
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Orders POST error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
