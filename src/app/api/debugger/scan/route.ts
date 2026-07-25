import { NextResponse } from "next/server";
import { db } from "@/db";
import { debugLogs } from "@/db/schema";
import { runDiagnosticScan } from "@/lib/debugger";

export async function POST() {
  try {
    const result = runDiagnosticScan();
    await db.insert(debugLogs).values({
      scanId: result.scanId,
      status: result.status,
      summary: result.summary,
      issues: result.issues,
      backupCreated: result.backupCreated,
      fixesApplied: result.fixesApplied,
      duration: result.duration,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}
