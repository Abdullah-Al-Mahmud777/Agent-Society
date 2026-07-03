import { z } from "zod";

export const AI_PROVIDERS = ["openai", "gemini"];

export const PROVIDER_LABELS = {
	openai: "OpenAI",
	gemini: "Gemini",
};

export const PROVIDER_DEFAULT_MODELS = {
	openai: "gpt-4o-mini",
	gemini: "gemini-1.5-flash",
};

export const ICON_OPTIONS = ["🤖", "👑", "🧠", "🎯", "📈", "⚙️", "💬", "🚀", "🧪", "🛡️", "🏛️", "🧩"];

export const DEFAULT_AGENT_COLOR = "#22c55e";
export const DEFAULT_SOCIETY_COLOR = "#0ea5e9";
export const DEFAULT_AGENT_PROMPT =
	"You are a reliable AI agent. Follow the assigned role, pursue the stated goal, and respond with clear, actionable output.";
export const DEFAULT_SOCIETY_PROMPT =
	"You are a society orchestrator. Use your member agents in order, keep the plan aligned to the society goal, and synthesize the result clearly.";

const colorRegex = /^#[0-9a-fA-F]{6}$/;

function createId() {
	if (globalThis.crypto?.randomUUID) {
		return globalThis.crypto.randomUUID();
	}

	return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function timestamp() {
	return new Date().toISOString();
}

export const agentInputSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(80, "Name must be 80 characters or less"),
	description: z.string().trim().min(1, "Description is required").max(240, "Description must be 240 characters or less"),
	role: z.string().trim().min(1, "Role is required").max(80, "Role must be 80 characters or less"),
	goal: z.string().trim().min(1, "Goal is required").max(240, "Goal must be 240 characters or less"),
	systemPrompt: z.string().trim().min(1, "System prompt is required").max(4000, "System prompt must be 4000 characters or less"),
	aiProvider: z.enum(AI_PROVIDERS),
	model: z.string().trim().min(1, "Model is required").max(120, "Model must be 120 characters or less"),
	temperature: z.number().min(0, "Temperature must be at least 0").max(2, "Temperature must be 2 or lower"),
	maxTokens: z.number().int("Max tokens must be a whole number").min(1, "Max tokens must be at least 1").max(32768, "Max tokens must be 32768 or lower"),
	icon: z.string().trim().min(1, "Icon is required").max(8, "Icon must be 8 characters or less"),
	color: z.string().regex(colorRegex, "Color must be a hex value like #22c55e"),
	isEnabled: z.boolean(),
});

export const agentSchema = agentInputSchema.extend({
	id: z.string().min(1),
	createdAt: z.string().min(1),
	updatedAt: z.string().min(1),
});

export const societyInputSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(80, "Name must be 80 characters or less"),
	description: z.string().trim().min(1, "Description is required").max(240, "Description must be 240 characters or less"),
	goal: z.string().trim().min(1, "Goal is required").max(240, "Goal must be 240 characters or less"),
	systemPrompt: z.string().trim().min(1, "System prompt is required").max(4000, "System prompt must be 4000 characters or less"),
	icon: z.string().trim().min(1, "Icon is required").max(8, "Icon must be 8 characters or less"),
	color: z.string().regex(colorRegex, "Color must be a hex value like #22c55e"),
	isEnabled: z.boolean(),
});

export const societySchema = societyInputSchema.extend({
	id: z.string().min(1),
	createdAt: z.string().min(1),
	updatedAt: z.string().min(1),
	agentIds: z.array(z.string().min(1)),
});

function stripIdentityFields(record) {
	if (!record) {
		return {};
	}

	const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = record;
	return rest;
}

function uniqueAgentIds(agentIds = []) {
	return [...new Set(agentIds.filter((agentId) => typeof agentId === "string" && agentId.trim().length > 0))];
}

export function createAgentDefaults(overrides = {}) {
	return {
		name: "New Agent",
		description: "Describe what this agent is responsible for.",
		role: "Specialist",
		goal: "Deliver a useful outcome for the team.",
		systemPrompt: DEFAULT_AGENT_PROMPT,
		aiProvider: "openai",
		model: PROVIDER_DEFAULT_MODELS.openai,
		temperature: 0.7,
		maxTokens: 1024,
		icon: "🤖",
		color: DEFAULT_AGENT_COLOR,
		isEnabled: true,
		...overrides,
	};
}

export function createSocietyDefaults(overrides = {}) {
	return {
		name: "New Society",
		description: "Describe the society and the problem it solves.",
		goal: "Coordinate member agents toward one objective.",
		systemPrompt: DEFAULT_SOCIETY_PROMPT,
		icon: "🏛️",
		color: DEFAULT_SOCIETY_COLOR,
		isEnabled: true,
		agentIds: [],
		...overrides,
	};
}

export function createAgentFromInput(input) {
	const now = timestamp();

	return agentSchema.parse({
		id: createId(),
		createdAt: now,
		updatedAt: now,
		...createAgentDefaults(),
		...stripIdentityFields(input),
	});
}

export function createSocietyFromInput(input) {
	const now = timestamp();

	return societySchema.parse({
		id: createId(),
		createdAt: now,
		updatedAt: now,
		...createSocietyDefaults(),
		...stripIdentityFields(input),
		agentIds: uniqueAgentIds(input?.agentIds ?? []),
	});
}

export function createAgentCopy(agent, overrides = {}) {
	return createAgentFromInput({
		...stripIdentityFields(agent),
		...overrides,
	});
}

export function createSocietyCopy(society, overrides = {}) {
	return createSocietyFromInput({
		...stripIdentityFields(society),
		...overrides,
		agentIds: [...(society?.agentIds ?? [])],
	});
}

export function normalizeAgentIds(agentIds) {
	return uniqueAgentIds(agentIds);
}
