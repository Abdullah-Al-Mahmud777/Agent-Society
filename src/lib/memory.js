/**
 * Conversation Memory Management for AI Agent Framework
 * 
 * This module handles conversation history and memory management for AI agents.
 * Supports both short-term (in-memory) and long-term (database) storage patterns.
 * 
 * Architecture:
 * - Short-term: In-memory Map for session-based caching
 * - Long-term: Database interface (MongoDB/Mongoose) - ready for future implementation
 * 
 * @module memory
 */

// ============================================================================
// IN-MEMORY STORAGE (Short-term)
// ============================================================================

/**
 * In-memory conversation history store
 * Key: sessionId/agentId -> Value: Array of message objects
 * 
 * @type {Map<string, Array<{role: string, content: string, timestamp: string}>>}
 */
const memoryStore = new Map();

/**
 * Maximum number of messages to keep per session (prevents memory bloat)
 * @type {number}
 */
const MAX_MESSAGES_PER_SESSION = 100;

/**
 * Default session ID for single-agent scenarios
 * @type {string}
 */
const DEFAULT_SESSION_ID = 'default-session';

// ============================================================================
// CORE MEMORY FUNCTIONS
// ============================================================================

/**
 * Fetches conversation history for a specific session or agent
 * 
 * @param {string} sessionId - Unique identifier for the conversation session
 * @returns {Array<{role: string, content: string, timestamp: string}>} Array of message objects
 */
export function getChatHistory(sessionId = DEFAULT_SESSION_ID) {
  try {
    const history = memoryStore.get(sessionId) || [];
    
    // Return a copy to prevent external mutations
    return [...history];
  } catch (error) {
    console.error(`[Memory] Error fetching chat history for session ${sessionId}:`, error.message);
    return [];
  }
}

/**
 * Saves a new message to the conversation history
 * 
 * @param {string} sessionId - Unique identifier for the conversation session
 * @param {string} role - Message role ('user', 'model', 'assistant', 'system')
 * @param {string} content - Message content
 * @returns {boolean} Success status
 */
export function saveMessage(sessionId = DEFAULT_SESSION_ID, role, content) {
  try {
    // Validate inputs
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('Invalid sessionId: must be a non-empty string');
    }
    
    if (!role || typeof role !== 'string') {
      throw new Error('Invalid role: must be a non-empty string');
    }
    
    if (content === undefined || content === null) {
      throw new Error('Invalid content: cannot be null or undefined');
    }
    
    // Get existing history or initialize new array
    const history = memoryStore.get(sessionId) || [];
    
    // Add new message with timestamp
    const message = {
      role,
      content: String(content),
      timestamp: new Date().toISOString(),
    };
    
    history.push(message);
    
    // Enforce maximum message limit (FIFO)
    if (history.length > MAX_MESSAGES_PER_SESSION) {
      history.shift(); // Remove oldest message
    }
    
    // Store updated history
    memoryStore.set(sessionId, history);
    
    console.log(`[Memory] Saved message to session ${sessionId}: role=${role}, totalMessages=${history.length}`);
    
    return true;
  } catch (error) {
    console.error(`[Memory] Error saving message to session ${sessionId}:`, error.message);
    return false;
  }
}

/**
 * Clears conversation history for a specific session
 * 
 * @param {string} sessionId - Unique identifier for the conversation session
 * @returns {boolean} Success status
 */
export function clearHistory(sessionId = DEFAULT_SESSION_ID) {
  try {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('Invalid sessionId: must be a non-empty string');
    }
    
    const hadHistory = memoryStore.has(sessionId);
    memoryStore.delete(sessionId);
    
    console.log(`[Memory] Cleared history for session ${sessionId} (existed: ${hadHistory})`);
    
    return true;
  } catch (error) {
    console.error(`[Memory] Error clearing history for session ${sessionId}:`, error.message);
    return false;
  }
}

