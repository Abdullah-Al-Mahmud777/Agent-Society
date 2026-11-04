import "server-only";

import { encryptApiKey } from "./encryption";
import { getDefaultModel, PROVIDER_INFO, PROVIDERS } from "./provider-catalog";
import { listProviders } from "./db/repositories";

/**
 * Loads the user's saved connections, but keeps the flow usable when Turso is
 * unreachable — the environment fallback below still applies.
 */
async function loadConnections(userId) {
  try {
    return await listProviders(userId);
  } catch (error) {
    console.warn("[agent-provider] could not load connections:", error.message);
    return [];
  }
}

/**
 * Where an API key for a given provider can come from, in priority order:
 *   1. the signed-in user's saved connection (stored encrypted in Turso)
 *   2. the deployment environment (Vercel project env vars)
 * The returned config is exactly what LLMProviderFactory consumes.
 */
const ENV_KEY_VARS = {
  [PROVIDERS.GEMINI]: ["GEMINI_API_KEY"],
  [PROVIDERS.OPENAI]: ["OPENAI_API_KEY"],
  [PROVIDERS.ANTHROPIC]: ["ANTHROPIC_API_KEY"],
  [PROVIDERS.OPENROUTER]: ["OPENROUTER_API_KEY"],
  // Qwen runs through the OpenRouter-compatible endpoint, so either key works.
  [PROVIDERS.QWEN]: ["QWEN_API_KEY", "OPENROUTER_API_KEY"],
};

export class ProviderNotConfiguredError extends Error {
  constructor(providerName) {
    const name = PROVIDER_INFO[providerName]?.name || providerName;
    super(
      `No ${name} API key is available for this agent. Connect one on the Provider settings page, or set the matching environment variable.`
    );
    this.name = "ProviderNotConfiguredError";
    this.code = "PROVIDER_NOT_CONFIGURED";
    this.userFacing = true;
    this.status = 400;
    this.provider = providerName;
  }
}

export function getEnvironmentApiKey(providerName) {
  for (const variable of ENV_KEY_VARS[providerName] || []) {
    const value = process.env[variable];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function hasEnvironmentApiKey(providerName) {
  return Boolean(getEnvironmentApiKey(providerName));
}

export function anyEnvironmentApiKey() {
  return Object.keys(ENV_KEY_VARS).some((provider) => hasEnvironmentApiKey(provider));
}

/**
 * Resolve the credentials to run `providerName` (usually the agent's provider)
 * with `model` as the model override. Never returns plaintext when a saved
 * connection is used — the encrypted blob is passed straight to the factory.
 */
export async function resolveAgentProviderConfig({ userId, providerName, model }) {
  const connections = await loadConnections(userId);
  const matching = connections.filter(
    (connection) => connection.providerName === providerName
  );
  const chosen = matching.find((connection) => connection.isActive) || matching[0];

  if (chosen?.encryptedApiKey) {
    return {
      config: {
        providerName,
        selectedModel: model,
        encryptedApiKey: chosen.encryptedApiKey,
        isActive: Boolean(chosen.isActive),
      },
      source: "connection",
      connectionId: chosen.id,
    };
  }

  const environmentKey = getEnvironmentApiKey(providerName);
  if (environmentKey) {
    return {
      config: {
        providerName,
        selectedModel: model,
        apiKey: environmentKey,
        isActive: true,
      },
      source: "environment",
      connectionId: null,
    };
  }

  throw new ProviderNotConfiguredError(providerName);
}

/**
 * Provider config for flows that do not care about the agent's provider —
 * they use whatever connection the account marked active (or the env default).
 */
export async function resolveActiveProviderConfig({ userId, model }) {
  const connections = await loadConnections(userId);
  const active =
    connections.find((connection) => connection.isActive) ||
    connections[0] ||
    null;

  if (active?.encryptedApiKey) {
    return {
      config: {
        providerName: active.providerName,
        selectedModel: model || active.selectedModel,
        encryptedApiKey: active.encryptedApiKey,
        isActive: Boolean(active.isActive),
      },
      source: "connection",
      connectionId: active.id,
    };
  }

  for (const providerName of Object.values(PROVIDERS)) {
    const environmentKey = getEnvironmentApiKey(providerName);
    if (environmentKey) {
      return {
        config: {
          providerName,
          selectedModel: model || getDefaultModel(providerName),
          apiKey: encryptApiKey(environmentKey),
          isActive: true,
        },
        source: "environment",
        connectionId: null,
      };
    }
  }

  throw new ProviderNotConfiguredError(active?.providerName || PROVIDERS.GEMINI);
}
