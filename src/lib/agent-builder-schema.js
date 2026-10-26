import {
	addIssue,
	numberInRange,
	parseWithSchema,
	requiredString,
	validationFailure,
	validationSuccess,
} from "./validation.js";

export const AI_PROVIDERS = ["openai", "qwen", "anthropic", "gemini", "openrouter"];

export const PROVIDER_LABELS = {
	openai: "OpenAI",
	qwen: "Alibaba Cloud Qwen",
	anthropic: "Anthropic Claude",
	gemini: "Google Gemini",
	openrouter: "OpenRouter",
};

export const PROVIDER_DEFAULT_MODELS = {
	openai: "gpt-4o-mini",
	qwen: "qwen/qwen3.7-plus",
	anthropic: "claude-3-5-sonnet-20241022",
	gemini: "gemini-2.5-flash",
	openrouter: "qwen/qwen3.7-plus",
};

export const ICON_OPTIONS = ["🤖", "👑", "🧠", "🎯", "📈", "⚙️", "💬", "🚀", "🧪", "🛡️"];

export const SPEAKING_STYLES = ["formal", "casual", "technical"];
export const SPEAKING_STYLE_LABELS = { formal: "Formal", casual: "Casual", technical: "Technical" };

export const DEFAULT_AGENT_COLOR = "#22c55e";
export const DEFAULT_SYSTEM_PROMPT =
	"You are a reliable AI agent. Follow the assigned role, pursue the stated goal, and respond with clear, actionable output.";

const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const AI_PROVIDER_SET = new Set(AI_PROVIDERS);
const SPEAKING_STYLE_SET = new Set(SPEAKING_STYLES);

function createId() {
	if (globalThis.crypto?.randomUUID) {
		return globalThis.crypto.randomUUID();
	}

	const bytes = new Uint8Array(16);
	if (globalThis.crypto?.getRandomValues) {
		globalThis.crypto.getRandomValues(bytes);
	} else {
		for (let index = 0; index < bytes.length; index += 1) {
			bytes[index] = Math.floor(Math.random() * 256);
		}
	}

	return `agent-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function validateStringArray(issues, value, path, { maxItems, maxLength, required = false }) {
	if (value === undefined && !required) return [];
	if (!Array.isArray(value)) {
		addIssue(issues, [path], `${path} must be a list`);
		return [];
	}
	if (value.length > maxItems) {
		addIssue(issues, [path], `${path} can have at most ${maxItems} items`);
	}
	const values = [];
	for (const item of value) {
		if (typeof item !== "string" || !item.trim()) {
			addIssue(issues, [path], `${path} items must be non-empty text`);
			continue;
		}
		const next = item.trim();
		if (next.length > maxLength) {
			addIssue(issues, [path], `${path} items must be ${maxLength} characters or less`);
			continue;
		}
		values.push(next);
	}
	return values;
}

function validateAgent(source, { requireMetadata = false } = {}) {
	const input = source && typeof source === "object" && !Array.isArray(source) ? source : {};
	const issues = [];
	const data = {};

	if (requireMetadata) {
		data.id = requiredString(issues, input.id, "id", "Agent id", 120);
		data.createdAt = requiredString(issues, input.createdAt, "createdAt", "Created date");
		data.updatedAt = requiredString(issues, input.updatedAt, "updatedAt", "Updated date");
	}

	data.name = requiredString(issues, input.name, "name", "Name", 80);
	data.description = requiredString(issues, input.description, "description", "Description", 240);
	data.role = requiredString(issues, input.role, "role", "Role", 80);
	data.goal = requiredString(issues, input.goal, "goal", "Goal", 240);
	data.systemPrompt = requiredString(issues, input.systemPrompt, "systemPrompt", "System prompt", 4000);

	if (!AI_PROVIDER_SET.has(input.aiProvider)) {
		addIssue(issues, ["aiProvider"], "Choose a supported AI provider");
	} else {
		data.aiProvider = input.aiProvider;
	}

	data.model = requiredString(issues, input.model, "model", "Model", 120);
	data.temperature = numberInRange(issues, input.temperature, "temperature", "Temperature", 0, 2);
	data.maxTokens = numberInRange(issues, input.maxTokens, "maxTokens", "Max tokens", 1, 32768, {
		integer: true,
	});
	data.icon = requiredString(issues, input.icon, "icon", "Icon", 8);

	if (typeof input.color !== "string" || !COLOR_PATTERN.test(input.color)) {
		addIssue(issues, ["color"], "Color must be a hex value like #22c55e");
	} else {
		data.color = input.color;
	}

	if (typeof input.isEnabled !== "boolean") {
		addIssue(issues, ["isEnabled"], "Enabled must be true or false");
	} else {
		data.isEnabled = input.isEnabled;
	}

	data.riskAppetite = numberInRange(issues, input.riskAppetite, "riskAppetite", "Risk appetite", 0, 1);
	data.communicationStyle = numberInRange(
		issues,
		input.communicationStyle,
		"communicationStyle",
		"Communication style",
		0,
		1
	);
	data.creativity = numberInRange(issues, input.creativity, "creativity", "Creativity", 0, 1);
	data.flexibility = numberInRange(issues, input.flexibility, "flexibility", "Flexibility", 0, 1);
	data.coreValues = validateStringArray(issues, input.coreValues, "coreValues", {
		maxItems: 4,
		maxLength: 60,
		required: true,
	});

	if (!SPEAKING_STYLE_SET.has(input.speakingStyle)) {
		addIssue(issues, ["speakingStyle"], "Choose a supported speaking style");
	} else {
		data.speakingStyle = input.speakingStyle;
	}

	const expertise = input.expertise === undefined ? "General knowledge" : input.expertise;
	data.expertise = requiredString(issues, expertise, "expertise", "Expertise", 500);
	data.capabilities = validateStringArray(issues, input.capabilities, "capabilities", {
		maxItems: 10,
		maxLength: 100,
	});

	return issues.length ? validationFailure(issues) : validationSuccess(data);
}

export const agentInputSchema = {
	safeParse(input) {
		return validateAgent(input);
	},
	parse(input) {
		return parseWithSchema(this, input);
	},
};

export const agentSchema = {
	safeParse(input) {
		return validateAgent(input, { requireMetadata: true });
	},
	parse(input) {
		return parseWithSchema(this, input);
	},
};

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
