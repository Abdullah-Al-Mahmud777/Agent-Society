/**
 * Dynamic LLM Provider Factory
 * 
 * Factory Pattern to dynamically initialize LLM clients based on user configuration
 * 
 * Updated: Fixed for Next.js 16/Turbopack compatibility with static ESM imports
 * Updated: Replaced Gemini with Alibaba Cloud Qwen
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { decryptApiKey } from "./encryption";
import { PROVIDERS } from "./db-schema";
import { QWEN_BASE_URL } from "@/providers/qwenProvider";
import { AI_RETRY_CONFIG } from "./ai-retry";
import {
  createGeminiClient as makeGeminiClient,
  generateGeminiContent,
  normalizeGeminiModel,
} from "@/providers/geminiProvider";

/**
 * Flattens chat history into alternating {role, content} turns, merging
 * consecutive same-role entries so providers that require strict alternation
 * (Anthropic, Gemini) accept the payload.
 */
function normalizeTurns(history) {
  const turns = [];
  for (const entry of Array.isArray(history) ? history : []) {
    const role =
      entry?.role === "assistant" || entry?.role === "model"
        ? "assistant"
        : entry?.role === "user"
          ? "user"
          : null;
    const content = typeof entry?.content === "string" ? entry.content.trim() : "";
    if (!role || !content) continue;
    const last = turns[turns.length - 1];
    if (last && last.role === role) last.content += `\n\n${content}`;
    else turns.push({ role, content });
  }
  return turns;
}

/**
 * History plus the new user prompt, always ending with a user turn.
 * Without `options.history` this returns a single turn, so single-shot calls
 * behave exactly as before.
 */
function buildTurns(options, prompt) {
  const turns = normalizeTurns(options.history);
  const last = turns[turns.length - 1];
  if (last && last.role === "user") last.content += `\n\n${prompt}`;
  else turns.push({ role: "user", content: prompt });
  return turns;
}

/**
 * Provider Factory - Creates LLM client instances dynamically
 */
export class LLMProviderFactory {
  constructor(userProviderConfig) {
    this.config = userProviderConfig;
    this.apiKey = userProviderConfig?.apiKey
      || (userProviderConfig?.encryptedApiKey ? decryptApiKey(userProviderConfig.encryptedApiKey) : "");
    this.provider = userProviderConfig?.providerName || userProviderConfig?.provider;
    this.model = userProviderConfig?.selectedModel || userProviderConfig?.model;
  }

