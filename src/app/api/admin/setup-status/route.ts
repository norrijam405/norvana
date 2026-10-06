import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export async function GET() {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json(
      { error: "Not found." },
      { status: 404, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
  let databaseReachable = false;
  let ownerIdentityPresent = false;

  try {
    await db.execute(sql`SELECT 1`);
    databaseReachable = true;

    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'admin_users'
      ) AS table_exists
    `);

    const tableExists = Boolean(result.rows?.[0]?.table_exists);

    if (tableExists) {
      const owner = await db.execute(sql`
        SELECT EXISTS (
          SELECT 1
          FROM admin_users
          WHERE username = 'owner'
        ) AS owner_exists
      `);
      ownerIdentityPresent = Boolean(owner.rows?.[0]?.owner_exists);
    }
  } catch {
    databaseReachable = false;
  }

  const sessionSecretConfigured = Boolean(process.env.NORVANA_ADMIN_SESSION_SECRET);
  const bootstrapCredentialConfigured = Boolean(
    process.env.NORVANA_ADMIN_PASSWORD_SALT &&
      process.env.NORVANA_ADMIN_PASSWORD_HASH
  );
  const recoverySecretConfigured = Boolean(process.env.NORVANA_ADMIN_RECOVERY_SECRET);
  const recoveryEnabled = process.env.NORVANA_ADMIN_RECOVERY_ENABLED === "true";
  const schedulerSecretConfigured = Boolean(process.env.NORVANA_WATCHTOWER_CRON_SECRET);
  const workerSecretConfigured = Boolean(process.env.NORVANA_WATCHTOWER_WORKER_SECRET);
  const queueEnabled = process.env.NORVANA_WATCHTOWER_QUEUE_ENABLED === "true";
  const executorEnabled = process.env.NORVANA_WATCHTOWER_EXECUTOR_ENABLED === "true";

  return NextResponse.json(
    {
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
      databaseReachable,
      ownerIdentityPresent,
      sessionSecretConfigured,
      bootstrapCredentialConfigured,
      recoverySecretConfigured,
      recoveryEnabled,
      schedulerSecretConfigured,
      workerSecretConfigured,
      queueEnabled,
      executorEnabled,
      externalFulfillmentEnabled:
        process.env.NORVANA_EXTERNAL_FULFILLMENT_ENABLED === "true",
      supplierConnectorsEnabled:
        process.env.NORVANA_SUPPLIER_CONNECTORS_ENABLED === "true",
      igniaquaFederationEnabled:
        process.env.IGNIAQUA_FEDERATION_ENABLED === "true",
      safeToBootstrap:
        databaseReachable &&
        sessionSecretConfigured &&
        (ownerIdentityPresent || bootstrapCredentialConfigured),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
