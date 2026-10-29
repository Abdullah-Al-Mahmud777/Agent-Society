/**
 * Turso/libSQL schema and migrations.
 *
 * Every migration must be safe to run more than once. The migration runner
 * records applied versions in `schema_migrations` and applies each migration
 * inside a single write transaction.
 */

export const MIGRATIONS = [
  {
    version: 1,
    name: "initial_agent_society_schema",
    statements: [
      `CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'default-user',
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        role TEXT NOT NULL,
        goal TEXT NOT NULL,
        system_prompt TEXT NOT NULL,
        ai_provider TEXT NOT NULL,
        model TEXT NOT NULL,
        temperature REAL NOT NULL DEFAULT 0.7,
        max_tokens INTEGER NOT NULL DEFAULT 1024,
        icon TEXT NOT NULL DEFAULT '🤖',
        color TEXT NOT NULL DEFAULT '#22c55e',
        is_enabled INTEGER NOT NULL DEFAULT 1,
        risk_appetite REAL NOT NULL DEFAULT 0.5,
        communication_style REAL NOT NULL DEFAULT 0.5,
        creativity REAL NOT NULL DEFAULT 0.5,
        flexibility REAL NOT NULL DEFAULT 0.5,
        core_values TEXT NOT NULL DEFAULT '[]',
        speaking_style TEXT NOT NULL DEFAULT 'formal',
        expertise TEXT NOT NULL DEFAULT 'General knowledge',
        capabilities TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_agents_user_enabled ON agents(user_id, is_enabled)`,
      `CREATE INDEX IF NOT EXISTS idx_agents_updated_at ON agents(updated_at)`,

      `CREATE TABLE IF NOT EXISTS providers (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'default-user',
        provider_name TEXT NOT NULL,
        encrypted_api_key TEXT NOT NULL,
        selected_model TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 0,
        metadata TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_providers_user_id ON providers(user_id)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_providers_one_active_per_user
        ON providers(user_id) WHERE is_active = 1`,

      `CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'default-user',
        title TEXT NOT NULL DEFAULT 'New conversation',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_conversations_user_updated
        ON conversations(user_id, updated_at DESC)`,

      `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT NOT NULL,
        user_id TEXT NOT NULL DEFAULT 'default-user',
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        agent_id TEXT,
        agent_name TEXT,
        metadata TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS idx_messages_conversation
        ON messages(conversation_id, id)`,

      `CREATE TABLE IF NOT EXISTS agent_memory_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL DEFAULT 'default-user',
        agent_id TEXT NOT NULL,
        entry_type TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'system',
        content TEXT NOT NULL,
        metadata TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_agent_memory_agent
        ON agent_memory_entries(agent_id, id DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_agent_memory_agent_type
        ON agent_memory_entries(agent_id, entry_type, id DESC)`,

      `CREATE TABLE IF NOT EXISTS agent_notes (
        agent_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'default-user',
        notes TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_agent_notes_user ON agent_notes(user_id)`,

      `CREATE TABLE IF NOT EXISTS executions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL DEFAULT 'default-user',
        agent_id TEXT NOT NULL,
        conversation_id TEXT,
        user_request TEXT NOT NULL,
        global_context TEXT NOT NULL DEFAULT '',
        success INTEGER NOT NULL DEFAULT 0,
        output TEXT,
        error TEXT,
        execution_strategy TEXT NOT NULL DEFAULT 'parallel',
        created_at TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_executions_user_created
        ON executions(user_id, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_executions_agent_created
        ON executions(agent_id, created_at DESC)`,

      `CREATE TABLE IF NOT EXISTS orchestrator_runs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'default-user',
        conversation_id TEXT,
        user_request TEXT NOT NULL,
        final_response TEXT,
        agent_outputs TEXT NOT NULL DEFAULT '[]',
        relevant_agents TEXT NOT NULL DEFAULT '[]',
        execution_strategy TEXT NOT NULL DEFAULT 'parallel',
        success INTEGER NOT NULL DEFAULT 0,
        error TEXT,
        created_at TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_orchestrator_runs_user_created
        ON orchestrator_runs(user_id, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_orchestrator_runs_conversation
        ON orchestrator_runs(conversation_id, created_at DESC)`,
    ],
  },
  {
    version: 2,
    name: "users_sessions_and_settings",
    statements: [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL COLLATE NOCASE UNIQUE,
        password_hash TEXT NOT NULL,
        display_name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_login_at TEXT
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email COLLATE NOCASE)`,

      `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        user_agent TEXT,
        created_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`,

      `CREATE TABLE IF NOT EXISTS user_settings (
        user_id TEXT PRIMARY KEY,
        theme TEXT NOT NULL DEFAULT 'dark',
        preferences TEXT NOT NULL DEFAULT '{}',
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,

      `CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id, id DESC)`,
    ],
  },
];

export async function applyMigrations(client) {
  const [, applied] = await client.batch(
    [
      {
        sql: `CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at TEXT NOT NULL
        )`,
        args: [],
      },
      { sql: "SELECT version FROM schema_migrations", args: [] },
    ],
    "write"
  );
  const appliedVersions = new Set(applied.rows.map((row) => Number(row.version)));

  for (const migration of MIGRATIONS) {
    if (appliedVersions.has(migration.version)) continue;

    const statements = migration.statements.map((sql) => ({ sql, args: [] }));
    statements.push({
      sql: "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)",
      args: [migration.version, migration.name, new Date().toISOString()],
    });

    await client.batch(statements, "write");
    console.log(`[db] Applied migration ${migration.version}: ${migration.name}`);
  }
}
