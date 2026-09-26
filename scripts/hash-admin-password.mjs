import { pbkdf2Sync, randomBytes } from "node:crypto";

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error("Usage: node scripts/hash-admin-password.mjs '<password-at-least-12-chars>'");
  process.exit(1);
}

const iterations = 310000;
const salt = randomBytes(24).toString("hex");
const digest = pbkdf2Sync(password, salt, iterations, 64, "sha256").toString("hex");
const hash = `pbkdf2:${iterations}:sha256:${digest}`;
const sessionSecret = randomBytes(48).toString("hex");
const recoverySecret = randomBytes(32).toString("hex");
const cronSecret = randomBytes(32).toString("hex");
const workerSecret = randomBytes(32).toString("hex");

console.log("Set these as server-side Preview secrets. Do not commit their values:");
console.log(`NORVANA_ADMIN_PASSWORD_SALT=${salt}`);
console.log(`NORVANA_ADMIN_PASSWORD_HASH=${hash}`);
console.log(`NORVANA_ADMIN_SESSION_SECRET=${sessionSecret}`);
console.log("NORVANA_ADMIN_RECOVERY_ENABLED=false");
console.log(`NORVANA_ADMIN_RECOVERY_SECRET=${recoverySecret}`);
console.log(`NORVANA_WATCHTOWER_CRON_SECRET=${cronSecret}`);
console.log("NORVANA_WATCHTOWER_QUEUE_ENABLED=false");
console.log("NORVANA_WATCHTOWER_EXECUTOR_ENABLED=false");
console.log(`NORVANA_WATCHTOWER_WORKER_SECRET=${workerSecret}`);
