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
