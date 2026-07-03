import { NextResponse } from "next/server";

export const runtime = "nodejs";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

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
				"Return only valid JSON with keys: agent, role, summary, findings, risks, recommendation, confidence.",
			].join(" "),
			user: `Business idea: ${context.businessIdea}\n\nAnalyze the market opportunity.`,
		},
		product: {
			system: [
				"You are the Product Manager Agent in an Agent Society.",
				"Focus on MVP scope, core user journey, feature prioritization, and product risks.",
				"Return only valid JSON with keys: agent, role, summary, findings, risks, recommendation, confidence.",
			].join(" "),
			user: `Business idea: ${context.businessIdea}\n\nDefine the smallest valuable product plan.`,
		},
		finance: {
			system: [
				"You are the Financial Analyst Agent in an Agent Society.",
				"Focus on burn, runway, pricing, revenue potential, and financial risks.",
				"Return only valid JSON with keys: agent, role, summary, findings, risks, recommendation, confidence.",
			].join(" "),
			user: `Business idea: ${context.businessIdea}\n\nEstimate the financial viability.`,
		},
		marketing: {
			system: [
				"You are the Marketing Agent in an Agent Society.",
				"Focus on positioning, messaging, launch channels, and go-to-market strategy.",
				"Return only valid JSON with keys: agent, role, summary, findings, risks, recommendation, confidence.",
			].join(" "),
			user: `Business idea: ${context.businessIdea}\n\nBuild the marketing and launch plan.`,
		},
		investor: {
			system: [
				"You are the Investor Agent in an Agent Society.",
				"Focus on fundability, upside, moat, traction requirements, and investor concerns.",
				"Return only valid JSON with keys: agent, role, summary, findings, risks, recommendation, confidence.",
			].join(" "),
			user: `Business idea: ${context.businessIdea}\n\nEvaluate this from an investor's perspective.`,
		},
	};
}

function getCeoPrompt(context, specialistOutputs) {
	return {
		system: [
			"You are the CEO Agent and orchestrator of the Agent Society.",
			"You receive specialist outputs and must summarize the final recommendation.",
			"Prioritize strategy, tradeoffs, next steps, and the single most important decision.",
			"Return only valid JSON with keys: agent, role, summary, keyDecisions, risks, recommendation, nextSteps, confidence.",
		].join(" "),
		user: `Business idea: ${context.businessIdea}\n\nSpecialist outputs:\n${JSON.stringify(specialistOutputs, null, 2)}\n\nSummarize the final CEO view.`,
	};
}

function stripCodeFences(text) {
	return text
		.replace(/^```json\s*/i, "")
		.replace(/^```\s*/i, "")
		.replace(/\s*```$/i, "")
		.trim();
}

function parseAgentJson(text) {
	const cleaned = stripCodeFences(text);
	return JSON.parse(cleaned);
}

async function callOpenAIAgent({ systemPrompt, userPrompt, temperature = 0.2 }) {
	const apiKey = process.env.OPENAI_API_KEY;

	if (!apiKey) {
		throw new Error("Missing OPENAI_API_KEY environment variable.");
	}

	const response = await fetch(OPENAI_API_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: OPENAI_MODEL,
			temperature,
			response_format: { type: "json_object" },
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt },
			],
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`OpenAI request failed (${response.status}): ${errorText}`);
	}

	const data = await response.json();
	const content = data?.choices?.[0]?.message?.content;

	if (typeof content !== "string" || !content.trim()) {
		throw new Error("OpenAI returned an empty response.");
	}

	return parseAgentJson(content);
}

async function runAgents(businessIdea) {
	const context = buildContext(businessIdea);
	const specialistPrompts = getSpecialistPrompts(context);

	const [marketResearch, product, finance, marketing, investor] = await Promise.all([
		callOpenAIAgent(specialistPrompts.marketResearch),
		callOpenAIAgent(specialistPrompts.product),
		callOpenAIAgent(specialistPrompts.finance),
		callOpenAIAgent(specialistPrompts.marketing),
		callOpenAIAgent(specialistPrompts.investor),
	]);

	const specialistOutputs = {
		marketResearch,
		product,
		finance,
		marketing,
		investor,
	};

	const ceo = await callOpenAIAgent(getCeoPrompt(context, specialistOutputs));

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