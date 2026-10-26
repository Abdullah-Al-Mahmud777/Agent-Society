import { NextResponse } from "next/server";
import { LLMProviderFactory } from "@/lib/provider-factory";
import { decryptApiKey, encryptApiKey } from "@/lib/encryption";
import { createUserProvider, PROVIDERS } from "@/lib/db-schema";
import {
  createProvider as createProviderRecord,
  deleteAllProviders,
  deleteProvider,
  getActiveProvider,
  getProviderById,
  listProviders,
  publicProvider,
  setActiveProvider,
  updateProvider,
  upsertProviders,
} from "@/lib/db/repositories";
import { getUserId, handleRouteError } from "@/lib/db/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROVIDER_NAMES = new Set(Object.values(PROVIDERS));

function normalizeProviderName(value) {
  const name = String(value || "").trim().toLowerCase();
  return PROVIDER_NAMES.has(name) ? name : null;
}

function normalizeMetadata(metadata, providerName, selectedModel) {
  const source = metadata && typeof metadata === "object" ? metadata : {};
  return {
    lastTested: source.lastTested || new Date().toISOString(),
    testStatus: ["success", "failed", "pending"].includes(source.testStatus)
      ? source.testStatus
      : "pending",
    displayName:
      typeof source.displayName === "string" && source.displayName.trim()
        ? source.displayName.trim().slice(0, 160)
        : `${providerName} - ${selectedModel}`,
  };
}

class TestLLMProviderFactory extends LLMProviderFactory {
  constructor(userProviderConfig, plaintextApiKey) {
    super(userProviderConfig);
    this.apiKey = plaintextApiKey;
  }
}

function createTestProvider(userProviderConfig, plaintextApiKey) {
  return new TestLLMProviderFactory(userProviderConfig, plaintextApiKey);
}

/**
 * GET - List providers, or return the active provider with ?active=1
 */
export async function GET(request) {
  try {
    const userId = await getUserId(request);
    const { searchParams } = new URL(request.url);

    if (searchParams.get("active") === "1" || searchParams.get("active") === "true") {
      const provider = await getActiveProvider(userId);
      return NextResponse.json({
        success: true,
        provider: publicProvider(provider),
      });
    }

    const providers = await listProviders(userId);
    return NextResponse.json({
      success: true,
      providers: providers.map(publicProvider),
    });
  } catch (error) {
    return handleRouteError(error, "Failed to load providers");
  }
}

