import { NextRequest, NextResponse } from "next/server";
import { runCJLiveReadOnlyProbe } from "@/lib/supplier-gateway/cj/live-client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json(
      {
        error: "CJ live read proving is Preview-only.",
        code: "NORVANA_CJ_LIVE_PROBE_PREVIEW_ONLY",
      },
      { status: 403 }
    );
  }

  if (process.env.NORVANA_EXTERNAL_FULFILLMENT_ENABLED === "true") {
    return NextResponse.json(
      {
        error: "External fulfillment must remain disabled during CJ read proving.",
        code: "NORVANA_CJ_LIVE_PROBE_REQUIRES_FULFILLMENT_OFF",
      },
      { status: 409 }
    );
  }

  if (process.env.IGNIAQUA_FEDERATION_ENABLED === "true") {
    return NextResponse.json(
      {
        error: "IgniAqua federation must remain disabled during CJ read proving.",
        code: "NORVANA_CJ_LIVE_PROBE_REQUIRES_FEDERATION_OFF",
      },
      { status: 409 }
    );
  }

  if (req.nextUrl.searchParams.get("confirm") !== "RUN_CJ_READ_ONLY_PROBE") {
    return NextResponse.json(
      {
        ready: true,
        mode: "CJ_LIVE_READ_ONLY_PROBE",
        execution: "NOT_STARTED",
        message:
          "Pass confirm=RUN_CJ_READ_ONLY_PROBE to perform one controlled read-only CJ probe.",
      },
      {
        status: 200,
        headers: { "cache-control": "no-store" },
      }
    );
  }

  const apiKey = process.env.NORVANA_CJ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "CJ API key is not bound to this Preview.",
        code: "NORVANA_CJ_CREDENTIAL_NOT_BOUND",
      },
      { status: 503, headers: { "cache-control": "no-store" } }
    );
  }

  try {
    const result = await runCJLiveReadOnlyProbe(apiKey);
    return NextResponse.json(result, {
      status: 200,
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    const code =
      error instanceof Error ? error.message : "CJ_LIVE_PROBE_FAILED";
    return NextResponse.json(
      {
        result: "FAIL",
        code,
        finalState: "STOPPED_NO_ORDER_NO_PUBLICATION",
      },
      {
        status: 502,
        headers: { "cache-control": "no-store" },
      }
    );
  }
}
