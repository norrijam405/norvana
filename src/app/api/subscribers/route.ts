import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  try {
    const all = await db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
    return NextResponse.json(all);
  } catch (error) {
    console.error("Subscribers GET error:", error);
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const normalized = String(email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 255) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }
    const [sub] = await db.insert(subscribers).values({ email: normalized }).onConflictDoNothing().returning();
    if (!sub) {
      return NextResponse.json({ message: "Already subscribed" });
    }
    return NextResponse.json({ subscribed: true }, { status: 201 });
  } catch (error) {
    console.error("Subscribers POST error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
