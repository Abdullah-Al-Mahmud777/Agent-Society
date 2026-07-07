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
          try {
            console.log("🔵 Gemini API Call Starting...");
            console.log("- Model:", this.model);
            console.log("- API Key present:", !!this.apiKey);
            console.log("- API Key length:", this.apiKey?.length || 0);
            console.log("- API Key prefix:", this.apiKey?.substring(0, 6) || "MISSING");
            console.log("- Prompt length:", prompt.length);
            console.log("- Temperature:", options.temperature ?? 0.7);
            console.log("- Max tokens:", options.maxTokens ?? 2048);
            console.log("- Has system prompt:", !!options.systemPrompt);
            
            // Build the generation config
            const config = {
              temperature: options.temperature ?? 0.7,
              maxOutputTokens: options.maxTokens ?? 2048,
            };
            
            // Build the request object for @google/genai v2.10.0
            const requestParams = {
              model: this.model,
              contents: prompt, // SDK accepts string directly
              config,
            };
            
            // Add system instruction if provided
            if (options.systemPrompt) {
              requestParams.systemInstruction = options.systemPrompt;
            }
            
            console.log("- Request config:", JSON.stringify(config, null, 2));
            console.log("- Has system instruction:", !!requestParams.systemInstruction);
            
            // Call Gemini API using ai.models.generateContent()
            // This is the correct method for @google/genai v2.10.0
            const result = await genAI.models.generateContent(requestParams);
            
            console.log("✅ Gemini API Response received");
            console.log("- Response type:", typeof result);
            console.log("- Response has 'text' property:", 'text' in result);
            
            // Extract text from response
            // For @google/genai v2.10.0, result.text is a property
            const responseText = result.text;
            
            if (!responseText) {
              console.error("❌ No text in Gemini response");
              console.error("- Response keys:", Object.keys(result || {}));
              throw new Error("Gemini API returned empty response");
            }
            
            console.log("✅ Response text extracted, length:", responseText.length);
            return responseText;
            
          } catch (error) {
            console.error("❌ Gemini API Error:");
            console.error("- Error name:", error.name);
            console.error("- Error message:", error.message);
            console.error("- Error stack:", error.stack);
            
            // Check for specific Gemini API errors
            if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("API key") || error.message?.includes("invalid")) {
              throw new Error("Invalid Gemini API key. Please check your configuration.");
            }
            if (error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED")) {
              throw new Error("Gemini API quota exceeded. Please check your usage limits.");
            }
            if (error.message?.includes("model") || error.message?.includes("NOT_FOUND")) {
              throw new Error(`Invalid model: ${this.model}. Please check the model name.`);
            }
            if (error.message?.includes("PERMISSION_DENIED")) {
              throw new Error("Permission denied. Check your API key has access to this model.");
            }
            
            throw new Error(`Gemini API error: ${error.message}`);
          }
        },
      };
    } catch (error) {
      console.error("❌ Failed to initialize Gemini client:", error);
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
