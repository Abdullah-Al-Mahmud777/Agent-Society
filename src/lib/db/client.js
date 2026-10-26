/**
 * Server-only Turso/libSQL client.
 *
 * Never import this module from a client component. Database credentials are
 * read from environment variables and are never sent to the browser.
 */

import { createClient } from "@libsql/client";
import { applyMigrations } from "./schema.mjs";

export class DatabaseConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "DatabaseConfigurationError";
    this.code = "DATABASE_NOT_CONFIGURED";
  }
}

const globalState = globalThis;
const dbState =
  globalState.__agentSocietyDatabaseState ??
  (globalState.__agentSocietyDatabaseState = {
    client: null,
    schemaPromise: null,
  });

function isLocalUrl(url) {
  return url.startsWith("file:") || url.startsWith(":memory:");
}

export function getDatabaseUrl() {
  return process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "";
}

export function getAuthToken() {
  return process.env.TURSO_AUTH_TOKEN || process.env.TURSO_DB_TOKEN || "";
}

export function isDatabaseConfigured() {
  try {
    resolveConnectionOptions();
    return true;
  } catch {
    return false;
  }
}

function resolveConnectionOptions() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new DatabaseConfigurationError(
      "Turso database URL is not configured. Set TURSO_DATABASE_URL in .env.local."
    );
  }

  const authToken = getAuthToken();
  if (!isLocalUrl(url) && !authToken) {
    throw new DatabaseConfigurationError(
      "Turso auth token is missing. Set TURSO_AUTH_TOKEN in .env.local. " +
        "Create one with: turso db tokens create <database-name>"
    );
  }

  return {
    url,
    authToken: authToken || undefined,
    intMode: "number",
  };
}

function connectionConcurrency() {
  const configured = Number.parseInt(process.env.TURSO_CONCURRENCY || "", 10);
  if (!Number.isFinite(configured)) return 4;
  return Math.min(20, Math.max(1, configured));
}

export function getTursoClient() {
  if (!dbState.client) {
    dbState.client = createClient({
      ...resolveConnectionOptions(),
      concurrency: connectionConcurrency(),
    });
  }
  return dbState.client;
}

/**
 * Creates the schema once per server process. The state lives on globalThis so
 * Next.js hot reloads and route module reloads reuse the same client and do not
 * re-run migrations on every request.
 */
export async function ensureSchema() {
  if (!dbState.schemaPromise) {
    dbState.schemaPromise = (async () => {
      const db = getTursoClient();
      await db.execute("PRAGMA foreign_keys = ON");
      await applyMigrations(db);
      return db;
    })().catch((error) => {
      dbState.schemaPromise = null;
      throw error;
    });
  }

  return dbState.schemaPromise;
}

const TRANSIENT_DATABASE_CODES = new Set([
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ECONNRESET",
  "ENOTFOUND",
  "ETIMEDOUT",
  "UND_ERR_BODY_TIMEOUT",
  "UND_ERR_CLOSED",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_SOCKET",
]);

function isTransientDatabaseError(error) {
  const seen = new Set();
  let current = error;

  for (let depth = 0; current && depth < 5; depth += 1) {
    if (seen.has(current)) break;
    seen.add(current);

    if (current.name === "ConnectTimeoutError") return true;
    if (TRANSIENT_DATABASE_CODES.has(current.code)) return true;

    current = current.cause;
  }

  return /fetch failed/i.test(error?.message || "");
}

export async function withDatabaseRetry(operation, options = {}) {
  const attempts = Math.min(6, Math.max(1, Number(options.attempts) || 4));
  const baseDelay = Math.max(0, Number(options.baseDelay) || 400);
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !isTransientDatabaseError(error)) throw error;

      console.warn(
        `[db] transient failure ${attempt}/${attempts}; retrying`,
        error?.cause?.code || error?.code || error?.message
      );
      await new Promise((resolve) =>
        setTimeout(resolve, baseDelay * 2 ** (attempt - 1))
      );
    }
  }

  throw lastError;
}

export async function checkDatabaseConnection() {
  const db = await ensureSchema();
  const result = await withDatabaseRetry(() => db.execute("SELECT 1 AS ok"));
  return result.rows[0]?.ok === 1;
}
