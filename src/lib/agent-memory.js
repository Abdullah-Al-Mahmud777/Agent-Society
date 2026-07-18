// Per-agent memory management
const AGENT_MEMORY_KEY = 'agent-society-agent-memory';

export class AgentMemory {
  constructor() {
    this.memory = this.loadMemory();
  }

  loadMemory() {
    if (typeof window === 'undefined') {
      return {};
    }
    try {
      const stored = localStorage.getItem(AGENT_MEMORY_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load agent memory:', error);
      return {};
    }
  }

  saveMemory() {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(AGENT_MEMORY_KEY, JSON.stringify(this.memory));
    } catch (error) {
      console.error('Failed to save agent memory:', error);
    }
  }

  getAgentMemory(agentId) {
    if (!this.memory[agentId]) {
      this.memory[agentId] = {
        conversationHistory: [],
        executionHistory: [],
        notes: '',
      };
    }
    return this.memory[agentId];
  }

  addConversationEntry(agentId, entry) {
    const agentMemory = this.getAgentMemory(agentId);
    agentMemory.conversationHistory.push({
      ...entry,
      timestamp: new Date().toISOString(),
    });
    // Keep last 100 entries
    if (agentMemory.conversationHistory.length > 100) {
      agentMemory.conversationHistory = agentMemory.conversationHistory.slice(-100);
    }
    this.saveMemory();
  }

  addExecutionEntry(agentId, entry) {
    const agentMemory = this.getAgentMemory(agentId);
    agentMemory.executionHistory.push({
      ...entry,
      timestamp: new Date().toISOString(),
    });
    // Keep last 50 executions
    if (agentMemory.executionHistory.length > 50) {
      agentMemory.executionHistory = agentMemory.executionHistory.slice(-50);
    }
    this.saveMemory();
  }

  updateNotes(agentId, notes) {
    const agentMemory = this.getAgentMemory(agentId);
    agentMemory.notes = notes;
    this.saveMemory();
  }

  clearAgentMemory(agentId) {
    delete this.memory[agentId];
    this.saveMemory();
  }

  clearAllMemory() {
    this.memory = {};
    this.saveMemory();
  }
}
