import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export const runtime = "nodejs";

// Initialize the Gemini client (it automatically picks up process.env.GEMINI_API_KEY)
const ai = new GoogleGenAI();
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function getBusinessIdea(payload) {
    if (typeof payload?.businessIdea === "string" && payload.businessIdea.trim()) {
        return payload.businessIdea.trim();
    }

    if (typeof payload?.idea === "string" && payload.idea.trim()) {
        return payload.idea.trim();
    }

    return "";
}

function buildContext(businessIdea) {
    const normalized = businessIdea.toLowerCase();
    const isAiStartup = normalized.includes("ai") || normalized.includes("artificial intelligence");

    return {
        businessIdea,
        isAiStartup,
        marketType: isAiStartup ? "AI-first software" : "general startup",
        targetBuyer: isAiStartup ? "teams that want workflow automation" : "unknown until validated",
    };
}

function getSpecialistPrompts(context) {
    return {
        marketResearch: {
            system: [
                "You are the Market Research Agent in an Agent Society.",
                "Focus on customer demand, competitors, market gaps, and buyer segments.",
            ].join(" "),
            user: `Business idea: ${context.businessIdea}\n\nAnalyze the market opportunity.`,
            // Defines schema enforcement for standard specialist outputs
            schema: {
                type: Type.OBJECT,
                properties: {
                    agent: { type: Type.STRING },
                    role: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    findings: { type: Type.STRING },
                    risks: { type: Type.STRING },
                    recommendation: { type: Type.STRING },
                    confidence: { type: Type.STRING }
                },
                required: ["agent", "role", "summary", "findings", "risks", "recommendation", "confidence"],
            }
        },
        product: {
            system: [
                "You are the Product Manager Agent in an Agent Society.",
                "Focus on MVP scope, core user journey, feature prioritization, and product risks.",
            ].join(" "),
            user: `Business idea: ${context.businessIdea}\n\nDefine the smallest valuable product plan.`,
            schema: {
                type: Type.OBJECT,
                properties: {
                    agent: { type: Type.STRING },
                    role: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    findings: { type: Type.STRING },
                    risks: { type: Type.STRING },
                    recommendation: { type: Type.STRING },
                    confidence: { type: Type.STRING }
                },
                required: ["agent", "role", "summary", "findings", "risks", "recommendation", "confidence"],
            }
        },
        finance: {
            system: [
                "You are the Financial Analyst Agent in an Agent Society.",
                "Focus on burn, runway, pricing, revenue potential, and financial risks.",
            ].join(" "),
            user: `Business idea: ${context.businessIdea}\n\nEstimate the financial viability.`,
            schema: {
                type: Type.OBJECT,
                properties: {
                    agent: { type: Type.STRING },
                    role: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    findings: { type: Type.STRING },
                    risks: { type: Type.STRING },
                    recommendation: { type: Type.STRING },
                    confidence: { type: Type.STRING }
                },
                required: ["agent", "role", "summary", "findings", "risks", "recommendation", "confidence"],
            }
        },
        marketing: {
            system: [
                "You are the Marketing Agent in an Agent Society.",
                "Focus on positioning, messaging, launch channels, and go-to-market strategy.",
            ].join(" "),
            user: `Business idea: ${context.businessIdea}\n\nBuild the marketing and launch plan.`,
            schema: {
                type: Type.OBJECT,
                properties: {
                    agent: { type: Type.STRING },
                    role: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    findings: { type: Type.STRING },
                    risks: { type: Type.STRING },
                    recommendation: { type: Type.STRING },
                    confidence: { type: Type.STRING }
                },
                required: ["agent", "role", "summary", "findings", "risks", "recommendation", "confidence"],
            }
        },
        investor: {
            system: [
                "You are the Investor Agent in an Agent Society.",
                "Focus on fundability, upside, moat, traction requirements, and investor concerns.",
            ].join(" "),
            user: `Business idea: ${context.businessIdea}\n\nEvaluate this from an investor's perspective.`,
            schema: {
                type: Type.OBJECT,
                properties: {
                    agent: { type: Type.STRING },
                    role: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    findings: { type: Type.STRING },
                    risks: { type: Type.STRING },
                    recommendation: { type: Type.STRING },
                    confidence: { type: Type.STRING }
                },
                required: ["agent", "role", "summary", "findings", "risks", "recommendation", "confidence"],
            }
        },
    };
}

