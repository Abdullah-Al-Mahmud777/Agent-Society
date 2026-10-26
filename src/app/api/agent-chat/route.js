import { NextResponse } from "next/server";
import { buildPersonalityContext } from "@/lib/personality";
import { createProvider } from "@/lib/provider-factory";
import { encryptApiKey } from "@/lib/encryption";
import { ensureSchema } from "@/lib/db/client";
import { getUserId } from "@/lib/db/http";
import { AuthenticationError, unauthorizedResponse } from "@/lib/auth/session";
import {
  addAgentMemoryEntries,
  addMessage,
  createConversation,
  getActiveProvider,
  getConversation,
  recordExecution,
} from "@/lib/db/repositories";

// HARDCODED API KEY - Replace with your actual OpenRouter API key
const HARDCODED_QWEN_API_KEY = "YOUR_OPENROUTER_API_KEY_HERE";

export const runtime = "nodejs";

/**
 * Agent-specific chat endpoint
 * POST /api/agent-chat
 * Body: { prompt: string, agent: object, providerConfig: object (optional) }
 * 
 * VERCEL PRODUCTION NOTES:
 * - This runs server-side only (Next.js API Route)
 * - process.env.QWEN_API_KEY is available on server
 * - Falls back to environment variables if providerConfig is not provided
 */
