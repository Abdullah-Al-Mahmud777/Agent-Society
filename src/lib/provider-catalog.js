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
    keyFormat: "sk-...",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  [PROVIDERS.QWEN]: {
    name: "Alibaba Cloud Qwen",
    icon: "🐉",
    description: "Qwen models through the OpenRouter-compatible endpoint.",
    keyFormat: "sk-or-v1-...",
    docsUrl: "https://bailian.console.aliyun.com/",
  },
  [PROVIDERS.ANTHROPIC]: {
    name: "Anthropic Claude",
    icon: "🧠",
    description: "Claude models for thoughtful analysis and long-form work.",
    keyFormat: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/",
  },
  [PROVIDERS.GEMINI]: {
    name: "Google Gemini",
    icon: "✨",
    description: "Gemini models with a generous context window and fast responses.",
    keyFormat: "AIza... or AQ....",
    docsUrl: "https://aistudio.google.com/app/apikey",
  },
  [PROVIDERS.OPENROUTER]: {
    name: "OpenRouter",
    icon: "🔀",
    description: "One key for many model providers through a unified gateway.",
    keyFormat: "sk-or-v1-...",
    docsUrl: "https://openrouter.ai/keys",
  },
};

export const PROVIDER_IDS = Object.keys(PROVIDER_INFO);

export function getProviderInfo(providerName) {
  return PROVIDER_INFO[providerName] || null;
}

export function getDefaultModel(providerName) {
  return DEFAULT_MODELS[providerName] || "";
}
