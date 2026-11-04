import { NextResponse } from "next/server";

import { decryptApiKey } from "@/lib/encryption";
import {
  PROVIDER_REGISTRY,
  assertApiKeyFormat,
  listProviderModels,
  ProviderConnectionError,
} from "@/lib/provider-registry";
import { getProviderById, listProviders } from "@/lib/db/repositories";
import { getUserId, handleRouteError } from "@/lib/db/http";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIST_LIMIT = { limit: 30, windowMs: 5 * 60 * 1000 };

function jsonResponse(payload, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * GET /api/providers/models
 *   ?id=<connection id>          → live models for a saved connection
 *   ?provider=<name>             → live models using the saved key for that provider
 *   ?provider=<name>&apiKey=...  → live models for a key typed in the form
 *
 * The API key is only ever handled server-side and is never echoed back.
 */
export async function GET(request) {
  try {
    const userId = await getUserId(request);

    const ip = getClientIp(request);
    const rate = checkRateLimit(`provider-models:${userId}:${ip}`, LIST_LIMIT);
    if (!rate.allowed) {
      return jsonResponse(
        {
          success: false,
          code: "RATE_LIMITED",
          error: `Too many model requests. Try again in ${rate.retryAfterSeconds}s.`,
        },
        429
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const providerParam = searchParams.get("provider");
    const apiKeyParam = searchParams.get("apiKey");

    let providerName = providerParam ? String(providerParam).trim() : null;
    let apiKey = null;
    let source = "request";

    if (providerName && !PROVIDER_REGISTRY[providerName]) {
      return jsonResponse(
        {
          success: false,
          code: "UNSUPPORTED_PROVIDER",
          error: `Unsupported provider: ${providerName}`,
        },
        400
      );
    }

    if (id) {
      const connection = await getProviderById(String(id), userId);
      if (!connection) {
        return jsonResponse(
          { success: false, error: "Provider connection not found" },
          404
        );
      }
      providerName = connection.providerName;
      source = "connection";
      try {
        apiKey = decryptApiKey(connection.encryptedApiKey);
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
    } else if (apiKeyParam) {
      providerName = providerName || "gemini";
      apiKey = assertApiKeyFormat(providerName, apiKeyParam);
    } else if (providerName) {
      const connections = await listProviders(userId);
      const connection =
        connections.find((item) => item.isActive && item.providerName === providerName) ||
        connections.find((item) => item.providerName === providerName);
      if (!connection) {
        return jsonResponse(
          {
            success: false,
            code: "PROVIDER_NOT_CONNECTED",
            error: "Connect an API key for this provider first.",
          },
          404
        );
      }
      source = "connection";
      try {
        apiKey = decryptApiKey(connection.encryptedApiKey);
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
    } else {
      return jsonResponse(
        { success: false, error: "Provide id, provider, or provider + apiKey" },
        400
      );
    }

    const models = await listProviderModels(providerName, apiKey);
    return jsonResponse({
      success: true,
      provider: providerName,
      source,
      modelCount: models.length,
      models,
    });
  } catch (error) {
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
    return handleRouteError(error, "Failed to list provider models");
  }
}
