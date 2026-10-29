import { NextResponse } from "next/server";
import { checkDatabaseConnection, ensureSchema } from "@/lib/db/client";
import { getDatabaseOverview } from "@/lib/db/repositories";
import { getUserId, handleRouteError } from "@/lib/db/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const userId = await getUserId(request);
    const connected = await checkDatabaseConnection();
    const client = await ensureSchema();
    const [overview, migrations] = await Promise.all([
      getDatabaseOverview(userId),
      client.execute("SELECT version, name, applied_at FROM schema_migrations ORDER BY version"),
    ]);

    return NextResponse.json({
      success: true,
      connected,
      provider: "turso",
      userId,
      tables: overview.tables,
      counts: overview.counts,
      migrations: migrations.rows,
    });
  } catch (error) {
    return handleRouteError(error, "Database health check failed");
  }
}