/**
 * POST - Test, save, update, activate, import, or delete provider configurations.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const userId = await getUserId(request);
    const { action = "test" } = body || {};

    if (action === "test") {
      const { id, selectedModel } = body;
      const storedProvider = id ? await getProviderById(id, userId) : null;

      if (id && !storedProvider) {
        return NextResponse.json(
          { success: false, message: "Provider not found" },
          { status: 404 }
        );
      }

      const providerName = normalizeProviderName(
        body.providerName || storedProvider?.providerName
      );
      const model = String(
        selectedModel || storedProvider?.selectedModel || ""
      ).trim();
      let cleanKey = String(body.apiKey || "").trim();

      if (!cleanKey && storedProvider?.encryptedApiKey) {
        cleanKey = decryptApiKey(storedProvider.encryptedApiKey);
      }

      if (
        storedProvider &&
        providerName !== storedProvider.providerName &&
        !body.apiKey
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Enter a new API key when changing providers",
          },
          { status: 400 }
        );
      }

      if (!providerName || !model || !cleanKey) {
        return NextResponse.json(
          {
            success: false,
            message: "Provider, model, and API key are required",
          },
          { status: 400 }
        );
      }

      const provider = createTestProvider(
        {
          userId,
          providerName,
          encryptedApiKey: "not-used-for-test",
          selectedModel: model,
          isActive: false,
        },
        cleanKey
      );
      const startedAt = Date.now();
      const result = await provider.testConnection();

      return NextResponse.json({
        success: result.success,
        message: result.message,
        response: result.response,
        latencyMs: Date.now() - startedAt,
      });
    }

    if (action === "save") {
      const providerName = normalizeProviderName(body.providerName);
      const selectedModel = String(body.selectedModel || "").trim();
      const apiKey = String(body.apiKey || "").trim();
      const encryptedApiKey =
        body.encryptedApiKey || (apiKey ? encryptApiKey(apiKey) : "");

      if (!providerName || !encryptedApiKey || !selectedModel) {
        return NextResponse.json(
          {
            success: false,
            error: "Provider, API key, and model are required",
          },
          { status: 400 }
        );
      }

      const providerConfig = createUserProvider({
        userId,
        providerName,
        encryptedApiKey,
        selectedModel,
        isActive: body.isActive !== false,
        metadata: normalizeMetadata(body.metadata, providerName, selectedModel),
      });

      const saved = await createProviderRecord(providerConfig, userId);
      return NextResponse.json({
        success: true,
        provider: publicProvider(saved),
        message: "Provider configuration saved",
      });
    }

    if (action === "update") {
      const { id, updates = {}, apiKey } = body;
      if (!id) {
        return NextResponse.json(
          { success: false, error: "Provider id is required" },
          { status: 400 }
        );
      }

      const current = await getProviderById(id, userId);
      if (!current) {
        return NextResponse.json(
          { success: false, error: "Provider not found" },
          { status: 404 }
        );
      }

      const nextUpdates = {};
      if (updates.providerName !== undefined) {
        const providerName = normalizeProviderName(updates.providerName);
        if (!providerName) {
          return NextResponse.json(
            { success: false, error: "Unsupported provider" },
            { status: 400 }
          );
        }
        if (providerName !== current.providerName && !apiKey) {
          return NextResponse.json(
            { success: false, error: "Enter a new API key when changing providers" },
            { status: 400 }
          );
        }
        nextUpdates.providerName = providerName;
      }
      if (updates.selectedModel !== undefined) {
        const selectedModel = String(updates.selectedModel).trim();
        if (!selectedModel) {
          return NextResponse.json(
            { success: false, error: "Model is required" },
            { status: 400 }
          );
        }
        nextUpdates.selectedModel = selectedModel;
      }
      if (updates.isActive !== undefined) {
        nextUpdates.isActive = updates.isActive !== false;
      }
      if (updates.metadata !== undefined) {
        nextUpdates.metadata = normalizeMetadata(
          updates.metadata,
          nextUpdates.providerName || current.providerName,
          nextUpdates.selectedModel || current.selectedModel
        );
      }
      if (apiKey) nextUpdates.encryptedApiKey = encryptApiKey(String(apiKey).trim());

      const updated = await updateProvider(id, nextUpdates, userId);
      if (!updated) {
        return NextResponse.json(
          { success: false, error: "Provider not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        provider: publicProvider(updated),
      });
    }

    if (action === "activate") {
      const { id } = body;
      if (!id) {
        return NextResponse.json(
          { success: false, error: "Provider id is required" },
          { status: 400 }
        );
      }

      const active = await setActiveProvider(id, userId);
      if (!active) {
        return NextResponse.json(
          { success: false, error: "Provider not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        provider: publicProvider(active),
      });
    }

    if (action === "import") {
      const providers = Array.isArray(body.providers) ? body.providers : [];
      const result = await upsertProviders(providers, userId);
      return NextResponse.json({ success: true, ...result });
    }

    if (action === "delete") {
      const { id } = body;
      const all = body.all === true;
      if (all) {
        const deleted = await deleteAllProviders(userId);
        return NextResponse.json({ success: true, deleted });
      }

      if (!id) {
        return NextResponse.json(
          { success: false, error: "Provider id is required" },
          { status: 400 }
        );
      }

      const deleted = await deleteProvider(id, userId);
      return NextResponse.json({ success: true, deleted });
    }

    if (action === "get") {
      const { id } = body;
      const provider = id ? await getProviderById(id, userId) : await getActiveProvider(userId);
      return NextResponse.json({
        success: true,
        provider: publicProvider(provider),
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    return handleRouteError(error, "Provider operation failed");
  }
}

export async function DELETE(request) {
  try {
    const userId = await getUserId(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (searchParams.get("all") === "true") {
      const deleted = await deleteAllProviders(userId);
      return NextResponse.json({ success: true, deleted });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Provider id is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteProvider(id, userId);
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    return handleRouteError(error, "Failed to delete provider");
  }
}
