import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireRecoveryAdmin } from "@/lib/admin-guard";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = requireRecoveryAdmin(req);
  if (gate) return gate;

  try {
    const { id } = await params;
    const body = await req.json();
    const [order] = await db
      .update(orders)
      .set({ status: body.status })
      .where(eq(orders.id, parseInt(id)))
      .returning();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    console.error("Order PATCH error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