export async function POST(request) {
    try {
        const requestBody = await request.json();
        const { prompt, agent, providerConfig } = requestBody;
        const userId = await getUserId(request);

        let databaseReady = false;
        try {
            await ensureSchema();
            databaseReady = true;
        } catch (dbError) {
            console.warn("Turso unavailable for agent chat persistence:", dbError.message);
        }

        if (!prompt || !prompt.trim()) {
            return NextResponse.json(
                { success: false, error: "Prompt is required" },
                { status: 400 }
            );
        }

        if (!agent || !agent.name) {
            return NextResponse.json(
                { success: false, error: "Agent is required" },
                { status: 400 }
            );
        }

        // ============================================
        // PROVIDER CONFIGURATION HANDLING
        // ============================================
        let config = providerConfig;

        if (!config && databaseReady) {
            try {
                const storedProvider = await getActiveProvider(userId);
                if (storedProvider?.encryptedApiKey) {
                    config = {
                        providerName: storedProvider.providerName,
                        selectedModel: storedProvider.selectedModel,
                        encryptedApiKey: storedProvider.encryptedApiKey,
                        userId,
                        isActive: true,
                    };
                }
            } catch (error) {
                console.warn("Could not load provider from Turso:", error.message);
            }
        }

        if (!config) {
            // Fallback to environment variables (for Vercel production)
            const envProvider = process.env.DEFAULT_PROVIDER || "qwen";
            const envModel = process.env.DEFAULT_MODEL || "qwen/qwen3.7-plus";
            
            // Check for API key - CRITICAL: No NEXT_PUBLIC_ prefix
            // Universal slot: Qwen (OpenRouter) OR Gemini both work here
            const envApiKey = HARDCODED_QWEN_API_KEY !== "YOUR_OPENROUTER_API_KEY_HERE" ? HARDCODED_QWEN_API_KEY :
                              process.env.OPENROUTER_API_KEY ||
                              process.env.QWEN_API_KEY ||
                              process.env.GEMINI_API_KEY ||
                              process.env.OPENAI_API_KEY || 
                              process.env.ANTHROPIC_API_KEY;
            
            if (envApiKey) {
                // Create config object with encrypted API key
                config = {
                    providerName: envProvider,
                    selectedModel: envModel,
                    encryptedApiKey: encryptApiKey(envApiKey),
                    userId,
                    isActive: true,
                };
            } else {
                return NextResponse.json(
                    { 
                        success: false, 
                        error: "No LLM provider configured. API key not found in environment variables. Please check Vercel settings." 
                    },
                    { status: 500 }
                );
            }
        }

        // ============================================
        // BUILD SYSTEM PROMPT
        // ============================================
        const personalityContext = buildPersonalityContext(agent);
        const systemPrompt = [
            personalityContext,
            agent.systemPrompt,
            `\nYour goal: ${agent.goal}`,
        ]
            .filter(Boolean)
            .join("\n\n");

        // ============================================
        // CREATE PROVIDER CLIENT
        // ============================================
        const providerFactory = createProvider(config);
        const client = providerFactory.getClient();

        // ============================================
        // GENERATE RESPONSE
        // ============================================
        const responseText = await client.generateContent(prompt.trim(), {
            temperature: agent.temperature ?? 0.7,
            maxTokens: agent.maxTokens ?? 2048,
            systemPrompt: systemPrompt,
        });

        const timestamp = new Date().toISOString();
        let conversationId = requestBody.conversationId || null;
        let persistence = { ok: false, error: "Database is not configured" };

        if (databaseReady) {
            try {
                if (conversationId) {
                    const existing = await getConversation(conversationId, userId);
                    if (!existing) conversationId = null;
                }
                if (!conversationId) {
                    conversationId = crypto.randomUUID();
                    await createConversation({
                        id: conversationId,
                        userId,
                        title: prompt.trim().slice(0, 120),
                    });
                }

                await addMessage({
                    conversationId,
                    userId,
                    role: "user",
                    content: prompt.trim(),
                });

                await addMessage({
                    conversationId,
                    userId,
                    role: "assistant",
                    content: responseText,
                    agentId: agent.id ?? null,
                    agentName: agent.name,
                    metadata: {
                        provider: config.providerName,
                        model: config.selectedModel,
                    },
                    createdAt: timestamp,
                });

                if (agent.id) {
                    await recordExecution(
                        {
                            agentId: agent.id,
                            conversationId,
                            userRequest: prompt.trim(),
                            success: true,
                            output: responseText,
                            executionStrategy: "single-agent",
                            createdAt: timestamp,
                        },
                        userId
                    );

                    await addAgentMemoryEntries(
                        agent.id,
                        [
                            {
                                entryType: "conversation",
                                role: "user",
                                content: prompt.trim(),
                                metadata: { conversationId },
                                createdAt: timestamp,
                            },
                            {
                                entryType: "conversation",
                                role: "assistant",
                                content: responseText,
                                metadata: { conversationId, agentName: agent.name },
                                createdAt: timestamp,
                            },
                            {
                                entryType: "execution",
                                role: "system",
                                content: responseText,
                                metadata: {
                                    conversationId,
                                    userRequest: prompt.trim(),
                                    success: true,
                                    executionStrategy: "single-agent",
                                    timestamp,
                                },
                                createdAt: timestamp,
                            },
                        ],
                        userId
                    );
                }

                persistence = { ok: true };
            } catch (dbError) {
                console.error("Failed to persist agent chat:", dbError);
                persistence = { ok: false, error: "Failed to persist agent chat" };
            }
        }

        return NextResponse.json({
            success: true,
            agentName: agent.name,
            agentRole: agent.role,
            prompt: prompt.trim(),
            response: responseText,
            provider: config.providerName,
            model: config.selectedModel,
            timestamp,
            conversationId,
            persistence,
        });
        
    } catch (error) {
        if (error instanceof AuthenticationError || error?.code === "UNAUTHENTICATED") {
            return unauthorizedResponse();
        }

        console.error("Agent chat API error:", error);

        const isUserFacing = Boolean(error?.userFacing);
        const status =
            isUserFacing && Number.isInteger(error?.status) && error.status >= 400 && error.status <= 599
                ? error.status
                : error.message?.includes("429") || error.message?.includes("quota")
                    ? 429
                    : 500;

        if (!isUserFacing && status === 429) {
            return NextResponse.json(
                {
                    success: false,
                    error: "API rate limit exceeded. Please wait a moment and try again.",
                },
                { status: 429 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to generate response",
                details:
                    !isUserFacing && process.env.NODE_ENV === "development"
                        ? error.message
                        : undefined,
            },
            { status }
        );
    }
}
