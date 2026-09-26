import { pbkdf2Sync, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";

function safeEqual(left: Buffer, right: Buffer) {
  return left.length === right.length && timingSafeEqual(left, right);
}

const PBKDF2_ITERATIONS = 310_000;

function pbkdf2SaltBytes(salt: string) {
  // Bootstrap/setup helpers generate a 24-byte random salt encoded as 48 hex chars.
  // PBKDF2 must use those original bytes, not the UTF-8 characters of the hex string.
  if (/^[0-9a-f]{48}$/i.test(salt)) {
    return Buffer.from(salt, "hex");
  }

  // Fail-compatible for any legacy/non-hex salt that may already exist.
  return Buffer.from(salt, "utf8");
}

function derivePbkdf2(password: string, salt: string, iterations = PBKDF2_ITERATIONS) {
  return pbkdf2Sync(password, pbkdf2SaltBytes(salt), iterations, 64, "sha256");
}

function verifyHash(password: string, salt: string, stored: string) {
  if (stored.startsWith("pbkdf2:")) {
    const [, iterationsRaw, digest, expectedHex] = stored.split(":");
    const iterations = Number(iterationsRaw);
    if (!iterations || digest !== "sha256" || !expectedHex) return false;
    const actual = derivePbkdf2(password, salt, iterations);
    return safeEqual(actual, Buffer.from(expectedHex, "hex"));
  }

  // Backward-compatible recovery for credentials generated before the PBKDF2 browser helper.
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(stored, "hex");
  return safeEqual(actual, expected);
}

export function bootstrapAdminConfigured() {
  return Boolean(
    process.env.NORVANA_ADMIN_PASSWORD_SALT &&
      process.env.NORVANA_ADMIN_PASSWORD_HASH
  );
}

export async function ensureAdminIdentityTable() {
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id serial PRIMARY KEY,
      username varchar(120) NOT NULL DEFAULT 'owner' UNIQUE,
      role varchar(30) NOT NULL DEFAULT 'owner',
      password_salt varchar(255) NOT NULL,
      password_hash varchar(255) NOT NULL,
      bootstrap_derived boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    );
  `));

  await db.execute(sql.raw(`
    ALTER TABLE admin_users
      ADD COLUMN IF NOT EXISTS bootstrap_derived boolean NOT NULL DEFAULT true;
  `));
}

export async function ownerIdentityExists() {
  try {
    await ensureAdminIdentityTable();
    const [owner] = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.username, "owner"))
      .limit(1);
    return Boolean(owner);
  } catch {
    return false;
  }
}

export async function ownerCredentialState() {
  try {
    await ensureAdminIdentityTable();
    const [owner] = await db
      .select({
        id: adminUsers.id,
        bootstrapDerived: adminUsers.bootstrapDerived,
      })
      .from(adminUsers)
      .where(eq(adminUsers.username, "owner"))
      .limit(1);

    return {
      exists: Boolean(owner),
      rotated: Boolean(owner && !owner.bootstrapDerived),
      bootstrapDerived: Boolean(owner?.bootstrapDerived),
    };
  } catch {
    return {
      exists: false,
      rotated: false,
      bootstrapDerived: false,
    };
  }
}

export async function ownerLoginConfigured() {
  return (await ownerIdentityExists()) || bootstrapAdminConfigured();
}

export async function verifyOwnerPassword(password: string) {
  if (!password) return false;

  await ensureAdminIdentityTable();

  const [owner] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.username, "owner"))
    .limit(1);

  if (owner) {
    return verifyHash(password, owner.passwordSalt, owner.passwordHash);
  }

  const salt = process.env.NORVANA_ADMIN_PASSWORD_SALT;
  const expectedHex = process.env.NORVANA_ADMIN_PASSWORD_HASH;
  if (!salt || !expectedHex || !verifyHash(password, salt, expectedHex)) {
    return false;
  }

  await db.insert(adminUsers).values({
    username: "owner",
    role: "owner",
    passwordSalt: salt,
    passwordHash: expectedHex,
    bootstrapDerived: true,
  });

  return true;
}

export async function setOwnerPassword(newPassword: string) {
  if (newPassword.length < 12) {
    return { ok: false as const, error: "New password must be at least 12 characters." };
  }

  await ensureAdminIdentityTable();

  const salt = randomBytes(24).toString("hex");
  const digest = derivePbkdf2(newPassword, salt).toString("hex");
  const hash = `pbkdf2:${PBKDF2_ITERATIONS}:sha256:${digest}`;

  await db
    .insert(adminUsers)
    .values({
      username: "owner",
      role: "owner",
      passwordSalt: salt,
      passwordHash: hash,
      bootstrapDerived: false,
    })
    .onConflictDoUpdate({
      target: adminUsers.username,
      set: {
        passwordSalt: salt,
        passwordHash: hash,
        bootstrapDerived: false,
        updatedAt: new Date(),
      },
    });

  return { ok: true as const };
}

export async function changeOwnerPassword(currentPassword: string, newPassword: string) {
  if (newPassword.length < 12) {
    return { ok: false as const, error: "New password must be at least 12 characters." };
  }

  const currentValid = await verifyOwnerPassword(currentPassword);
  if (!currentValid) {
    return { ok: false as const, error: "Current password is incorrect." };
  }

  return setOwnerPassword(newPassword);
}
