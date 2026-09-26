import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

function constantTimeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function requireWatchtowerWorker(req: NextRequest): NextResponse | null {
  const expected = process.env.NORVANA_WATCHTOWER_WORKER_SECRET;
  const supplied = req.headers.get("x-norvana-watchtower-worker-secret");

  if (!expected) {
    return NextResponse.json(
      { error: "Watchtower worker is not configured.", code: "WATCHTOWER_WORKER_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  if (!supplied || !constantTimeEqual(expected, supplied)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return null;
}
