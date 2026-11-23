import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHouseHandshakeHandler } from "../src/lib/house-app-handshake.ts";

const SECRET = "synthetic-acre-era-house-secret-32-bytes";
const NOW = Date.now();
const SCHEMA = "igniaqua.house.app-handshake.v1";
function signedRequest(secret = SECRET, nonce = "ab".repeat(16), timestamp = Math.floor(NOW / 1000), overrides: Record<string, unknown> = {}): Request {
  const input: Record<string, unknown> = {
    schema: SCHEMA, kind: "request", sender: "IGNIAQUA_CONTROL_PANEL",
    recipient: "acre-era", timestamp, nonce, ...overrides
  };
  input.signature = crypto.createHmac("sha256", secret)
    .update([SCHEMA, "request", "IGNIAQUA_CONTROL_PANEL", "acre-era", String(input.timestamp), String(input.nonce)].join("\n"))
    .digest("hex");
  return new Request("http://localhost/api/house/v1/handshake", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input)
  });
}
function expectedSignature(response: Record<string, unknown>, replay: "PROCESS_LOCAL" | "DURABLE" = "PROCESS_LOCAL"): string {
  const digest = crypto.createHash("sha256").update(JSON.stringify(response.capabilities), "utf8").digest("hex");
  const message = [SCHEMA, "response", "acre-era", "IGNIAQUA_CONTROL_PANEL", String(response.timestamp),
    String(response.nonce), "READ_ONLY_HEARTBEAT", "false", replay, digest].join("\n");
  return crypto.createHmac("sha256", SECRET).update(message, "utf8").digest("hex");
}

test("valid House handshake returns a signed read-only Acre Era identity with no capability claim", async () => {
  const handler = createHouseHandshakeHandler({
    env: { IGNIAQUA_ACRE_ERA_CONTROL_PANEL_SECRET: SECRET }, now: () => NOW
  });
  const response = await handler(signedRequest());
  assert.equal(response.status, 200);
  const body = await response.json() as Record<string, unknown>;
  assert.equal(body.sender, "acre-era");
  assert.equal(body.recipient, "IGNIAQUA_CONTROL_PANEL");
  assert.equal(body.scope, "READ_ONLY_HEARTBEAT");
  assert.equal(body.writes_authorized, false);
  assert.equal(body.replay_protection, "PROCESS_LOCAL");
  assert.deepEqual(body.capabilities, []);
  assert.equal(body.signature, expectedSignature(body));
});

test("nonce replay is denied within a process and local fallback is labeled", async () => {
  const options = { env: { IGNIAQUA_ACRE_ERA_CONTROL_PANEL_SECRET: SECRET }, now: () => NOW };
  const first = createHouseHandshakeHandler(options);
  assert.equal((await first(signedRequest())).status, 200);
  assert.equal((await first(signedRequest())).status, 409);
  const restarted = createHouseHandshakeHandler(options);
  assert.equal((await restarted(signedRequest())).status, 200);
});

test("file-backed replay survives handler recreation and stores only the nonce hash", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "acre-era-house-replay-"));
  const nonce = "cd".repeat(16);
  try {
    const options = {
      env: { IGNIAQUA_ACRE_ERA_CONTROL_PANEL_SECRET: SECRET, ACRE_ERA_HOUSE_HANDSHAKE_REPLAY_DIR: root },
      now: () => NOW
    };
    const first = createHouseHandshakeHandler(options);
    const accepted = await first(signedRequest(SECRET, nonce));
    assert.equal(accepted.status, 200);
    const body = await accepted.json() as Record<string, unknown>;
    assert.equal(body.replay_protection, "DURABLE");
    assert.equal(body.signature, expectedSignature(body, "DURABLE"));
    const files = fs.readdirSync(root);
    assert.equal(files.length, 1);
    assert.match(files[0], /^nonce-[a-f0-9]{64}\.json$/);
    assert.equal(fs.readFileSync(path.join(root, files[0]), "utf8").includes(nonce), false);
    const restarted = createHouseHandshakeHandler(options);
    assert.equal((await restarted(signedRequest(SECRET, nonce)).then((r) => r.status)), 409);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("configured replay-store failures fail closed", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "acre-era-house-replay-fail-"));
  const blocked = path.join(root, "not-a-directory");
  fs.writeFileSync(blocked, "file");
  try {
    const handler = createHouseHandshakeHandler({
      env: { IGNIAQUA_ACRE_ERA_CONTROL_PANEL_SECRET: SECRET, ACRE_ERA_HOUSE_HANDSHAKE_REPLAY_DIR: blocked },
      now: () => NOW
    });
    const response = await handler(signedRequest(SECRET, "ef".repeat(16)));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, "HOUSE_HANDSHAKE_REPLAY_STORE_UNAVAILABLE");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("wrong audience, timestamp, signature, secret reuse, method, and content type fail closed", async () => {
  const handler = createHouseHandshakeHandler({
    env: { IGNIAQUA_ACRE_ERA_CONTROL_PANEL_SECRET: SECRET, DATABASE_URL: SECRET }, now: () => NOW
  });
  assert.equal((await handler(signedRequest())).status, 503);
  const valid = createHouseHandshakeHandler({
    env: { IGNIAQUA_ACRE_ERA_CONTROL_PANEL_SECRET: SECRET }, now: () => NOW
  });
  assert.equal((await valid(signedRequest(SECRET, "12".repeat(16), Math.floor(NOW / 1000) - 91))).status, 400);
  assert.equal((await valid(signedRequest(SECRET, "23".repeat(16), Math.floor(NOW / 1000), { recipient: "wrong" }))).status, 400);
  const tampered = await signedRequest(SECRET, "34".repeat(16);
  const body = await tampered.json() as Record<string, unknown>;
  body.signature = "0".repeat(64);
  assert.equal((await valid(new Request(tampered.url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }))).status, 401);
  assert.equal((await valid(new Request("http://localhost", { method: "GET" }))).status, 405);
  assert.equal((await valid(new Request("http://localhost", { method: "POST", headers: { "content-type": "text/plain" }, body: "{}" }))).status, 415);
});

test("oversized request bodies are rejected", async () => {
  const handler = createHouseHandshakeHandler({
    env: { IGNIAQUA_ACRE_ERA_CONTROL_PANEL_SECRET: SECRET }, now: () => NOW
  });
  const response = await handler(new Request("http://localhost", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ payload: "x".repeat(20_000) })
  }));
  assert.equal(response.status, 413);
});
