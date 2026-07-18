import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
	agentSchema,
	createAgentFromInput,
} from "../lib/agent-builder-schema";
import agentDatabase from "../lib/agent-database";

const storageFallback = {
	getItem: () => null,
	setItem: () => undefined,
	removeItem: () => undefined,
};

const storage = createJSONStorage(() => {
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

	return (agents ?? []).map((agent) => {
		if (!seenIds.has(agent.id)) {
			seenIds.add(agent.id);
			return agent;
		}

		let nextId = createUniqueAgentId();
		while (seenIds.has(nextId)) {
			nextId = createUniqueAgentId();
		}

		seenIds.add(nextId);

		return {
			...agent,
			id: nextId,
			updatedAt: new Date().toISOString(),
		};
	});
}

function getNextSelection(agents, deletedIndex) {
	if (!agents.length) {
		return null;
	}

	return agents[Math.min(deletedIndex, agents.length - 1)].id;
}

function touch(agent) {
	return {
		...agent,
		updatedAt: new Date().toISOString(),
	};
}

export const useAgentBuilderStore = create(
	persist(
		(set, get) => ({
			agents: [],
			selectedAgentId: null,

			selectAgentId: (agentId) => {
				set({ selectedAgentId: agentId });
			},

			createAgent: (input) => {
				const createdAgent = createAgentFromInput(input);

				set((state) => ({
					agents: [...state.agents, createdAgent],
					selectedAgentId: createdAgent.id,
				}));

				// Also add to database
				agentDatabase.add(createdAgent);

				return createdAgent;
			},

			updateAgent: (input) => {
				const parsed = agentSchema.parse(touch(input));

				set((state) => ({
					agents: state.agents.map((agent) => (agent.id === parsed.id ? parsed : agent)),
					selectedAgentId: parsed.id,
				}));

				// Also update in database
				agentDatabase.update(parsed.id, parsed);

				return parsed;
			},

			duplicateAgent: (agentId) => {
				const source = get().agents.find((agent) => agent.id === agentId);
				if (!source) {
					return null;
				}

				const { id, createdAt, updatedAt, ...copySource } = source;

				const duplicate = createAgentFromInput({
					...copySource,
					name: `${source.name} Copy`,
				});

				set((state) => ({
					agents: [...state.agents, duplicate],
					selectedAgentId: duplicate.id,
				}));

				// Also add to database
				agentDatabase.add(duplicate);

				return duplicate;
			},

			toggleAgentEnabled: (agentId) => {
				set((state) => ({
					agents: state.agents.map((agent) => {
						if (agent.id !== agentId) {
							return agent;
						}

						const updatedAgent = touch({
							...agent,
							isEnabled: !agent.isEnabled,
						});
						
						// Also update in database
						agentDatabase.update(agentId, updatedAgent);
						
						return updatedAgent;
					}),
				}));
			},

			deleteAgent: (agentId) => {
				set((state) => {
					const deletedIndex = state.agents.findIndex((agent) => agent.id === agentId);
					const nextAgents = state.agents.filter((agent) => agent.id !== agentId);
					return {
						agents: nextAgents,
						selectedAgentId: getNextSelection(nextAgents, deletedIndex),
					};
				});

				// Also delete from database
				agentDatabase.delete(agentId);
			},

			resetAgents: () => {
				set({
					agents: [],
					selectedAgentId: null,
				});
			},
		}),
		{
			name: "agent-society-builder",
			storage,
			version: 5,
			migrate: (persistedState) => {
				if (!persistedState) {
					return {
						agents: [],
						selectedAgentId: null,
					};
				}

				// Backfill personality fields, expertise, capabilities, and update model
				const migratedAgents = normalizeAgents(persistedState.agents ?? []).map((agent) => ({
					riskAppetite: 0.5,
					communicationStyle: 0.5,
					creativity: 0.5,
					flexibility: 0.5,
					coreValues: [],
					speakingStyle: "formal",
					expertise: "General knowledge",
					capabilities: [],
					...agent,
					model: agent.model === "qwen3.7-plus" ? "qwen/qwen3.7-plus" : agent.model,
				}));

				const selectedAgentId = migratedAgents.some((agent) => agent.id === persistedState.selectedAgentId)
					? persistedState.selectedAgentId
					: migratedAgents[0]?.id ?? null;

				return {
					...persistedState,
					agents: migratedAgents,
					selectedAgentId,
				};
			},
			merge: (persistedState, currentState) => {
				const mergedAgents = normalizeAgents(persistedState?.agents ?? currentState.agents);
				const selectedAgentId = mergedAgents.some((agent) => agent.id === persistedState?.selectedAgentId)
					? persistedState.selectedAgentId
					: mergedAgents[0]?.id ?? null;

				return {
					...currentState,
					...persistedState,
					agents: mergedAgents,
					selectedAgentId,
				};
			},
			partialize: (state) => ({
				agents: state.agents,
				selectedAgentId: state.selectedAgentId,
			}),
			skipHydration: true,
		},
	),
);
