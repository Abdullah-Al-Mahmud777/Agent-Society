import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { buildPersonalityContext } from "@/lib/personality";

export const runtime = "nodejs";

/**
 * Agent-specific chat endpoint
 * POST /api/agent-chat
 * Body: { prompt: string, agent: object }
 */
export async function POST(request) {
    try {
        const { prompt, agent } = await request.json();

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

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: "GEMINI_API_KEY not configured" },
                { status: 500 }
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

        // Generate response using agent's configuration
        const genAI = new GoogleGenAI({ apiKey });
        
        const response = await genAI.models.generateContent({
            model: agent.model || "gemini-2.5-flash",
            contents: prompt.trim(),
            config: {
                systemInstruction: systemPrompt,
                temperature: agent.temperature ?? 0.7,
                maxOutputTokens: agent.maxTokens ?? 2048,
            },
        });

        return NextResponse.json({
            success: true,
            agentName: agent.name,
            agentRole: agent.role,
            prompt: prompt.trim(),
            response: response.text,
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
