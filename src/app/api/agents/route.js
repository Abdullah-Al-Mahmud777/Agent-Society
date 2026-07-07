import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { buildPersonalityContext } from "../../../lib/personality";
import {
    retrieveRelevantMemories,
    buildMemoryContext,
    extractSpecialistMemories,
    extractOrchestratorMemory,
    extractDebateMemories,
} from "../../../lib/memory";

export const runtime = "nodejs";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Shared output schema for specialist agents
const SPECIALIST_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        agent: { type: Type.STRING },
        role: { type: Type.STRING },
        summary: { type: Type.STRING },
        findings: { type: Type.STRING },
        risks: { type: Type.STRING },
        recommendation: { type: Type.STRING },
        confidence: { type: Type.STRING },
    },
    required: ["agent", "role", "summary", "findings", "risks", "recommendation", "confidence"],
};

// Output schema for Round 2 debate reactions
const DEBATE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        agrees: { type: Type.ARRAY, items: { type: Type.STRING } },
        disagrees: { type: Type.ARRAY, items: { type: Type.STRING } },
        updatedPosition: { type: Type.STRING },
        positionChanged: { type: Type.BOOLEAN },
        reasoning: { type: Type.STRING },
    },
    required: ["agrees", "disagrees", "updatedPosition", "positionChanged", "reasoning"],
};

// Output schema for the orchestrator / CEO agent
const ORCHESTRATOR_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        agent: { type: Type.STRING },
        role: { type: Type.STRING },
        summary: { type: Type.STRING },
        keyDecisions: { type: Type.ARRAY, items: { type: Type.STRING } },
        risks: { type: Type.STRING },
        recommendation: { type: Type.STRING },
        nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
        confidence: { type: Type.STRING },
    },
    required: ["agent", "role", "summary", "keyDecisions", "risks", "recommendation", "nextSteps", "confidence"],
};

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

function extractRetryDelay(errorMessage) {
    const match = String(errorMessage).match(/retry[^0-9]*([0-9]+(?:\.[0-9]+)?)s/i);
    return match ? Math.ceil(parseFloat(match[1])) * 1000 : 30000;
}

async function callGeminiAgent({ systemPrompt, userPrompt, schema, temperature = 0.2 }, retries = 3) {
    const apiKey = HARDCODED_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Missing GEMINI_API_KEY environment variable.");
    }

    const ai = new GoogleGenAI({ apiKey });

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: GEMINI_MODEL,
                contents: userPrompt,
                config: {
                    systemInstruction: systemPrompt,
                    temperature,
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
            const msg = error instanceof Error ? error.message : String(error);
            const isRateLimit = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota");
            const isTransient = msg.includes("503") || msg.includes("UNAVAILABLE");

            if ((isRateLimit || isTransient) && attempt < retries) {
                const delay = isRateLimit ? extractRetryDelay(msg) : 5000 * (attempt + 1);
                await new Promise((resolve) => setTimeout(resolve, delay));
                continue;
            }

            throw new Error(`Gemini request failed: ${msg}`);
        }
    }
}

// ─── Dynamic mode: uses agents configured in the builder ─────────────────────

function isOrchestratorRole(agent) {
    return /ceo|orchestrat|director|chief/i.test(agent.role) ||
        /ceo|orchestrat|director|chief/i.test(agent.name);
}

