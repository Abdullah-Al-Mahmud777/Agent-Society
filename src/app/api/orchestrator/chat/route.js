import { NextResponse } from "next/server";
import { Orchestrator } from "../../../../lib/orchestrator";
import { decryptApiKey } from "../../../../lib/encryption";
import {
  addMessage,
  createConversation,
  getActiveProvider,
  getAgentMemories,
  getConversation,
  listAgents,
  persistOrchestratorTurn,
} from "@/lib/db/repositories";
import { ensureSchema } from "@/lib/db/client";
import { getUserId } from "@/lib/db/http";
import { AuthenticationError, unauthorizedResponse } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function conversationTitle(userRequest) {
  const normalized = String(userRequest || "").replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, 120) : "New conversation";
}


export async function POST(request) {
  try {
    const body = await request.json();
    const {
      userRequest,
      agents: bodyAgents,
      globalContext = "",
      executionStrategy = "parallel",
      selectedAgents = [],
    } = body;

    if (typeof userRequest !== "string" || !userRequest.trim()) {
      return NextResponse.json({ error: "User request is required" }, { status: 400 });
    }

    if (userRequest.length > 20000) {
      return NextResponse.json(
        { error: "User request is too long" },
        { status: 400 }
      );
    }

    const userId = await getUserId(request);
    let persistence = { ok: false, error: "Database is not configured" };
    let databaseReady = false;
    let conversationId = body.conversationId || null;

    try {
      await ensureSchema();
      databaseReady = true;
      persistence = { ok: true };
    } catch (error) {
      console.warn("[orchestrator] Turso unavailable, running without persistence:", error.message);
    }

    let agents = Array.isArray(bodyAgents) ? bodyAgents : [];

    if (databaseReady) {
      try {
        const storedAgents = await listAgents(userId);
        if (storedAgents.length > 0) {
          agents = storedAgents;
        }

        const existing = conversationId
          ? await getConversation(conversationId, userId)
          : null;

        if (!existing) {
          conversationId = crypto.randomUUID();
          await createConversation({
            id: conversationId,
            userId,
            title: conversationTitle(userRequest),
          });
        }

        await addMessage({
          conversationId,
          userId,
          role: "user",
          content: userRequest,
          metadata: { executionStrategy },
        });
      } catch (error) {
        console.error("[orchestrator] Failed to prepare database state:", error);
        persistence = { ok: false, error: "Failed to prepare database state" };
        databaseReady = false;
      }
    }

    if (!Array.isArray(agents) || agents.length === 0) {
      return NextResponse.json(
        { error: "No agents provided. Please create agents first." },
        { status: 400 }
      );
    }

    const selectedIds = Array.isArray(selectedAgents)
      ? selectedAgents
          .map((agent) => (typeof agent === "string" ? agent : agent?.id))
          .filter(Boolean)
      : [];

    let agentMemories = {};
    if (databaseReady) {
      try {
        agentMemories = await getAgentMemories(
          agents.map((agent) => agent.id),
          userId
        );
      } catch (error) {
        console.error("[orchestrator] Failed to load agent memories:", error);
      }
    }

    let finalApiKey = null;
    let activeProviderConfig = null;
    if (databaseReady) {
      try {
        const provider = await getActiveProvider(userId);
        if (provider?.encryptedApiKey) {
          finalApiKey = decryptApiKey(provider.encryptedApiKey);
          activeProviderConfig = provider;
        }
      } catch (error) {
        console.warn("[orchestrator] Could not load active provider:", error.message);
      }
    }
    if (!finalApiKey) {
      finalApiKey =
        process.env.OPENROUTER_API_KEY ||
        process.env.QWEN_API_KEY ||
        process.env.GEMINI_API_KEY ||
        process.env.OPENAI_API_KEY ||
        process.env.ANTHROPIC_API_KEY;
    }
    if (!finalApiKey) {
      return NextResponse.json(
        {
          error:
            "No AI provider is configured. Add an encrypted API key in Providers.",
        },
        { status: 400 }
      );
    }

    // The app stores one active provider key. Use that provider for every
    // agent so an older agent config cannot send a Gemini key to OpenRouter
    // (or vice versa).
    if (activeProviderConfig) {
      agents = agents.map((agent) => ({
        ...agent,
        aiProvider: activeProviderConfig.providerName,
        model: activeProviderConfig.selectedModel,
      }));
    }

    const orchestrator = new Orchestrator({
      agents,
      apiKey: finalApiKey,
      defaultProvider:
        activeProviderConfig?.providerName || agents[0]?.aiProvider,
      defaultModel: activeProviderConfig?.selectedModel || agents[0]?.model,
      executionStrategy,
      agentMemories,
      selectedAgents: selectedIds,
    });

    const result = await orchestrator.run(userRequest, globalContext);

    if (databaseReady && conversationId) {
      try {
        const runId = crypto.randomUUID();
        const assistantTimestamp = new Date().toISOString();
        await persistOrchestratorTurn({
          run: {
            id: runId,
            conversationId,
            userRequest,
            globalContext,
            finalResponse: result.finalResponse,
            agentOutputs: result.agentOutputs || [],
            relevantAgents: result.relevantAgents || [],
            executionStrategy,
            success: result.success !== false,
            error: result.error ?? null,
            createdAt: assistantTimestamp,
          },
          agentOutputs: result.agentOutputs || [],
          assistantMessage: {
            conversationId,
            role: "assistant",
            content: result.finalResponse || result.error || "",
            metadata: {
              agentOutputs: result.agentOutputs || [],
              relevantAgents: result.relevantAgents || [],
              orchestratorRunId: runId,
            },
            createdAt: assistantTimestamp,
          },
          userId,
        });
      } catch (error) {
        console.error("[orchestrator] Failed to persist run:", error);
        persistence = { ok: false, error: "Failed to persist orchestration results" };
      }
    }

    return NextResponse.json({
      ...result,
      conversationId,
      persistence,
    });
  } catch (error) {
    if (error instanceof AuthenticationError || error?.code === "UNAUTHENTICATED") {
      return unauthorizedResponse();
    }

    console.error("Orchestrator API error:", error);

    const isUserFacing = Boolean(error?.userFacing);
    const status =
      isUserFacing && Number.isInteger(error?.status) && error.status >= 400 && error.status <= 599
        ? error.status
        : 500;

    return NextResponse.json(
      {
        error: isUserFacing ? error.message : "Internal server error",
        details:
          !isUserFacing && process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
      },
      { status }
    );
  }
}
