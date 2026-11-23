import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const HOUSE_SCHEMA = "igniaqua.house.app-handshake.v1";
const APP_ID = "acre-era";
const PANEL_ID = "IGNIAQUA_CONTROL_PANEL";
const MAX_CLOCK_SKEW_SECONDS = 90;
const MAX_BODY_BYTES = 16_384;
const REPLAY_TTL_MS = 180_000;
const MAX_REPLAY_ENTRIES = 10_000;
const PRUNE_INTERVAL_MS = 30_000;
const REPLAY_FILE_PATTERN = /^nonce-([a-f0-9]{64})\.json$/;
const REPLAY_STORE_SCHEMA = "acre-era.house-handshake-nonce.v1";

type Environment = NodeJS.ProcessEnv;
type ReplayProtection = "PROCESS_LOCAL" | "DURABLE";
type ReplayDecision = "STORED" | "REPLAY" | "FULL";
type HandlerOptions = { env?: Environment; now?: () => number };
type HouseRequest = {
  schema: string; kind: string; sender: string; recipient: string;
  timestamp: number; nonce: string; signature: string;
};
type HouseResponse = {
  schema: string; kind: string; sender: string; recipient: string;
  timestamp: number; nonce: string; scope: "READ_ONLY_HEARTBEAT";
  writes_authorized: false; replay_protection: ReplayProtection;
  capabilities: []; signature: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function exactKeys(value: unknown, keys: string[]): value is Record<string, unknown> {
  return isRecord(value) && Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key));
}
function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("CANONICAL_NUMBER_INVALID");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  if (isRecord(value)) return "{" + Object.keys(value).sort().map((key) =>
    JSON.stringify(key) + ":" + canonicalJson(value[key])
  ).join(",") + "}";
  throw new Error("CANONICAL_VALUE_INVALID");
}
function requestMessage(input: Pick<HouseRequest, "timestamp" | "nonce">): string {
  return [HOUSE_SCHEMA, "request", PANEL_ID, APP_ID, String(input.timestamp), input.nonce].join("\n");
}
function responseMessage(response: Omit<HouseResponse, "signature">): string {
  const digest = crypto.createHash("sha256").update(canonicalJson(response.capabilities), "utf8").digest("hex");
  return [
    HOUSE_SCHEMA, "response", APP_ID, PANEL_ID, String(response.timestamp), response.nonce,
    response.scope, String(response.writes_authorized), response.replay_protection, digest
  ].join("\n");
}
function sign(secret: string, message: string): string {
  return crypto.createHmac("sha256", secret).update(message, "utf8").digest("hex");
}
function json(status: number, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store, max-age=0" }
  });
}
function createFileReplayStore(root: string) {
  if (!root.trim()) throw new Error("HOUSE_HANDSHAKE_REPLAY_DIR_REQUIRED");
  const directory = path.resolve(root);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  let activeCount = 0;
  let lastPruneAt = 0;
  function prune(nowMs: number, force = false): void {
    if (!force && nowMs - lastPruneAt < PRUNE_INTERVAL_MS) return;
    let count = 0;
    for (const name of fs.readdirSync(directory)) {
      const match = name.match(REPLAY_FILE_PATTERN);
      if (!match) continue;
      const file = path.join(directory, name);
      let record: Record<string, unknown> | null = null;
      try {
        const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
        if (isRecord(parsed)) record = parsed;
      } catch {}
      if (record && record.schema === REPLAY_STORE_SCHEMA &&
          record.nonce_sha256 === match[1] &&
          Number.isSafeInteger(record.expires_at_ms) &&
          typeof record.expires_at_ms === "number" &&
          record.expires_at_ms <= nowMs) {
        try { fs.unlinkSync(file); } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
        continue;
      }
      count++;
    }
    activeCount = count;
    lastPruneAt = nowMs;
  }
  function consume(nonce: string, nowMs: number): boolean {
    prune(nowMs);
    const hash = crypto.createHash("sha256").update(nonce, "utf8").digest("hex");
    const file = path.join(directory, "nonce-" + hash + ".json");
    let existing: Record<string, unknown> | null = null;
    try {
      const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
      if (isRecord(parsed)) existing = parsed;
    } catch {}
    if (existing) {
      if (existing.schema === REPLAY_STORE_SCHEMA && existing.nonce_sha256 === hash &&
          Number.isSafeInteger(existing.expires_at_ms) &&
          typeof existing.expires_at_ms === "number" &&
          existing.expires_at_ms <= nowMs) {
        try { fs.unlinkSync(file); } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
        activeCount = Math.max(0, activeCount - 1);
      } else {
        return false;
      }
    } else if (fs.existsSync(file)) {
      return false;
    }
    if (activeCount >= MAX_REPLAY_ENTRIES) throw new Error("HOUSE_HANDSHAKE_REPLAY_STORE_FULL");
    let fd: number;
    try { fd = fs.openSync(file, "wx", 0o600); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST") return false;
      throw error;
    }
    try {
      const payload = JSON.stringify({
        schema: REPLAY_STORE_SCHEMA, nonce_sha256: hash, expires_at_ms: nowMs + REPLAY_TTL_MS
      }) + "\n";
      fs.writeFileSync(fd, payload, "utf8");
      fs.fsyncSync(fd);
    } catch (error) {
      try { fs.closeSync(fd); } catch {}
      try { fs.unlinkSync(file); } catch {}
      throw error;
    }
    fs.closeSync(fd);
    activeCount++;
    return true;
  }
  prune(Date.now(), true);
  return { consume };
}
function rememberNonce(replay: Map<string, number>, nonce: string, nowMs: number): ReplayDecision {
  for (const [existing, expiresAt] of replay.entries()) {
    if (expiresAt <= nowMs) replay.delete(existing);
  }
  if (replay.has(nonce)) return "REPLAY";
  if (replay.size >= MAX_REPLAY_ENTRIES) return "FULL";
  replay.set(nonce, nowMs + REPLAY_TTL_MS);
  return "STORED";
}
export function createHouseHandshakeHandler(options: HandlerOptions = {}) {
  const env = options.env || process.env;
  const now = options.now || Date.now;
  const replay = new Map<string, number>();
  const replayDir = String(env.ACRE_ERA_HOUSE_HANDSHAKE_REPLAY_DIR || "").trim();
  let persistentReplayStore: ReturnType<typeof createFileReplayStore> | null = null;
  let replayStoreInitializationAttempted = false;
  function getPersistentReplayStore() {
    if (!replayStoreInitializationAttempted) {
      replayStoreInitializationAttempted = true;
      persistentReplayStore = createFileReplayStore(replayDir);
    }
    if (!persistentReplayStore) throw new Error("HOUSE_HANDSHAKE_REPLAY_STORE_UNAVAILABLE");
    return persistentReplayStore;
  }
  return async function handleHouseHandshake(request: Request): Promise<Response> {
    if (request.method !== "POST") return json(405, { error: "METHOD_NOT_ALLOWED" });
    const secret = String(env.IGNIAQUA_ACRE_ERA_CONTROL_PANEL_SECRET || "");
    if (Buffer.byteLength(secret, "utf8") < 32) return json(503, { error: "HOUSE_HANDSHAKE_NOT_CONFIGURED" });
    const reserved = [
      env.IGNIAQUA_OPERATOR_TOKEN, env.ACRE_ERA_ADMIN_TOKEN, env.DATABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY, env.STRIPE_SECRET_KEY, env.STRIPE_WEBHOOK_SECRET
    ].filter((value): value is string => typeof value === "string" && value.length > 0);
    if (reserved.some((value) => value === secret)) return json(503, { error: "HOUSE_HANDSHAKE_NOT_CONFIGURED" });

    const contentType = String(request.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("application/json")) return json(415, { error: "JSON_REQUIRED" });
    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      return json(413, { error: "REQUEST_TOO_LARGE" });
    }
    const reader = request.body?.getReader();
    if (!reader) return json(400, { error: "REQUEST_BODY_INVALID" });
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_BODY_BYTES) {
          await reader.cancel();
          return json(413, { error: "REQUEST_TOO_LARGE" });
        }
        chunks.push(value);
      }
    } catch {
      return json(400, { error: "REQUEST_BODY_INVALID" });
    }
    const bytes = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
    let body: unknown;
    try { body = JSON.parse(bytes.toString("utf8")); }
    catch { return json(400, { error: "JSON_INVALID" }); }
    const keys = ["schema", "kind", "sender", "recipient", "timestamp", "nonce", "signature"];
    if (!exactKeys(body, keys)) return json(400, { error: "HOUSE_HANDSHAKE_ENVELOPE_INVALID" });
    const input = body as HouseRequest;
    if (input.schema !== HOUSE_SCHEMA || input.kind !== "request" ||
        input.sender !== PANEL_ID || input.recipient !== APP_ID) {
      return json(400, { error: "HOUSE_HANDSHAKE_AUDIENCE_INVALID" });
    }
    const nowMs = now();
    if (!Number.isSafeInteger(input.timestamp) ||
        Math.abs(Math.floor(nowMs / 1000) - input.timestamp) > MAX_CLOCK_SKEW_SECONDS) {
      return json(400, { error: "HOUSE_HANDSHAKE_TIMESTAMP_INVALID" });
    }
    if (typeof input.nonce !== "string" || !/^[a-f0-9]{32}$/.test(input.nonce)) {
      return json(400, { error: "HOUSE_HANDSHAKE_NONCE_INVALID" });
    }
    if (typeof input.signature !== "string" || !/^[a-f0-9]{64}$/.test(input.signature)) {
      return json(401, { error: "HOUSE_HANDSHAKE_SIGNATURE_INVALID" });
    }
    const expected = sign(secret, requestMessage(input));
    const actual = Buffer.from(input.signature, "hex");
    const wanted = Buffer.from(expected, "hex");
    if (actual.length !== wanted.length || !crypto.timingSafeEqual(actual, wanted)) {
      return json(401, { error: "HOUSE_HANDSHAKE_SIGNATURE_INVALID" });
    }

    let replayProtection: ReplayProtection = "PROCESS_LOCAL";
    try {
      if (replayDir) {
        if (!getPersistentReplayStore().consume(input.nonce, nowMs)) {
          return json(409, { error: "HOUSE_HANDSHAKE_REPLAY_DENIED" });
        }
        replayProtection = "DURABLE";
      } else {
        const decision = rememberNonce(replay, input.nonce, nowMs);
        if (decision === "REPLAY") return json(409, { error: "HOUSE_HANDSHAKE_REPLAY_DENIED" });
        if (decision === "FULL") return json(503, { error: "HOUSE_HANDSHAKE_REPLAY_STORE_FULL" });
      }
    } catch (error) {
      const code = (error as Error)?.message === "HOUSE_HANDSHAKE_REPLAY_STORE_FULL"
        ? "HOUSE_HANDSHAKE_REPLAY_STORE_FULL"
        : "HOUSE_HANDSHAKE_REPLAY_STORE_UNAVAILABLE";
      return json(503, { error: code });
    }

    const unsigned: Omit<HouseResponse, "signature"> = {
      schema: HOUSE_SCHEMA, kind: "response", sender: APP_ID, recipient: PANEL_ID,
      timestamp: input.timestamp, nonce: input.nonce, scope: "READ_ONLY_HEARTBEAT",
      writes_authorized: false, replay_protection: replayProtection, capabilities: []
    };
    const response: HouseResponse = {
      ...unsigned,
      signature: sign(secret, responseMessage(unsigned))
    };
    return json(200, response as unknown as Record<string, unknown>);
  };
}
