import {
  CJ_FORBIDDEN_R0_PATH_FRAGMENTS,
  CJ_READ_ONLY_ENDPOINTS,
} from "./types.ts";

export const CJ_CREDENTIAL_ENV_KEYS = {
  apiKey: "NORVANA_CJ_API_KEY",
  accessToken: "NORVANA_CJ_ACCESS_TOKEN",
  refreshToken: "NORVANA_CJ_REFRESH_TOKEN",
} as const;

export function evaluateCJEndpointR0(
  path: string
):
  | { ok: true; mode: "READ_ONLY_R0" }
  | { ok: false; code: string; reason: string } {
  const normalized = path.trim();

  if (
    CJ_FORBIDDEN_R0_PATH_FRAGMENTS.some((fragment) =>
      normalized.includes(fragment)
    )
  ) {
    return {
      ok: false,
      code: "NORVANA_CJ_ACT_ENDPOINT_LOCKED_R0",
      reason:
        "CJ order/payment/store-write/product-connection endpoints are not authorized in read-only qualification.",
    };
  }

  if (!Object.values(CJ_READ_ONLY_ENDPOINTS).includes(normalized)) {
    return {
      ok: false,
      code: "NORVANA_CJ_ENDPOINT_NOT_ADMITTED_R0",
      reason: "CJ endpoint is not in the explicit R0 read-only allowlist.",
    };
  }

  return { ok: true, mode: "READ_ONLY_R0" };
}

export function evaluateCJCredentialState(input: {
  accountEntitlementVerified: boolean;
  apiKeyPresent: boolean;
  accessTokenPresent: boolean;
}) {
  if (!input.accountEntitlementVerified) {
    return {
      ok: false as const,
      code: "NORVANA_CJ_ACCOUNT_ENTITLEMENT_NOT_VERIFIED",
      reason:
        "CJ account/API entitlement must be verified before authenticated read proving.",
    };
  }

  if (!input.apiKeyPresent && !input.accessTokenPresent) {
    return {
      ok: false as const,
      code: "NORVANA_CJ_CREDENTIAL_NOT_BOUND",
      reason: "No approved CJ backend credential is bound.",
    };
  }

  return { ok: true as const, mode: "READ_ONLY_R0" as const };
}

export function mapCJProviderFailure(input: {
  httpStatus?: number | null;
  code?: number | null;
  message?: string | null;
}) {
  if (input.httpStatus === 429 || input.code === 429) {
    return {
      code: "SUPPLIER_RATE_LIMITED" as const,
      retryBlindly: false as const,
    };
  }

  if (
    input.httpStatus === 401 ||
    input.httpStatus === 403 ||
    input.code === 1600001 ||
    /auth|token/i.test(input.message ?? "")
  ) {
    return {
      code: "SUPPLIER_AUTH_INVALID" as const,
      retryBlindly: false as const,
    };
  }

  return {
    code: "SUPPLIER_RESPONSE_INVALID" as const,
    retryBlindly: false as const,
  };
}
