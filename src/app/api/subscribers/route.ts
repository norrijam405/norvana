import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
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
    const [sub] = await db.insert(subscribers).values({ email }).onConflictDoNothing().returning();
    if (!sub) {
      return NextResponse.json({ message: "Already subscribed" });
    }
    return NextResponse.json(sub, { status: 201 });
  } catch (error) {
    console.error("Subscribers POST error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
