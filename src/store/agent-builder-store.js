import { create } from "zustand";

import {
	agentSchema,
	createAgentFromInput,
} from "../lib/agent-builder-schema";

async function requestJson(url, options = {}) {
	const response = await fetch(url, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...(options.headers || {}),
		},
	});

	let data = null;
	try {
		data = await response.json();
	} catch {
		data = null;
	}

	if (response.status === 401) {
		if (typeof window !== "undefined") {
			window.location.assign("/login");
		}
		throw new Error("Your session expired. Please sign in again.");
	}

	if (!response.ok || data?.success === false) {
		throw new Error(data?.error || "The agent could not be saved.");
	}

	return data;
}

function normalizeAgents(agents) {
	const seenIds = new Set();

	return (Array.isArray(agents) ? agents : []).map((agent) => {
		if (!seenIds.has(agent.id)) {
			seenIds.add(agent.id);
			return agent;
		}

		const nextId = createUniqueAgentId();
		seenIds.add(nextId);
		return { ...agent, id: nextId };
	});
}

function createUniqueAgentId() {
	if (globalThis.crypto?.randomUUID) {
		return globalThis.crypto.randomUUID();
	}

	return `agent-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function nextSelection(agents, deletedIndex) {
	if (!agents.length) return null;
	return agents[Math.min(Math.max(deletedIndex, 0), agents.length - 1)].id;
}

function copyName(sourceName, agents) {
	const base = `${sourceName} Copy`.slice(0, 80);
	if (!agents.some((agent) => agent.name === base)) return base;

	for (let index = 2; index < 100; index += 1) {
		const suffix = ` ${index}`;
		const candidate = `${base.slice(0, 80 - suffix.length)}${suffix}`;
		if (!agents.some((agent) => agent.name === candidate)) return candidate;
	}

	return `${base.slice(0, 72)} Copy`;
}

function touch(agent) {
	return {
		...agent,
		updatedAt: new Date().toISOString(),
	};
}

function replaceAgent(agents, updated) {
	return agents.map((agent) => (agent.id === updated.id ? updated : agent));
}

async function persistAgent(agent) {
	const data = await requestJson("/api/db/agents", {
		method: "POST",
		body: JSON.stringify({ agent }),
	});
	return data?.agent || agent;
}

export const useAgentBuilderStore = create((set, get) => ({
	agents: [],
	selectedAgentId: null,
	hydrated: false,
	hydrating: false,
	hydrateError: null,

	selectAgentId: (agentId) => {
		set({ selectedAgentId: agentId });
	},

	hydrateAgents: async () => {
		if (get().hydrating) return;

		set({ hydrating: true, hydrateError: null });

		try {
			const data = await requestJson("/api/db/agents", { cache: "no-store" });
			const nextAgents = normalizeAgents(data.agents);
			const currentSelected = get().selectedAgentId;
			const selectedAgentId = nextAgents.some((agent) => agent.id === currentSelected)
				? currentSelected
				: nextAgents[0]?.id ?? null;

			set({
				agents: nextAgents,
				selectedAgentId,
				hydrated: true,
				hydrating: false,
				hydrateError: null,
			});
		} catch (error) {
			set({
				hydrated: true,
				hydrating: false,
				hydrateError: error.message || "Agents could not be loaded.",
			});
		}
	},

	createAgent: async (input) => {
		const createdAgent = createAgentFromInput(input);
		const previousSelection = get().selectedAgentId;

		set((state) => ({
			agents: [...state.agents, createdAgent],
			selectedAgentId: createdAgent.id,
		}));

		try {
			const savedAgent = await persistAgent(createdAgent);
			set((state) => ({
				agents: replaceAgent(state.agents, savedAgent),
				selectedAgentId: savedAgent.id,
			}));
			return savedAgent;
		} catch (error) {
			set((state) => ({
				agents: state.agents.filter((agent) => agent.id !== createdAgent.id),
				selectedAgentId: previousSelection,
			}));
			throw error;
		}
	},

	updateAgent: async (input) => {
		const parsed = agentSchema.parse(touch(input));
		const previous = get().agents.find((agent) => agent.id === parsed.id) || null;

		set((state) => ({
			agents: replaceAgent(state.agents, parsed),
			selectedAgentId: parsed.id,
		}));

		try {
			const savedAgent = await persistAgent(parsed);
			set((state) => ({
				agents: replaceAgent(state.agents, savedAgent),
				selectedAgentId: savedAgent.id,
			}));
			return savedAgent;
		} catch (error) {
			set((state) => ({
				agents: previous
					? replaceAgent(state.agents, previous)
					: state.agents,
				selectedAgentId: previous ? previous.id : state.selectedAgentId,
			}));
			throw error;
		}
	},

	duplicateAgent: async (agentId) => {
		const state = get();
		const source = state.agents.find((agent) => agent.id === agentId);
		if (!source) return null;

		const { id, createdAt, updatedAt, ...copySource } = source;
		const duplicate = createAgentFromInput({
			...copySource,
			name: copyName(source.name, state.agents),
		});

		set((current) => ({
			agents: [...current.agents, duplicate],
			selectedAgentId: duplicate.id,
		}));

		try {
			const savedAgent = await persistAgent(duplicate);
			set((current) => ({
				agents: replaceAgent(current.agents, savedAgent),
				selectedAgentId: savedAgent.id,
			}));
			return savedAgent;
		} catch (error) {
			set((current) => ({
				agents: current.agents.filter((agent) => agent.id !== duplicate.id),
				selectedAgentId: source.id,
			}));
			throw error;
		}
	},

	toggleAgentEnabled: async (agentId) => {
		const agent = get().agents.find((item) => item.id === agentId);
		if (!agent) return null;
		return get().updateAgent({ ...agent, isEnabled: !agent.isEnabled });
	},

	deleteAgent: async (agentId) => {
		const state = get();
		const deletedIndex = state.agents.findIndex((agent) => agent.id === agentId);
		if (deletedIndex === -1) return false;

		const nextAgents = state.agents.filter((agent) => agent.id !== agentId);

		set({
			agents: nextAgents,
			selectedAgentId: nextSelection(nextAgents, deletedIndex),
		});

		try {
			await requestJson(`/api/db/agents?id=${encodeURIComponent(agentId)}`, {
				method: "DELETE",
			});
			return true;
		} catch (error) {
			set({
				agents: state.agents,
				selectedAgentId: state.selectedAgentId,
			});
			throw error;
		}
	},
}));