function getCeoPrompt(context, specialistOutputs) {
    return {
        system: [
            "You are the CEO Agent and orchestrator of the Agent Society.",
            "You receive specialist outputs and must summarize the final recommendation.",
            "Prioritize strategy, tradeoffs, next steps, and the single most important decision.",
        ].join(" "),
        user: `Business idea: ${context.businessIdea}\n\nSpecialist outputs:\n${JSON.stringify(specialistOutputs, null, 2)}\n\nSummarize the final CEO view.`,
        schema: {
            type: Type.OBJECT,
            properties: {
                agent: { type: Type.STRING },
                role: { type: Type.STRING },
                summary: { type: Type.STRING },
                keyDecisions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                },
                risks: { type: Type.STRING },
                recommendation: { type: Type.STRING },
                nextSteps: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                },
                confidence: { type: Type.STRING }
            },
            required: ["agent", "role", "summary", "keyDecisions", "risks", "recommendation", "nextSteps", "confidence"],
        }
    };
}

async function callGeminiAgent({ systemPrompt, userPrompt, schema, temperature = 0.2 }) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("Missing GEMINI_API_KEY environment variable.");
    }

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                temperature: temperature,
                // Ensures JSON execution and strictly adheres to the requested object layout
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const content = response.text;

        if (!content || !content.trim()) {
            throw new Error("Gemini returned an empty response.");
        }

        return JSON.parse(content.trim());
    } catch (error) {
        throw new Error(`Gemini request failed: ${error instanceof Error ? error.message : error}`);
    }
}

async function runAgents(businessIdea) {
    const context = buildContext(businessIdea);
    const specialistPrompts = getSpecialistPrompts(context);

    // Call all specialist agents concurrently
    const [marketResearch, product, finance, marketing, investor] = await Promise.all([
        callGeminiAgent(specialistPrompts.marketResearch),
        callGeminiAgent(specialistPrompts.product),
        callGeminiAgent(specialistPrompts.finance),
        callGeminiAgent(specialistPrompts.marketing),
        callGeminiAgent(specialistPrompts.investor),
    ]);

    const specialistOutputs = {
        marketResearch,
        product,
        finance,
        marketing,
        investor,
    };

    // Orchestrate through the CEO Agent
    const ceo = await callGeminiAgent(getCeoPrompt(context, specialistOutputs));

    return {
        context,
        agents: {
            ceo,
            ...specialistOutputs,
        },
        final: {
            summary: ceo.summary,
            recommendation: ceo.recommendation,
            nextSteps: ceo.nextSteps || [],
            keyDecisions: ceo.keyDecisions || [],
            confidence: ceo.confidence,
        },
    };
}

async function parseRequest(request) {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        return request.json();
    }

    return {};
}

export async function POST(request) {
    try {
        const body = await parseRequest(request);
        const businessIdea = getBusinessIdea(body);

        if (!businessIdea) {
            return NextResponse.json(
                { success: false, error: "businessIdea is required" },
                { status: 400 },
            );
        }

        const result = await runAgents(businessIdea);

        return NextResponse.json({
            success: true,
            input: { businessIdea },
            ...result,
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unexpected server error",
            },
            { status: 500 },
        );
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const businessIdea = searchParams.get("businessIdea")?.trim() || "";

        if (!businessIdea) {
            return NextResponse.json(
                { success: false, error: "businessIdea query parameter is required" },
                { status: 400 },
            );
        }

        const result = await runAgents(businessIdea);

        return NextResponse.json({
            success: true,
            input: { businessIdea },
            ...result,
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unexpected server error",
            },
            { status: 500 },
        );
    }
}
