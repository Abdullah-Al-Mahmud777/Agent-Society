/**
 * Server-side provider registry.
 *
 * One entry per supported AI provider with two real network operations:
 *   - testConnection(apiKey): prove the key authenticates and can serve requests
 *   - listModels(apiKey):     fetch the model catalogue live from the vendor
 *
 * The registry is the extension point for new providers: add an entry here and
 * the Providers page, the agents builder, and the chat runtime all pick it up.
 * No mock data — every list comes from the vendor API.
 */

import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

import { validateApiKeyFormat } from "./api-key-format.js";
import { DEFAULT_MODELS, PROVIDERS, PROVIDER_INFO } from "./provider-catalog.js";
import { QWEN_BASE_URL } from "../providers/qwenProvider.js";
import {
  formatGeminiError,
  normalizeGeminiModel,
} from "../providers/geminiProvider.js";

const CONNECT_TIMEOUT_MS = 15000;
const MAX_LISTED_MODELS = 1000;
const MAX_SCANNED_ITEMS = 1200;

export class ProviderConnectionError extends Error {
  constructor(message, { status = 400, provider = null, cause = undefined } = {}) {
    super(message, { cause });
    this.name = "ProviderConnectionError";
    this.code = "PROVIDER_CONNECTION_FAILED";
    this.userFacing = true;
    this.status = status;
    this.provider = provider;
  }
}

function label(providerId) {
  return PROVIDER_INFO[providerId]?.name || providerId;
}

export function assertApiKeyFormat(providerId, apiKey) {
  const key = String(apiKey || "").trim();
  if (!key) {
    throw new ProviderConnectionError("API key is required.", {
      status: 400,
      provider: providerId,
    });
  }
  if (!validateApiKeyFormat(providerId, key)) {
    const expected = PROVIDER_INFO[providerId]?.keyFormat;
    throw new ProviderConnectionError(
      `That does not look like a valid ${label(providerId)} API key${
        expected ? ` (expected format: ${expected})` : ""
      }.`,
      { status: 400, provider: providerId }
    );
  }
  return key;
}

function toConnectionError(providerId, error) {
  if (error instanceof ProviderConnectionError) return error;

  const status =
    Number(error?.status) ||
    Number(error?.response?.status) ||
    Number(error?.error?.status) ||
    undefined;
  const message = String(error?.message || "");

  let friendly;
  if (status === 401 || /invalid api key|incorrect api key|unauthorized/i.test(message)) {
    friendly = `${label(providerId)} rejected the API key. Double-check the key and try again.`;
  } else if (status === 403 || /permission denied|access denied/i.test(message)) {
    friendly = `${label(providerId)} denied access for this key. Check its permissions and billing status.`;
  } else if (status === 429 || /rate limit|too many requests/i.test(message)) {
    friendly = `${label(providerId)} rate limit reached. Wait a moment and try again.`;
  } else if (status === 402 || /insufficient|quota|credit/i.test(message)) {
    friendly = `${label(providerId)} reported a quota or billing problem for this key.`;
  } else if (
    status === 408 ||
    status === 504 ||
    /timed? ?out|fetch failed|network|ENOTFOUND|EAI_AGAIN|ECONNRESET/i.test(message)
  ) {
    friendly = `Could not reach ${label(providerId)}. Check your connection and try again.`;
  } else {
    friendly = `${label(providerId)} connection test failed${
      status ? ` (${status})` : ""
    }: ${message.slice(0, 180) || "unknown error"}`;
  }

  return new ProviderConnectionError(friendly, {
    status: status && status >= 400 && status <= 599 ? status : 400,
    provider: providerId,
    cause: error,
  });
}

function createGeminiClient(apiKey) {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: CONNECT_TIMEOUT_MS,
      retryOptions: { attempts: 1 },
    },
  });
}

