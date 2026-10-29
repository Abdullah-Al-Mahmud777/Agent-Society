import { ensureSchema } from "./client.js";

function nowIso() {
  return new Date().toISOString();
}

function fromJson(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toJson(value, fallback) {
  if (value === undefined || value === null) return JSON.stringify(fallback);
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify(fallback);
  }
}

function userRow(row) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
  };
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
  };
}

export async function countUsers() {
  const client = await ensureSchema();
  const result = await client.execute("SELECT COUNT(*) AS count FROM users");
  return Number(result.rows[0]?.count ?? 0);
}

export async function createUser({ id, email, passwordHash, displayName }) {
  const client = await ensureSchema();
  const timestamp = nowIso();
  const userId = id || crypto.randomUUID();

  await client.execute({
    sql: `INSERT INTO users
      (id, email, password_hash, display_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
    args: [userId, email, passwordHash, displayName, timestamp, timestamp],
  });

  return {
    id: userId,
    email,
    displayName,
    passwordHash,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastLoginAt: null,
  };
}

export async function getUserByEmail(email) {
  const client = await ensureSchema();
  const result = await client.execute({
    sql: "SELECT * FROM users WHERE email = ? COLLATE NOCASE LIMIT 1",
    args: [email],
  });
  return result.rows[0] ? userRow(result.rows[0]) : null;
}

export async function getUserById(userId) {
  const client = await ensureSchema();
  const result = await client.execute({
    sql: "SELECT * FROM users WHERE id = ? LIMIT 1",
    args: [userId],
  });
  return result.rows[0] ? userRow(result.rows[0]) : null;
}

export async function markUserLogin(userId) {
  const client = await ensureSchema();
  const timestamp = nowIso();
  await client.execute({
    sql: "UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?",
    args: [timestamp, timestamp, userId],
  });
  return timestamp;
}

/**
 * The pre-auth app stored every record under `default-user`. The first account
 * created on a fresh deployment claims that legacy data so existing users do
 * not lose their agents, providers, memories, or conversations.
 */
export async function claimLegacyData(userId) {
  if (!userId || userId === "default-user") return false;
  if ((await countUsers()) !== 1) return false;

  const client = await ensureSchema();
  const timestamp = nowIso();
  const tables = [
    "agents",
    "providers",
    "conversations",
    "messages",
    "agent_memory_entries",
    "agent_notes",
    "executions",
    "orchestrator_runs",
  ];

  const statements = tables.map((table) => ({
    sql: `UPDATE ${table} SET user_id = ? WHERE user_id = 'default-user'`,
    args: [userId],
  }));

  statements.push({
    sql: "UPDATE users SET updated_at = ? WHERE id = ?",
    args: [timestamp, userId],
  });

  await client.batch(statements, "write");
  return true;
}

export async function createSessionRecord({
  id,
  userId,
  tokenHash,
  userAgent,
  expiresAt,
}) {
  const client = await ensureSchema();
  const timestamp = nowIso();

  await client.execute({
    sql: `INSERT INTO sessions
      (id, user_id, token_hash, user_agent, created_at, last_seen_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, userId, tokenHash, userAgent || null, timestamp, timestamp, expiresAt],
  });

  return { id, userId, tokenHash, createdAt: timestamp, expiresAt };
}

const SESSION_TOUCH_INTERVAL_MS = 15 * 60 * 1000;

export async function getSessionUserByTokenHash(tokenHash) {
  const client = await ensureSchema();
  const timestamp = nowIso();
  const result = await client.execute({
    sql: `SELECT u.*,
            s.id AS session_id,
            s.expires_at AS session_expires_at,
            s.last_seen_at AS session_last_seen_at
          FROM sessions s
          JOIN users u ON u.id = s.user_id
          WHERE s.token_hash = ? AND s.expires_at > ?
          LIMIT 1`,
    args: [tokenHash, timestamp],
  });

  if (!result.rows[0]) return null;
  const user = userRow(result.rows[0]);

  const lastSeen = Date.parse(result.rows[0].session_last_seen_at || "");
  if (!Number.isFinite(lastSeen) || Date.now() - lastSeen >= SESSION_TOUCH_INTERVAL_MS) {
    await client.execute({
      sql: "UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?",
      args: [timestamp, tokenHash],
    });
  }

  return user;
}

export async function deleteSessionByTokenHash(tokenHash) {
  const client = await ensureSchema();
  await client.execute({
    sql: "DELETE FROM sessions WHERE token_hash = ?",
    args: [tokenHash],
  });
}

export async function deleteSessionsForUser(userId) {
  const client = await ensureSchema();
  await client.execute({
    sql: "DELETE FROM sessions WHERE user_id = ?",
    args: [userId],
  });
}

export async function deleteExpiredSessions() {
  const client = await ensureSchema();
  await client.execute({
    sql: "DELETE FROM sessions WHERE expires_at <= ?",
    args: [nowIso()],
  });
}

export async function getUserSettings(userId) {
  const client = await ensureSchema();
  const result = await client.execute({
    sql: "SELECT * FROM user_settings WHERE user_id = ? LIMIT 1",
    args: [userId],
  });

  if (!result.rows[0]) {
    return {
      userId,
      theme: "dark",
      preferences: {},
      updatedAt: null,
    };
  }

  const row = result.rows[0];
  return {
    userId: row.user_id,
    theme: row.theme === "light" ? "light" : "dark",
    preferences: fromJson(row.preferences, {}),
    updatedAt: row.updated_at,
  };
}

export async function saveUserSettings(userId, { theme, preferences } = {}) {
  const client = await ensureSchema();
  const nextTheme =
    theme === "light" ? "light" : theme === "dark" ? "dark" : null;
  const nextPreferences =
    preferences === undefined ? null : toJson(preferences, {});
  const timestamp = nowIso();

  const result = await client.execute({
    sql: `INSERT INTO user_settings (user_id, theme, preferences, updated_at)
          VALUES (?, COALESCE(?, 'dark'), COALESCE(?, '{}'), ?)
          ON CONFLICT(user_id) DO UPDATE SET
            theme = CASE WHEN ? IS NULL THEN user_settings.theme ELSE excluded.theme END,
            preferences = CASE
              WHEN ? IS NULL THEN user_settings.preferences
              ELSE excluded.preferences
            END,
            updated_at = excluded.updated_at
          RETURNING *`,
    args: [
      userId,
      nextTheme,
      nextPreferences,
      timestamp,
      nextTheme,
      nextPreferences,
    ],
  });

  const row = result.rows[0];
  return {
    userId,
    theme: row?.theme === "light" ? "light" : "dark",
    preferences: fromJson(row?.preferences, {}),
    updatedAt: row?.updated_at ?? timestamp,
  };
}
