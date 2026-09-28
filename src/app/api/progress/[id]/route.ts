import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { progressNotes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  try {
    const { id } = await params;
    const body = await req.json();
    const [note] = await db
      .update(progressNotes)
      .set(body)
      .where(eq(progressNotes.id, parseInt(id)))
      .returning();
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    return NextResponse.json(note);
  } catch (error) {
    console.error("Progress PATCH error:", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  try {
    const { id } = await params;
    await db.delete(progressNotes).where(eq(progressNotes.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Progress DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