async function runAgentsFromConfig(businessIdea, agents, memories = []) {
    const enabled = agents.filter((a) => a.isEnabled !== false);
    if (!enabled.length) {
        throw new Error("No enabled agents provided. Enable at least one agent in the Agent Builder.");
    }

    const orchestrator = enabled.find(isOrchestratorRole) ?? enabled[0];
    const specialists = enabled.filter((a) => a.id !== orchestrator.id);
    const context = buildContext(businessIdea);
    const sessionId = crypto.randomUUID();
    const newMemories = [];
    const memoriesInjected = {};

    // ── Round 1: all specialists analyze independently ────────────────────────
    const round1Results = await Promise.all(
        specialists.map((agent) => {
            const relevant = retrieveRelevantMemories(memories, agent.id, businessIdea);
            const memoryBlock = buildMemoryContext(relevant);
            memoriesInjected[agent.id] = relevant.length;

            const systemPrompt = [
                buildPersonalityContext(agent),
                memoryBlock,
                agent.systemPrompt,
            ].filter(Boolean).join("\n\n");

            return callGeminiAgent({
                systemPrompt,
                userPrompt: `Business idea: ${businessIdea}\n\nYour goal: ${agent.goal}\n\nProvide your specialist analysis and recommendation.`,
                schema: SPECIALIST_SCHEMA,
                temperature: agent.temperature ?? 0.4,
            })
                .then((result) => {
                    newMemories.push(...extractSpecialistMemories(agent, result, businessIdea, sessionId));
                    return {
                        agentName: agent.name,
                        agentRole: agent.role,
                        agentIcon: agent.icon,
                        agentColor: agent.color,
                        memoriesUsed: relevant.length,
                        ...result,
                    };
                })
                .catch((err) => ({
                    agentName: agent.name,
                    agentRole: agent.role,
                    agentIcon: agent.icon,
                    agentColor: agent.color,
                    memoriesUsed: relevant.length,
                    error: err.message,
                    summary: "This agent failed to respond.",
                    findings: "N/A",
                    risks: "N/A",
                    recommendation: "N/A",
                    confidence: "0%",
                }));
        })
    );

    // ── Round 2: each specialist reacts to its peers (only with 2+ specialists) ─
    const specialistResults = specialists.length >= 2
        ? await Promise.all(
            round1Results.map((round1, i) => {
                const agent = specialists[i];
                if (round1.error) return { ...round1, debate: null };

                const peers = round1Results
                    .filter((_, j) => j !== i && !round1Results[j]?.error)
                    .map((p) => ({
                        agentName: p.agentName,
                        agentRole: p.agentRole,
                        summary: p.summary,
                        recommendation: p.recommendation,
                        risks: p.risks,
                    }));

                const systemPrompt = [
                    buildPersonalityContext(agent),
                    agent.systemPrompt,
                ].filter(Boolean).join("\n\n");

                const userPrompt = [
                    `Business idea: ${businessIdea}`,
                    `\nYour Round 1 analysis:\nSummary: ${round1.summary}\nRecommendation: ${round1.recommendation}`,
                    `\nYour colleagues' analyses:\n${peers.map((p) => `${p.agentName} (${p.agentRole}): ${p.summary} | Recommends: ${p.recommendation}`).join("\n\n")}`,
                    `\nReact to what your colleagues said. Be specific about who you agree or disagree with and why. State whether your overall position has changed.`,
                ].join("\n");

                return callGeminiAgent({
                    systemPrompt,
                    userPrompt,
                    schema: DEBATE_SCHEMA,
                    temperature: Math.min((agent.temperature ?? 0.5) + 0.1, 1.0),
                })
                    .then((debate) => {
                        newMemories.push(...extractDebateMemories(agent, debate, businessIdea, sessionId));
                        return { ...round1, debate };
                    })
                    .catch(() => ({ ...round1, debate: null }));
            })
        )
        : round1Results;

    // ── Orchestrator synthesizes both rounds ──────────────────────────────────
    const orchestratorMemories = retrieveRelevantMemories(memories, orchestrator.id, businessIdea);
    const orchestratorMemoryBlock = buildMemoryContext(orchestratorMemories);
    memoriesInjected[orchestrator.id] = orchestratorMemories.length;

    const orchestratorSystemPrompt = [
        buildPersonalityContext(orchestrator),
        orchestratorMemoryBlock,
        orchestrator.systemPrompt,
    ].filter(Boolean).join("\n\n");

    const debateSummary = specialistResults
        .filter((s) => s.debate)
        .map((s) => `${s.agentName}: position changed=${s.debate.positionChanged}, updated position: ${s.debate.updatedPosition}`)
        .join("\n");

    const orchestratorResult = await callGeminiAgent({
        systemPrompt: orchestratorSystemPrompt,
        userPrompt: [
            `Business idea: ${businessIdea}`,
            `\nRound 1 — Initial specialist analyses:\n${JSON.stringify(round1Results.map((r) => ({ agentName: r.agentName, summary: r.summary, recommendation: r.recommendation })), null, 2)}`,
            specialists.length >= 2
                ? `\nRound 2 — After debate:\n${debateSummary}`
                : "",
            `\nSynthesize the final recommendation. Note where agents reached consensus and where disagreements remain unresolved.`,
        ].filter(Boolean).join("\n"),
        schema: ORCHESTRATOR_SCHEMA,
        temperature: orchestrator.temperature ?? 0.2,
    });

    const final = {
        summary: orchestratorResult.summary,
        recommendation: orchestratorResult.recommendation,
        nextSteps: orchestratorResult.nextSteps ?? [],
        keyDecisions: orchestratorResult.keyDecisions ?? [],
        confidence: orchestratorResult.confidence,
    };

    newMemories.push(extractOrchestratorMemory(orchestrator, final, businessIdea, sessionId));

    return {
        context,
        sessionId,
        memoriesInjected,
        newMemories,
        agents: {
            orchestrator: {
                agentName: orchestrator.name,
                agentRole: orchestrator.role,
                agentIcon: orchestrator.icon,
                agentColor: orchestrator.color,
                memoriesUsed: orchestratorMemories.length,
                ...orchestratorResult,
            },
            specialists: specialistResults,
        },
        final,
    };
}

// ─── Hardcoded fallback: original 5-specialist setup ────────────────────────