/**
 * Clears all conversation history (useful for testing or cleanup)
 * 
 * @returns {boolean} Success status
 */
export function clearAllHistory() {
  try {
    const sessionCount = memoryStore.size;
    memoryStore.clear();
    
    console.log(`[Memory] Cleared all history for ${sessionCount} sessions`);
    
    return true;
  } catch (error) {
    console.error('[Memory] Error clearing all history:', error.message);
    return false;
  }
}

// ============================================================================
// CONTEXT BUILDING FUNCTIONS
// ============================================================================

/**
 * Builds a formatted conversation context for LLM APIs
 * Converts internal memory format to provider-specific formats
 * 
 * @param {string} sessionId - Unique identifier for the conversation session
 * @param {string} provider - LLM provider ('gemini', 'openai', 'anthropic')
 * @param {number} maxHistory - Maximum number of recent messages to include
 * @returns {Array|Object} Formatted conversation history for the specific provider
 */
export function buildConversationContext(sessionId = DEFAULT_SESSION_ID, provider = 'gemini', maxHistory = 10) {
  try {
    const history = getChatHistory(sessionId);
    
    // Get only the most recent messages
    const recentHistory = history.slice(-maxHistory);
    
    switch (provider.toLowerCase()) {
      case 'gemini':
        // Gemini format: Array of strings or structured objects
        return recentHistory.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : msg.role,
          parts: [{ text: msg.content }]
        }));
      
      case 'openai':
        // OpenAI format: Array of message objects
        return recentHistory.map(msg => ({
          role: msg.role === 'model' ? 'assistant' : msg.role,
          content: msg.content
        }));
      
      case 'anthropic':
        // Anthropic format: Array of message objects
        return recentHistory.map(msg => ({
          role: msg.role === 'model' ? 'assistant' : msg.role,
          content: msg.content
        }));
      
      default:
        // Generic format
        return recentHistory;
    }
  } catch (error) {
    console.error(`[Memory] Error building conversation context for ${provider}:`, error.message);
    return [];
  }
}

/**
 * Builds complete agent context including system prompt, personality, and chat history
 * This is the main function to call before sending to an LLM
 * 
 * @param {Object} agent - Agent configuration object
 * @param {string} agent.id - Unique agent identifier
 * @param {string} agent.systemPrompt - Core system prompt for the agent
 * @param {string} agent.personality - Optional personality/context string
 * @param {string} agent.role - Agent's role description
 * @param {string} provider - LLM provider ('gemini', 'openai', 'anthropic')
 * @param {number} maxHistory - Maximum number of recent messages to include
 * @returns {Object} Complete context object for LLM API
 */
export function buildAgentContext(agent, provider = 'gemini', maxHistory = 10) {
  try {
    const sessionId = agent.id || DEFAULT_SESSION_ID;
    
    // Build base context components
    const contextComponents = [];
    
    // Add system prompt if provided
    if (agent.systemPrompt) {
      contextComponents.push(agent.systemPrompt);
    }
    
    // Add personality if provided
    if (agent.personality) {
      contextComponents.push(`Personality: ${agent.personality}`);
    }
    
    // Add role if provided
    if (agent.role) {
      contextComponents.push(`Role: ${agent.role}`);
    }
    
    // Combine system components
    const systemInstruction = contextComponents.filter(Boolean).join('\n\n');
    
    // Get conversation history
    const conversationHistory = buildConversationContext(sessionId, provider, maxHistory);
    
    // Return complete context object
    return {
      systemInstruction,
      conversationHistory,
      sessionId,
      provider,
      messageCount: conversationHistory.length,
      
      // Helper method to get formatted context for specific providers
      toGeminiFormat() {
        return {
          systemInstruction: this.systemInstruction,
          contents: this.conversationHistory
        };
      },
      
      toOpenAIFomat() {
        return {
          messages: [
            ...(this.systemInstruction ? [{ role: 'system', content: this.systemInstruction }] : []),
            ...this.conversationHistory
          ]
        };
      },
      
      toAnthropicFormat() {
        return {
          system: this.systemInstruction,
          messages: this.conversationHistory
        };
      }
    };
  } catch (error) {
    console.error('[Memory] Error building agent context:', error.message);
    
    // Return minimal context on error
    return {
      systemInstruction: agent?.systemPrompt || '',
      conversationHistory: [],
      sessionId: agent?.id || DEFAULT_SESSION_ID,
      provider,
      messageCount: 0
    };
  }
}

