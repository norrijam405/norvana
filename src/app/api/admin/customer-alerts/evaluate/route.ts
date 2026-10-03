import { NextRequest, NextResponse } from "next/server";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import {
  evaluateAndQueueCustomerAlerts,
} from "@/lib/customer-intent/alert-evaluator";

export async function POST(req: NextRequest) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const result = await evaluateAndQueueCustomerAlerts({
      eventType: String(body.eventType || ""),
      targetType: String(body.targetType || ""),
      targetKey: String(body.targetKey || ""),
      signalKey: String(body.signalKey || ""),
      evidenceRef: body.evidenceRef ? String(body.evidenceRef) : null,
      payload:
        body.payload && typeof body.payload === "object" && !Array.isArray(body.payload)
          ? (body.payload as Record<string, unknown>)
          : {},
    });

    return NextResponse.json({
      result,
      authority: "QUEUE_ONLY_NO_EXTERNAL_DELIVERY",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Alert evaluation failed." },
      { status: 400 }
    );
  }
}
