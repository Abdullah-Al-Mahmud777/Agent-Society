/**
 * Turso-backed repositories for every persisted entity in Agent Society.
 * All functions are server-only and parameterize every value.
 */

import {
  ensureSchema,
  getTursoClient,
  withDatabaseRetry,
} from "./client.js";

export const DEFAULT_USER_ID = "default-user";

function nowIso() {
  return new Date().toISOString();
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

function fromJson(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toInt(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : fallback;
}

function toReal(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toBoolInt(value, fallback = true) {
  if (value === undefined || value === null) return fallback ? 1 : 0;
  return value ? 1 : 0;
}

async function db() {
  return ensureSchema();
}

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

function agentRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    role: row.role,
    goal: row.goal,
    systemPrompt: row.system_prompt,
    aiProvider: row.ai_provider,
    model: row.model,
    temperature: row.temperature,
    maxTokens: row.max_tokens,
    icon: row.icon,
    color: row.color,
    isEnabled: Boolean(row.is_enabled),
    riskAppetite: row.risk_appetite,
    communicationStyle: row.communication_style,
    creativity: row.creativity,
    flexibility: row.flexibility,
    coreValues: fromJson(row.core_values, []),
    speakingStyle: row.speaking_style,
    expertise: row.expertise,
    capabilities: fromJson(row.capabilities, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function agentInsertStatement(agent, userId = DEFAULT_USER_ID) {
  const timestamp = nowIso();
  return {
    sql: `INSERT INTO agents (
      id, user_id, name, description, role, goal, system_prompt, ai_provider,
      model, temperature, max_tokens, icon, color, is_enabled, risk_appetite,
      communication_style, creativity, flexibility, core_values, speaking_style,
      expertise, capabilities, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      user_id = excluded.user_id,
      name = excluded.name,
      description = excluded.description,
      role = excluded.role,
      goal = excluded.goal,
      system_prompt = excluded.system_prompt,
      ai_provider = excluded.ai_provider,
      model = excluded.model,
      temperature = excluded.temperature,
      max_tokens = excluded.max_tokens,
      icon = excluded.icon,
      color = excluded.color,
      is_enabled = excluded.is_enabled,
      risk_appetite = excluded.risk_appetite,
      communication_style = excluded.communication_style,
      creativity = excluded.creativity,
      flexibility = excluded.flexibility,
      core_values = excluded.core_values,
      speaking_style = excluded.speaking_style,
      expertise = excluded.expertise,
      capabilities = excluded.capabilities,
      updated_at = excluded.updated_at`,
    args: [
      String(agent.id),
      userId,
      String(agent.name ?? ""),
      String(agent.description ?? ""),
      String(agent.role ?? ""),
      String(agent.goal ?? ""),
      String(agent.systemPrompt ?? ""),
      String(agent.aiProvider ?? "openai"),
      String(agent.model ?? "gpt-4o-mini"),
      toReal(agent.temperature, 0.7),
      toInt(agent.maxTokens, 1024),
      String(agent.icon ?? "🤖"),
      String(agent.color ?? "#22c55e"),
      toBoolInt(agent.isEnabled, true),
      toReal(agent.riskAppetite, 0.5),
      toReal(agent.communicationStyle, 0.5),
      toReal(agent.creativity, 0.5),
      toReal(agent.flexibility, 0.5),
      toJson(agent.coreValues, []),
      String(agent.speakingStyle ?? "formal"),
      String(agent.expertise ?? "General knowledge"),
      toJson(agent.capabilities, []),
      String(agent.createdAt ?? timestamp),
      String(agent.updatedAt ?? timestamp),
    ],
  };
}

export async function listAgents(userId = DEFAULT_USER_ID) {
  return withDatabaseRetry(async () => {
    const client = await db();
    const result = await client.execute({
      sql: "SELECT * FROM agents WHERE user_id = ? ORDER BY created_at ASC, id ASC",
      args: [userId],
    });
    return result.rows.map(agentRow);
  });
}

export async function getAgent(agentId, userId = DEFAULT_USER_ID) {
  return withDatabaseRetry(async () => {
    const client = await db();
    const result = await client.execute({
      sql: "SELECT * FROM agents WHERE id = ? AND user_id = ? LIMIT 1",
      args: [agentId, userId],
    });
    return result.rows[0] ? agentRow(result.rows[0]) : null;
  });
}

export async function upsertAgent(agent, userId = DEFAULT_USER_ID) {
  return withDatabaseRetry(async () => {
    const client = await db();
    const statement = agentInsertStatement(agent, userId);
    const result = await client.execute({
      ...statement,
      sql: `${statement.sql} RETURNING *`,
    });
    return result.rows[0] ? agentRow(result.rows[0]) : null;
  });
}

export async function upsertAgents(agents, userId = DEFAULT_USER_ID) {
  if (!Array.isArray(agents) || agents.length === 0) return { imported: 0 };

  return withDatabaseRetry(async () => {
    const client = await db();
    let imported = 0;

    for (let index = 0; index < agents.length; index += 50) {
      const chunk = agents.slice(index, index + 50);
      const statements = chunk
        .filter((agent) => agent && agent.id && agent.name)
        .map((agent) => agentInsertStatement(agent, userId));

      if (statements.length > 0) {
        await client.batch(statements, "write");
        imported += statements.length;
      }
    }

    return { imported };
  });
}

export async function deleteAgent(agentId, userId = DEFAULT_USER_ID) {
  return withDatabaseRetry(async () => {
    const client = await db();
    const result = await client.execute({
      sql: "DELETE FROM agents WHERE id = ? AND user_id = ?",
      args: [agentId, userId],
    });
    return result.rowsAffected > 0;
  });
}

export async function deleteAllAgents(userId = DEFAULT_USER_ID) {
  return withDatabaseRetry(async () => {
    const client = await db();
    const result = await client.execute({
      sql: "DELETE FROM agents WHERE user_id = ?",
      args: [userId],
    });
    return result.rowsAffected;
  });
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

function providerRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    providerName: row.provider_name,
    encryptedApiKey: row.encrypted_api_key,
    selectedModel: row.selected_model,
    isActive: Boolean(row.is_active),
    metadata: fromJson(row.metadata, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function publicProvider(provider) {
  if (!provider) return null;
  const { encryptedApiKey, ...safe } = provider;
  return {
    ...safe,
    hasApiKey: Boolean(encryptedApiKey),
  };
}

function providerInsertStatement(provider, userId = DEFAULT_USER_ID) {
  const timestamp = nowIso();
  return {
    sql: `INSERT INTO providers (
      id, user_id, provider_name, encrypted_api_key, selected_model,
      is_active, metadata, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      user_id = excluded.user_id,
      provider_name = excluded.provider_name,
      encrypted_api_key = excluded.encrypted_api_key,
      selected_model = excluded.selected_model,
      is_active = excluded.is_active,
      metadata = excluded.metadata,
      updated_at = excluded.updated_at`,
    args: [
      String(provider.id),
      userId,
      String(provider.providerName ?? ""),
      String(provider.encryptedApiKey ?? ""),
      String(provider.selectedModel ?? ""),
      toBoolInt(provider.isActive, false),
      toJson(provider.metadata, {}),
      String(provider.createdAt ?? timestamp),
      String(provider.updatedAt ?? timestamp),
    ],
  };
}

export async function listProviders(userId = DEFAULT_USER_ID) {
  return withDatabaseRetry(async () => {
    const client = await db();
    const result = await client.execute({
      sql: "SELECT * FROM providers WHERE user_id = ? ORDER BY created_at DESC",
      args: [userId],
    });
    return result.rows.map(providerRow);
  });
}

export async function getProviderById(providerId, userId = DEFAULT_USER_ID) {
  return withDatabaseRetry(async () => {
    const client = await db();
    const result = await client.execute({
      sql: "SELECT * FROM providers WHERE id = ? AND user_id = ? LIMIT 1",
      args: [providerId, userId],
    });
    return result.rows[0] ? providerRow(result.rows[0]) : null;
  });
}

export async function getActiveProvider(userId = DEFAULT_USER_ID) {
  return withDatabaseRetry(async () => {
    const client = await db();
    const result = await client.execute({
      sql: "SELECT * FROM providers WHERE user_id = ? AND is_active = 1 LIMIT 1",
      args: [userId],
    });
    return result.rows[0] ? providerRow(result.rows[0]) : null;
  });
}

export async function createProvider(provider, userId = DEFAULT_USER_ID) {
  await withDatabaseRetry(async () => {
    const client = await db();
    const statements = [];
    if (provider.isActive) {
      statements.push({
        sql: "UPDATE providers SET is_active = 0, updated_at = ? WHERE user_id = ? AND is_active = 1",
        args: [nowIso(), userId],
      });
    }
    statements.push(providerInsertStatement(provider, userId));
    await client.batch(statements, "write");
  });
  return getProviderById(provider.id, userId);
}

export async function upsertProviders(providers, userId = DEFAULT_USER_ID) {
  if (!Array.isArray(providers) || providers.length === 0) return { imported: 0 };

  return withDatabaseRetry(async () => {
    const activeProvider = [...providers]
      .reverse()
      .find((provider) => provider?.isActive);
    const client = await db();

    const statements = [
      {
        sql: "UPDATE providers SET is_active = 0, updated_at = ? WHERE user_id = ? AND is_active = 1",
        args: [nowIso(), userId],
      },
    ];

    for (const provider of providers) {
      if (!provider?.id || !provider?.providerName) continue;
      statements.push(
        providerInsertStatement(
          {
            ...provider,
            isActive: activeProvider ? provider.id === activeProvider.id : false,
          },
          userId
        )
      );
    }

    if (statements.length === 1) return { imported: 0 };
    await client.batch(statements, "write");
    return { imported: statements.length - 1 };
  });
}

export async function updateProvider(providerId, updates, userId = DEFAULT_USER_ID) {
  const current = await getProviderById(providerId, userId);
  if (!current) return null;

  const next = {
    ...current,
    ...updates,
    updatedAt: nowIso(),
  };

  await withDatabaseRetry(async () => {
    const client = await db();
    const statements = [];
    if (next.isActive) {
      statements.push({
        sql: "UPDATE providers SET is_active = 0, updated_at = ? WHERE user_id = ? AND is_active = 1 AND id != ?",
        args: [nowIso(), userId, providerId],
      });
    }
    statements.push(providerInsertStatement(next, userId));
    await client.batch(statements, "write");
  });
  return getProviderById(providerId, userId);
}

export async function setActiveProvider(providerId, userId = DEFAULT_USER_ID) {
  const current = await getProviderById(providerId, userId);
  if (!current) return null;

  await withDatabaseRetry(async () => {
    const client = await db();
    const timestamp = nowIso();
    await client.batch(
      [
        {
          sql: "UPDATE providers SET is_active = 0, updated_at = ? WHERE user_id = ? AND is_active = 1",
          args: [timestamp, userId],
        },
        {
          sql: "UPDATE providers SET is_active = 1, updated_at = ? WHERE id = ? AND user_id = ?",
          args: [timestamp, providerId, userId],
        },
      ],
      "write"
    );
  });

  return getProviderById(providerId, userId);
}

export async function deleteProvider(providerId, userId = DEFAULT_USER_ID) {
  return withDatabaseRetry(async () => {
    const client = await db();
    const result = await client.execute({
      sql: "DELETE FROM providers WHERE id = ? AND user_id = ?",
      args: [providerId, userId],
    });
    return result.rowsAffected > 0;
  });
}

export async function deleteAllProviders(userId = DEFAULT_USER_ID) {
  return withDatabaseRetry(async () => {
    const client = await db();
    const result = await client.execute({
      sql: "DELETE FROM providers WHERE user_id = ?",
      args: [userId],
    });
    return result.rowsAffected;
  });
}

// ---------------------------------------------------------------------------
// Conversations and messages
// ---------------------------------------------------------------------------

function conversationRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messageCount: row.message_count ?? undefined,
  };
}

function messageRow(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    userId: row.user_id,
    role: row.role,
    content: row.content,
    agentId: row.agent_id,
    agentName: row.agent_name,
    metadata: fromJson(row.metadata, {}),
    createdAt: row.created_at,
  };
}

export async function createConversation({
  id,
  userId = DEFAULT_USER_ID,
  title = "New conversation",
  createdAt,
}) {
  const client = await db();
  const timestamp = createdAt || nowIso();
  const conversationId = id || crypto.randomUUID();

  const result = await client.execute({
    sql: `INSERT INTO conversations (id, user_id, title, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(id) DO NOTHING
          RETURNING *`,
    args: [conversationId, userId, title, timestamp, timestamp],
  });

  if (result.rows[0]) return conversationRow(result.rows[0]);
  return getConversation(conversationId, userId);
}

export async function getConversation(conversationId, userId = DEFAULT_USER_ID) {
  const client = await db();
  const result = await client.execute({
    sql: "SELECT * FROM conversations WHERE id = ? AND user_id = ? LIMIT 1",
    args: [conversationId, userId],
  });
  return result.rows[0] ? conversationRow(result.rows[0]) : null;
}

export async function listConversations(userId = DEFAULT_USER_ID, limit = 25) {
  const client = await db();
  const result = await client.execute({
    sql: `SELECT c.*, COUNT(m.id) AS message_count
          FROM conversations c
          LEFT JOIN messages m ON m.conversation_id = c.id
          WHERE c.user_id = ?
          GROUP BY c.id
          ORDER BY c.updated_at DESC
          LIMIT ?`,
    args: [userId, Math.max(1, Math.min(100, Number(limit) || 25))],
  });
  return result.rows.map(conversationRow);
}

export async function touchConversation(conversationId, userId = DEFAULT_USER_ID) {
  const client = await db();
  await client.execute({
    sql: "UPDATE conversations SET updated_at = ? WHERE id = ? AND user_id = ?",
    args: [nowIso(), conversationId, userId],
  });
}

export async function updateConversation(
  conversationId,
  { title },
  userId = DEFAULT_USER_ID
) {
  const client = await db();
  const result = await client.execute({
    sql: `UPDATE conversations
          SET title = ?, updated_at = ?
          WHERE id = ? AND user_id = ?
          RETURNING *`,
    args: [String(title ?? "New conversation"), nowIso(), conversationId, userId],
  });
  return result.rows[0] ? conversationRow(result.rows[0]) : null;
}

export async function deleteConversation(conversationId, userId = DEFAULT_USER_ID) {
  const client = await db();
  const result = await client.execute({
    sql: "DELETE FROM conversations WHERE id = ? AND user_id = ?",
    args: [conversationId, userId],
  });
  return result.rowsAffected > 0;
}

export async function deleteAllConversations(userId = DEFAULT_USER_ID) {
  const client = await db();
  const result = await client.execute({
    sql: "DELETE FROM conversations WHERE user_id = ?",
    args: [userId],
  });
  return result.rowsAffected;
}

function messageInsertStatement({
  conversationId,
  userId = DEFAULT_USER_ID,
  role,
  content,
  agentId = null,
  agentName = null,
  metadata = {},
  createdAt,
}) {
  return {
    sql: `INSERT INTO messages
      (conversation_id, user_id, role, content, agent_id, agent_name, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      conversationId,
      userId,
      String(role),
      String(content ?? ""),
      agentId,
      agentName,
      toJson(metadata, {}),
      createdAt || nowIso(),
    ],
  };
}

function conversationTouchStatement(conversationId, userId, timestamp) {
  return {
    sql: "UPDATE conversations SET updated_at = ? WHERE id = ? AND user_id = ?",
    args: [timestamp, conversationId, userId],
  };
}

export async function addMessage({
  conversationId,
  userId = DEFAULT_USER_ID,
  role,
  content,
  agentId = null,
  agentName = null,
  metadata = {},
  createdAt,
}) {
  const client = await db();
  const timestamp = createdAt || nowIso();
  const results = await client.batch(
    [
      messageInsertStatement({
        conversationId,
        userId,
        role,
        content,
        agentId,
        agentName,
        metadata,
        createdAt: timestamp,
      }),
      conversationTouchStatement(conversationId, userId, timestamp),
    ],
    "write"
  );

  return {
    id: Number(results[0]?.lastInsertRowid ?? 0),
    conversationId,
    userId,
    role,
    content,
    agentId,
    agentName,
    metadata,
    createdAt: timestamp,
  };
}

export async function listMessages(conversationId, userId = DEFAULT_USER_ID, limit = 200) {
  const client = await db();
  const cappedLimit = Math.max(1, Math.min(1000, Number(limit) || 200));
  const result = await client.execute({
    sql: `SELECT * FROM (
            SELECT * FROM messages
            WHERE conversation_id = ? AND user_id = ?
            ORDER BY id DESC
            LIMIT ?
          ) ORDER BY id ASC`,
    args: [conversationId, userId, cappedLimit],
  });
  return result.rows.map(messageRow);
}

export async function getConversationThread(
  conversationId,
  userId = DEFAULT_USER_ID,
  limit = 200
) {
  const client = await db();
  const cappedLimit = Math.max(1, Math.min(1000, Number(limit) || 200));
  const [conversationResult, messagesResult] = await client.batch(
    [
      {
        sql: "SELECT * FROM conversations WHERE id = ? AND user_id = ? LIMIT 1",
        args: [conversationId, userId],
      },
      {
        sql: `SELECT * FROM (
                SELECT * FROM messages
                WHERE conversation_id = ? AND user_id = ?
                ORDER BY id DESC
                LIMIT ?
              ) ORDER BY id ASC`,
        args: [conversationId, userId, cappedLimit],
      },
    ],
    "read"
  );

  return {
    conversation: conversationResult.rows[0]
      ? conversationRow(conversationResult.rows[0])
      : null,
    messages: messagesResult.rows.map(messageRow),
  };
}

// ---------------------------------------------------------------------------
// Agent memory and notes
// ---------------------------------------------------------------------------

function memoryRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    agentId: row.agent_id,
    entryType: row.entry_type,
    role: row.role,
    content: row.content,
    metadata: fromJson(row.metadata, {}),
    createdAt: row.created_at,
  };
}

export async function getAgentMemory(
  agentId,
  userId = DEFAULT_USER_ID,
  { conversationLimit = 100, executionLimit = 50 } = {}
) {
  const client = await db();
  const [conversationResult, executionResult, notesResult] = await Promise.all([
    client.execute({
      sql: `SELECT * FROM agent_memory_entries
            WHERE agent_id = ? AND user_id = ? AND entry_type = 'conversation'
            ORDER BY id DESC LIMIT ?`,
      args: [agentId, userId, Math.max(1, Math.min(500, conversationLimit))],
    }),
    client.execute({
      sql: `SELECT * FROM agent_memory_entries
            WHERE agent_id = ? AND user_id = ? AND entry_type = 'execution'
            ORDER BY id DESC LIMIT ?`,
      args: [agentId, userId, Math.max(1, Math.min(200, executionLimit))],
    }),
    client.execute({
      sql: "SELECT * FROM agent_notes WHERE agent_id = ? AND user_id = ? LIMIT 1",
      args: [agentId, userId],
    }),
  ]);

  const conversationHistory = conversationResult.rows
    .map(memoryRow)
    .reverse()
    .map((entry) => ({
      role: entry.role,
      content: entry.content,
      timestamp: entry.createdAt,
    }));

  const executionHistory = executionResult.rows
    .map(memoryRow)
    .reverse()
    .map((entry) => ({
      ...entry.metadata,
      timestamp: entry.createdAt,
    }));

  return {
    conversationHistory,
    executionHistory,
    notes: notesResult.rows[0]?.notes ?? "",
  };
}

function emptyAgentMemory() {
  return {
    conversationHistory: [],
    executionHistory: [],
    notes: "",
  };
}

export async function getAgentMemories(agentIds, userId = DEFAULT_USER_ID) {
  const uniqueAgentIds = [
    ...new Set((agentIds || []).filter(Boolean).map(String)),
  ];
  if (uniqueAgentIds.length === 0) return {};

  const placeholders = uniqueAgentIds.map(() => "?").join(", ");
  const client = await db();
  const [conversationResult, executionResult, notesResult] = await client.batch(
    [
      {
        sql: `SELECT * FROM (
                SELECT *, ROW_NUMBER() OVER (
                  PARTITION BY agent_id ORDER BY id DESC
                ) AS row_number
                FROM agent_memory_entries
                WHERE user_id = ? AND entry_type = 'conversation'
                  AND agent_id IN (${placeholders})
              ) WHERE row_number <= 100
              ORDER BY agent_id ASC, id ASC`,
        args: [userId, ...uniqueAgentIds],
      },
      {
        sql: `SELECT * FROM (
                SELECT *, ROW_NUMBER() OVER (
                  PARTITION BY agent_id ORDER BY id DESC
                ) AS row_number
                FROM agent_memory_entries
                WHERE user_id = ? AND entry_type = 'execution'
                  AND agent_id IN (${placeholders})
              ) WHERE row_number <= 50
              ORDER BY agent_id ASC, id ASC`,
        args: [userId, ...uniqueAgentIds],
      },
      {
        sql: `SELECT * FROM agent_notes
              WHERE user_id = ? AND agent_id IN (${placeholders})`,
        args: [userId, ...uniqueAgentIds],
      },
    ],
    "read"
  );

  const memories = Object.fromEntries(
    uniqueAgentIds.map((agentId) => [agentId, emptyAgentMemory()])
  );

  for (const row of conversationResult.rows) {
    memories[row.agent_id].conversationHistory.push({
      role: row.role,
      content: row.content,
      timestamp: row.created_at,
    });
  }

  for (const row of executionResult.rows) {
    memories[row.agent_id].executionHistory.push({
      ...fromJson(row.metadata, {}),
      timestamp: row.created_at,
    });
  }

  for (const row of notesResult.rows) {
    memories[row.agent_id].notes = row.notes ?? "";
  }

  return memories;
}

function memoryInsertStatements(agentId, entries, userId = DEFAULT_USER_ID) {
  if (!Array.isArray(entries) || entries.length === 0) return [];
  return entries.map((entry) => ({
    sql: `INSERT INTO agent_memory_entries
      (user_id, agent_id, entry_type, role, content, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      userId,
      agentId,
      String(entry.entryType ?? "conversation"),
      String(entry.role ?? "system"),
      String(entry.content ?? ""),
      toJson(entry.metadata, {}),
      String(entry.createdAt ?? nowIso()),
    ],
  }));
}

export async function addAgentMemoryEntries(agentId, entries, userId = DEFAULT_USER_ID) {
  const statements = memoryInsertStatements(agentId, entries, userId);
  if (statements.length === 0) return { inserted: 0 };

  const client = await db();
  await client.batch(statements, "write");
  return { inserted: statements.length };
}

export async function saveAgentNotes(agentId, notes, userId = DEFAULT_USER_ID) {
  const client = await db();
  const timestamp = nowIso();
  await client.execute({
    sql: `INSERT INTO agent_notes (agent_id, user_id, notes, updated_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(agent_id) DO UPDATE SET
            user_id = excluded.user_id,
            notes = excluded.notes,
            updated_at = excluded.updated_at`,
    args: [agentId, userId, String(notes ?? ""), timestamp],
  });

  return { agentId, notes: String(notes ?? ""), updatedAt: timestamp };
}

export async function clearAgentMemory(agentId, userId = DEFAULT_USER_ID) {
  const client = await db();
  await client.batch(
    [
      {
        sql: "DELETE FROM agent_memory_entries WHERE agent_id = ? AND user_id = ?",
        args: [agentId, userId],
      },
      {
        sql: "DELETE FROM agent_notes WHERE agent_id = ? AND user_id = ?",
        args: [agentId, userId],
      },
    ],
    "write"
  );
  return true;
}

export async function clearAllAgentMemory(userId = DEFAULT_USER_ID) {
  const client = await db();
  await client.batch(
    [
      {
        sql: "DELETE FROM agent_memory_entries WHERE user_id = ?",
        args: [userId],
      },
      {
        sql: "DELETE FROM agent_notes WHERE user_id = ?",
        args: [userId],
      },
    ],
    "write"
  );
  return true;
}

// ---------------------------------------------------------------------------
// Executions
// ---------------------------------------------------------------------------

function executionRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    agentId: row.agent_id,
    conversationId: row.conversation_id,
    userRequest: row.user_request,
    globalContext: row.global_context,
    success: Boolean(row.success),
    output: row.output,
    error: row.error,
    executionStrategy: row.execution_strategy,
    createdAt: row.created_at,
  };
}