// ============================================================================
// AGENT-SPECIFIC MEMORY FUNCTIONS
// ============================================================================

/**
 * Long-term memory storage for agent-specific memories
 * Key: agentId -> Value: Array of memory objects
 * 
 * @type {Map<string, Array<{type: string, content: string, timestamp: string, sessionId: string}>>}
 */
const agentMemoryStore = new Map();

/**
 * Maximum number of memories to keep per agent
 * @type {number}
 */
const MAX_MEMORIES_PER_AGENT = 50;

/**
 * Retrieves relevant memories for a specific agent based on business context
 * Filters memories by agent ID and optionally by content similarity
 * 
 * @param {Array} memories - Array of all available memories
 * @param {string} agentId - Unique identifier for the agent
 * @param {string} businessIdea - Business context to filter relevant memories
 * @param {number} limit - Maximum number of memories to return (default: 5)
 * @returns {Array} Relevant memories for the agent
 */
export function retrieveRelevantMemories(memories, agentId, businessIdea = '', limit = 5) {
  try {
    if (!Array.isArray(memories)) {
      console.warn('[Memory] retrieveRelevantMemories: memories is not an array, returning empty');
      return [];
    }

    // Filter memories by agent ID
    const agentMemories = memories.filter(memory => 
      memory.agentId === agentId || memory.agentId === 'global'
    );

    // If business context provided, filter by relevance (simple keyword matching)
    if (businessIdea) {
      const keywords = businessIdea.toLowerCase().split(/\s+/).filter(k => k.length > 3);
      const scoredMemories = agentMemories.map(memory => {
        const content = (memory.content || '').toLowerCase();
        const score = keywords.reduce((sum, keyword) => 
          sum + (content.includes(keyword) ? 1 : 0), 0
        );
        return { ...memory, score };
      });

      // Sort by relevance score and return top results
      return scoredMemories
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ score, ...memory }) => memory);
    }

    // Return most recent memories if no business context
    return agentMemories.slice(-limit);
  } catch (error) {
    console.error('[Memory] Error in retrieveRelevantMemories:', error.message);
    return [];
  }
}

/**
 * Builds a formatted memory context string from retrieved memories
 * Converts memory objects into a readable format for LLM consumption
 * 
 * @param {Array} memories - Array of memory objects
 * @returns {string} Formatted memory context string
 */
export function buildMemoryContext(memories) {
  try {
    if (!Array.isArray(memories) || memories.length === 0) {
      return '';
    }

    const contextLines = memories.map((memory, index) => {
      const type = memory.type || 'general';
      const content = memory.content || '';
      const timestamp = memory.timestamp ? new Date(memory.timestamp).toLocaleDateString() : '';
      
      return `[Memory ${index + 1} - ${type}${timestamp ? ` (${timestamp})` : ''}]: ${content}`;
    });

    return contextLines.join('\n\n');
  } catch (error) {
    console.error('[Memory] Error in buildMemoryContext:', error.message);
    return '';
  }
}

/**
 * Extracts and structures memories from specialist agent responses
 * Used to capture key insights, findings, and recommendations from specialist agents
 * 
 * @param {Object} agent - Agent configuration object
 * @param {Object} result - Response result from the specialist agent
 * @param {string} businessIdea - Business context for the memory
 * @param {string} sessionId - Session identifier for tracking
 * @returns {Array} Array of extracted memory objects
 */
