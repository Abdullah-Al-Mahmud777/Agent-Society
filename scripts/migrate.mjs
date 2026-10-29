import { createClient } from "@libsql/client";
import { applyMigrations } from "../src/lib/db/schema.mjs";

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN || process.env.TURSO_DB_TOKEN;

if (!url) {
  console.error("Missing TURSO_DATABASE_URL. Add it to .env.local.");
  process.exit(1);
}

if (!url.startsWith("file:") && !url.startsWith(":memory:") && !authToken) {
  console.error("Missing TURSO_AUTH_TOKEN. Create one with:");
  console.error("  turso db tokens create <database-name>");
  console.error("Then add it to .env.local as TURSO_AUTH_TOKEN.");
  process.exit(1);
}

const client = createClient({
  url,
  authToken: authToken || undefined,
  intMode: "number",
});

try {
  await client.execute("PRAGMA foreign_keys = ON");
  await applyMigrations(client);

  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  const indexes = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );

  console.log("[db] Migration complete.");
  console.log(`[db] Tables (${tables.rows.length}): ${tables.rows.map((row) => row.name).join(", ")}`);
  console.log(`[db] Indexes (${indexes.rows.length}): ${indexes.rows.map((row) => row.name).join(", ")}`);
} catch (error) {
  console.error("[db] Migration failed:", error.message);
  process.exitCode = 1;
} finally {
  client.close();
}
