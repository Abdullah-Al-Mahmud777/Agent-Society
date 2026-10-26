/**
 * Per-agent memory client.
 *
 * Turso is the source of truth. Memory is kept in module memory only for the
 * current page session; browser storage is never used, preventing one account
 * from reading or importing another account's memories.
 */

function emptyMemory() {
  return {
    conversationHistory: [],
    executionHistory: [],
    notes: "",
  };
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok || data?.success === false) {
    const error = new Error(data?.error || "Agent memory request failed");
    error.status = response.status;
    error.code = data?.code;
    throw error;
  }

  return data;
}

function isDatabaseUnavailable(error) {
  return error?.status === 503 || error?.code === "DATABASE_NOT_CONFIGURED";
}

function logMemorySyncError(message, error) {
  if (!isDatabaseUnavailable(error)) {
    console.error(message, error);
  }
}

function hasMemoryContent(memory) {
  return Boolean(
    memory?.notes ||
      memory?.conversationHistory?.length ||
      memory?.executionHistory?.length
  );
}

export class AgentMemory {
  constructor() {
    this.memory = this.loadMemory();
  }

  loadMemory() {
    return {};
  }

  saveMemory() {
    // Intentionally in-memory only.
  }

  getAgentMemory(agentId) {
    if (!this.memory[agentId]) {
      this.memory[agentId] = emptyMemory();
    }
    return this.memory[agentId];
  }

  /**
   * Loads memory from Turso for the authenticated account.
   */
  async loadFromServer(agentId) {
    if (!agentId || typeof window === "undefined") {
      return this.getAgentMemory(agentId);
    }

    const localMemory = this.getAgentMemory(agentId);

    try {
      const data = await requestJson(
        `/api/db/memories?agentId=${encodeURIComponent(agentId)}`
      );
      const serverMemory = data.memory || emptyMemory();

      if (hasMemoryContent(serverMemory)) {
        this.memory[agentId] = {
          conversationHistory: serverMemory.conversationHistory || [],
          executionHistory: serverMemory.executionHistory || [],
          notes: serverMemory.notes || "",
        };
        this.saveMemory();
        return this.memory[agentId];
      }

      return localMemory;
    } catch (error) {
      logMemorySyncError("Failed to load agent memory from Turso:", error);
      return localMemory;
    }
  }

  addConversationEntry(agentId, entry) {
    const agentMemory = this.getAgentMemory(agentId);
    const nextEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    agentMemory.conversationHistory.push(nextEntry);
    if (agentMemory.conversationHistory.length > 100) {
      agentMemory.conversationHistory = agentMemory.conversationHistory.slice(-100);
    }
    this.saveMemory();

    return requestJson("/api/db/memories", {
      method: "POST",
      body: JSON.stringify({
        agentId,
        entry: {
          entryType: "conversation",
          role: nextEntry.role,
          content: nextEntry.content,
          metadata: { ...nextEntry, timestamp: undefined },
          createdAt: nextEntry.timestamp,
        },
      }),
    }).catch((error) => {
      logMemorySyncError("Failed to persist conversation memory:", error);
    });
  }

  addExecutionEntry(agentId, entry) {
    const agentMemory = this.getAgentMemory(agentId);
    const nextEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    agentMemory.executionHistory.push(nextEntry);
    if (agentMemory.executionHistory.length > 50) {
      agentMemory.executionHistory = agentMemory.executionHistory.slice(-50);
    }
    this.saveMemory();

    return requestJson("/api/db/memories", {
      method: "POST",
      body: JSON.stringify({
        agentId,
        entry: {
          entryType: "execution",
          role: "system",
          content: JSON.stringify(nextEntry),
          metadata: nextEntry,
          createdAt: nextEntry.timestamp,
        },
      }),
    }).catch((error) => {
      logMemorySyncError("Failed to persist execution memory:", error);
    });
  }

  updateNotes(agentId, notes) {
    const agentMemory = this.getAgentMemory(agentId);
    agentMemory.notes = notes;
    this.saveMemory();

    return requestJson("/api/db/memories", {
      method: "PUT",
      body: JSON.stringify({ agentId, notes }),
    });
  }

  clearAgentMemory(agentId) {
    delete this.memory[agentId];
    this.saveMemory();

    return requestJson(
      `/api/db/memories?agentId=${encodeURIComponent(agentId)}`,
      { method: "DELETE" }
    );
  }

  clearAllMemory() {
    this.memory = {};
    this.saveMemory();

    return requestJson("/api/db/memories?all=true", { method: "DELETE" }).catch(
      (error) => {
        logMemorySyncError("Failed to clear agent memory in Turso:", error);
      }
    );
  }
}
