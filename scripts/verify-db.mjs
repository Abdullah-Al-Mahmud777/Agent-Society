import {
  addAgentMemoryEntries,
  addMessage,
  clearAgentMemory,
  createConversation,
  createProvider,
  deleteAgent,
  deleteConversation,
  deleteProvider,
  getAgent,
  getAgentMemory,
  getAgentMemories,
  getTursoClient,
  listAgents,
  listMessages,
  listProviders,
  persistOrchestratorTurn,
  recordExecution,
  recordOrchestratorRun,
  saveAgentNotes,
  upsertAgent,
} from "../src/lib/db/repositories.js";
import { checkDatabaseConnection } from "../src/lib/db/client.js";

const userId = "__verify_user__";
const suffix = crypto.randomUUID();
const agentId = `verify-agent-${suffix}`;
const providerId = `verify-provider-${suffix}`;
const conversationId = `verify-conversation-${suffix}`;
const runId = `verify-run-${suffix}`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  console.log("[verify] Connecting and applying schema...");
  const connected = await checkDatabaseConnection();
  assert(connected, "Database connection check failed");

  const client = getTursoClient();
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  const indexes = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );

  const requiredTables = [
    "agents",
    "providers",
    "conversations",
    "messages",
    "agent_memory_entries",
    "agent_notes",
    "executions",
    "orchestrator_runs",
    "schema_migrations",
  ];
  const tableNames = tables.rows.map((row) => row.name);
  for (const table of requiredTables) {
    assert(tableNames.includes(table), `Missing table: ${table}`);
  }
  assert(indexes.rows.length > 0, "No indexes were created");
  console.log(`[verify] Tables OK (${tableNames.length}), indexes OK (${indexes.rows.length})`);

  const timestamp = new Date().toISOString();
  const agent = {
    id: agentId,
    name: "Verification Agent",
    description: "Temporary agent used by the database verification script.",
    role: "Verifier",
    goal: "Validate CRUD operations.",
    systemPrompt: "You verify database operations.",
    aiProvider: "openai",
    model: "gpt-4o-mini",
    temperature: 0.2,
    maxTokens: 256,
    icon: "🧪",
    color: "#22c55e",
    isEnabled: true,
    riskAppetite: 0.5,
    communicationStyle: 0.5,
    creativity: 0.5,
    flexibility: 0.5,
    coreValues: ["reliability"],
    speakingStyle: "technical",
    expertise: "Database verification",
    capabilities: ["crud"],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await upsertAgent(agent, userId);
  const createdAgent = await getAgent(agentId, userId);
  assert(createdAgent?.name === agent.name, "Agent create/read failed");

  await upsertAgent({ ...createdAgent, name: "Verification Agent Updated", updatedAt: new Date().toISOString() }, userId);
  const updatedAgent = await getAgent(agentId, userId);
  assert(updatedAgent?.name === "Verification Agent Updated", "Agent update failed");
  assert((await listAgents(userId)).some((item) => item.id === agentId), "Agent list failed");

  const provider = await createProvider(
    {
      id: providerId,
      userId,
      providerName: "openai",
      encryptedApiKey: "verification-encrypted-key",
      selectedModel: "gpt-4o-mini",
      isActive: true,
      metadata: { testStatus: "pending" },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    userId
  );
  assert(provider?.id === providerId, "Provider create failed");
  assert((await listProviders(userId)).some((item) => item.id === providerId), "Provider list failed");

  await createConversation({ id: conversationId, userId, title: "Verification conversation" });
  const message = await addMessage({
    conversationId,
    userId,
    role: "user",
    content: "Verification message",
  });
  assert(message.id > 0, "Message insert failed");
  const messages = await listMessages(conversationId, userId);
  assert(messages.length === 1 && messages[0].content === "Verification message", "Message read failed");

  await addAgentMemoryEntries(
    agentId,
    [
      { entryType: "conversation", role: "user", content: "hello" },
      { entryType: "execution", role: "system", content: "executed", metadata: { success: true } },
    ],
    userId
  );
  await saveAgentNotes(agentId, "verification notes", userId);
  const memory = await getAgentMemory(agentId, userId);
  assert(memory.conversationHistory.length === 1, "Memory conversation entry failed");
  assert(memory.executionHistory.length === 1, "Memory execution entry failed");
  assert(memory.notes === "verification notes", "Memory notes failed");

  const bulkMemories = await getAgentMemories([agentId, "missing-verify-agent"], userId);
  assert(bulkMemories[agentId]?.conversationHistory.length === 1, "Bulk memory conversation failed");
  assert(bulkMemories[agentId]?.executionHistory.length === 1, "Bulk memory execution failed");
  assert(bulkMemories[agentId]?.notes === "verification notes", "Bulk memory notes failed");
  assert(bulkMemories["missing-verify-agent"]?.conversationHistory.length === 0, "Bulk memory empty agent failed");

  const executionId = await recordExecution(
    {
      agentId,
      conversationId,
      userRequest: "Verification message",
      success: true,
      output: "Verification output",
      executionStrategy: "parallel",
    },
    userId
  );
  assert(executionId > 0, "Execution insert failed");

  await recordOrchestratorRun(
    {
      id: runId,
      conversationId,
      userRequest: "Verification message",
      finalResponse: "Verification response",
      agentOutputs: [{ agentId, success: true }],
      relevantAgents: [{ id: agentId, name: agent.name }],
      executionStrategy: "parallel",
      success: true,
    },
    userId
  );

  const runs = await client.execute({
    sql: "SELECT COUNT(*) AS count FROM orchestrator_runs WHERE id = ?",
    args: [runId],
  });
  assert(Number(runs.rows[0].count) === 1, "Orchestrator run insert failed");

  const turnRunId = `verify-turn-${suffix}`;
  await persistOrchestratorTurn({
    run: {
      id: turnRunId,
      conversationId,
      userRequest: "Persist a full turn",
      finalResponse: "Persisted turn response",
      agentOutputs: [],
      relevantAgents: [{ id: agentId, name: agent.name }],
      executionStrategy: "parallel",
      success: true,
      error: null,
    },
    agentOutputs: [
      {
        agentId,
        agentName: agent.name,
        success: true,
        content: "Turn agent output",
        timestamp: new Date().toISOString(),
      },
    ],
    assistantMessage: {
      conversationId,
      role: "assistant",
      content: "Persisted turn response",
      metadata: { orchestratorRunId: turnRunId },
    },
    userId,
  });
  const turnMessages = await listMessages(conversationId, userId);
  assert(turnMessages.length === 2, "Batched turn assistant message failed");
  const turnRun = await client.execute({
    sql: "SELECT COUNT(*) AS count FROM orchestrator_runs WHERE id = ?",
    args: [turnRunId],
  });
  assert(Number(turnRun.rows[0].count) === 1, "Batched orchestrator turn failed");

  await clearAgentMemory(agentId, userId);
  await deleteAgent(agentId, userId);
  await deleteProvider(providerId, userId);
  await deleteConversation(conversationId, userId);
  await client.execute({
    sql: "DELETE FROM executions WHERE user_id = ?",
    args: [userId],
  });
  await client.execute({
    sql: "DELETE FROM orchestrator_runs WHERE user_id = ?",
    args: [userId],
  });

  assert((await getAgent(agentId, userId)) === null, "Agent cleanup failed");
  assert(!(await listProviders(userId)).some((item) => item.id === providerId), "Provider cleanup failed");

  console.log("[verify] CRUD, indexes, memories, executions, and runs verified successfully.");
} catch (error) {
  console.error("[verify] FAILED:", error.message);
  process.exitCode = 1;
} finally {
  try {
    getTursoClient().close();
  } catch {
    // The client may not have been created if configuration failed.
  }
}
