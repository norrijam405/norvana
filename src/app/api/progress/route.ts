import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { progressNotes } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const all = await db.select().from(progressNotes).orderBy(desc(progressNotes.createdAt));
    return NextResponse.json(all);
  } catch (error) {
    console.error("Progress GET error:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [note] = await db.insert(progressNotes).values(body).returning();
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Progress POST error:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
