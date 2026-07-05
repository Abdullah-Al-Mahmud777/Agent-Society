/**
 * Dynamic LLM Provider Factory
 * 
 * Factory Pattern to dynamically initialize LLM clients based on user configuration
 */

import { GoogleGenAI } from "@google/genai";
import { decryptApiKey } from "./encryption";
import { PROVIDERS } from "./db-schema";

/**
 * Provider Factory - Creates LLM client instances dynamically
 */
export class LLMProviderFactory {
  constructor(userProviderConfig) {
    this.config = userProviderConfig;
    this.apiKey = decryptApiKey(userProviderConfig.encryptedApiKey);
    this.provider = userProviderConfig.providerName;
    this.model = userProviderConfig.selectedModel;
  }

  /**
   * Get the appropriate LLM client instance
   */
  getClient() {
    switch (this.provider) {
      case PROVIDERS.GEMINI:
        return this.createGeminiClient();
      
      case PROVIDERS.OPENAI:
        return this.createOpenAIClient();
      
      case PROVIDERS.ANTHROPIC:
        return this.createAnthropicClient();
      
      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }

  /**
   * Create Google Gemini client
   */
  createGeminiClient() {
    try {
      const genAI = new GoogleGenAI({ apiKey: this.apiKey });
      return {
        provider: PROVIDERS.GEMINI,
        client: genAI,
        model: this.model,
        
        async generateContent(prompt, options = {}) {
          const response = await genAI.models.generateContent({
            model: this.model,
            contents: prompt,
            config: {
              temperature: options.temperature ?? 0.7,
              maxOutputTokens: options.maxTokens ?? 2048,
              systemInstruction: options.systemPrompt,
            },
          });
          return response.text;
        },
      };
    } catch (error) {
      throw new Error(`Failed to initialize Gemini client: ${error.message}`);
    }
  }

  /**
   * Create OpenAI client
   * Note: Requires OpenAI SDK to be installed: npm install openai
   */
  createOpenAIClient() {
    try {
      // Dynamic import to avoid bundling if not used
      const OpenAI = require("openai").default;
      const openai = new OpenAI({ apiKey: this.apiKey });
      
      return {
        provider: PROVIDERS.OPENAI,
        client: openai,
        model: this.model,
        
        async generateContent(prompt, options = {}) {
          const messages = [
            ...(options.systemPrompt ? [{ role: "system", content: options.systemPrompt }] : []),
            { role: "user", content: prompt },
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
      const Anthropic = require("@anthropic-ai/sdk").default;
      const anthropic = new Anthropic({ apiKey: this.apiKey });
      
      return {
        provider: PROVIDERS.ANTHROPIC,
        client: anthropic,
        model: this.model,
        
        async generateContent(prompt, options = {}) {
          const response = await anthropic.messages.create({
            model: this.model,
            max_tokens: options.maxTokens ?? 2048,
            temperature: options.temperature ?? 0.7,
            system: options.systemPrompt,
            messages: [{ role: "user", content: prompt }],
          });
          
          return response.content[0].text;
        },
      };
    } catch (error) {
      throw new Error(`Failed to initialize Anthropic client: ${error.message}`);
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
