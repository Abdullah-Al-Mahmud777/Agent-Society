(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/agent-builder-schema.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AI_PROVIDERS",
    ()=>AI_PROVIDERS,
    "DEFAULT_AGENT_COLOR",
    ()=>DEFAULT_AGENT_COLOR,
    "DEFAULT_SYSTEM_PROMPT",
    ()=>DEFAULT_SYSTEM_PROMPT,
    "ICON_OPTIONS",
    ()=>ICON_OPTIONS,
    "PROVIDER_DEFAULT_MODELS",
    ()=>PROVIDER_DEFAULT_MODELS,
    "PROVIDER_LABELS",
    ()=>PROVIDER_LABELS,
    "agentInputSchema",
    ()=>agentInputSchema,
    "agentSchema",
    ()=>agentSchema,
    "createAgentDefaults",
    ()=>createAgentDefaults,
    "createAgentFromInput",
    ()=>createAgentFromInput,
    "createStarterAgents",
    ()=>createStarterAgents
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>");
;
const AI_PROVIDERS = [
    "openai",
    "gemini"
];
const PROVIDER_LABELS = {
    openai: "OpenAI",
    gemini: "Gemini"
};
const PROVIDER_DEFAULT_MODELS = {
    openai: "gpt-4o-mini",
    gemini: "gemini-1.5-flash"
};
const ICON_OPTIONS = [
    "🤖",
    "👑",
    "🧠",
    "🎯",
    "📈",
    "⚙️",
    "💬",
    "🚀",
    "🧪",
    "🛡️"
];
const DEFAULT_AGENT_COLOR = "#22c55e";
const DEFAULT_SYSTEM_PROMPT = "You are a reliable AI agent. Follow the assigned role, pursue the stated goal, and respond with clear, actionable output.";
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
            for(let i = 0; i < 16; i++){
                array[i] = Math.floor(Math.random() * 256);
            }
        }
        return 'agent-' + Array.from(array).map((b)=>b.toString(16).padStart(2, '0')).join('');
    } catch  {
        // Fallback for edge cases
        return 'agent-' + Math.random().toString(36).substr(2, 9);
    }
}
const agentInputSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1, "Name is required").max(80, "Name must be 80 characters or less"),
    description: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1, "Description is required").max(240, "Description must be 240 characters or less"),
    role: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1, "Role is required").max(80, "Role must be 80 characters or less"),
    goal: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1, "Goal is required").max(240, "Goal must be 240 characters or less"),
    systemPrompt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1, "System prompt is required").max(4000, "System prompt must be 4000 characters or less"),
    aiProvider: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum(AI_PROVIDERS),
    model: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1, "Model is required").max(120, "Model must be 120 characters or less"),
    temperature: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0, "Temperature must be at least 0").max(2, "Temperature must be 2 or lower"),
    maxTokens: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int("Max tokens must be a whole number").min(1, "Max tokens must be at least 1").max(32768, "Max tokens must be 32768 or lower"),
    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1, "Icon is required").max(8, "Icon must be 8 characters or less"),
    color: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(colorRegex, "Color must be a hex value like #22c55e"),
    isEnabled: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean()
});
const agentSchema = agentInputSchema.extend({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    createdAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    updatedAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1)
});
const starterTimestamp = "2026-07-03T00:00:00.000Z";
function buildSeedAgent(overrides) {
    return agentSchema.parse({
        id: overrides.id ?? createId(),
        createdAt: starterTimestamp,
        updatedAt: starterTimestamp,
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
        ...overrides
    });
}
function createAgentDefaults(overrides = {}) {
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
        ...overrides
    };
}
function createAgentFromInput(input) {
    const now = new Date().toISOString();
    return agentSchema.parse({
        id: createId(),
        createdAt: now,
        updatedAt: now,
        ...createAgentDefaults(),
        ...input
    });
}
function createStarterAgents() {
    return [
        buildSeedAgent({
            id: "starter-ceo",
            name: "CEO Orchestrator",
            description: "Coordinates the entire agent council and resolves tradeoffs.",
            role: "Orchestrator",
            goal: "Turn ideas into an executable plan.",
            systemPrompt: "You are the CEO Agent. Prioritize clarity, strategy, and decision-making across the agent council.",
            aiProvider: "openai",
            model: "gpt-4o-mini",
            temperature: 0.3,
            maxTokens: 1200,
            icon: "👑",
            color: "#22c55e",
            isEnabled: true
        }),
        buildSeedAgent({
            id: "starter-research",
            name: "Market Research Agent",
            description: "Studies demand, competitors, and customer pain points.",
            role: "Research",
            goal: "Find the strongest market wedge.",
            systemPrompt: "You are a market research specialist. Focus on demand, competitors, and market opportunity.",
            aiProvider: "gemini",
            model: "gemini-1.5-flash",
            temperature: 0.4,
            maxTokens: 1000,
            icon: "📈",
            color: "#0ea5e9",
            isEnabled: true
        }),
        buildSeedAgent({
            id: "starter-product",
            name: "Product Planner",
            description: "Shapes the smallest valuable product and roadmap.",
            role: "Product",
            goal: "Define a clear MVP and execution path.",
            systemPrompt: "You are a product manager specialist. Turn the business idea into a focused MVP.",
            aiProvider: "openai",
            model: "gpt-4o-mini",
            temperature: 0.5,
            maxTokens: 1100,
            icon: "🎯",
            color: "#f59e0b",
            isEnabled: true
        })
    ];
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/agent-builder/AgentEditor.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AgentEditor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$agent$2d$builder$2d$schema$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/agent-builder-schema.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function buildFormState(agent) {
    if (!agent) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$agent$2d$builder$2d$schema$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createAgentDefaults"])();
    }
    return {
        name: agent.name,
        description: agent.description,
        role: agent.role,
        goal: agent.goal,
        systemPrompt: agent.systemPrompt,
        aiProvider: agent.aiProvider,
        model: agent.model,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        icon: agent.icon,
        color: agent.color,
        isEnabled: agent.isEnabled
    };
}
function mapErrors(error) {
    const fieldErrors = error.flatten().fieldErrors;
    return Object.entries(fieldErrors).reduce((result, [field, messages])=>{
        if (messages && messages[0]) {
            result[field] = messages[0];
        }
        return result;
    }, {});
}
function FormField(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(14);
    if ($[0] !== "b05b18ea6a1be222a88a7b78cf5b2c3817f5012776313c2950e14fdef60f3d91") {
        for(let $i = 0; $i < 14; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "b05b18ea6a1be222a88a7b78cf5b2c3817f5012776313c2950e14fdef60f3d91";
    }
    const { label, error, children, hint } = t0;
    let t1;
    if ($[1] !== label) {
        t1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-sm font-medium text-white/80",
            children: label
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 50,
            columnNumber: 10
        }, this);
        $[1] = label;
        $[2] = t1;
    } else {
        t1 = $[2];
    }
    let t2;
    if ($[3] !== hint) {
        t2 = hint ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-xs text-white/45",
            children: hint
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 58,
            columnNumber: 17
        }, this) : null;
        $[3] = hint;
        $[4] = t2;
    } else {
        t2 = $[4];
    }
    let t3;
    if ($[5] !== t1 || $[6] !== t2) {
        t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-between gap-3",
            children: [
                t1,
                t2
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 66,
            columnNumber: 10
        }, this);
        $[5] = t1;
        $[6] = t2;
        $[7] = t3;
    } else {
        t3 = $[7];
    }
    let t4;
    if ($[8] !== error) {
        t4 = error ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "text-sm text-rose-300",
            children: error
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 75,
            columnNumber: 18
        }, this) : null;
        $[8] = error;
        $[9] = t4;
    } else {
        t4 = $[9];
    }
    let t5;
    if ($[10] !== children || $[11] !== t3 || $[12] !== t4) {
        t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block space-y-2",
            children: [
                t3,
                children,
                t4
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 83,
            columnNumber: 10
        }, this);
        $[10] = children;
        $[11] = t3;
        $[12] = t4;
        $[13] = t5;
    } else {
        t5 = $[13];
    }
    return t5;
}
_c = FormField;
function IconPicker(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(6);
    if ($[0] !== "b05b18ea6a1be222a88a7b78cf5b2c3817f5012776313c2950e14fdef60f3d91") {
        for(let $i = 0; $i < 6; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "b05b18ea6a1be222a88a7b78cf5b2c3817f5012776313c2950e14fdef60f3d91";
    }
    const { value, onChange } = t0;
    let t1;
    if ($[1] !== onChange || $[2] !== value) {
        t1 = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$agent$2d$builder$2d$schema$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ICON_OPTIONS"].map({
            "IconPicker[ICON_OPTIONS.map()]": (icon)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    onClick: {
                        "IconPicker[ICON_OPTIONS.map() > <button>.onClick]": ()=>onChange(icon)
                    }["IconPicker[ICON_OPTIONS.map() > <button>.onClick]"],
                    className: `rounded-2xl border px-3 py-2 text-lg transition ${value === icon ? "border-cyan-300/60 bg-cyan-300/10" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"}`,
                    children: icon
                }, icon, false, {
                    fileName: "[project]/src/components/agent-builder/AgentEditor.js",
                    lineNumber: 108,
                    columnNumber: 49
                }, this)
        }["IconPicker[ICON_OPTIONS.map()]"]);
        $[1] = onChange;
        $[2] = value;
        $[3] = t1;
    } else {
        t1 = $[3];
    }
    let t2;
    if ($[4] !== t1) {
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-wrap gap-2",
            children: t1
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 120,
            columnNumber: 10
        }, this);
        $[4] = t1;
        $[5] = t2;
    } else {
        t2 = $[5];
    }
    return t2;
}
_c1 = IconPicker;
function AgentEditor(t0) {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(159);
    if ($[0] !== "b05b18ea6a1be222a88a7b78cf5b2c3817f5012776313c2950e14fdef60f3d91") {
        for(let $i = 0; $i < 159; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "b05b18ea6a1be222a88a7b78cf5b2c3817f5012776313c2950e14fdef60f3d91";
    }
    const { agent, onCreate, onUpdate, onNew, onDuplicate, onDelete, onToggleEnabled } = t0;
    let t1;
    if ($[1] !== agent) {
        t1 = ({
            "AgentEditor[useState()]": ()=>buildFormState(agent)
        })["AgentEditor[useState()]"];
        $[1] = agent;
        $[2] = t1;
    } else {
        t1 = $[2];
    }
    const [form, setForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(t1);
    let t2;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = {};
        $[3] = t2;
    } else {
        t2 = $[3];
    }
    const [errors, setErrors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(t2);
    const isEditing = Boolean(agent);
    const providerHint = `Suggested default: ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$agent$2d$builder$2d$schema$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PROVIDER_DEFAULT_MODELS"][form.aiProvider]}`;
    let t3;
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = ({
            "AgentEditor[updateField]": (field, value)=>{
                setForm({
                    "AgentEditor[updateField > setForm()]": (current)=>({
                            ...current,
                            [field]: value
                        })
                }["AgentEditor[updateField > setForm()]"]);
            }
        })["AgentEditor[updateField]"];
        $[4] = t3;
    } else {
        t3 = $[4];
    }
    const updateField = t3;
    let t4;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = ({
            "AgentEditor[handleProviderChange]": (nextProvider)=>{
                setForm({
                    "AgentEditor[handleProviderChange > setForm()]": (current_0)=>({
                            ...current_0,
                            aiProvider: nextProvider,
                            model: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$agent$2d$builder$2d$schema$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PROVIDER_DEFAULT_MODELS"][nextProvider]
                        })
                }["AgentEditor[handleProviderChange > setForm()]"]);
            }
        })["AgentEditor[handleProviderChange]"];
        $[5] = t4;
    } else {
        t4 = $[5];
    }
    const handleProviderChange = t4;
    let t5;
    if ($[6] !== agent || $[7] !== form || $[8] !== isEditing || $[9] !== onCreate || $[10] !== onUpdate) {
        t5 = ({
            "AgentEditor[handleSave]": (event)=>{
                event.preventDefault();
                const validation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$agent$2d$builder$2d$schema$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["agentInputSchema"].safeParse(form);
                if (!validation.success) {
                    setErrors(mapErrors(validation.error));
                    return;
                }
                setErrors({});
                if (isEditing) {
                    onUpdate({
                        ...validation.data,
                        id: agent.id,
                        createdAt: agent.createdAt,
                        updatedAt: new Date().toISOString()
                    });
                    return;
                }
                onCreate(validation.data);
            }
        })["AgentEditor[handleSave]"];
        $[6] = agent;
        $[7] = form;
        $[8] = isEditing;
        $[9] = onCreate;
        $[10] = onUpdate;
        $[11] = t5;
    } else {
        t5 = $[11];
    }
    const handleSave = t5;
    let t6;
    if ($[12] !== agent) {
        t6 = ({
            "AgentEditor[handleReset]": ()=>{
                setForm(buildFormState(agent));
                setErrors({});
            }
        })["AgentEditor[handleReset]"];
        $[12] = agent;
        $[13] = t6;
    } else {
        t6 = $[13];
    }
    const handleReset = t6;
    let t7;
    if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
        t7 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/70",
            children: "Agent editor"
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 250,
            columnNumber: 10
        }, this);
        $[14] = t7;
    } else {
        t7 = $[14];
    }
    const t8 = isEditing ? "Edit agent" : "Create a new agent";
    let t9;
    if ($[15] !== t8) {
        t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
            className: "mt-2 text-xl font-semibold text-white",
            children: t8
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 258,
            columnNumber: 10
        }, this);
        $[15] = t8;
        $[16] = t9;
    } else {
        t9 = $[16];
    }
    let t10;
    if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
        t10 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "mt-2 text-sm leading-6 text-white/65",
            children: "Validate and save every field locally. Nothing leaves the browser unless you wire it to an API later."
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 266,
            columnNumber: 11
        }, this);
        $[17] = t10;
    } else {
        t10 = $[17];
    }
    let t11;
    if ($[18] !== t9) {
        t11 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t7,
                t9,
                t10
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 273,
            columnNumber: 11
        }, this);
        $[18] = t9;
        $[19] = t11;
    } else {
        t11 = $[19];
    }
    let t12;
    if ($[20] !== onNew) {
        t12 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            type: "button",
            onClick: onNew,
            className: "rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/5",
            children: "New agent"
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 281,
            columnNumber: 11
        }, this);
        $[20] = onNew;
        $[21] = t12;
    } else {
        t12 = $[21];
    }
    let t13;
    if ($[22] !== agent || $[23] !== onDelete || $[24] !== onDuplicate || $[25] !== onToggleEnabled) {
        t13 = agent ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    onClick: {
                        "AgentEditor[<button>.onClick]": ()=>onToggleEnabled(agent.id)
                    }["AgentEditor[<button>.onClick]"],
                    className: "rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/5",
                    children: agent.isEnabled ? "Disable" : "Enable"
                }, void 0, false, {
                    fileName: "[project]/src/components/agent-builder/AgentEditor.js",
                    lineNumber: 289,
                    columnNumber: 21
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    onClick: {
                        "AgentEditor[<button>.onClick]": ()=>onDuplicate(agent.id)
                    }["AgentEditor[<button>.onClick]"],
                    className: "rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/5",
                    children: "Duplicate"
                }, void 0, false, {
                    fileName: "[project]/src/components/agent-builder/AgentEditor.js",
                    lineNumber: 291,
                    columnNumber: 234
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    onClick: {
                        "AgentEditor[<button>.onClick]": ()=>onDelete(agent.id)
                    }["AgentEditor[<button>.onClick]"],
                    className: "rounded-full border border-rose-400/30 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-400/10",
                    children: "Delete"
                }, void 0, false, {
                    fileName: "[project]/src/components/agent-builder/AgentEditor.js",
                    lineNumber: 293,
                    columnNumber: 203
                }, this)
            ]
        }, void 0, true) : null;
        $[22] = agent;
        $[23] = onDelete;
        $[24] = onDuplicate;
        $[25] = onToggleEnabled;
        $[26] = t13;
    } else {
        t13 = $[26];
    }
    let t14;
    if ($[27] !== t12 || $[28] !== t13) {
        t14 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-wrap gap-2",
            children: [
                t12,
                t13
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 306,
            columnNumber: 11
        }, this);
        $[27] = t12;
        $[28] = t13;
        $[29] = t14;
    } else {
        t14 = $[29];
    }
    let t15;
    if ($[30] !== t11 || $[31] !== t14) {
        t15 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between",
            children: [
                t11,
                t14
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 315,
            columnNumber: 11
        }, this);
        $[30] = t11;
        $[31] = t14;
        $[32] = t15;
    } else {
        t15 = $[32];
    }
    let t16;
    if ($[33] !== errors) {
        t16 = Object.keys(errors).length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "rounded-3xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100",
            children: "Please fix the highlighted fields before saving."
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 324,
            columnNumber: 40
        }, this) : null;
        $[33] = errors;
        $[34] = t16;
    } else {
        t16 = $[34];
    }
    let t17;
    if ($[35] === Symbol.for("react.memo_cache_sentinel")) {
        t17 = ({
            "AgentEditor[<input>.onChange]": (event_0)=>updateField("name", event_0.target.value)
        })["AgentEditor[<input>.onChange]"];
        $[35] = t17;
    } else {
        t17 = $[35];
    }
    let t18;
    if ($[36] !== form.name) {
        t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
            type: "text",
            value: form.name,
            onChange: t17,
            className: "w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20",
            placeholder: "Agent name"
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 341,
            columnNumber: 11
        }, this);
        $[36] = form.name;
        $[37] = t18;
    } else {
        t18 = $[37];
    }
    let t19;
    if ($[38] !== errors.name || $[39] !== t18) {
        t19 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FormField, {
            label: "Name",
            error: errors.name,
            children: t18
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 349,
            columnNumber: 11
        }, this);
        $[38] = errors.name;
        $[39] = t18;
        $[40] = t19;
    } else {
        t19 = $[40];
    }
    let t20;
    if ($[41] === Symbol.for("react.memo_cache_sentinel")) {
        t20 = ({
            "AgentEditor[<input>.onChange]": (event_1)=>updateField("role", event_1.target.value)
        })["AgentEditor[<input>.onChange]"];
        $[41] = t20;
    } else {
        t20 = $[41];
    }
    let t21;
    if ($[42] !== form.role) {
        t21 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
            type: "text",
            value: form.role,
            onChange: t20,
            className: "w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20",
            placeholder: "e.g. Product strategist"
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 367,
            columnNumber: 11
        }, this);
        $[42] = form.role;
        $[43] = t21;
    } else {
        t21 = $[43];
    }
    let t22;
    if ($[44] !== errors.role || $[45] !== t21) {
        t22 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FormField, {
            label: "Role",
            error: errors.role,
            children: t21
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 375,
            columnNumber: 11
        }, this);
        $[44] = errors.role;
        $[45] = t21;
        $[46] = t22;
    } else {
        t22 = $[46];
    }
    let t23;
    if ($[47] !== t19 || $[48] !== t22) {
        t23 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "grid gap-4 lg:grid-cols-2",
            children: [
                t19,
                t22
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 384,
            columnNumber: 11
        }, this);
        $[47] = t19;
        $[48] = t22;
        $[49] = t23;
    } else {
        t23 = $[49];
    }
    let t24;
    if ($[50] === Symbol.for("react.memo_cache_sentinel")) {
        t24 = ({
            "AgentEditor[<textarea>.onChange]": (event_2)=>updateField("description", event_2.target.value)
        })["AgentEditor[<textarea>.onChange]"];
        $[50] = t24;
    } else {
        t24 = $[50];
    }
    let t25;
    if ($[51] !== form.description) {
        t25 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
            rows: 3,
            value: form.description,
            onChange: t24,
            className: "w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20",
            placeholder: "What does this agent do?"
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 402,
            columnNumber: 11
        }, this);
        $[51] = form.description;
        $[52] = t25;
    } else {
        t25 = $[52];
    }
    let t26;
    if ($[53] !== errors.description || $[54] !== t25) {
        t26 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FormField, {
            label: "Description",
            error: errors.description,
            children: t25
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 410,
            columnNumber: 11
        }, this);
        $[53] = errors.description;
        $[54] = t25;
        $[55] = t26;
    } else {
        t26 = $[55];
    }
    let t27;
    if ($[56] === Symbol.for("react.memo_cache_sentinel")) {
        t27 = ({
            "AgentEditor[<textarea>.onChange]": (event_3)=>updateField("goal", event_3.target.value)
        })["AgentEditor[<textarea>.onChange]"];
        $[56] = t27;
    } else {
        t27 = $[56];
    }
    let t28;
    if ($[57] !== form.goal) {
        t28 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
            rows: 3,
            value: form.goal,
            onChange: t27,
            className: "w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20",
            placeholder: "What outcome should it deliver?"
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 428,
            columnNumber: 11
        }, this);
        $[57] = form.goal;
        $[58] = t28;
    } else {
        t28 = $[58];
    }
    let t29;
    if ($[59] !== errors.goal || $[60] !== t28) {
        t29 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FormField, {
            label: "Goal",
            error: errors.goal,
            children: t28
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 436,
            columnNumber: 11
        }, this);
        $[59] = errors.goal;
        $[60] = t28;
        $[61] = t29;
    } else {
        t29 = $[61];
    }
    let t30;
    if ($[62] === Symbol.for("react.memo_cache_sentinel")) {
        t30 = ({
            "AgentEditor[<textarea>.onChange]": (event_4)=>updateField("systemPrompt", event_4.target.value)
        })["AgentEditor[<textarea>.onChange]"];
        $[62] = t30;
    } else {
        t30 = $[62];
    }
    let t31;
    if ($[63] !== form.systemPrompt) {
        t31 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
            rows: 6,
            value: form.systemPrompt,
            onChange: t30,
            className: "w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20",
            placeholder: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$agent$2d$builder$2d$schema$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_SYSTEM_PROMPT"]
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 454,
            columnNumber: 11
        }, this);
        $[63] = form.systemPrompt;
        $[64] = t31;
    } else {
        t31 = $[64];
    }
    let t32;
    if ($[65] !== errors.systemPrompt || $[66] !== t31) {
        t32 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FormField, {
            label: "System prompt",
            error: errors.systemPrompt,
            hint: "This is the exact instruction sent to the model",
            children: t31
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 462,
            columnNumber: 11
        }, this);
        $[65] = errors.systemPrompt;
        $[66] = t31;
        $[67] = t32;
    } else {
        t32 = $[67];
    }
    const t33 = errors.aiProvider;
    const t34 = form.aiProvider;
    let t35;
    if ($[68] === Symbol.for("react.memo_cache_sentinel")) {
        t35 = ({
            "AgentEditor[<select>.onChange]": (event_5)=>handleProviderChange(event_5.target.value)
        })["AgentEditor[<select>.onChange]"];
        $[68] = t35;
    } else {
        t35 = $[68];
    }
    let t36;
    if ($[69] === Symbol.for("react.memo_cache_sentinel")) {
        t36 = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$agent$2d$builder$2d$schema$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AI_PROVIDERS"].map(_AgentEditorAI_PROVIDERSMap);
        $[69] = t36;
    } else {
        t36 = $[69];
    }
    let t37;
    if ($[70] !== form.aiProvider) {
        t37 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
            value: t34,
            onChange: t35,
            className: "w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20",
            children: t36
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 489,
            columnNumber: 11
        }, this);
        $[70] = form.aiProvider;
        $[71] = t37;
    } else {
        t37 = $[71];
    }
    let t38;
    if ($[72] !== errors.aiProvider || $[73] !== t37) {
        t38 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FormField, {
            label: "AI provider",
            error: t33,
            children: t37
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 497,
            columnNumber: 11
        }, this);
        $[72] = errors.aiProvider;
        $[73] = t37;
        $[74] = t38;
    } else {
        t38 = $[74];
    }
    let t39;
    if ($[75] === Symbol.for("react.memo_cache_sentinel")) {
        t39 = ({
            "AgentEditor[<input>.onChange]": (event_6)=>updateField("model", event_6.target.value)
        })["AgentEditor[<input>.onChange]"];
        $[75] = t39;
    } else {
        t39 = $[75];
    }
    const t40 = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$agent$2d$builder$2d$schema$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PROVIDER_DEFAULT_MODELS"][form.aiProvider];
    let t41;
    if ($[76] !== form.model || $[77] !== t40) {
        t41 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
            type: "text",
            value: form.model,
            onChange: t39,
            className: "w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20",
            placeholder: t40
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 516,
            columnNumber: 11
        }, this);
        $[76] = form.model;
        $[77] = t40;
        $[78] = t41;
    } else {
        t41 = $[78];
    }
    let t42;
    if ($[79] !== errors.model || $[80] !== providerHint || $[81] !== t41) {
        t42 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FormField, {
            label: "Model",
            error: errors.model,
            hint: providerHint,
            children: t41
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 525,
            columnNumber: 11
        }, this);
        $[79] = errors.model;
        $[80] = providerHint;
        $[81] = t41;
        $[82] = t42;
    } else {
        t42 = $[82];
    }
    let t43;
    if ($[83] !== t38 || $[84] !== t42) {
        t43 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "grid gap-4 lg:grid-cols-2",
            children: [
                t38,
                t42
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 535,
            columnNumber: 11
        }, this);
        $[83] = t38;
        $[84] = t42;
        $[85] = t43;
    } else {
        t43 = $[85];
    }
    let t44;
    if ($[86] !== form.temperature) {
        t44 = form.temperature.toFixed(1);
        $[86] = form.temperature;
        $[87] = t44;
    } else {
        t44 = $[87];
    }
    const t45 = `Temperature: ${t44}`;
    let t46;
    if ($[88] === Symbol.for("react.memo_cache_sentinel")) {
        t46 = ({
            "AgentEditor[<input>.onChange]": (event_7)=>updateField("temperature", Number(event_7.target.value))
        })["AgentEditor[<input>.onChange]"];
        $[88] = t46;
    } else {
        t46 = $[88];
    }
    let t47;
    if ($[89] !== form.temperature) {
        t47 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
            type: "range",
            min: "0",
            max: "2",
            step: "0.1",
            value: form.temperature,
            onChange: t46,
            className: "w-full accent-cyan-300"
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 562,
            columnNumber: 11
        }, this);
        $[89] = form.temperature;
        $[90] = t47;
    } else {
        t47 = $[90];
    }
    let t48;
    if ($[91] !== errors.temperature || $[92] !== t45 || $[93] !== t47) {
        t48 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FormField, {
            label: t45,
            error: errors.temperature,
            children: t47
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 570,
            columnNumber: 11
        }, this);
        $[91] = errors.temperature;
        $[92] = t45;
        $[93] = t47;
        $[94] = t48;
    } else {
        t48 = $[94];
    }
    let t49;
    if ($[95] === Symbol.for("react.memo_cache_sentinel")) {
        t49 = ({
            "AgentEditor[<input>.onChange]": (event_8)=>updateField("maxTokens", Number(event_8.target.value))
        })["AgentEditor[<input>.onChange]"];
        $[95] = t49;
    } else {
        t49 = $[95];
    }
    let t50;
    if ($[96] !== form.maxTokens) {
        t50 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
            type: "number",
            min: "1",
            max: "32768",
            step: "1",
            value: form.maxTokens,
            onChange: t49,
            className: "w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 589,
            columnNumber: 11
        }, this);
        $[96] = form.maxTokens;
        $[97] = t50;
    } else {
        t50 = $[97];
    }
    let t51;
    if ($[98] !== errors.maxTokens || $[99] !== t50) {
        t51 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FormField, {
            label: "Max tokens",
            error: errors.maxTokens,
            children: t50
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 597,
            columnNumber: 11
        }, this);
        $[98] = errors.maxTokens;
        $[99] = t50;
        $[100] = t51;
    } else {
        t51 = $[100];
    }
    let t52;
    if ($[101] !== t48 || $[102] !== t51) {
        t52 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "grid gap-4 lg:grid-cols-2",
            children: [
                t48,
                t51
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 606,
            columnNumber: 11
        }, this);
        $[101] = t48;
        $[102] = t51;
        $[103] = t52;
    } else {
        t52 = $[103];
    }
    let t53;
    if ($[104] === Symbol.for("react.memo_cache_sentinel")) {
        t53 = ({
            "AgentEditor[<input>.onChange]": (event_9)=>updateField("icon", event_9.target.value)
        })["AgentEditor[<input>.onChange]"];
        $[104] = t53;
    } else {
        t53 = $[104];
    }
    let t54;
    if ($[105] !== form.icon) {
        t54 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
            type: "text",
            value: form.icon,
            onChange: t53,
            className: "w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20",
            placeholder: "\uD83E\uDD16"
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 624,
            columnNumber: 11
        }, this);
        $[105] = form.icon;
        $[106] = t54;
    } else {
        t54 = $[106];
    }
    let t55;
    if ($[107] === Symbol.for("react.memo_cache_sentinel")) {
        t55 = ({
            "AgentEditor[<IconPicker>.onChange]": (icon)=>updateField("icon", icon)
        })["AgentEditor[<IconPicker>.onChange]"];
        $[107] = t55;
    } else {
        t55 = $[107];
    }
    let t56;
    if ($[108] !== form.icon) {
        t56 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(IconPicker, {
            value: form.icon,
            onChange: t55
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 641,
            columnNumber: 11
        }, this);
        $[108] = form.icon;
        $[109] = t56;
    } else {
        t56 = $[109];
    }
    let t57;
    if ($[110] !== t54 || $[111] !== t56) {
        t57 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-3",
            children: [
                t54,
                t56
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 649,
            columnNumber: 11
        }, this);
        $[110] = t54;
        $[111] = t56;
        $[112] = t57;
    } else {
        t57 = $[112];
    }
    let t58;
    if ($[113] !== errors.icon || $[114] !== t57) {
        t58 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FormField, {
            label: "Icon",
            error: errors.icon,
            children: t57
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 658,
            columnNumber: 11
        }, this);
        $[113] = errors.icon;
        $[114] = t57;
        $[115] = t58;
    } else {
        t58 = $[115];
    }
    let t59;
    if ($[116] === Symbol.for("react.memo_cache_sentinel")) {
        t59 = ({
            "AgentEditor[<input>.onChange]": (event_10)=>updateField("color", event_10.target.value)
        })["AgentEditor[<input>.onChange]"];
        $[116] = t59;
    } else {
        t59 = $[116];
    }
    let t60;
    if ($[117] !== form.color) {
        t60 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
            type: "color",
            value: form.color,
            onChange: t59,
            className: "h-12 w-14 cursor-pointer rounded-2xl border border-white/10 bg-transparent p-1"
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 676,
            columnNumber: 11
        }, this);
        $[117] = form.color;
        $[118] = t60;
    } else {
        t60 = $[118];
    }
    let t61;
    if ($[119] === Symbol.for("react.memo_cache_sentinel")) {
        t61 = ({
            "AgentEditor[<input>.onChange]": (event_11)=>updateField("color", event_11.target.value)
        })["AgentEditor[<input>.onChange]"];
        $[119] = t61;
    } else {
        t61 = $[119];
    }
    let t62;
    if ($[120] !== form.color) {
        t62 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
            type: "text",
            value: form.color,
            onChange: t61,
            className: "flex-1 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20",
            placeholder: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$agent$2d$builder$2d$schema$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_AGENT_COLOR"]
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 693,
            columnNumber: 11
        }, this);
        $[120] = form.color;
        $[121] = t62;
    } else {
        t62 = $[121];
    }
    let t63;
    if ($[122] !== t60 || $[123] !== t62) {
        t63 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-3",
            children: [
                t60,
                t62
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 701,
            columnNumber: 11
        }, this);
        $[122] = t60;
        $[123] = t62;
        $[124] = t63;
    } else {
        t63 = $[124];
    }
    let t64;
    if ($[125] !== errors.color || $[126] !== t63) {
        t64 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FormField, {
            label: "Color",
            error: errors.color,
            children: t63
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 710,
            columnNumber: 11
        }, this);
        $[125] = errors.color;
        $[126] = t63;
        $[127] = t64;
    } else {
        t64 = $[127];
    }
    let t65;
    if ($[128] !== t58 || $[129] !== t64) {
        t65 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "grid gap-4 lg:grid-cols-2",
            children: [
                t58,
                t64
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 719,
            columnNumber: 11
        }, this);
        $[128] = t58;
        $[129] = t64;
        $[130] = t65;
    } else {
        t65 = $[130];
    }
    let t66;
    if ($[131] === Symbol.for("react.memo_cache_sentinel")) {
        t66 = ({
            "AgentEditor[<input>.onChange]": (event_12)=>updateField("isEnabled", event_12.target.checked)
        })["AgentEditor[<input>.onChange]"];
        $[131] = t66;
    } else {
        t66 = $[131];
    }
    let t67;
    if ($[132] !== form.isEnabled) {
        t67 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
            type: "checkbox",
            checked: form.isEnabled,
            onChange: t66,
            className: "h-4 w-4 rounded border-white/20 bg-slate-950 text-cyan-400 focus:ring-cyan-300"
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 737,
            columnNumber: 11
        }, this);
        $[132] = form.isEnabled;
        $[133] = t67;
    } else {
        t67 = $[133];
    }
    let t68;
    if ($[134] === Symbol.for("react.memo_cache_sentinel")) {
        t68 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            children: "Enabled for routing"
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 745,
            columnNumber: 11
        }, this);
        $[134] = t68;
    } else {
        t68 = $[134];
    }
    let t69;
    if ($[135] !== t67) {
        t69 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white/80",
            children: [
                t67,
                t68
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 752,
            columnNumber: 11
        }, this);
        $[135] = t67;
        $[136] = t69;
    } else {
        t69 = $[136];
    }
    const t70 = isEditing ? "Save agent" : "Create agent";
    let t71;
    if ($[137] !== t70) {
        t71 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            type: "submit",
            className: "rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200",
            children: t70
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 761,
            columnNumber: 11
        }, this);
        $[137] = t70;
        $[138] = t71;
    } else {
        t71 = $[138];
    }
    let t72;
    if ($[139] !== handleReset) {
        t72 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            type: "button",
            onClick: handleReset,
            className: "rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/5",
            children: "Reset form"
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 769,
            columnNumber: 11
        }, this);
        $[139] = handleReset;
        $[140] = t72;
    } else {
        t72 = $[140];
    }
    let t73;
    if ($[141] !== t71 || $[142] !== t72) {
        t73 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-wrap gap-3 border-t border-white/10 pt-5",
            children: [
                t71,
                t72
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 777,
            columnNumber: 11
        }, this);
        $[141] = t71;
        $[142] = t72;
        $[143] = t73;
    } else {
        t73 = $[143];
    }
    let t74;
    if ($[144] !== handleSave || $[145] !== t16 || $[146] !== t23 || $[147] !== t26 || $[148] !== t29 || $[149] !== t32 || $[150] !== t43 || $[151] !== t52 || $[152] !== t65 || $[153] !== t69 || $[154] !== t73) {
        t74 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
            className: "mt-6 space-y-6",
            onSubmit: handleSave,
            children: [
                t16,
                t23,
                t26,
                t29,
                t32,
                t43,
                t52,
                t65,
                t69,
                t73
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 786,
            columnNumber: 11
        }, this);
        $[144] = handleSave;
        $[145] = t16;
        $[146] = t23;
        $[147] = t26;
        $[148] = t29;
        $[149] = t32;
        $[150] = t43;
        $[151] = t52;
        $[152] = t65;
        $[153] = t69;
        $[154] = t73;
        $[155] = t74;
    } else {
        t74 = $[155];
    }
    let t75;
    if ($[156] !== t15 || $[157] !== t74) {
        t75 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            className: "rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl",
            children: [
                t15,
                t74
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentEditor.js",
            lineNumber: 804,
            columnNumber: 11
        }, this);
        $[156] = t15;
        $[157] = t74;
        $[158] = t75;
    } else {
        t75 = $[158];
    }
    return t75;
}
_s(AgentEditor, "T1iIzqviMNLqvm2XQDkuXK+X8o8=");
_c2 = AgentEditor;
function _AgentEditorAI_PROVIDERSMap(provider) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
        value: provider,
        children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$agent$2d$builder$2d$schema$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PROVIDER_LABELS"][provider]
    }, provider, false, {
        fileName: "[project]/src/components/agent-builder/AgentEditor.js",
        lineNumber: 814,
        columnNumber: 10
    }, this);
}
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "FormField");
__turbopack_context__.k.register(_c1, "IconPicker");
__turbopack_context__.k.register(_c2, "AgentEditor");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/agent-builder/AgentList.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AgentList
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
;
;
function AgentList(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(32);
    if ($[0] !== "a609ab54b9999f5e09b264669d7019e85d497eb59ffc8de83c3f3dbe2863cb17") {
        for(let $i = 0; $i < 32; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "a609ab54b9999f5e09b264669d7019e85d497eb59ffc8de83c3f3dbe2863cb17";
    }
    const { agents, selectedAgentId, searchTerm, onSearchTermChange, onSelect, onDuplicate, onDelete, onToggleEnabled } = t0;
    let t1;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70",
                    children: "Agent library"
                }, void 0, false, {
                    fileName: "[project]/src/components/agent-builder/AgentList.js",
                    lineNumber: 22,
                    columnNumber: 15
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "mt-2 text-xl font-semibold text-white",
                    children: "All agents"
                }, void 0, false, {
                    fileName: "[project]/src/components/agent-builder/AgentList.js",
                    lineNumber: 22,
                    columnNumber: 114
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "mt-2 text-sm leading-6 text-white/65",
                    children: "Create, duplicate, disable, and remove agents without leaving the browser."
                }, void 0, false, {
                    fileName: "[project]/src/components/agent-builder/AgentList.js",
                    lineNumber: 22,
                    columnNumber: 183
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentList.js",
            lineNumber: 22,
            columnNumber: 10
        }, this);
        $[1] = t1;
    } else {
        t1 = $[1];
    }
    let t2;
    if ($[2] !== agents.length) {
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-start justify-between gap-4",
            children: [
                t1,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/60",
                    children: [
                        agents.length,
                        " total"
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/agent-builder/AgentList.js",
                    lineNumber: 29,
                    columnNumber: 70
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentList.js",
            lineNumber: 29,
            columnNumber: 10
        }, this);
        $[2] = agents.length;
        $[3] = t2;
    } else {
        t2 = $[3];
    }
    let t3;
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-white/45",
            htmlFor: "agent-search",
            children: "Search"
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentList.js",
            lineNumber: 37,
            columnNumber: 10
        }, this);
        $[4] = t3;
    } else {
        t3 = $[4];
    }
    let t4;
    if ($[5] !== onSearchTermChange) {
        t4 = ({
            "AgentList[<input>.onChange]": (event)=>onSearchTermChange(event.target.value)
        })["AgentList[<input>.onChange]"];
        $[5] = onSearchTermChange;
        $[6] = t4;
    } else {
        t4 = $[6];
    }
    let t5;
    if ($[7] !== searchTerm || $[8] !== t4) {
        t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mt-5",
            children: [
                t3,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    id: "agent-search",
                    value: searchTerm,
                    onChange: t4,
                    placeholder: "Name, role, or goal",
                    className: "w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
                }, void 0, false, {
                    fileName: "[project]/src/components/agent-builder/AgentList.js",
                    lineNumber: 54,
                    columnNumber: 36
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentList.js",
            lineNumber: 54,
            columnNumber: 10
        }, this);
        $[7] = searchTerm;
        $[8] = t4;
        $[9] = t5;
    } else {
        t5 = $[9];
    }
    let t6;
    if ($[10] !== agents.length) {
        t6 = agents.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "rounded-2xl border border-dashed border-white/15 bg-black/15 p-6 text-sm text-white/65",
            children: "No agents yet. Create your first one from the editor."
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentList.js",
            lineNumber: 63,
            columnNumber: 32
        }, this) : null;
        $[10] = agents.length;
        $[11] = t6;
    } else {
        t6 = $[11];
    }
    let t7;
    if ($[12] !== agents || $[13] !== onDelete || $[14] !== onDuplicate || $[15] !== onSelect || $[16] !== onToggleEnabled || $[17] !== selectedAgentId) {
        let t8;
        if ($[19] !== onDelete || $[20] !== onDuplicate || $[21] !== onSelect || $[22] !== onToggleEnabled || $[23] !== selectedAgentId) {
            t8 = ({
                "AgentList[agents.map()]": (agent)=>{
                    const isSelected = agent.id === selectedAgentId;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: `rounded-3xl border p-4 transition ${isSelected ? "border-cyan-300/50 bg-cyan-300/10 shadow-[0_0_0_1px_rgba(103,232,249,0.25)]" : "border-white/10 bg-black/15 hover:border-white/20 hover:bg-white/5"}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: {
                                    "AgentList[agents.map() > <button>.onClick]": ()=>onSelect(agent.id)
                                }["AgentList[agents.map() > <button>.onClick]"],
                                className: "w-full text-left",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-start gap-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-xl",
                                            style: {
                                                backgroundColor: `${agent.color}22`,
                                                color: agent.color
                                            },
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: agent.icon
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/agent-builder/AgentList.js",
                                                lineNumber: 81,
                                                columnNumber: 20
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/agent-builder/AgentList.js",
                                            lineNumber: 78,
                                            columnNumber: 131
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "min-w-0 flex-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex flex-wrap items-center gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                            className: "truncate text-base font-semibold text-white",
                                                            children: agent.name
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/agent-builder/AgentList.js",
                                                            lineNumber: 81,
                                                            columnNumber: 134
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white/55",
                                                            children: agent.isEnabled ? "Enabled" : "Disabled"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/agent-builder/AgentList.js",
                                                            lineNumber: 81,
                                                            columnNumber: 211
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/agent-builder/AgentList.js",
                                                    lineNumber: 81,
                                                    columnNumber: 83
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "mt-1 text-sm font-medium text-white/75",
                                                    children: agent.role
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/agent-builder/AgentList.js",
                                                    lineNumber: 81,
                                                    columnNumber: 385
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "mt-2 line-clamp-2 text-sm leading-6 text-white/60",
                                                    children: agent.description
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/agent-builder/AgentList.js",
                                                    lineNumber: 81,
                                                    columnNumber: 455
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/agent-builder/AgentList.js",
                                            lineNumber: 81,
                                            columnNumber: 51
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/agent-builder/AgentList.js",
                                    lineNumber: 78,
                                    columnNumber: 91
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/agent-builder/AgentList.js",
                                lineNumber: 76,
                                columnNumber: 255
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-4 flex flex-wrap items-center gap-2 text-xs",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/60",
                                        children: agent.aiProvider
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/agent-builder/AgentList.js",
                                        lineNumber: 81,
                                        columnNumber: 628
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/60",
                                        children: agent.model
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/agent-builder/AgentList.js",
                                        lineNumber: 81,
                                        columnNumber: 744
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/60",
                                        children: [
                                            agent.temperature.toFixed(1),
                                            " temp"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/agent-builder/AgentList.js",
                                        lineNumber: 81,
                                        columnNumber: 855
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/agent-builder/AgentList.js",
                                lineNumber: 81,
                                columnNumber: 564
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-4 flex flex-wrap gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: {
                                            "AgentList[agents.map() > <button>.onClick]": ()=>onToggleEnabled(agent.id)
                                        }["AgentList[agents.map() > <button>.onClick]"],
                                        className: "rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-white/75 transition hover:border-white/20 hover:bg-white/5",
                                        children: agent.isEnabled ? "Disable" : "Enable"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/agent-builder/AgentList.js",
                                        lineNumber: 81,
                                        columnNumber: 1037
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: {
                                            "AgentList[agents.map() > <button>.onClick]": ()=>onDuplicate(agent.id)
                                        }["AgentList[agents.map() > <button>.onClick]"],
                                        className: "rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-white/75 transition hover:border-white/20 hover:bg-white/5",
                                        children: "Duplicate"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/agent-builder/AgentList.js",
                                        lineNumber: 83,
                                        columnNumber: 255
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: {
                                            "AgentList[agents.map() > <button>.onClick]": ()=>onDelete(agent.id)
                                        }["AgentList[agents.map() > <button>.onClick]"],
                                        className: "rounded-full border border-rose-400/30 px-3 py-2 text-xs font-medium text-rose-200 transition hover:bg-rose-400/10",
                                        children: "Delete"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/agent-builder/AgentList.js",
                                        lineNumber: 85,
                                        columnNumber: 224
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/agent-builder/AgentList.js",
                                lineNumber: 81,
                                columnNumber: 994
                            }, this)
                        ]
                    }, agent.id, true, {
                        fileName: "[project]/src/components/agent-builder/AgentList.js",
                        lineNumber: 76,
                        columnNumber: 18
                    }, this);
                }
            })["AgentList[agents.map()]"];
            $[19] = onDelete;
            $[20] = onDuplicate;
            $[21] = onSelect;
            $[22] = onToggleEnabled;
            $[23] = selectedAgentId;
            $[24] = t8;
        } else {
            t8 = $[24];
        }
        t7 = agents.map(t8);
        $[12] = agents;
        $[13] = onDelete;
        $[14] = onDuplicate;
        $[15] = onSelect;
        $[16] = onToggleEnabled;
        $[17] = selectedAgentId;
        $[18] = t7;
    } else {
        t7 = $[18];
    }
    let t8;
    if ($[25] !== t6 || $[26] !== t7) {
        t8 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mt-5 space-y-3",
            children: [
                t6,
                t7
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentList.js",
            lineNumber: 112,
            columnNumber: 10
        }, this);
        $[25] = t6;
        $[26] = t7;
        $[27] = t8;
    } else {
        t8 = $[27];
    }
    let t9;
    if ($[28] !== t2 || $[29] !== t5 || $[30] !== t8) {
        t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            className: "rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl",
            children: [
                t2,
                t5,
                t8
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentList.js",
            lineNumber: 121,
            columnNumber: 10
        }, this);
        $[28] = t2;
        $[29] = t5;
        $[30] = t8;
        $[31] = t9;
    } else {
        t9 = $[31];
    }
    return t9;
}
_c = AgentList;
var _c;
__turbopack_context__.k.register(_c, "AgentList");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/store/agent-builder-store.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAgentBuilderStore",
    ()=>useAgentBuilderStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$agent$2d$builder$2d$schema$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/agent-builder-schema.js [app-client] (ecmascript)");
;
;
;
const starterAgents = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$agent$2d$builder$2d$schema$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createStarterAgents"])();
const storageFallback = {
    getItem: ()=>null,
    setItem: ()=>undefined,
    removeItem: ()=>undefined
};
const storage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createJSONStorage"])(()=>{
    if (typeof globalThis === 'undefined' || typeof globalThis.localStorage === 'undefined') {
        return storageFallback;
    }
    return window.localStorage;
});
function createUniqueAgentId() {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }
    return `agent-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
function normalizeAgents(agents) {
    const seenIds = new Set();
    return (agents ?? []).map((agent)=>{
        if (!seenIds.has(agent.id)) {
            seenIds.add(agent.id);
            return agent;
        }
        let nextId = createUniqueAgentId();
        while(seenIds.has(nextId)){
            nextId = createUniqueAgentId();
        }
        seenIds.add(nextId);
        return {
            ...agent,
            id: nextId,
            updatedAt: new Date().toISOString()
        };
    });
}
function getNextSelection(agents, deletedId) {
    if (!agents.length) {
        return null;
    }
    const deletedIndex = agents.findIndex((agent)=>agent.id === deletedId);
    if (deletedIndex === -1) {
        return agents[0].id;
    }
    return agents[Math.min(deletedIndex, agents.length - 1)].id;
}
function touch(agent) {
    return {
        ...agent,
        updatedAt: new Date().toISOString()
    };
}
const useAgentBuilderStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["persist"])((set, get)=>({
        agents: starterAgents,
        selectedAgentId: starterAgents[0]?.id ?? null,
        selectAgentId: (agentId)=>{
            set({
                selectedAgentId: agentId
            });
        },
        createAgent: (input)=>{
            const createdAgent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$agent$2d$builder$2d$schema$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createAgentFromInput"])(input);
            set((state)=>({
                    agents: [
                        ...state.agents,
                        createdAgent
                    ],
                    selectedAgentId: createdAgent.id
                }));
            return createdAgent;
        },
        updateAgent: (input)=>{
            const parsed = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$agent$2d$builder$2d$schema$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["agentSchema"].parse(touch(input));
            set((state)=>({
                    agents: state.agents.map((agent)=>agent.id === parsed.id ? parsed : agent),
                    selectedAgentId: parsed.id
                }));
            return parsed;
        },
        duplicateAgent: (agentId)=>{
            const source = get().agents.find((agent)=>agent.id === agentId);
            if (!source) {
                return null;
            }
            const { id, createdAt, updatedAt, ...copySource } = source;
            const duplicate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$agent$2d$builder$2d$schema$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createAgentFromInput"])({
                ...copySource,
                name: `${source.name} Copy`
            });
            set((state)=>({
                    agents: [
                        ...state.agents,
                        duplicate
                    ],
                    selectedAgentId: duplicate.id
                }));
            return duplicate;
        },
        toggleAgentEnabled: (agentId)=>{
            set((state)=>({
                    agents: state.agents.map((agent)=>{
                        if (agent.id !== agentId) {
                            return agent;
                        }
                        return touch({
                            ...agent,
                            isEnabled: !agent.isEnabled
                        });
                    })
                }));
        },
        deleteAgent: (agentId)=>{
            set((state)=>{
                const nextAgents = state.agents.filter((agent)=>agent.id !== agentId);
                return {
                    agents: nextAgents,
                    selectedAgentId: getNextSelection(nextAgents, agentId)
                };
            });
        },
        resetAgents: ()=>{
            const freshAgents = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$agent$2d$builder$2d$schema$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createStarterAgents"])();
            set({
                agents: freshAgents,
                selectedAgentId: freshAgents[0]?.id ?? null
            });
        }
    }), {
    name: "agent-society-builder",
    storage,
    version: 2,
    migrate: (persistedState)=>{
        if (!persistedState) {
            return {
                agents: starterAgents,
                selectedAgentId: starterAgents[0]?.id ?? null
            };
        }
        const migratedAgents = normalizeAgents(persistedState.agents ?? starterAgents);
        const selectedAgentId = migratedAgents.some((agent)=>agent.id === persistedState.selectedAgentId) ? persistedState.selectedAgentId : migratedAgents[0]?.id ?? null;
        return {
            ...persistedState,
            agents: migratedAgents,
            selectedAgentId
        };
    },
    merge: (persistedState, currentState)=>{
        const mergedAgents = normalizeAgents(persistedState?.agents ?? currentState.agents);
        const selectedAgentId = mergedAgents.some((agent)=>agent.id === persistedState?.selectedAgentId) ? persistedState.selectedAgentId : mergedAgents[0]?.id ?? null;
        return {
            ...currentState,
            ...persistedState,
            agents: mergedAgents,
            selectedAgentId
        };
    },
    partialize: (state)=>({
            agents: state.agents,
            selectedAgentId: state.selectedAgentId
        }),
    skipHydration: true
}));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/agent-builder/AgentBuilderApp.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AgentBuilderApp
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$agent$2d$builder$2f$AgentEditor$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/agent-builder/AgentEditor.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$agent$2d$builder$2f$AgentList$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/agent-builder/AgentList.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$agent$2d$builder$2d$schema$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/agent-builder-schema.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$agent$2d$builder$2d$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/agent-builder-store.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
function StatCard(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(11);
    if ($[0] !== "2fd97a5e46fdf2b9dfe13e92bd8fc5785b83ec59d6f9f92be1c20d85761b96fb") {
        for(let $i = 0; $i < 11; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "2fd97a5e46fdf2b9dfe13e92bd8fc5785b83ec59d6f9f92be1c20d85761b96fb";
    }
    const { label, value, subtext } = t0;
    let t1;
    if ($[1] !== label) {
        t1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "text-xs font-semibold uppercase tracking-[0.2em] text-white/45",
            children: label
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
            lineNumber: 24,
            columnNumber: 10
        }, this);
        $[1] = label;
        $[2] = t1;
    } else {
        t1 = $[2];
    }
    let t2;
    if ($[3] !== value) {
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mt-3 text-3xl font-semibold text-white",
            children: value
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
            lineNumber: 32,
            columnNumber: 10
        }, this);
        $[3] = value;
        $[4] = t2;
    } else {
        t2 = $[4];
    }
    let t3;
    if ($[5] !== subtext) {
        t3 = subtext ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "mt-2 text-sm leading-6 text-white/60",
            children: subtext
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
            lineNumber: 40,
            columnNumber: 20
        }, this) : null;
        $[5] = subtext;
        $[6] = t3;
    } else {
        t3 = $[6];
    }
    let t4;
    if ($[7] !== t1 || $[8] !== t2 || $[9] !== t3) {
        t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur",
            children: [
                t1,
                t2,
                t3
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
            lineNumber: 48,
            columnNumber: 10
        }, this);
        $[7] = t1;
        $[8] = t2;
        $[9] = t3;
        $[10] = t4;
    } else {
        t4 = $[10];
    }
    return t4;
}
_c = StatCard;
function EmptyPreview() {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(2);
    if ($[0] !== "2fd97a5e46fdf2b9dfe13e92bd8fc5785b83ec59d6f9f92be1c20d85761b96fb") {
        for(let $i = 0; $i < 2; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "2fd97a5e46fdf2b9dfe13e92bd8fc5785b83ec59d6f9f92be1c20d85761b96fb";
    }
    let t0;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "rounded-[2rem] border border-dashed border-white/15 bg-black/15 p-8 text-sm leading-7 text-white/60",
            children: "Select an agent to edit it, or create a new one to start from a blank slate. Every change is saved to local storage."
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
            lineNumber: 68,
            columnNumber: 10
        }, this);
        $[1] = t0;
    } else {
        t0 = $[1];
    }
    return t0;
}
_c1 = EmptyPreview;
function AgentBuilderApp() {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(91);
    if ($[0] !== "2fd97a5e46fdf2b9dfe13e92bd8fc5785b83ec59d6f9f92be1c20d85761b96fb") {
        for(let $i = 0; $i < 91; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "2fd97a5e46fdf2b9dfe13e92bd8fc5785b83ec59d6f9f92be1c20d85761b96fb";
    }
    const [searchTerm, setSearchTerm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const agents = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$agent$2d$builder$2d$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAgentBuilderStore"])(_AgentBuilderAppUseAgentBuilderStore);
    const selectedAgentId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$agent$2d$builder$2d$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAgentBuilderStore"])(_AgentBuilderAppUseAgentBuilderStore2);
    const selectAgentId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$agent$2d$builder$2d$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAgentBuilderStore"])(_AgentBuilderAppUseAgentBuilderStore3);
    const createAgent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$agent$2d$builder$2d$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAgentBuilderStore"])(_AgentBuilderAppUseAgentBuilderStore4);
    const updateAgent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$agent$2d$builder$2d$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAgentBuilderStore"])(_AgentBuilderAppUseAgentBuilderStore5);
    const duplicateAgent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$agent$2d$builder$2d$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAgentBuilderStore"])(_AgentBuilderAppUseAgentBuilderStore6);
    const deleteAgent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$agent$2d$builder$2d$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAgentBuilderStore"])(_AgentBuilderAppUseAgentBuilderStore7);
    const toggleAgentEnabled = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$agent$2d$builder$2d$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAgentBuilderStore"])(_AgentBuilderAppUseAgentBuilderStore8);
    const resetAgents = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$agent$2d$builder$2d$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAgentBuilderStore"])(_AgentBuilderAppUseAgentBuilderStore9);
    let t0;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = [];
        $[1] = t0;
    } else {
        t0 = $[1];
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])(_AgentBuilderAppUseEffect, t0);
    let t1;
    let t2;
    if ($[2] !== agents || $[3] !== selectAgentId || $[4] !== selectedAgentId) {
        t1 = ({
            "AgentBuilderApp[useEffect()]": ()=>{
                if (!agents.length) {
                    return;
                }
                const selectedExists = agents.some({
                    "AgentBuilderApp[useEffect() > agents.some()]": (agent)=>agent.id === selectedAgentId
                }["AgentBuilderApp[useEffect() > agents.some()]"]);
                if (!selectedExists) {
                    selectAgentId(agents[0].id);
                }
            }
        })["AgentBuilderApp[useEffect()]"];
        t2 = [
            agents,
            selectedAgentId,
            selectAgentId
        ];
        $[2] = agents;
        $[3] = selectAgentId;
        $[4] = selectedAgentId;
        $[5] = t1;
        $[6] = t2;
    } else {
        t1 = $[5];
        t2 = $[6];
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])(t1, t2);
    let t3;
    if ($[7] !== agents || $[8] !== searchTerm) {
        bb0: {
            const query = searchTerm.trim().toLowerCase();
            if (!query) {
                t3 = agents;
                break bb0;
            }
            t3 = agents.filter({
                "AgentBuilderApp[agents.filter()]": (agent_0)=>[
                        agent_0.name,
                        agent_0.role,
                        agent_0.goal,
                        agent_0.description
                    ].join(" ").toLowerCase().includes(query)
            }["AgentBuilderApp[agents.filter()]"]);
        }
        $[7] = agents;
        $[8] = searchTerm;
        $[9] = t3;
    } else {
        t3 = $[9];
    }
    const filteredAgents = t3;
    let t4;
    if ($[10] !== agents || $[11] !== selectedAgentId) {
        t4 = agents.find({
            "AgentBuilderApp[agents.find()]": (agent_1)=>agent_1.id === selectedAgentId
        }["AgentBuilderApp[agents.find()]"]) ?? null;
        $[10] = agents;
        $[11] = selectedAgentId;
        $[12] = t4;
    } else {
        t4 = $[12];
    }
    const selectedAgent = t4;
    let t5;
    if ($[13] !== agents) {
        t5 = agents.filter(_AgentBuilderAppAgentsFilter);
        $[13] = agents;
        $[14] = t5;
    } else {
        t5 = $[14];
    }
    const enabledAgents = t5.length;
    let t6;
    if ($[15] !== agents) {
        t6 = agents.filter(_AgentBuilderAppAgentsFilter2);
        $[15] = agents;
        $[16] = t6;
    } else {
        t6 = $[16];
    }
    const openaiCount = t6.length;
    let t7;
    if ($[17] !== agents) {
        t7 = agents.filter(_AgentBuilderAppAgentsFilter3);
        $[17] = agents;
        $[18] = t7;
    } else {
        t7 = $[18];
    }
    const geminiCount = t7.length;
    let t8;
    if ($[19] !== createAgent) {
        t8 = ({
            "AgentBuilderApp[handleCreateAgent]": (agentInput)=>{
                createAgent(agentInput);
            }
        })["AgentBuilderApp[handleCreateAgent]"];
        $[19] = createAgent;
        $[20] = t8;
    } else {
        t8 = $[20];
    }
    const handleCreateAgent = t8;
    let t9;
    if ($[21] !== updateAgent) {
        t9 = ({
            "AgentBuilderApp[handleUpdateAgent]": (agentInput_0)=>{
                updateAgent(agentInput_0);
            }
        })["AgentBuilderApp[handleUpdateAgent]"];
        $[21] = updateAgent;
        $[22] = t9;
    } else {
        t9 = $[22];
    }
    const handleUpdateAgent = t9;
    let t10;
    if ($[23] !== duplicateAgent) {
        t10 = ({
            "AgentBuilderApp[handleDuplicateAgent]": (agentId)=>{
                duplicateAgent(agentId);
            }
        })["AgentBuilderApp[handleDuplicateAgent]"];
        $[23] = duplicateAgent;
        $[24] = t10;
    } else {
        t10 = $[24];
    }
    const handleDuplicateAgent = t10;
    let t11;
    if ($[25] !== deleteAgent) {
        t11 = ({
            "AgentBuilderApp[handleDeleteAgent]": (agentId_0)=>{
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
                const shouldDelete = window.confirm("Delete this agent? This cannot be undone.");
                if (!shouldDelete) {
                    return;
                }
                deleteAgent(agentId_0);
            }
        })["AgentBuilderApp[handleDeleteAgent]"];
        $[25] = deleteAgent;
        $[26] = t11;
    } else {
        t11 = $[26];
    }
    const handleDeleteAgent = t11;
    let t12;
    if ($[27] !== toggleAgentEnabled) {
        t12 = ({
            "AgentBuilderApp[handleToggleAgentEnabled]": (agentId_1)=>{
                toggleAgentEnabled(agentId_1);
            }
        })["AgentBuilderApp[handleToggleAgentEnabled]"];
        $[27] = toggleAgentEnabled;
        $[28] = t12;
    } else {
        t12 = $[28];
    }
    const handleToggleAgentEnabled = t12;
    let t13;
    if ($[29] === Symbol.for("react.memo_cache_sentinel")) {
        t13 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(244,114,182,0.12),_transparent_28%),linear-gradient(180deg,_#0b1526_0%,_#07111f_100%)]"
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
            lineNumber: 260,
            columnNumber: 11
        }, this);
        $[29] = t13;
    } else {
        t13 = $[29];
    }
    let t14;
    if ($[30] === Symbol.for("react.memo_cache_sentinel")) {
        t14 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-3xl",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-wrap gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80",
                            children: "Agent Builder"
                        }, void 0, false, {
                            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
                            lineNumber: 267,
                            columnNumber: 76
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80",
                            children: "Local Storage"
                        }, void 0, false, {
                            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
                            lineNumber: 267,
                            columnNumber: 230
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80",
                            children: "Zustand"
                        }, void 0, false, {
                            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
                            lineNumber: 267,
                            columnNumber: 384
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
                    lineNumber: 267,
                    columnNumber: 38
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    className: "mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl",
                    children: "Build and manage an unlimited agent library."
                }, void 0, false, {
                    fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
                    lineNumber: 267,
                    columnNumber: 538
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base",
                    children: "Create, edit, duplicate, enable, disable, and delete agents. Everything stays on the client and persists in the browser."
                }, void 0, false, {
                    fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
                    lineNumber: 267,
                    columnNumber: 681
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
            lineNumber: 267,
            columnNumber: 11
        }, this);
        $[30] = t14;
    } else {
        t14 = $[30];
    }
    let t15;
    if ($[31] === Symbol.for("react.memo_cache_sentinel")) {
        t15 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "font-semibold uppercase tracking-[0.25em] text-cyan-200/80",
            children: "Persisted state"
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
            lineNumber: 274,
            columnNumber: 11
        }, this);
        $[31] = t15;
    } else {
        t15 = $[31];
    }
    let t16;
    if ($[32] !== agents.length) {
        t16 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                agents.length,
                " agents saved locally"
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
            lineNumber: 281,
            columnNumber: 11
        }, this);
        $[32] = agents.length;
        $[33] = t16;
    } else {
        t16 = $[33];
    }
    const t17 = agents.length - enabledAgents;
    let t18;
    if ($[34] !== enabledAgents || $[35] !== t17) {
        t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                enabledAgents,
                " enabled, ",
                t17,
                " disabled"
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
            lineNumber: 290,
            columnNumber: 11
        }, this);
        $[34] = enabledAgents;
        $[35] = t17;
        $[36] = t18;
    } else {
        t18 = $[36];
    }
    let t19;
    if ($[37] !== t16 || $[38] !== t18) {
        t19 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
            className: "rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_20px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between",
                children: [
                    t14,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid gap-3 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-50",
                        children: [
                            t15,
                            t16,
                            t18
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
                        lineNumber: 299,
                        columnNumber: 226
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
                lineNumber: 299,
                columnNumber: 140
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
            lineNumber: 299,
            columnNumber: 11
        }, this);
        $[37] = t16;
        $[38] = t18;
        $[39] = t19;
    } else {
        t19 = $[39];
    }
    let t20;
    if ($[40] !== agents.length) {
        t20 = agents.length.toString();
        $[40] = agents.length;
        $[41] = t20;
    } else {
        t20 = $[41];
    }
    let t21;
    if ($[42] !== t20) {
        t21 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
            label: "Total agents",
            value: t20,
            subtext: "The library can grow without a fixed limit."
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
            lineNumber: 316,
            columnNumber: 11
        }, this);
        $[42] = t20;
        $[43] = t21;
    } else {
        t21 = $[43];
    }
    let t22;
    if ($[44] !== enabledAgents) {
        t22 = enabledAgents.toString();
        $[44] = enabledAgents;
        $[45] = t22;
    } else {
        t22 = $[45];
    }
    let t23;
    if ($[46] !== t22) {
        t23 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
            label: "Enabled agents",
            value: t22,
            subtext: "Disabled agents stay stored but are skipped by routing."
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
            lineNumber: 332,
            columnNumber: 11
        }, this);
        $[46] = t22;
        $[47] = t23;
    } else {
        t23 = $[47];
    }
    const t24 = `${openaiCount}/${geminiCount}`;
    let t25;
    if ($[48] !== t24) {
        t25 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
            label: "Providers",
            value: t24,
            subtext: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$agent$2d$builder$2d$schema$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PROVIDER_LABELS"].openai} / ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$agent$2d$builder$2d$schema$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PROVIDER_LABELS"].gemini}`
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
            lineNumber: 341,
            columnNumber: 11
        }, this);
        $[48] = t24;
        $[49] = t25;
    } else {
        t25 = $[49];
    }
    let t26;
    if ($[50] !== t21 || $[51] !== t23 || $[52] !== t25) {
        t26 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            className: "grid gap-4 md:grid-cols-3",
            children: [
                t21,
                t23,
                t25
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
            lineNumber: 349,
            columnNumber: 11
        }, this);
        $[50] = t21;
        $[51] = t23;
        $[52] = t25;
        $[53] = t26;
    } else {
        t26 = $[53];
    }
    let t27;
    if ($[54] !== filteredAgents || $[55] !== handleDeleteAgent || $[56] !== handleDuplicateAgent || $[57] !== handleToggleAgentEnabled || $[58] !== searchTerm || $[59] !== selectAgentId || $[60] !== selectedAgentId) {
        t27 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$agent$2d$builder$2f$AgentList$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            agents: filteredAgents,
            selectedAgentId: selectedAgentId,
            searchTerm: searchTerm,
            onSearchTermChange: setSearchTerm,
            onSelect: selectAgentId,
            onDuplicate: handleDuplicateAgent,
            onDelete: handleDeleteAgent,
            onToggleEnabled: handleToggleAgentEnabled
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
            lineNumber: 359,
            columnNumber: 11
        }, this);
        $[54] = filteredAgents;
        $[55] = handleDeleteAgent;
        $[56] = handleDuplicateAgent;
        $[57] = handleToggleAgentEnabled;
        $[58] = searchTerm;
        $[59] = selectAgentId;
        $[60] = selectedAgentId;
        $[61] = t27;
    } else {
        t27 = $[61];
    }
    const t28 = selectedAgent?.id ?? "new-agent";
    let t29;
    if ($[62] !== selectAgentId) {
        t29 = ({
            "AgentBuilderApp[<AgentEditor>.onNew]": ()=>selectAgentId(null)
        })["AgentBuilderApp[<AgentEditor>.onNew]"];
        $[62] = selectAgentId;
        $[63] = t29;
    } else {
        t29 = $[63];
    }
    let t30;
    if ($[64] !== handleCreateAgent || $[65] !== handleDeleteAgent || $[66] !== handleDuplicateAgent || $[67] !== handleToggleAgentEnabled || $[68] !== handleUpdateAgent || $[69] !== selectedAgent || $[70] !== t28 || $[71] !== t29) {
        t30 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$agent$2d$builder$2f$AgentEditor$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            agent: selectedAgent,
            onCreate: handleCreateAgent,
            onUpdate: handleUpdateAgent,
            onNew: t29,
            onDuplicate: handleDuplicateAgent,
            onDelete: handleDeleteAgent,
            onToggleEnabled: handleToggleAgentEnabled
        }, t28, false, {
            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
            lineNumber: 384,
            columnNumber: 11
        }, this);
        $[64] = handleCreateAgent;
        $[65] = handleDeleteAgent;
        $[66] = handleDuplicateAgent;
        $[67] = handleToggleAgentEnabled;
        $[68] = handleUpdateAgent;
        $[69] = selectedAgent;
        $[70] = t28;
        $[71] = t29;
        $[72] = t30;
    } else {
        t30 = $[72];
    }
    let t31;
    if ($[73] === Symbol.for("react.memo_cache_sentinel")) {
        t31 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/70",
                    children: "Current selection"
                }, void 0, false, {
                    fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
                    lineNumber: 399,
                    columnNumber: 16
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "mt-2 text-xl font-semibold text-white",
                    children: "Agent snapshot"
                }, void 0, false, {
                    fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
                    lineNumber: 399,
                    columnNumber: 122
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "mt-2 text-sm leading-6 text-white/65",
                    children: "A compact preview of the selected agent makes it easier to confirm the final stored state."
                }, void 0, false, {
                    fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
                    lineNumber: 399,
                    columnNumber: 195
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
            lineNumber: 399,
            columnNumber: 11
        }, this);
        $[73] = t31;
    } else {
        t31 = $[73];
    }
    let t32;
    if ($[74] !== resetAgents) {
        t32 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-start justify-between gap-4",
            children: [
                t31,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    onClick: resetAgents,
                    className: "rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/5",
                    children: "Reset starter set"
                }, void 0, false, {
                    fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
                    lineNumber: 406,
                    columnNumber: 72
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
            lineNumber: 406,
            columnNumber: 11
        }, this);
        $[74] = resetAgents;
        $[75] = t32;
    } else {
        t32 = $[75];
    }
    let t33;
    if ($[76] !== selectedAgent) {
        t33 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mt-5",
            children: selectedAgent ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                className: "overflow-x-auto rounded-3xl border border-white/10 bg-slate-950/90 p-5 text-xs leading-6 text-cyan-100",
                children: JSON.stringify(selectedAgent, null, 2)
            }, void 0, false, {
                fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
                lineNumber: 414,
                columnNumber: 50
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyPreview, {}, void 0, false, {
                fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
                lineNumber: 414,
                columnNumber: 219
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
            lineNumber: 414,
            columnNumber: 11
        }, this);
        $[76] = selectedAgent;
        $[77] = t33;
    } else {
        t33 = $[77];
    }
    let t34;
    if ($[78] !== t32 || $[79] !== t33) {
        t34 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            className: "rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl",
            children: [
                t32,
                t33
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
            lineNumber: 422,
            columnNumber: 11
        }, this);
        $[78] = t32;
        $[79] = t33;
        $[80] = t34;
    } else {
        t34 = $[80];
    }
    let t35;
    if ($[81] !== t30 || $[82] !== t34) {
        t35 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-6",
            children: [
                t30,
                t34
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
            lineNumber: 431,
            columnNumber: 11
        }, this);
        $[81] = t30;
        $[82] = t34;
        $[83] = t35;
    } else {
        t35 = $[83];
    }
    let t36;
    if ($[84] !== t27 || $[85] !== t35) {
        t36 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            className: "grid gap-8 lg:grid-cols-[0.95fr_1.05fr]",
            children: [
                t27,
                t35
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
            lineNumber: 440,
            columnNumber: 11
        }, this);
        $[84] = t27;
        $[85] = t35;
        $[86] = t36;
    } else {
        t36 = $[86];
    }
    let t37;
    if ($[87] !== t19 || $[88] !== t26 || $[89] !== t36) {
        t37 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
            className: "min-h-screen overflow-hidden bg-[#07111f] text-white",
            children: [
                t13,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10",
                    children: [
                        t19,
                        t26,
                        t36
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
                    lineNumber: 449,
                    columnNumber: 87
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/agent-builder/AgentBuilderApp.js",
            lineNumber: 449,
            columnNumber: 11
        }, this);
        $[87] = t19;
        $[88] = t26;
        $[89] = t36;
        $[90] = t37;
    } else {
        t37 = $[90];
    }
    return t37;
}
_s(AgentBuilderApp, "qAptL0XhPwt63wRvbDqmG/FxtsQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$agent$2d$builder$2d$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAgentBuilderStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$agent$2d$builder$2d$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAgentBuilderStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$agent$2d$builder$2d$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAgentBuilderStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$agent$2d$builder$2d$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAgentBuilderStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$agent$2d$builder$2d$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAgentBuilderStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$agent$2d$builder$2d$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAgentBuilderStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$agent$2d$builder$2d$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAgentBuilderStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$agent$2d$builder$2d$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAgentBuilderStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$agent$2d$builder$2d$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAgentBuilderStore"]
    ];
});
_c2 = AgentBuilderApp;
function _AgentBuilderAppAgentsFilter3(agent_4) {
    return agent_4.aiProvider === "gemini";
}
function _AgentBuilderAppAgentsFilter2(agent_3) {
    return agent_3.aiProvider === "openai";
}
function _AgentBuilderAppAgentsFilter(agent_2) {
    return agent_2.isEnabled;
}
function _AgentBuilderAppUseEffect() {
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$agent$2d$builder$2d$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAgentBuilderStore"].persist.rehydrate();
}
function _AgentBuilderAppUseAgentBuilderStore9(state_7) {
    return state_7.resetAgents;
}
function _AgentBuilderAppUseAgentBuilderStore8(state_6) {
    return state_6.toggleAgentEnabled;
}
function _AgentBuilderAppUseAgentBuilderStore7(state_5) {
    return state_5.deleteAgent;
}
function _AgentBuilderAppUseAgentBuilderStore6(state_4) {
    return state_4.duplicateAgent;
}
function _AgentBuilderAppUseAgentBuilderStore5(state_3) {
    return state_3.updateAgent;
}
function _AgentBuilderAppUseAgentBuilderStore4(state_2) {
    return state_2.createAgent;
}
function _AgentBuilderAppUseAgentBuilderStore3(state_1) {
    return state_1.selectAgentId;
}
function _AgentBuilderAppUseAgentBuilderStore2(state_0) {
    return state_0.selectedAgentId;
}
function _AgentBuilderAppUseAgentBuilderStore(state) {
    return state.agents;
}
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "StatCard");
__turbopack_context__.k.register(_c1, "EmptyPreview");
__turbopack_context__.k.register(_c2, "AgentBuilderApp");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/agent-builder/AgentBuilderApp.js [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/components/agent-builder/AgentBuilderApp.js [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=src_0_3f2im._.js.map