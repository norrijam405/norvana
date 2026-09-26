import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { watchJobs } from "@/db/schema";
import { requireRecoveryAdmin } from "@/lib/admin-guard";

const SAFE_STATUS = new Set(["PAUSED", "ENABLED"]);
const SAFE_AUTHORITY = new Set(["OBSERVE", "RECOMMEND"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = requireRecoveryAdmin(req);
  if (gate) return gate;

  const { id } = await params;
  const jobId = Number(id);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return NextResponse.json({ error: "Invalid job id." }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (body.status !== undefined) {
    const status = String(body.status).toUpperCase();
    if (!SAFE_STATUS.has(status)) {
      return NextResponse.json({ error: "Invalid Watchtower status." }, { status: 400 });
    }
    updates.status = status;
    if (status === "ENABLED") {
      updates.nextRunAt = new Date();
    }
  }

  if (body.authority !== undefined) {
    const authority = String(body.authority).toUpperCase();
    if (!SAFE_AUTHORITY.has(authority)) {
      return NextResponse.json(
        { error: "ACT authority is locked in R0." },
        { status: 400 }
      );
    }
    updates.authority = authority;
  }

  if (body.cadenceMinutes !== undefined) {
    updates.cadenceMinutes = Math.max(60, Number(body.cadenceMinutes) || 1440);
  }

  if (body.instructions !== undefined) {
    updates.instructions = String(body.instructions);
  }

  const [job] = await db
    .update(watchJobs)
    .set(updates)
    .where(eq(watchJobs.id, jobId))
    .returning();

  if (!job) {
    return NextResponse.json({ error: "Watchtower job not found." }, { status: 404 });
  }

  return NextResponse.json(job);
}
