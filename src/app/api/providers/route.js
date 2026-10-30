import { NextResponse } from "next/server";

import { decryptApiKey, encryptApiKey } from "@/lib/encryption";
import {
  assertApiKeyFormat,
  getProviderConnector,
  listProviderModels,
  ProviderConnectionError,
  PROVIDER_REGISTRY,
  testProviderConnection,
} from "@/lib/provider-registry";
import { anyEnvironmentApiKey } from "@/lib/agent-provider-config";
import {
  createProvider,
  deleteProvider,
  getProviderById,
  listProviders,
  publicProvider,
  updateProvider,
} from "@/lib/db/repositories";
import { getUserId, handleRouteError } from "@/lib/db/http";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WRITE_LIMIT = { limit: 10, windowMs: 10 * 60 * 1000 };
const LIST_LIMIT = { limit: 60, windowMs: 5 * 60 * 1000 };

function jsonResponse(payload, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function errorResponse(error, fallbackMessage) {
  if (error instanceof ProviderConnectionError) {
    return jsonResponse(
      {
        success: false,
        code: error.code,
        provider: error.provider,
        error: error.message,
      },
      error.status || 400
    );
  }
  return handleRouteError(error, fallbackMessage);
}

function enforceRateLimit(request, userId, options) {
  const ip = getClientIp(request);
  const result = checkRateLimit(`providers:${userId}:${ip}`, options);
  if (!result.allowed) {
    return jsonResponse(
      {
        success: false,
        code: "RATE_LIMITED",
        error: `Too many provider requests. Try again in ${result.retryAfterSeconds}s.`,
        retryAfterSeconds: result.retryAfterSeconds,
      },
      429
    );
  }
  return null;
}

async function runModelRefresh(providerName, apiKey) {
  try {
    const models = await listProviderModels(providerName, apiKey);
    const ids = models.map((model) => model?.id).filter(Boolean);
    return { models: ids, modelsUpdatedAt: new Date().toISOString() };
  } catch (error) {
    console.warn(`[providers] model list failed for ${providerName}:`, error.message);
    return { models: [], modelsUpdatedAt: null };
  }
}

export async function GET(request) {
  try {
    const userId = await getUserId(request);
    const rateLimited = enforceRateLimit(request, userId, LIST_LIMIT);
    if (rateLimited) return rateLimited;

    const providers = await listProviders(userId);
    return jsonResponse({
      success: true,
      providers: providers.map(publicProvider),
      hasEnvironmentKey: anyEnvironmentApiKey(),
      supported: Object.entries(PROVIDER_REGISTRY).map(([id, connector]) => ({
        id,
        label: connector.label,
        defaultModel: connector.defaultModel,
      })),
    });
  } catch (error) {
    return errorResponse(error, "Failed to load provider connections");
  }
}

export async function POST(request) {
  try {
    const userId = await getUserId(request);
    const rateLimited = enforceRateLimit(request, userId, WRITE_LIMIT);
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const providerName = String(body?.provider || "").trim();
    const connector = getProviderConnector(providerName);
    if (!connector) {
      return jsonResponse(
        { success: false, error: `Unsupported provider: ${providerName || "(empty)"}` },
        400
      );
    }

    const apiKey = assertApiKeyFormat(providerName, body?.apiKey);

    const connections = await listProviders(userId);
    const existing = connections.find(
      (connection) => connection.providerName === providerName
    );

    const test = await testProviderConnection(providerName, apiKey);
    const { models, modelsUpdatedAt } = await runModelRefresh(providerName, apiKey);

    const model =
      String(body?.model || "").trim() ||
      existing?.selectedModel ||
      models[0] ||
      connector.defaultModel;

    const metadata = {
      testStatus: "success",
      lastTested: new Date().toISOString(),
      testMessage: test.message,
      testLatencyMs: test.latencyMs ?? null,
      models,
      modelCount: models.length,
      modelsUpdatedAt,
    };

    const hasActive = connections.some((connection) => connection.isActive);
    const makeActive =
      typeof body?.makeActive === "boolean"
        ? body.makeActive
        : existing
          ? Boolean(existing.isActive) || !hasActive
          : true;

    let saved;
    if (existing) {
      saved = await updateProvider(
        existing.id,
        {
          encryptedApiKey: encryptApiKey(apiKey),
          selectedModel: model,
          metadata: { ...existing.metadata, ...metadata },
          isActive: makeActive,
        },
        userId
      );
    } else {
      saved = await createProvider(
        {
          id: crypto.randomUUID(),
          providerName,
          encryptedApiKey: encryptApiKey(apiKey),
          selectedModel: model,
          metadata,
          isActive: makeActive,
        },
        userId
      );
    }

    return jsonResponse({
      success: true,
      provider: publicProvider(saved),
      models,
      test: {
        message: test.message,
        latencyMs: test.latencyMs ?? null,
        testedAt: metadata.lastTested,
      },
    });
  } catch (error) {
    return errorResponse(error, "Failed to save the provider connection");
  }
}

export async function PUT(request) {
  try {
    const userId = await getUserId(request);
    const rateLimited = enforceRateLimit(request, userId, WRITE_LIMIT);
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const id = String(body?.id || "").trim();
    if (!id) {
      return jsonResponse({ success: false, error: "Provider id is required" }, 400);
    }

    const current = await getProviderById(id, userId);
    if (!current) {
      return jsonResponse({ success: false, error: "Provider connection not found" }, 404);
    }

    const connector = getProviderConnector(current.providerName);
    if (!connector) {
      return jsonResponse(
        { success: false, error: `Unsupported provider: ${current.providerName}` },
        400
      );
    }

    let encryptedApiKey = current.encryptedApiKey;
    let test = null;
    let models = null;
    let modelsUpdatedAt = null;

    if (typeof body?.apiKey === "string" && body.apiKey.trim()) {
      const apiKey = assertApiKeyFormat(current.providerName, body.apiKey);
      test = await testProviderConnection(current.providerName, apiKey);
      encryptedApiKey = encryptApiKey(apiKey);
      ({ models, modelsUpdatedAt } = await runModelRefresh(
        current.providerName,
        apiKey
      ));
    } else if (body?.test === true) {
      let apiKey;
      try {
        apiKey = decryptApiKey(current.encryptedApiKey);
      } catch {
        return jsonResponse(
          {
            success: false,
            code: "KEY_DECRYPT_FAILED",
            error: "The stored key could not be decrypted. Enter the API key again.",
          },
          400
        );
      }
      test = await testProviderConnection(current.providerName, apiKey);
      ({ models, modelsUpdatedAt } = await runModelRefresh(
        current.providerName,
        apiKey
      ));
    }

    const metadata = {
      ...current.metadata,
      ...(test
        ? {
            testStatus: "success",
            lastTested: new Date().toISOString(),
            testMessage: test.message,
            testLatencyMs: test.latencyMs ?? null,
            models: models ?? current.metadata?.models ?? [],
            modelCount: models?.length ?? current.metadata?.modelCount ?? 0,
            modelsUpdatedAt: modelsUpdatedAt ?? current.metadata?.modelsUpdatedAt ?? null,
          }
        : {}),
    };

    const updated = await updateProvider(
      id,
      {
        encryptedApiKey,
        selectedModel: String(body?.model || "").trim() || current.selectedModel,
        metadata,
        isActive:
          typeof body?.makeActive === "boolean" ? body.makeActive : current.isActive,
      },
      userId
    );

    return jsonResponse({
      success: true,
      provider: publicProvider(updated),
      models: models ?? undefined,
      test: test
        ? {
            message: test.message,
            latencyMs: test.latencyMs ?? null,
            testedAt: metadata.lastTested,
          }
        : undefined,
    });
  } catch (error) {
    return errorResponse(error, "Failed to update the provider connection");
  }
}

export async function DELETE(request) {
  try {
    const userId = await getUserId(request);
    const rateLimited = enforceRateLimit(request, userId, WRITE_LIMIT);
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return jsonResponse({ success: false, error: "Provider id is required" }, 400);
    }

    const deleted = await deleteProvider(id, userId);
    if (!deleted) {
      return jsonResponse({ success: false, error: "Provider connection not found" }, 404);
    }

    return jsonResponse({ success: true, deleted: true, id });
  } catch (error) {
    return errorResponse(error, "Failed to remove the provider connection");
  }
}
