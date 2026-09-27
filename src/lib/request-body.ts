import type { NextRequest } from "next/server";

export type LimitedJsonResult =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; status: number; error: string; code: string };

export async function readJsonObjectLimited(
  req: NextRequest,
  maxBytes: number
): Promise<LimitedJsonResult> {
  const declaredLength = Number(req.headers.get("content-length") || 0);

  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return {
      ok: false,
      status: 413,
      error: "Request payload is too large.",
      code: "NORVANA_REQUEST_TOO_LARGE",
    };
  }

  const raw = await req.text();
  if (Buffer.byteLength(raw, "utf8") > maxBytes) {
    return {
      ok: false,
      status: 413,
      error: "Request payload is too large.",
      code: "NORVANA_REQUEST_TOO_LARGE",
    };
  }

  if (!raw) return { ok: true, body: {} };

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        ok: false,
        status: 400,
        error: "Request payload must be a JSON object.",
        code: "NORVANA_INVALID_JSON_OBJECT",
      };
    }

    return { ok: true, body: parsed as Record<string, unknown> };
  } catch {
    return {
      ok: false,
      status: 400,
      error: "Request payload must be valid JSON.",
      code: "NORVANA_INVALID_JSON",
    };
  }
}
