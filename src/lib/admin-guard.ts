import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminSessionFromRequest } from "@/lib/admin-session";

const ADMIN_HEADER = "x-norvana-admin-token";

function constantTimeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function requireBrowserSameOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");

  if (!origin || !host) {
    return NextResponse.json(
      { error: "Same-origin browser request required.", code: "NORVANA_SAME_ORIGIN_REQUIRED" },
      { status: 403 }
    );
  }

  try {
    const originUrl = new URL(origin);
    if (originUrl.host !== host) {
      return NextResponse.json(
        { error: "Cross-origin browser mutation rejected.", code: "NORVANA_CROSS_ORIGIN_REJECTED" },
        { status: 403 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid request origin.", code: "NORVANA_INVALID_ORIGIN" },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Temporary recovery boundary for privileged server mutations.
 *
 * This is intentionally NOT browser authentication. The Engine Room must use a
 * real server-side identity/session system before it is re-enabled for people.
 *
 * Until then, privileged endpoints fail closed unless a server-to-server caller
 * presents NORVANA_ADMIN_API_TOKEN in x-norvana-admin-token.
 */
export function requireRecoveryAdmin(req: NextRequest): NextResponse | null {
  const configured = process.env.NORVANA_ADMIN_API_TOKEN;
  const supplied = req.headers.get(ADMIN_HEADER);

  if (configured && supplied && constantTimeEqual(configured, supplied)) {
    return null;
  }

  if (adminSessionFromRequest(req)) {
    return requireBrowserSameOrigin(req);
  }

  if (!configured && !process.env.NORVANA_ADMIN_SESSION_SECRET) {
    return NextResponse.json(
      {
        error: "Privileged Norvana mutations are disabled during recovery.",
        code: "NORVANA_ADMIN_BOUNDARY_NOT_CONFIGURED",
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { error: "Unauthorized.", code: "NORVANA_ADMIN_AUTH_REQUIRED" },
    { status: 401 }
  );
}

export function requireExternalFulfillmentEnabled(): NextResponse | null {
  if (process.env.NORVANA_EXTERNAL_FULFILLMENT_ENABLED !== "true") {
    return NextResponse.json(
      {
        error: "External supplier fulfillment is disabled during recovery.",
        code: "NORVANA_EXTERNAL_FULFILLMENT_DISABLED",
      },
      { status: 503 }
    );
  }
  return null;
}

export function requireSupplierConnectorsEnabled(): NextResponse | null {
  if (process.env.NORVANA_SUPPLIER_CONNECTORS_ENABLED !== "true") {
    return NextResponse.json(
      {
        error: "Supplier connectors are disabled during recovery.",
        code: "NORVANA_SUPPLIER_CONNECTORS_DISABLED",
      },
      { status: 503 }
    );
  }
  return null;
}
