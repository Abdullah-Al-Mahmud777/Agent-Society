import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini API client
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Get a Gemini model instance
 * @param {string} modelName - Model name (default: 'gemini-2.5-flash')
 * @returns {Object} Gemini model instance
 */
export function getGeminiModel(modelName = 'gemini-2.5-flash') {
  return genAI.models.generateContent({ model: modelName });
}

/**
 * Generate text using Gemini
 * @param {string} prompt - The prompt to send to Gemini
 * @param {string} modelName - Optional model name
 * @returns {Promise<string>} Generated text
 */
export async function generateText(prompt, modelName = 'gemini-2.5-flash') {
  const response = await genAI.models.generateContent({
    model: modelName,
    contents: prompt,
  });
  return response.text;
}

/**
 * Generate streaming text using Gemini
 * @param {string} prompt - The prompt to send to Gemini
 * @param {string} modelName - Optional model name
 * @returns {Promise<AsyncGenerator>} Stream of text chunks
 */
export async function generateStreamingText(prompt, modelName = 'gemini-2.5-flash') {
  const response = await genAI.models.generateContent({
    model: modelName,
    contents: prompt,
  });
  
  // Return async generator for streaming
  async function* streamText() {
    yield response.text;
  }
  
  return streamText();
}

/**
 * Chat with Gemini (maintains conversation history)
 * @param {Array} history - Array of previous messages
 * @param {string} message - New message to send
 * @param {string} modelName - Optional model name
 * @returns {Promise<string>} Generated response
 */
export async function chat(history, message, modelName = 'gemini-2.5-flash') {
  // Build conversation context
  const conversationContext = history.map(msg => 
    `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
  ).join('\n\n');
  
  const fullPrompt = conversationContext 
    ? `${conversationContext}\n\nUser: ${message}\n\nAssistant:`
    : message;
  
  const response = await genAI.models.generateContent({
    model: modelName,
    contents: fullPrompt,
  });
  
  return response.text;
}

export default genAI;