export function extractSpecialistMemories(agent, result, businessIdea, sessionId) {
  try {
    const memories = [];
    const timestamp = new Date().toISOString();

    // Extract key findings
    if (result.findings && result.findings !== 'N/A') {
      memories.push({
        agentId: agent.id,
        agentName: agent.name,
        type: 'finding',
        content: result.findings,
        businessIdea,
        sessionId,
        timestamp,
      });
    }

    // Extract recommendations
    if (result.recommendation && result.recommendation !== 'N/A') {
      memories.push({
        agentId: agent.id,
        agentName: agent.name,
        type: 'recommendation',
        content: result.recommendation,
        businessIdea,
        sessionId,
        timestamp,
      });
    }

    // Extract risks
    if (result.risks && result.risks !== 'N/A') {
      memories.push({
        agentId: agent.id,
        agentName: agent.name,
        type: 'risk',
        content: result.risks,
        businessIdea,
        sessionId,
        timestamp,
      });
    }

    // Extract confidence level
    if (result.confidence && result.confidence !== '0%') {
      memories.push({
        agentId: agent.id,
        agentName: agent.name,
        type: 'confidence',
        content: `Confidence level: ${result.confidence}`,
        businessIdea,
        sessionId,
        timestamp,
      });
    }

    // Store memories in agent memory store
    if (memories.length > 0) {
      const existingMemories = agentMemoryStore.get(agent.id) || [];
      const updatedMemories = [...existingMemories, ...memories];
      
      // Enforce memory limit
      if (updatedMemories.length > MAX_MEMORIES_PER_AGENT) {
        updatedMemories.splice(0, updatedMemories.length - MAX_MEMORIES_PER_AGENT);
      }
      
      agentMemoryStore.set(agent.id, updatedMemories);
    }

    return memories;
  } catch (error) {
    console.error('[Memory] Error in extractSpecialistMemories:', error.message);
    return [];
  }
}

/**
 * Extracts and structures memories from orchestrator/CEO agent responses
 * Used to capture final decisions, next steps, and strategic insights
 * 
 * @param {Object} agent - Orchestrator agent configuration object
 * @param {Object} finalResult - Final result from the orchestrator
 * @param {string} businessIdea - Business context for the memory
 * @param {string} sessionId - Session identifier for tracking
 * @returns {Object} Extracted orchestrator memory object
 */
export function extractOrchestratorMemory(agent, finalResult, businessIdea, sessionId) {
  try {
    const timestamp = new Date().toISOString();
    
    const memory = {
      agentId: agent.id,
      agentName: agent.name,
      type: 'orchestrator-decision',
      content: '',
      businessIdea,
      sessionId,
      timestamp,
      metadata: {
        summary: finalResult.summary || '',
        recommendation: finalResult.recommendation || '',
        nextSteps: finalResult.nextSteps || [],
        keyDecisions: finalResult.keyDecisions || [],
        confidence: finalResult.confidence || '',
      }
    };

    // Build comprehensive content string
    const contentParts = [];
    
    if (finalResult.summary) {
      contentParts.push(`Summary: ${finalResult.summary}`);
    }
    
    if (finalResult.recommendation) {
      contentParts.push(`Recommendation: ${finalResult.recommendation}`);
    }
    
    if (finalResult.nextSteps && finalResult.nextSteps.length > 0) {
      contentParts.push(`Next Steps:\n${finalResult.nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}`);
    }
    
    if (finalResult.keyDecisions && finalResult.keyDecisions.length > 0) {
      contentParts.push(`Key Decisions:\n${finalResult.keyDecisions.map((decision, i) => `${i + 1}. ${decision}`).join('\n')}`);
    }
    
    memory.content = contentParts.join('\n\n');

    // Store in agent memory store
    const existingMemories = agentMemoryStore.get(agent.id) || [];
    const updatedMemories = [...existingMemories, memory];
    
    // Enforce memory limit
    if (updatedMemories.length > MAX_MEMORIES_PER_AGENT) {
      updatedMemories.splice(0, updatedMemories.length - MAX_MEMORIES_PER_AGENT);
    }
    
    agentMemoryStore.set(agent.id, updatedMemories);

    return memory;
  } catch (error) {
    console.error('[Memory] Error in extractOrchestratorMemory:', error.message);
    return null;
  }
}

