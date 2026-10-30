import { NextResponse } from "next/server";

import { buildPersonalityContext } from "@/lib/personality";
import { createProvider } from "@/lib/provider-factory";
import { getProviderConnector, ProviderConnectionError } from "@/lib/provider-registry";
import {
  ProviderNotConfiguredError,
  resolveAgentProviderConfig,
} from "@/lib/agent-provider-config";
import { getUserId, handleRouteError } from "@/lib/db/http";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_HISTORY_TURNS = 12;
const MAX_MESSAGE_CHARS = 8000;
const TEST_LIMIT = { limit: 25, windowMs: 5 * 60 * 1000 };

function jsonResponse(payload, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function clampNumber(value, fallback, min, max) {
  const next = typeof value === "number" ? Number(value) : Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.min(max, Math.max(min, next));
}

function normalizeIncomingMessages(body) {
  const source = Array.isArray(body?.messages) ? body.messages : null;
  const messages = [];

  if (source) {
    for (const entry of source) {
      const role = entry?.role === "assistant" ? "assistant" : "user";
      const content = typeof entry?.content === "string" ? entry.content.trim() : "";
      if (content) messages.push({ role, content: content.slice(0, MAX_MESSAGE_CHARS) });
    }
  } else if (typeof body?.prompt === "string" && body.prompt.trim()) {
    messages.push({
      role: "user",
      content: body.prompt.trim().slice(0, MAX_MESSAGE_CHARS),
    });
  }

  const trimmed = messages.slice(-MAX_HISTORY_TURNS);
  while (trimmed.length > 0 && trimmed[0].role !== "user") trimmed.shift();
  return trimmed;
}

function buildSystemPrompt(agent) {
  const identity = [
    agent.name ? `You are ${agent.name}, a ${agent.role || "specialist"} AI agent.` : null,
    agent.expertise ? `Your expertise: ${agent.expertise}.` : null,
    Array.isArray(agent.capabilities) && agent.capabilities.length > 0
      ? `Your capabilities: ${agent.capabilities.join(", ")}.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  return [
    identity || null,
    buildPersonalityContext(agent),
    agent.systemPrompt || null,
    agent.goal ? `Your goal: ${agent.goal}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * POST /api/builder/test — the agent builder playground.
 *
 * Runs the agent exactly as it would run in the society chat (same factory,
 * same personality prompt, same credential resolution) but without persisting
 * anything, so testing a draft never pollutes conversation history.
 *
 * Body: { agent: {...}, messages: [{role, content}] } or { agent, prompt }
 */
export async function POST(request) {
  try {
    const userId = await getUserId(request);

    const ip = getClientIp(request);
    const rate = checkRateLimit(`builder-test:${userId}:${ip}`, TEST_LIMIT);
    if (!rate.allowed) {
      return jsonResponse(
        {
          success: false,
          code: "RATE_LIMITED",
          error: `Too many test requests. Try again in ${rate.retryAfterSeconds}s.`,
        },
        429
      );
    }

    const body = await request.json();
    const agent = body?.agent;
    if (!agent || typeof agent !== "object" || !String(agent.name || "").trim()) {
      return jsonResponse(
        { success: false, error: "An agent with a name is required" },
        400
      );
    }

    const messages = normalizeIncomingMessages(body);
    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      return jsonResponse(
        { success: false, error: "Send at least one user message to test" },
        400
      );
    }

    const providerName = String(agent.aiProvider || "").trim();
    const connector = getProviderConnector(providerName);
    if (!connector) {
      return jsonResponse(
        { success: false, error: `Unsupported provider: ${providerName || "(empty)"}` },
        400
      );
    }

    const model = String(agent.model || "").trim() || connector.defaultModel;
    const temperature = clampNumber(agent.temperature, 0.7, 0, 2);
    const maxTokens = Math.round(clampNumber(agent.maxTokens, 1024, 1, 8192));

    const { config, source } = await resolveAgentProviderConfig({
      userId,
      providerName,
      model,
    });

    const prompt = messages[messages.length - 1].content;
    const history = messages.slice(0, -1);

    const factory = createProvider(config);
    const client = factory.getClient();
    const startedAt = Date.now();

    const content = await client.generateContent(prompt, {
      systemPrompt: buildSystemPrompt(agent),
      temperature,
      maxTokens,
      history,
    });

    const durationMs = Date.now() - startedAt;

    return jsonResponse({
      success: true,
      reply: {
        role: "assistant",
        content: typeof content === "string" && content ? content : "",
        createdAt: new Date().toISOString(),
      },
      provider: providerName,
      model: client.model || model,
      source,
      durationMs,
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
    if (error instanceof ProviderNotConfiguredError) {
      return jsonResponse(
        { success: false, code: error.code, provider: error.provider, error: error.message },
        error.status || 400
      );
    }
    if (error?.userFacing && Number.isInteger(error?.status)) {
      return jsonResponse(
        { success: false, code: error.code || "PROVIDER_ERROR", error: error.message },
        error.status
      );
    }
    return handleRouteError(error, "The agent test failed");
  }
}
