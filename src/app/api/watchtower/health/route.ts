import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { watchJobs } from "@/db/schema";
import { requireRecoveryAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  const gate = requireRecoveryAdmin(req);
  if (gate) return gate;

  let initialized = false;
  let jobCount = 0;

  try {
    const jobs = await db.select({ id: watchJobs.id }).from(watchJobs);
    initialized = true;
    jobCount = jobs.length;
  } catch {
    initialized = false;
  }

  return NextResponse.json({
    initialized,
    jobCount,
    executorConfigured: false,
    schedulerConfigured: Boolean(process.env.NORVANA_WATCHTOWER_CRON_SECRET),
    externalActionsEnabled: false,
    federationConfigured:
      process.env.IGNIAQUA_FEDERATION_ENABLED === "true" &&
      Boolean(process.env.IGNIAQUA_FEDERATION_BASE_URL),
  });
}
