/**
 * Gemini API Utility Functions
 * 
 * Provides helper functions for generating text with Google Gemini API
 * Compatible with Next.js App Router and Vercel deployment
 */

import { GoogleGenAI } from '@google/genai';

// HARDCODED API KEY - Replace with your actual Gemini API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';

// Default model to use
const DEFAULT_MODEL = 'gemini-2.5-flash';

/**
 * Generates text using Google Gemini API
 * 
 * @param {string} prompt - The input prompt for text generation
 * @param {Object} options - Optional configuration
 * @param {string} options.model - Model name (default: gemini-2.5-flash)
 * @param {number} options.temperature - Temperature (0-1, default: 0.7)
 * @param {number} options.maxTokens - Maximum tokens (default: 2048)
 * @param {string} options.systemPrompt - Optional system instruction
 * @returns {Promise<string>} Generated text response
 */
export async function generateText(prompt, options = {}) {
  try {
    const {
      model = DEFAULT_MODEL,
      temperature = 0.7,
      maxTokens = 2048,
      systemPrompt = null,
    } = options;

    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      throw new Error('GEMINI_API_KEY is not configured. Please set the environment variable or update the hardcoded value.');
    }

    const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const requestParams = {
      model,
      contents: prompt,
      config: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    };

    // Add system instruction if provided
    if (systemPrompt) {
      requestParams.systemInstruction = systemPrompt;
    }

    const result = await genAI.models.generateContent(requestParams);
    
    if (!result.text) {
      throw new Error('Gemini API returned empty response');
    }

    return result.text;
  } catch (error) {
    console.error('Gemini API error in generateText:', error);
    throw new Error(`Failed to generate text: ${error.message}`);
  }
}

/**
 * Generates streaming text using Google Gemini API
 * 
 * @param {string} prompt - The input prompt for text generation
 * @param {Object} options - Optional configuration
 * @param {string} options.model - Model name (default: gemini-2.5-flash)
 * @param {number} options.temperature - Temperature (0-1, default: 0.7)
 * @param {number} options.maxTokens - Maximum tokens (default: 2048)
 * @param {string} options.systemPrompt - Optional system instruction
 * @returns {AsyncGenerator<{text: string}>} Async generator yielding text chunks
 */
export async function* generateStreamingText(prompt, options = {}) {
  try {
    const {
      model = DEFAULT_MODEL,
      temperature = 0.7,
      maxTokens = 2048,
      systemPrompt = null,
    } = options;

    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      throw new Error('GEMINI_API_KEY is not configured. Please set the environment variable or update the hardcoded value.');
    }

    const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const requestParams = {
      model,
      contents: prompt,
      config: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    };

    // Add system instruction if provided
    if (systemPrompt) {
      requestParams.systemInstruction = systemPrompt;
    }

    const result = await genAI.models.generateContent(requestParams);
    
    if (!result.text) {
      throw new Error('Gemini API returned empty response');
    }

    // Yield the complete response as a single chunk
    // Note: For true streaming, you would use the streaming API from @google/genai
    // This implementation provides compatibility with the expected interface
    yield { text: result.text };
  } catch (error) {
    console.error('Gemini API error in generateStreamingText:', error);
    throw new Error(`Failed to generate streaming text: ${error.message}`);
  }
}

/**
 * Generates text with conversation history support
 * 
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Optional configuration
 * @returns {Promise<string>} Generated text response
 */
export async function generateChat(messages, options = {}) {
  try {
    const {
      model = DEFAULT_MODEL,
      temperature = 0.7,
      maxTokens = 2048,
      systemPrompt = null,
    } = options;

    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      throw new Error('GEMINI_API_KEY is not configured. Please set the environment variable or update the hardcoded value.');
    }

    const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Convert messages to Gemini format
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }]
    }));

    const requestParams = {
      model,
      contents,
      config: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    };

    // Add system instruction if provided
    if (systemPrompt) {
      requestParams.systemInstruction = systemPrompt;
    }

    const result = await genAI.models.generateContent(requestParams);
    
    if (!result.text) {
      throw new Error('Gemini API returned empty response');
    }

    return result.text;
  } catch (error) {
    console.error('Gemini API error in generateChat:', error);
    throw new Error(`Failed to generate chat response: ${error.message}`);
  }
}
