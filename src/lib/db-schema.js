/**
 * Database Schema for User Provider Configuration
 * 
 * This is a JSON-based local storage implementation.
 * For production, migrate to PostgreSQL/MongoDB with proper encryption.
 */

import { z } from "zod";

// Provider types supported — universal slot: any key works in same system
export const PROVIDERS = {
  OPENAI: "openai",
  QWEN: "qwen",
  ANTHROPIC: "anthropic",
  GEMINI: "gemini",
  OPENROUTER: "openrouter",
};

// User Provider Configuration Schema
export const userProviderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().min(1), // In production, link to auth user
  providerName: z.enum([PROVIDERS.OPENAI, PROVIDERS.QWEN, PROVIDERS.ANTHROPIC, PROVIDERS.GEMINI, PROVIDERS.OPENROUTER]),
  encryptedApiKey: z.string().min(1), // Encrypted API key
  selectedModel: z.string().min(1),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  metadata: z.object({
    lastTested: z.string().datetime().optional(),
    testStatus: z.enum(["success", "failed", "pending"]).optional(),
    displayName: z.string().optional(),
  }).optional(),
});

// Default models for each provider
export const DEFAULT_MODELS = {
  [PROVIDERS.OPENAI]: "gpt-4o-mini",
  [PROVIDERS.QWEN]: "qwen/qwen3.7-plus",
  [PROVIDERS.ANTHROPIC]: "claude-3-5-sonnet-20241022",
  [PROVIDERS.GEMINI]: "gemini-2.5-flash",
  [PROVIDERS.OPENROUTER]: "qwen/qwen3.7-plus",
};

// Provider display information
export const PROVIDER_INFO = {
  [PROVIDERS.OPENAI]: {
    name: "OpenAI",
    icon: "🤖",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    keyFormat: "sk-...",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  [PROVIDERS.QWEN]: {
    name: "Alibaba Cloud Qwen",
    icon: "🐉",
    models: ["qwen/qwen3.7-plus", "qwen/qwen3.5-plus", "qwen/qwen3-plus", "qwen/qwen-turbo"],
    keyFormat: "sk-or-v1-...",
    docsUrl: "https://bailian.console.aliyun.com/",
  },
  [PROVIDERS.ANTHROPIC]: {
    name: "Anthropic Claude",
    icon: "🧠",
    models: ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-3-haiku-20240307"],
    keyFormat: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/",
  },
  [PROVIDERS.GEMINI]: {
    name: "Google Gemini",
    icon: "✨",
    models: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-1.5-pro"],
    keyFormat: "AIza...",
    docsUrl: "https://aistudio.google.com/app/apikey",
  },
  [PROVIDERS.OPENROUTER]: {
    name: "OpenRouter",
    icon: "🔀",
    models: ["qwen/qwen3.7-plus", "qwen/qwen3.5-plus", "openai/gpt-4o-mini"],
    keyFormat: "sk-or-v1-...",
    docsUrl: "https://openrouter.ai/keys",
  },
};

export function createUserProvider(data) {
  return userProviderSchema.parse({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data,
  });
}