/**
 * Extracts and structures memories from debate interactions between agents
 * Used to capture position changes, agreements, disagreements, and reasoning
 * 
 * @param {Object} agent - Agent participating in the debate
 * @param {Object} debateResult - Debate result containing position changes
 * @param {string} businessIdea - Business context for the memory
 * @param {string} sessionId - Session identifier for tracking
 * @returns {Object} Extracted debate memory object
 */
export function extractDebateMemories(agent, debateResult, businessIdea, sessionId) {
  try {
    if (!debateResult || debateResult.positionChanged === undefined) {
      console.warn('[Memory] extractDebateMemories: Invalid debate result');
      return null;
    }

    const timestamp = new Date().toISOString();
    
    const memory = {
      agentId: agent.id,
      agentName: agent.name,
      type: 'debate-interaction',
      content: '',
      businessIdea,
      sessionId,
      timestamp,
      metadata: {
        positionChanged: debateResult.positionChanged,
        updatedPosition: debateResult.updatedPosition || '',
        agrees: debateResult.agrees || [],
        disagrees: debateResult.disagrees || [],
        reasoning: debateResult.reasoning || '',
      }
    };

    // Build comprehensive content string
    const contentParts = [];
    
    contentParts.push(`Position Changed: ${debateResult.positionChanged ? 'Yes' : 'No'}`);
    
    if (debateResult.updatedPosition) {
      contentParts.push(`Updated Position: ${debateResult.updatedPosition}`);
    }
    
    if (debateResult.agrees && debateResult.agrees.length > 0) {
      contentParts.push(`Agrees with: ${debateResult.agrees.join(', ')}`);
    }
    
    if (debateResult.disagrees && debateResult.disagrees.length > 0) {
      contentParts.push(`Disagrees with: ${debateResult.disagrees.join(', ')}`);
    }
    
    if (debateResult.reasoning) {
      contentParts.push(`Reasoning: ${debateResult.reasoning}`);
    }
    
    memory.content = contentParts.join('\n');

    // Store in agent memory store
    const existingMemories = agentMemoryStore.get(agent.id) || [];
    const updatedMemories = [...existingMemories, memory];
    
    // Enforce memory limit
    if (updatedMemories.length > MAX_MEMORIES_PER_AGENT) {
      updatedMemories.splice(0, updatedMemories.length - MAX_MEMORIES_PER_AGENT);
    }
    
    agentMemoryStore.set(agent.id, updatedMemories);

    return memory;
  } catch (error) {
    console.error('[Memory] Error in extractDebateMemories:', error.message);
    return null;
  }
}

/**
 * Gets all memories for a specific agent
 * 
 * @param {string} agentId - Unique identifier for the agent
 * @returns {Array} Array of memory objects for the agent
 */
export function getAgentMemories(agentId) {
  try {
    return agentMemoryStore.get(agentId) || [];
  } catch (error) {
    console.error('[Memory] Error in getAgentMemories:', error.message);
    return [];
  }
}

/**
 * Clears all memories for a specific agent
 * 
 * @param {string} agentId - Unique identifier for the agent
 * @returns {boolean} Success status
 */
export function clearAgentMemories(agentId) {
  try {
    agentMemoryStore.delete(agentId);
    console.log(`[Memory] Cleared memories for agent ${agentId}`);
    return true;
  } catch (error) {
    console.error('[Memory] Error in clearAgentMemories:', error.message);
    return false;
  }
}

// ============================================================================
// DATABASE INTERFACE (Future Implementation)
// ============================================================================

