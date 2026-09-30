import { createPublicKey, timingSafeEqual, verify, type JsonWebKeyInput } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { evaluateGitHubHarnessClaims, evaluateGitHubObserveProofClaims } from "@/lib/watchtower/policy";

const GITHUB_OIDC_JWKS_URL = "https://token.actions.githubusercontent.com/.well-known/jwks";
const TOKEN_CLOCK_SKEW_SECONDS = 60;
const JWKS_CACHE_MS = 10 * 60 * 1000;

type GitHubJwk = JsonWebKey & { kid?: string; alg?: string; use?: string };

let jwksCache:
  | {
      fetchedAt: number;
      keys: GitHubJwk[];
    }
  | undefined;

function constantTimeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function decodeJsonSegment(segment: string): Record<string, unknown> | null {
  try {
    const decoded = Buffer.from(segment, "base64url").toString("utf8");
    const parsed: unknown = JSON.parse(decoded);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function githubJwks() {
  if (jwksCache && Date.now() - jwksCache.fetchedAt < JWKS_CACHE_MS) {
    return jwksCache.keys;
  }

  const response = await fetch(GITHUB_OIDC_JWKS_URL, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GitHub OIDC JWKS fetch failed with status ${response.status}.`);
  }

  const body: unknown = await response.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("GitHub OIDC JWKS response is invalid.");
  }

  const keys = (body as { keys?: unknown }).keys;
  if (!Array.isArray(keys)) {
    throw new Error("GitHub OIDC JWKS response has no keys.");
  }

  const normalized = keys.filter(
    (key): key is GitHubJwk => Boolean(key) && typeof key === "object" && !Array.isArray(key)
  );

  jwksCache = { fetchedAt: Date.now(), keys: normalized };
  return normalized;
}

async function verifyGitHubHarnessOidc(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return {
      ok: false as const,
      code: "WATCHTOWER_HARNESS_OIDC_MALFORMED",
      reason: "Harness OIDC token is malformed.",
    };
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeJsonSegment(encodedHeader);
  const claims = decodeJsonSegment(encodedPayload);

  if (!header || !claims) {
    return {
      ok: false as const,
      code: "WATCHTOWER_HARNESS_OIDC_MALFORMED",
      reason: "Harness OIDC token cannot be decoded.",
    };
  }

  if (String(header.alg || "") !== "RS256" || !String(header.kid || "")) {
    return {
      ok: false as const,
      code: "WATCHTOWER_HARNESS_OIDC_ALGORITHM_REJECTED",
      reason: "Harness OIDC token does not use an approved signing algorithm.",
    };
  }

  const keys = await githubJwks();
  const jwk = keys.find(
    (key) =>
      key.kid === String(header.kid) &&
      key.kty === "RSA" &&
      (!key.alg || key.alg === "RS256") &&
      (!key.use || key.use === "sig")
  );

  if (!jwk) {
    return {
      ok: false as const,
      code: "WATCHTOWER_HARNESS_OIDC_SIGNING_KEY_UNKNOWN",
      reason: "Harness OIDC signing key is not recognized.",
    };
  }

  let signatureValid = false;
  try {
    const key = createPublicKey({ key: jwk, format: "jwk" } as JsonWebKeyInput);
    signatureValid = verify(
      "RSA-SHA256",
      Buffer.from(`${encodedHeader}.${encodedPayload}`),
      key,
      Buffer.from(encodedSignature, "base64url")
    );
  } catch {
    signatureValid = false;
  }

  if (!signatureValid) {
    return {
      ok: false as const,
      code: "WATCHTOWER_HARNESS_OIDC_SIGNATURE_INVALID",
      reason: "Harness OIDC signature verification failed.",
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = Number(claims.exp);
  const nbf = Number(claims.nbf);
  const iat = Number(claims.iat);

  if (
    !Number.isFinite(exp) ||
    !Number.isFinite(nbf) ||
    !Number.isFinite(iat) ||
    exp < now - TOKEN_CLOCK_SKEW_SECONDS ||
    nbf > now + TOKEN_CLOCK_SKEW_SECONDS ||
    iat > now + TOKEN_CLOCK_SKEW_SECONDS
  ) {
    return {
      ok: false as const,
      code: "WATCHTOWER_HARNESS_OIDC_TIME_INVALID",
      reason: "Harness OIDC token is expired or not currently valid.",
    };
  }

  return evaluateGitHubHarnessClaims(claims);
}

export async function requireWatchtowerWorker(req: NextRequest): Promise<NextResponse | null> {
  const requestedMode = (req.headers.get("x-norvana-worker-mode") || "standard").toLowerCase();

  if (requestedMode === "harness") {
    if (process.env.VERCEL_ENV !== "preview") {
      return NextResponse.json(
        {
          error: "GitHub OIDC harness authentication is restricted to Vercel Preview.",
          code: "WATCHTOWER_HARNESS_OIDC_PREVIEW_ONLY",
        },
        { status: 409 }
      );
    }

    const token = req.headers.get("x-norvana-github-oidc-token");
    if (!token) {
      return NextResponse.json(
        {
          error: "GitHub OIDC harness token is required in the Norvana forwarding header.",
          code: "WATCHTOWER_HARNESS_OIDC_REQUIRED",
        },
        { status: 401 }
      );
    }

    try {
      const decision = await verifyGitHubHarnessOidc(token);
      if (!decision.ok) {
        return NextResponse.json(
          { error: decision.reason, code: decision.code },
          { status: 401 }
        );
      }
      return null;
    } catch (error) {
      console.error("Watchtower GitHub OIDC verification unavailable:", error);
      return NextResponse.json(
        {
          error: "GitHub OIDC verification is temporarily unavailable.",
          code: "WATCHTOWER_HARNESS_OIDC_VERIFICATION_UNAVAILABLE",
        },
        { status: 503 }
      );
    }
  }

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


async function verifyGitHubObserveProofOidc(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return {
      ok: false as const,
      code: "WATCHTOWER_OBSERVE_PROOF_OIDC_MALFORMED",
      reason: "Observe-proof OIDC token is malformed.",
    };
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeJsonSegment(encodedHeader);
  const claims = decodeJsonSegment(encodedPayload);

  if (!header || !claims) {
    return {
      ok: false as const,
      code: "WATCHTOWER_OBSERVE_PROOF_OIDC_MALFORMED",
      reason: "Observe-proof OIDC token cannot be decoded.",
    };
  }

  if (String(header.alg || "") !== "RS256" || !String(header.kid || "")) {
    return {
      ok: false as const,
      code: "WATCHTOWER_OBSERVE_PROOF_OIDC_ALGORITHM_REJECTED",
      reason: "Observe-proof OIDC token does not use an approved signing algorithm.",
    };
  }

  const keys = await githubJwks();
  const jwk = keys.find(
    (key) =>
      key.kid === String(header.kid) &&
      key.kty === "RSA" &&
      (!key.alg || key.alg === "RS256") &&
      (!key.use || key.use === "sig")
  );

  if (!jwk) {
    return {
      ok: false as const,
      code: "WATCHTOWER_OBSERVE_PROOF_OIDC_SIGNING_KEY_UNKNOWN",
      reason: "Observe-proof OIDC signing key is not recognized.",
    };
  }

  let signatureValid = false;
  try {
    const key = createPublicKey({ key: jwk, format: "jwk" } as JsonWebKeyInput);
    signatureValid = verify(
      "RSA-SHA256",
      Buffer.from(`${encodedHeader}.${encodedPayload}`),
      key,
      Buffer.from(encodedSignature, "base64url")
    );
  } catch {
    signatureValid = false;
  }

  if (!signatureValid) {
    return {
      ok: false as const,
      code: "WATCHTOWER_OBSERVE_PROOF_OIDC_SIGNATURE_INVALID",
      reason: "Observe-proof OIDC signature verification failed.",
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = Number(claims.exp);
  const nbf = Number(claims.nbf);
  const iat = Number(claims.iat);

  if (
    !Number.isFinite(exp) ||
    !Number.isFinite(nbf) ||
    !Number.isFinite(iat) ||
    exp < now - TOKEN_CLOCK_SKEW_SECONDS ||
    nbf > now + TOKEN_CLOCK_SKEW_SECONDS ||
    iat > now + TOKEN_CLOCK_SKEW_SECONDS
  ) {
    return {
      ok: false as const,
      code: "WATCHTOWER_OBSERVE_PROOF_OIDC_TIME_INVALID",
      reason: "Observe-proof OIDC token is expired or not currently valid.",
    };
  }

  return evaluateGitHubObserveProofClaims(claims);
}

export async function requireWatchtowerObserveProofWorker(
  req: NextRequest
): Promise<NextResponse | null> {
  if (process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json(
      {
        error: "GitHub OIDC observe-proof authentication is restricted to Vercel Preview.",
        code: "WATCHTOWER_OBSERVE_PROOF_OIDC_PREVIEW_ONLY",
      },
      { status: 409 }
    );
  }

  const token = req.headers.get("x-norvana-github-oidc-token");
  if (!token) {
    return NextResponse.json(
      {
        error: "GitHub OIDC observe-proof token is required in the Norvana forwarding header.",
        code: "WATCHTOWER_OBSERVE_PROOF_OIDC_REQUIRED",
      },
      { status: 401 }
    );
  }

  try {
    const decision = await verifyGitHubObserveProofOidc(token);
    if (!decision.ok) {
      return NextResponse.json(
        { error: decision.reason, code: decision.code },
        { status: 401 }
      );
    }
    return null;
  } catch (error) {
    console.error("Watchtower observe-proof GitHub OIDC verification unavailable:", error);
    return NextResponse.json(
      {
        error: "GitHub OIDC observe-proof verification is temporarily unavailable.",
        code: "WATCHTOWER_OBSERVE_PROOF_OIDC_VERIFICATION_UNAVAILABLE",
      },
      { status: 503 }
    );
  }
}