  /**
   * Get the appropriate LLM client instance
   */
  getClient() {
    switch (this.provider) {
      case PROVIDERS.QWEN:
      case "qwen":
        return this.createQwenClient();
      
      case PROVIDERS.OPENAI:
      case "openai":
        return this.createOpenAIClient();
      
      case PROVIDERS.ANTHROPIC:
      case "anthropic":
        return this.createAnthropicClient();

      case "openrouter":
        return this.createOpenRouterClient();

      case PROVIDERS.GEMINI:
      case "gemini":
        return this.createGeminiClient();
      
      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }

  /**
   * Create Alibaba Cloud Qwen client (using OpenAI SDK compatible mode)
   */
  createQwenClient() {
    try {
      const qwen = new OpenAI({
        apiKey: this.apiKey,
        baseURL: QWEN_BASE_URL,
        timeout: AI_RETRY_CONFIG.requestTimeoutMs,
        maxRetries: 1,
      });
      
      return {
        provider: PROVIDERS.QWEN,
        client: qwen,
        model: this.model,
        
        async generateContent(prompt, options = {}) {
          const messages = [
            ...(options.systemPrompt ? [{ role: "system", content: options.systemPrompt }] : []),
            ...buildTurns(options, prompt).map((turn) => ({ ...turn })),
          ];
          
          const response = await qwen.chat.completions.create({
            model: this.model,
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 2048,
          });
          
          return response.choices[0].message.content;
        },
      };
    } catch (error) {
      console.error("❌ Failed to initialize Qwen client:", error);
      throw new Error(`Failed to initialize Qwen client: ${error.message}`);
    }
  }

  /**
   * Create OpenAI client
   * Note: Requires OpenAI SDK to be installed: npm install openai
   */
  createOpenAIClient() {
    try {
      const openai = new OpenAI({
        apiKey: this.apiKey,
        timeout: AI_RETRY_CONFIG.requestTimeoutMs,
        maxRetries: 1,
      });
      
      return {
        provider: PROVIDERS.OPENAI,
        client: openai,
        model: this.model,
        
        async generateContent(prompt, options = {}) {
          const messages = [
            ...(options.systemPrompt ? [{ role: "system", content: options.systemPrompt }] : []),
            ...buildTurns(options, prompt).map((turn) => ({ ...turn })),
          ];
          
          const response = await openai.chat.completions.create({
            model: this.model,
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 2048,
          });
          
          return response.choices[0].message.content;
        },
      };
    } catch (error) {
      throw new Error(`Failed to initialize OpenAI client: ${error.message}`);
    }
  }

  /**
   * Create Anthropic Claude client
   * Note: Requires Anthropic SDK to be installed: npm install @anthropic-ai/sdk
   */
  createAnthropicClient() {
    try {
      const anthropic = new Anthropic({
        apiKey: this.apiKey,
        timeout: AI_RETRY_CONFIG.requestTimeoutMs,
        maxRetries: 1,
      });
      
      return {
        provider: PROVIDERS.ANTHROPIC,
        client: anthropic,
        model: this.model,
        
        async generateContent(prompt, options = {}) {
          const turns = buildTurns(options, prompt).filter(
            (turn) => turn.role !== "system"
          );
          if (turns[0]?.role === "assistant") turns.shift();

          const response = await anthropic.messages.create({
            model: this.model,
            max_tokens: options.maxTokens ?? 2048,
            temperature: options.temperature ?? 0.7,
            system: options.systemPrompt,
            messages: turns.map((turn) => ({ ...turn })),
          });
          
          return response.content[0].text;
        },
      };
    } catch (error) {
      throw new Error(`Failed to initialize Anthropic client: ${error.message}`);
    }
  }

  /**
   * Create OpenRouter client
   */
  createOpenRouterClient() {
    try {
      const openrouter = new OpenAI({
        apiKey: this.apiKey,
        baseURL: "https://openrouter.ai/api/v1",
        timeout: AI_RETRY_CONFIG.requestTimeoutMs,
        maxRetries: 1,
      });
      
      return {
        provider: PROVIDERS.OPENROUTER,
        client: openrouter,
        model: this.model,
        
        async generateContent(prompt, options = {}) {
          const messages = [
            ...(options.systemPrompt ? [{ role: "system", content: options.systemPrompt }] : []),
            ...buildTurns(options, prompt).map((turn) => ({ ...turn })),
          ];
          
          const response = await openrouter.chat.completions.create({
            model: this.model,
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 2048,
          });
          
          return response.choices[0].message.content;
        },
      };
    } catch (error) {
      throw new Error(`Failed to initialize OpenRouter client: ${error.message}`);
    }
  }

  /**
   * Create Google Gemini client (using @google/genai SDK)
   * Same unified interface: generateContent(prompt, { systemPrompt, temperature, maxTokens })
   * So Qwen key slot <-> Gemini key slot are interchangeable.
   */
  createGeminiClient() {
    try {
      const ai = makeGeminiClient(this.apiKey);
      const model = normalizeGeminiModel(this.model);

      return {
        provider: PROVIDERS.GEMINI,
        client: ai,
        model,

        async generateContent(prompt, options = {}) {
          const turns = buildTurns(options, prompt);
          const contents =
            turns.length === 1 && turns[0].role === "user"
              ? turns[0].content
              : turns.map((turn) => ({
                  role: turn.role === "assistant" ? "model" : "user",
                  parts: [{ text: turn.content }],
                }));

          return generateGeminiContent({
            ai,
            contents,
            model,
            config: {
              ...(options.systemPrompt ? { systemInstruction: options.systemPrompt } : {}),
              temperature: options.temperature ?? 0.7,
              maxOutputTokens: options.maxTokens ?? 2048,
            },
          });
        },
      };
    } catch (error) {
      throw new Error(`Failed to initialize Gemini client: ${error.message}`);
    }
  }

  /**
   * Test connection with a lightweight prompt
   */
  async testConnection() {
    try {
      const client = this.getClient();
      const testPrompt = "Hello! Please respond with just 'OK' to confirm the connection.";
      
      const response = await client.generateContent(testPrompt, {
        temperature: 0,
        maxTokens: 10,
      });
      
      return {
        success: true,
        message: "Connection successful",
        response: response?.substring(0, 100),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error,
      };
    }
  }
}

/**
 * Helper function to create provider instance from config
 */
export function createProvider(userProviderConfig) {
  return new LLMProviderFactory(userProviderConfig);
}

/**
 * Helper function to execute agent task with dynamic provider
 */
export async function executeAgentTask(userProviderConfig, prompt, options = {}) {
  const factory = new LLMProviderFactory(userProviderConfig);
  const client = factory.getClient();
  
  return await client.generateContent(prompt, options);
}
