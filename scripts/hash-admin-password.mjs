import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error("Usage: node scripts/hash-admin-password.mjs '<password-at-least-12-chars>'");
  process.exit(1);
}

const salt = randomBytes(24).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
const sessionSecret = randomBytes(48).toString("hex");

console.log("Set these as server-side secrets. Do not commit their values:");
console.log(`NORVANA_ADMIN_PASSWORD_SALT=${salt}`);
console.log(`NORVANA_ADMIN_PASSWORD_HASH=${hash}`);
console.log(`NORVANA_ADMIN_SESSION_SECRET=${sessionSecret}`);
