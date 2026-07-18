import { z } from "zod";

export const AI_PROVIDERS = ["openai", "qwen", "anthropic"];

export const PROVIDER_LABELS = {
	openai: "OpenAI",
	qwen: "Alibaba Cloud Qwen",
	anthropic: "Anthropic Claude",
	openrouter: "OpenRouter",
};

export const PROVIDER_DEFAULT_MODELS = {
	openai: "gpt-4o-mini",
	qwen: "qwen/qwen3.7-plus",
	anthropic: "claude-3-5-sonnet-20241022",
	openrouter: "qwen/qwen3.7-plus",
};

export const ICON_OPTIONS = ["🤖", "👑", "🧠", "🎯", "📈", "⚙️", "💬", "🚀", "🧪", "🛡️"];

export const SPEAKING_STYLES = ["formal", "casual", "technical"];
export const SPEAKING_STYLE_LABELS = { formal: "Formal", casual: "Casual", technical: "Technical" };

export const DEFAULT_AGENT_COLOR = "#22c55e";
export const DEFAULT_SYSTEM_PROMPT =
	"You are a reliable AI agent. Follow the assigned role, pursue the stated goal, and respond with clear, actionable output.";

const colorRegex = /^#[0-9a-fA-F]{6}$/;

function createId() {
	if (globalThis.crypto?.randomUUID) {
		return globalThis.crypto.randomUUID();
	}

	// Use stable UUID generation without Date.now() or Math.random() during SSR
	try {
		if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
			return globalThis.crypto.randomUUID();
		}
		const array = new Uint8Array(16);
		if (globalThis.crypto?.getRandomValues) {
			globalThis.crypto.getRandomValues(array);
		} else {
			for (let i = 0; i < 16; i++) {
				array[i] = Math.floor(Math.random() * 256);
			}
		}
		return 'agent-' + Array.from(array).map((b) => b.toString(16).padStart(2, '0')).join('');
	} catch {
		// Fallback for edge cases
		return 'agent-' + Math.random().toString(36).substr(2, 9);
	}
}

export const agentInputSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(80, "Name must be 80 characters or less"),
	description: z.string().trim().min(1, "Description is required").max(240, "Description must be 240 characters or less"),
	role: z.string().trim().min(1, "Role is required").max(80, "Role must be 80 characters or less"),
	goal: z.string().trim().min(1, "Goal is required").max(240, "Goal must be 240 characters or less"),
	systemPrompt: z.string().trim().min(1, "System prompt is required").max(4000, "System prompt must be 4000 characters or less"),
	aiProvider: z.enum(["openai", "qwen", "anthropic"]),
	model: z.string().trim().min(1, "Model is required").max(120, "Model must be 120 characters or less"),
	temperature: z.number().min(0, "Temperature must be at least 0").max(2, "Temperature must be 2 or lower"),
	maxTokens: z.number().int("Max tokens must be a whole number").min(1, "Max tokens must be at least 1").max(32768, "Max tokens must be 32768 or lower"),
	icon: z.string().trim().min(1, "Icon is required").max(8, "Icon must be 8 characters or less"),
	color: z.string().regex(colorRegex, "Color must be a hex value like #22c55e"),
	isEnabled: z.boolean(),
	// Personality traits (0 = left extreme, 1 = right extreme)
	riskAppetite: z.number().min(0).max(1),
	communicationStyle: z.number().min(0).max(1),
	creativity: z.number().min(0).max(1),
	flexibility: z.number().min(0).max(1),
	coreValues: z.array(z.string().trim().min(1).max(60)).max(4),
	speakingStyle: z.enum(SPEAKING_STYLES),
	// New fields from spec
	expertise: z.string().trim().min(1, "Expertise is required").max(500, "Expertise must be 500 characters or less").default("General knowledge"),
	capabilities: z.array(z.string().trim().min(1).max(100)).max(10).default([]),
});

export const agentSchema = agentInputSchema.extend({
	id: z.string().min(1),
	createdAt: z.string().min(1),
	updatedAt: z.string().min(1),
});

export function createAgentDefaults(overrides = {}) {
	return {
		name: "New Agent",
		description: "Describe what this agent is responsible for.",
		role: "Specialist",
		goal: "Deliver a useful outcome for the team.",
		systemPrompt: DEFAULT_SYSTEM_PROMPT,
		aiProvider: "openai",
		model: PROVIDER_DEFAULT_MODELS.openai,
		temperature: 0.7,
		maxTokens: 1024,
		icon: "🤖",
		color: DEFAULT_AGENT_COLOR,
		isEnabled: true,
		riskAppetite: 0.5,
		communicationStyle: 0.5,
		creativity: 0.5,
		flexibility: 0.5,
		coreValues: [],
		speakingStyle: "formal",
		// New fields
		expertise: "General knowledge",
		capabilities: [],
		...overrides,
	};
}

export function createAgentFromInput(input) {
	const now = new Date().toISOString();

	return agentSchema.parse({
		id: createId(),
		createdAt: now,
		updatedAt: now,
		...createAgentDefaults(),
		...input,
	});
}