function executionInsertStatement(execution, userId = DEFAULT_USER_ID) {
  return {
    sql: `INSERT INTO executions
      (user_id, agent_id, conversation_id, user_request, global_context, success,
       output, error, execution_strategy, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      userId,
      String(execution.agentId ?? ""),
      execution.conversationId ?? null,
      String(execution.userRequest ?? ""),
      String(execution.globalContext ?? ""),
      toBoolInt(execution.success, false),
      execution.output ?? null,
      execution.error ?? null,
      String(execution.executionStrategy ?? "parallel"),
      String(execution.createdAt ?? nowIso()),
    ],
  };
}

export async function recordExecution(execution, userId = DEFAULT_USER_ID) {
  const client = await db();
  const result = await client.execute(executionInsertStatement(execution, userId));
  return Number(result.lastInsertRowid ?? 0);
}

export async function listExecutions(
  userId = DEFAULT_USER_ID,
  { agentId = null, limit = 50 } = {}
) {
  const client = await db();
  const cappedLimit = Math.max(1, Math.min(200, Number(limit) || 50));
  const result = agentId
    ? await client.execute({
        sql: `SELECT * FROM executions
              WHERE user_id = ? AND agent_id = ?
              ORDER BY id DESC LIMIT ?`,
        args: [userId, agentId, cappedLimit],
      })
    : await client.execute({
        sql: `SELECT * FROM executions
              WHERE user_id = ?
              ORDER BY id DESC LIMIT ?`,
        args: [userId, cappedLimit],
      });

  return result.rows.map(executionRow);
}

// ---------------------------------------------------------------------------
// Orchestrator runs
// ---------------------------------------------------------------------------

function orchestratorRunRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    conversationId: row.conversation_id,
    userRequest: row.user_request,
    finalResponse: row.final_response,
    agentOutputs: fromJson(row.agent_outputs, []),
    relevantAgents: fromJson(row.relevant_agents, []),
    executionStrategy: row.execution_strategy,
    success: Boolean(row.success),
    error: row.error,
    createdAt: row.created_at,
  };
}

function orchestratorRunInsertStatement(run, userId = DEFAULT_USER_ID) {
  return {
    sql: `INSERT INTO orchestrator_runs
      (id, user_id, conversation_id, user_request, final_response, agent_outputs,
       relevant_agents, execution_strategy, success, error, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        final_response = excluded.final_response,
        agent_outputs = excluded.agent_outputs,
        relevant_agents = excluded.relevant_agents,
        execution_strategy = excluded.execution_strategy,
        success = excluded.success,
        error = excluded.error`,
    args: [
      String(run.id),
      userId,
      run.conversationId ?? null,
      String(run.userRequest ?? ""),
      run.finalResponse ?? null,
      toJson(run.agentOutputs, []),
      toJson(run.relevantAgents, []),
      String(run.executionStrategy ?? "parallel"),
      toBoolInt(run.success, false),
      run.error ?? null,
      String(run.createdAt ?? nowIso()),
    ],
  };
}

export async function recordOrchestratorRun(run, userId = DEFAULT_USER_ID) {
  const client = await db();
  const runId = String(run.id ?? crypto.randomUUID());
  await client.execute(
    orchestratorRunInsertStatement({ ...run, id: runId }, userId)
  );
  return runId;
}

export async function persistOrchestratorTurn({
  run,
  agentOutputs = [],
  assistantMessage,
  userId = DEFAULT_USER_ID,
}) {
  const client = await db();
  const statements = [];
  const assistantTimestamp = run.createdAt || nowIso();

  for (const output of agentOutputs) {
    if (!output?.agentId) continue;

    const outputTimestamp = output.timestamp || assistantTimestamp;
    statements.push(
      executionInsertStatement(
        {
          agentId: output.agentId,
          conversationId: run.conversationId,
          userRequest: run.userRequest,
          globalContext: run.globalContext || "",
          success: output.success,
          output: output.content ?? null,
          error: output.error ?? null,
          executionStrategy: run.executionStrategy,
          createdAt: outputTimestamp,
        },
        userId
      )
    );

    const entries = [
      {
        entryType: "conversation",
        role: "user",
        content: run.userRequest,
        metadata: { conversationId: run.conversationId },
        createdAt: outputTimestamp,
      },
    ];

    if (output.success && output.content) {
      entries.push({
        entryType: "conversation",
        role: "assistant",
        content: output.content,
        metadata: {
          conversationId: run.conversationId,
          agentName: output.agentName,
        },
        createdAt: outputTimestamp,
      });
    }

    entries.push({
      entryType: "execution",
      role: "system",
      content: output.success
        ? output.content || ""
        : output.error || "Agent execution failed",
      metadata: {
        conversationId: run.conversationId,
        userRequest: run.userRequest,
        success: Boolean(output.success),
        error: output.error ?? null,
        agentName: output.agentName ?? null,
        executionStrategy: run.executionStrategy,
        timestamp: outputTimestamp,
      },
      createdAt: outputTimestamp,
    });

    statements.push(...memoryInsertStatements(output.agentId, entries, userId));
  }

  statements.push(orchestratorRunInsertStatement(run, userId));

  if (assistantMessage && run.conversationId) {
    statements.push(messageInsertStatement({ ...assistantMessage, userId }));
    statements.push(
      conversationTouchStatement(
        run.conversationId,
        userId,
        assistantMessage.createdAt || assistantTimestamp
      )
    );
  }

  await client.batch(statements, "write");
  return String(run.id);
}

export async function listOrchestratorRuns(
  userId = DEFAULT_USER_ID,
  { conversationId = null, limit = 50 } = {}
) {
  const client = await db();
  const cappedLimit = Math.max(1, Math.min(200, Number(limit) || 50));
  const result = conversationId
    ? await client.execute({
        sql: `SELECT * FROM orchestrator_runs
              WHERE user_id = ? AND conversation_id = ?
              ORDER BY created_at DESC LIMIT ?`,
        args: [userId, conversationId, cappedLimit],
      })
    : await client.execute({
        sql: `SELECT * FROM orchestrator_runs
              WHERE user_id = ?
              ORDER BY created_at DESC LIMIT ?`,
        args: [userId, cappedLimit],
      });

  return result.rows.map(orchestratorRunRow);
}

export async function getDatabaseOverview(userId = DEFAULT_USER_ID) {
  const client = await db();
  const [tables, counts] = await Promise.all([
    client.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ),
    Promise.all([
      client.execute({ sql: "SELECT COUNT(*) AS count FROM agents WHERE user_id = ?", args: [userId] }),
      client.execute({ sql: "SELECT COUNT(*) AS count FROM providers WHERE user_id = ?", args: [userId] }),
      client.execute({ sql: "SELECT COUNT(*) AS count FROM conversations WHERE user_id = ?", args: [userId] }),
      client.execute({ sql: "SELECT COUNT(*) AS count FROM messages WHERE user_id = ?", args: [userId] }),
      client.execute({ sql: "SELECT COUNT(*) AS count FROM agent_memory_entries WHERE user_id = ?", args: [userId] }),
      client.execute({ sql: "SELECT COUNT(*) AS count FROM executions WHERE user_id = ?", args: [userId] }),
      client.execute({ sql: "SELECT COUNT(*) AS count FROM orchestrator_runs WHERE user_id = ?", args: [userId] }),
    ]),
  ]);

  const tableNames = tables.rows.map((row) => row.name);
  const [agents, providers, conversations, messages, memories, executions, runs] =
    counts.map((result) => Number(result.rows[0]?.count ?? 0));

  return {
    tables: tableNames,
    counts: {
      agents,
      providers,
      conversations,
      messages,
      memories,
      executions,
      orchestratorRuns: runs,
    },
  };
}

export { getTursoClient };
