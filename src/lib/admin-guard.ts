import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_HEADER = "x-norvana-admin-token";

function constantTimeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
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

  if (!configured) {
    return NextResponse.json(
      {
        error: "Privileged Norvana mutations are disabled during recovery.",
        code: "NORVANA_ADMIN_BOUNDARY_NOT_CONFIGURED",
      },
      { status: 503 }
    );
  }

  if (!supplied || !constantTimeEqual(configured, supplied)) {
    return NextResponse.json(
      { error: "Unauthorized.", code: "NORVANA_ADMIN_AUTH_REQUIRED" },
      { status: 401 }
    );
  }

  return null;
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