/**
 * Database interface for long-term memory storage
 * Implement these functions when integrating with MongoDB/Mongoose
 * 
 * @example
 * // MongoDB implementation example:
 * import MessageModel from '../models/Message';
 * 
 * export async function saveMessageToDB(sessionId, role, content) {
 *   await MessageModel.create({ sessionId, role, content });
 * }
 * 
 * export async function getChatHistoryFromDB(sessionId) {
 *   return await MessageModel.find({ sessionId }).sort({ timestamp: 1 });
 * }
 */

/**
 * Placeholder for database-backed message saving
 * @param {string} sessionId - Session identifier
 * @param {string} role - Message role
 * @param {string} content - Message content
 * @returns {Promise<boolean>}
 */
export async function saveMessageToDB(sessionId, role, content) {
  // TODO: Implement MongoDB/Mongoose integration
  console.warn('[Memory] Database storage not implemented yet. Using in-memory storage.');
  return saveMessage(sessionId, role, content);
}

/**
 * Placeholder for database-backed history fetching
 * @param {string} sessionId - Session identifier
 * @returns {Promise<Array>}
 */
export async function getChatHistoryFromDB(sessionId) {
  // TODO: Implement MongoDB/Mongoose integration
  console.warn('[Memory] Database storage not implemented yet. Using in-memory storage.');
  return getChatHistory(sessionId);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets statistics about memory usage
 * 
 * @param {string} sessionId - Optional session identifier for specific stats
 * @returns {Object} Memory statistics
 */
export function getMemoryStats(sessionId = null) {
  try {
    if (sessionId) {
      const history = memoryStore.get(sessionId) || [];
      return {
        sessionId,
        messageCount: history.length,
        lastActivity: history.length > 0 ? history[history.length - 1].timestamp : null,
        storageType: 'in-memory'
      };
    }
    
    // Global stats
    const sessions = Array.from(memoryStore.entries());
    const totalMessages = sessions.reduce((sum, [, history]) => sum + history.length, 0);
    
    return {
      totalSessions: sessions.length,
      totalMessages,
      storageType: 'in-memory',
      maxMessagesPerSession: MAX_MESSAGES_PER_SESSION,
      sessions: sessions.map(([id, history]) => ({
        sessionId: id,
        messageCount: history.length,
        lastActivity: history.length > 0 ? history[history.length - 1].timestamp : null
      }))
    };
  } catch (error) {
    console.error('[Memory] Error getting memory stats:', error.message);
    return null;
  }
}

/**
 * Exports conversation history to JSON format
 * Useful for debugging, export, or migration
 * 
 * @param {string} sessionId - Session identifier
 * @returns {string} JSON string of conversation history
 */
export function exportHistoryToJSON(sessionId = DEFAULT_SESSION_ID) {
  try {
    const history = getChatHistory(sessionId);
    return JSON.stringify({
      sessionId,
      exportedAt: new Date().toISOString(),
      messageCount: history.length,
      messages: history
    }, null, 2);
  } catch (error) {
    console.error('[Memory] Error exporting history to JSON:', error.message);
    return '{}';
  }
}

/**
 * Imports conversation history from JSON format
 * Useful for restoring conversations or testing
 * 
 * @param {string} json - JSON string of conversation history
 * @returns {boolean} Success status
 */
export function importHistoryFromJSON(json) {
  try {
    const data = JSON.parse(json);
    
    if (!data.sessionId || !Array.isArray(data.messages)) {
      throw new Error('Invalid JSON format: missing sessionId or messages array');
    }
    
    // Clear existing history for this session
    clearHistory(data.sessionId);
    
    // Import messages
    data.messages.forEach(msg => {
      if (msg.role && msg.content) {
        saveMessage(data.sessionId, msg.role, msg.content);
      }
    });
    
    console.log(`[Memory] Imported ${data.messages.length} messages for session ${data.sessionId}`);
    
    return true;
  } catch (error) {
    console.error('[Memory] Error importing history from JSON:', error.message);
    return false;
  }
}