async function runAgentsHardcoded(businessIdea) {
    const context = buildContext(businessIdea);

    const specialistPrompts = [
        {
            agentName: "Market Research Agent",
            agentRole: "Demand scout",
            agentIcon: "📈",
            agentColor: "#0ea5e9",
            systemPrompt: "You are the Market Research Agent in an Agent Society. Focus on customer demand, competitors, market gaps, and buyer segments.",
            userPrompt: `Business idea: ${businessIdea}\n\nAnalyze the market opportunity.`,
        },
        {
            agentName: "Product Manager Agent",
            agentRole: "MVP planner",
            agentIcon: "🎯",
            agentColor: "#f59e0b",
            systemPrompt: "You are the Product Manager Agent in an Agent Society. Focus on MVP scope, core user journey, feature prioritization, and product risks.",
            userPrompt: `Business idea: ${businessIdea}\n\nDefine the smallest valuable product plan.`,
        },
        {
            agentName: "Financial Analyst Agent",
            agentRole: "Viability check",
            agentIcon: "💰",
            agentColor: "#a855f7",
            systemPrompt: "You are the Financial Analyst Agent in an Agent Society. Focus on burn, runway, pricing, revenue potential, and financial risks.",
            userPrompt: `Business idea: ${businessIdea}\n\nEstimate the financial viability.`,
        },
        {
            agentName: "Marketing Agent",
            agentRole: "Go-to-market",
            agentIcon: "📣",
            agentColor: "#f43f5e",
            systemPrompt: "You are the Marketing Agent in an Agent Society. Focus on positioning, messaging, launch channels, and go-to-market strategy.",
            userPrompt: `Business idea: ${businessIdea}\n\nBuild the marketing and launch plan.`,
        },
        {
            agentName: "Investor Agent",
            agentRole: "Funding lens",
            agentIcon: "💼",
            agentColor: "#64748b",
            systemPrompt: "You are the Investor Agent in an Agent Society. Focus on fundability, upside, moat, traction requirements, and investor concerns.",
            userPrompt: `Business idea: ${businessIdea}\n\nEvaluate this from an investor's perspective.`,
        },
    ];

    const specialistResults = await Promise.all(
        specialistPrompts.map(({ agentName, agentRole, agentIcon, agentColor, systemPrompt, userPrompt }) =>
            callGeminiAgent({ systemPrompt, userPrompt, schema: SPECIALIST_SCHEMA, temperature: 0.4 })
                .then((result) => ({ agentName, agentRole, agentIcon, agentColor, ...result }))
                .catch((err) => ({
                    agentName, agentRole, agentIcon, agentColor,
                    error: err.message,
                    summary: "This agent failed to respond.",
                    findings: "N/A",
                    risks: "N/A",
                    recommendation: "N/A",
                    confidence: "0%",
                }))
        )
    );

    const orchestratorResult = await callGeminiAgent({
        systemPrompt: "You are the CEO Agent and orchestrator of the Agent Society. You receive specialist outputs and must summarize the final recommendation. Prioritize strategy, tradeoffs, next steps, and the single most important decision.",
        userPrompt: `Business idea: ${businessIdea}\n\nSpecialist outputs:\n${JSON.stringify(specialistResults, null, 2)}\n\nSummarize the final CEO view.`,
        schema: ORCHESTRATOR_SCHEMA,
        temperature: 0.2,
    });

    return {
        context,
        agents: {
            orchestrator: {
                agentName: "CEO Agent",
                agentRole: "Orchestrator",
                agentIcon: "👑",
                agentColor: "#22c55e",
                ...orchestratorResult,
            },
            specialists: specialistResults,
        },
        final: {
            summary: orchestratorResult.summary,
            recommendation: orchestratorResult.recommendation,
            nextSteps: orchestratorResult.nextSteps ?? [],
            keyDecisions: orchestratorResult.keyDecisions ?? [],
            confidence: orchestratorResult.confidence,
        },
    };
}

// ─── Request parsing ─────────────────────────────────────────────────────────

async function parseRequest(request) {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        return request.json();
    }
    return {};
}

// ─── Route handlers ───────────────────────────────────────────────────────────

export async function POST(request) {
    try {
        const body = await parseRequest(request);
        const businessIdea = getBusinessIdea(body);

        if (!businessIdea) {
            return NextResponse.json(
                { success: false, error: "businessIdea is required" },
                { status: 400 }
            );
        }

        const agents = Array.isArray(body.agents) && body.agents.length > 0 ? body.agents : null;
        const memories = Array.isArray(body.memories) ? body.memories : [];
        const result = agents
            ? await runAgentsFromConfig(businessIdea, agents, memories)
            : await runAgentsHardcoded(businessIdea);

        return NextResponse.json({ success: true, input: { businessIdea }, ...result });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Unexpected server error" },
            { status: 500 }
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
                { status: 400 }
            );
        }

        const result = await runAgentsHardcoded(businessIdea);

        return NextResponse.json({ success: true, input: { businessIdea }, ...result });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Unexpected server error" },
            { status: 500 }
        );
    }
}
