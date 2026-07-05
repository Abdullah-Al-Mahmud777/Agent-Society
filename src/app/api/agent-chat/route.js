import { NextResponse } from "next/server";
import { buildPersonalityContext } from "@/lib/personality";
import { createProvider } from "@/lib/provider-factory";

export const runtime = "nodejs";

/**
 * Agent-specific chat endpoint
 * POST /api/agent-chat
 * Body: { prompt: string, agent: object, providerConfig: object }
 */
export async function POST(request) {
    try {
        const { prompt, agent, providerConfig } = await request.json();

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

        if (!providerConfig) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: "No LLM provider configured. Please configure a provider in the Providers page first." 
                },
                { status: 400 }
            );
        }

        // Build system prompt with personality
        const personalityContext = buildPersonalityContext(agent);
        const systemPrompt = [
            personalityContext,
            agent.systemPrompt,
            `\nYour goal: ${agent.goal}`,
        ]
            .filter(Boolean)
            .join("\n\n");

        // Create dynamic provider client
        const providerFactory = createProvider(providerConfig);
        const client = providerFactory.getClient();

        // Generate response using agent's configuration
        const responseText = await client.generateContent(prompt.trim(), {
            temperature: agent.temperature ?? 0.7,
            maxTokens: agent.maxTokens ?? 2048,
            systemPrompt: systemPrompt,
        });

        return NextResponse.json({
            success: true,
            agentName: agent.name,
            agentRole: agent.role,
            prompt: prompt.trim(),
            response: responseText,
            provider: providerConfig.providerName,
            model: providerConfig.selectedModel,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Agent chat API error:", error);
        
        // Handle rate limiting
        if (error.message?.includes("429") || error.message?.includes("quota")) {
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
            },
            { status: 500 }
        );
    }
}