function preferredModelFirst(models) {
  const preferred = normalizeGeminiModel();
  return [...models].sort((a, b) => {
    const aPreferred = a.id === preferred ? 0 : /flash/.test(a.id) ? 1 : 2;
    const bPreferred = b.id === preferred ? 0 : /flash/.test(b.id) ? 1 : 2;
    if (aPreferred !== bPreferred) return aPreferred - bPreferred;
    return a.id.localeCompare(b.id);
  });
}

async function collectModels(iterator, mapItem, filter) {
  const models = [];
  let scanned = 0;

  const push = (item) => {
    const mapped = mapItem(item);
    if (!mapped?.id) return;
    if (filter && !filter(mapped, item)) return;
    if (models.some((existing) => existing.id === mapped.id)) return;
    models.push(mapped);
  };

  if (Array.isArray(iterator)) {
    for (const item of iterator) {
      push(item);
      scanned += 1;
      if (scanned >= MAX_SCANNED_ITEMS) break;
    }
    return models;
  }

  if (iterator && typeof iterator[Symbol.asyncIterator] === "function") {
    for await (const item of iterator) {
      push(item);
      scanned += 1;
      if (scanned >= MAX_SCANNED_ITEMS) break;
    }
    return models;
  }

  throw new Error("Unexpected model list response");
}

function openAiCompatibleClient(providerId, apiKey) {
  return new OpenAI({
    apiKey,
    baseURL:
      providerId === PROVIDERS.OPENROUTER || providerId === PROVIDERS.QWEN
        ? QWEN_BASE_URL
        : undefined,
    timeout: CONNECT_TIMEOUT_MS,
    maxRetries: 1,
  });
}

/**
 * OpenRouter/Qwen expose their model list publicly, so a list call alone
 * would accept a bogus key. /auth/key requires a real key and costs nothing.
 */
async function probeOpenRouterKey(providerId, apiKey) {
  let response;
  try {
    response = await fetch(`${QWEN_BASE_URL}/auth/key`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(CONNECT_TIMEOUT_MS),
    });
  } catch (error) {
    throw toConnectionError(providerId, error);
  }

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = String(body?.error?.message || "");
    } catch {
      detail = "";
    }
    throw toConnectionError(
      providerId,
      Object.assign(new Error(detail || `HTTP ${response.status}`), {
        status: response.status,
      })
    );
  }
}

function isChatCompletionModel(id) {
  if (/^gpt-|^o[134](?:-|\b)|^chatgpt/i.test(id)) return true;
  if (
    /(embedding|whisper|tts|dall-e|audio|moderation|transcribe)/i.test(id) ||
    /:batch$/i.test(id)
  ) {
    return false;
  }
  return true;
}

function mapOpenAiStyleModel(item) {
  const id = String(item?.id || "").trim();
  if (!id) return null;
  return {
    id,
    label: String(item?.id || id),
    description: "",
    inputTokenLimit: null,
    outputTokenLimit: null,
  };
}

async function listOpenAiStyleModels(providerId, apiKey) {
  try {
    const client = openAiCompatibleClient(providerId, apiKey);
    const page = await client.models.list();
    const source = Array.isArray(page?.data)
      ? page.data
      : Array.isArray(page?.models)
        ? page.models
        : page;

    const models = await collectModels(
      source,
      mapOpenAiStyleModel,
      (mapped) => isChatCompletionModel(mapped.id)
    );

    if (models.length === 0) {
      throw new Error("The account returned no chat models");
    }

    return models.slice(0, MAX_LISTED_MODELS);
  } catch (error) {
    throw toConnectionError(providerId, error);
  }
}

