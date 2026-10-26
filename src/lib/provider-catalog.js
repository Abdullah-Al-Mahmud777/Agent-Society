export const PROVIDERS = {
  OPENAI: "openai",
  QWEN: "qwen",
  ANTHROPIC: "anthropic",
  GEMINI: "gemini",
  OPENROUTER: "openrouter",
};

export const DEFAULT_MODELS = {
  [PROVIDERS.OPENAI]: "gpt-4o-mini",
  [PROVIDERS.QWEN]: "qwen/qwen3.7-plus",
  [PROVIDERS.ANTHROPIC]: "claude-3-5-sonnet-20241022",
  [PROVIDERS.GEMINI]: "gemini-2.5-flash",
  [PROVIDERS.OPENROUTER]: "qwen/qwen3.7-plus",
};

export const PROVIDER_INFO = {
  [PROVIDERS.OPENAI]: {
    name: "OpenAI",
    icon: "🤖",
    description: "GPT models for general reasoning and fast everyday tasks.",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
    keyFormat: "sk-...",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  [PROVIDERS.QWEN]: {
    name: "Alibaba Cloud Qwen",
    icon: "🐉",
    description: "Qwen models through the OpenRouter-compatible endpoint.",
    models: ["qwen/qwen3.7-plus", "qwen/qwen3.5-plus", "qwen/qwen3-plus", "qwen/qwen-turbo"],
    keyFormat: "sk-or-v1-...",
    docsUrl: "https://bailian.console.aliyun.com/",
  },
  [PROVIDERS.ANTHROPIC]: {
    name: "Anthropic Claude",
    icon: "🧠",
    description: "Claude models for thoughtful analysis and long-form work.",
    models: ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-3-haiku-20240307"],
    keyFormat: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/",
  },
  [PROVIDERS.GEMINI]: {
    name: "Google Gemini",
    icon: "✨",
    description: "Gemini models with a generous context window and fast responses.",
    models: ["gemini-2.5-flash", "gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-2.5-pro"],
    keyFormat: "AIza... or AQ....",
    docsUrl: "https://aistudio.google.com/app/apikey",
  },
  [PROVIDERS.OPENROUTER]: {
    name: "OpenRouter",
    icon: "🔀",
    description: "One key for many model providers through a unified gateway.",
    models: ["qwen/qwen3.7-plus", "qwen/qwen3.5-plus", "openai/gpt-4o-mini"],
    keyFormat: "sk-or-v1-...",
    docsUrl: "https://openrouter.ai/keys",
  },
};

export const PROVIDER_IDS = Object.keys(PROVIDER_INFO);

export function getProviderInfo(providerName) {
  return PROVIDER_INFO[providerName] || null;
}

export function getDefaultModel(providerName) {
  return DEFAULT_MODELS[providerName] || getProviderInfo(providerName)?.models?.[0] || "";
}