async function listAnthropicModels(apiKey) {
  try {
    const client = new Anthropic({
      apiKey,
      timeout: CONNECT_TIMEOUT_MS,
      maxRetries: 1,
    });
    const page = await client.models.list();
    const source = Array.isArray(page?.data) ? page.data : page;

    const models = await collectModels(source, (item) => {
      const id = String(item?.id || "").trim();
      if (!id) return null;
      return {
        id,
        label: String(item?.display_name || id),
        description: "",
        inputTokenLimit: null,
        outputTokenLimit: null,
      };
    });

    if (models.length === 0) {
      throw new Error("The account returned no Claude models");
    }
    return models.slice(0, MAX_LISTED_MODELS);
  } catch (error) {
    throw toConnectionError(PROVIDERS.ANTHROPIC, error);
  }
}

async function listGeminiModels(apiKey) {
  let ai;
  try {
    ai = createGeminiClient(apiKey);
  } catch (error) {
    throw toConnectionError(PROVIDERS.GEMINI, error);
  }

  try {
    const pager = await ai.models.list();
    const models = await collectModels(
      pager,
      (model) => {
        const id = String(model?.name || "").replace(/^models\//, "");
        if (!id) return null;
        return {
          id,
          label: String(model?.displayName || id),
          description: String(model?.description || "").slice(0, 180),
          inputTokenLimit: model?.inputTokenLimit ?? null,
          outputTokenLimit: model?.outputTokenLimit ?? null,
        };
      },
      (mapped, raw) => {
        const actions = Array.isArray(raw?.supportedActions) ? raw.supportedActions : null;
        if (actions) return actions.includes("generateContent");
        return !/(embedding|imagen|veo|tts|aqa|audio|palm)/i.test(mapped.id);
      }
    );

    if (models.length === 0) {
      throw new Error("The key returned no chat-capable Gemini models");
    }
    return preferredModelFirst(models).slice(0, MAX_LISTED_MODELS);
  } catch (error) {
    if (error instanceof ProviderConnectionError) throw error;
    const friendly = formatGeminiError(error, { model: normalizeGeminiModel() });
    throw new ProviderConnectionError(friendly.message, {
      status: friendly.status || 400,
      provider: PROVIDERS.GEMINI,
      cause: friendly,
    });
  }
}

export const PROVIDER_REGISTRY = {
  [PROVIDERS.GEMINI]: {
    id: PROVIDERS.GEMINI,
    label: PROVIDER_INFO[PROVIDERS.GEMINI].name,
    defaultModel: DEFAULT_MODELS[PROVIDERS.GEMINI],
    async testConnection(apiKey) {
      const startedAt = Date.now();
      let model;
      try {
        const models = await listGeminiModels(apiKey);
        model = models[0]?.id;
        if (!model) throw new Error("The key returned no chat-capable Gemini models");
        const ai = createGeminiClient(apiKey);
        await ai.models.generateContent({
          model,
          contents: "Reply with the single word: OK",
          config: { temperature: 0, maxOutputTokens: 16 },
        });
      } catch (error) {
        if (error instanceof ProviderConnectionError) throw error;
        const friendly = formatGeminiError(error, {
          model: model || normalizeGeminiModel(),
        });
        throw new ProviderConnectionError(friendly.message, {
          status: friendly.status || 400,
          provider: PROVIDERS.GEMINI,
          cause: friendly,
        });
      }
      return {
        ok: true,
        message: `Connected to Google Gemini (${model})`,
        latencyMs: Date.now() - startedAt,
        model,
      };
    },
    listModels: (apiKey) => listGeminiModels(apiKey),
  },

  [PROVIDERS.OPENAI]: {
    id: PROVIDERS.OPENAI,
    label: PROVIDER_INFO[PROVIDERS.OPENAI].name,
    defaultModel: DEFAULT_MODELS[PROVIDERS.OPENAI],
    async testConnection(apiKey) {
      const startedAt = Date.now();
      let model = DEFAULT_MODELS[PROVIDERS.OPENAI];
      try {
        const client = new OpenAI({
          apiKey,
          timeout: CONNECT_TIMEOUT_MS,
          maxRetries: 1,
        });
        const page = await client.models.list({ limit: 1 });
        const first = Array.isArray(page?.data) ? page?.data[0] : null;
        if (String(first?.id || "").trim()) model = String(first.id).trim();
      } catch (error) {
        throw toConnectionError(PROVIDERS.OPENAI, error);
      }
      return {
        ok: true,
        message: "Connected to OpenAI",
        latencyMs: Date.now() - startedAt,
        model,
      };
    },
    listModels: (apiKey) => listOpenAiStyleModels(PROVIDERS.OPENAI, apiKey),
  },

  [PROVIDERS.ANTHROPIC]: {
    id: PROVIDERS.ANTHROPIC,
    label: PROVIDER_INFO[PROVIDERS.ANTHROPIC].name,
    defaultModel: DEFAULT_MODELS[PROVIDERS.ANTHROPIC],
    async testConnection(apiKey) {
      const startedAt = Date.now();
      let model;
      try {
        const models = await listAnthropicModels(apiKey);
        model = models[0]?.id;
        if (!model) throw new Error("The account returned no Claude models");
        const client = new Anthropic({
          apiKey,
          timeout: CONNECT_TIMEOUT_MS,
          maxRetries: 1,
        });
        await client.messages.create({
          model,
          max_tokens: 8,
          messages: [{ role: "user", content: "Reply with OK" }],
        });
      } catch (error) {
        throw toConnectionError(PROVIDERS.ANTHROPIC, error);
      }
      return {
        ok: true,
        message: `Connected to Anthropic Claude (${model})`,
        latencyMs: Date.now() - startedAt,
        model,
      };
    },
    listModels: (apiKey) => listAnthropicModels(apiKey),
  },

  [PROVIDERS.OPENROUTER]: {
    id: PROVIDERS.OPENROUTER,
    label: PROVIDER_INFO[PROVIDERS.OPENROUTER].name,
    defaultModel: DEFAULT_MODELS[PROVIDERS.OPENROUTER],
    async testConnection(apiKey) {
      const startedAt = Date.now();
      await probeOpenRouterKey(PROVIDERS.OPENROUTER, apiKey);
      return {
        ok: true,
        message: "Connected to OpenRouter",
        latencyMs: Date.now() - startedAt,
        model: DEFAULT_MODELS[PROVIDERS.OPENROUTER],
      };
    },
    listModels: (apiKey) => listOpenAiStyleModels(PROVIDERS.OPENROUTER, apiKey),
  },

  [PROVIDERS.QWEN]: {
    id: PROVIDERS.QWEN,
    label: PROVIDER_INFO[PROVIDERS.QWEN].name,
    defaultModel: DEFAULT_MODELS[PROVIDERS.QWEN],
    async testConnection(apiKey) {
      const startedAt = Date.now();
      await probeOpenRouterKey(PROVIDERS.QWEN, apiKey);
      return {
        ok: true,
        message: "Connected to Alibaba Cloud Qwen",
        latencyMs: Date.now() - startedAt,
        model: DEFAULT_MODELS[PROVIDERS.QWEN],
      };
    },
    listModels: (apiKey) => listOpenAiStyleModels(PROVIDERS.QWEN, apiKey),
  },
};

export function getProviderConnector(providerName) {
  return PROVIDER_REGISTRY[providerName] || null;
}

export async function testProviderConnection(providerName, apiKey) {
  const connector = getProviderConnector(providerName);
  if (!connector) {
    throw new ProviderConnectionError(`Unsupported provider: ${providerName}`, {
      status: 400,
      provider: providerName,
    });
  }
  return connector.testConnection(apiKey);
}

export async function listProviderModels(providerName, apiKey) {
  const connector = getProviderConnector(providerName);
  if (!connector) {
    throw new ProviderConnectionError(`Unsupported provider: ${providerName}`, {
      status: 400,
      provider: providerName,
    });
  }
  return connector.listModels(apiKey);
}
