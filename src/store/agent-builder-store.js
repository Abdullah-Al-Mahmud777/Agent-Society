import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
	agentSchema,
	createAgentFromInput,
	createStarterAgents,
} from "../lib/agent-builder-schema";

const starterAgents = createStarterAgents();

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
			agents: starterAgents,
			selectedAgentId: starterAgents[0]?.id ?? null,

			selectAgentId: (agentId) => {
				set({ selectedAgentId: agentId });
			},

			createAgent: (input) => {
				const createdAgent = createAgentFromInput(input);

				set((state) => ({
					agents: [...state.agents, createdAgent],
					selectedAgentId: createdAgent.id,
				}));

				return createdAgent;
			},

			updateAgent: (input) => {
				const parsed = agentSchema.parse(touch(input));

				set((state) => ({
					agents: state.agents.map((agent) => (agent.id === parsed.id ? parsed : agent)),
					selectedAgentId: parsed.id,
				}));

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

				return duplicate;
			},

			toggleAgentEnabled: (agentId) => {
				set((state) => ({
					agents: state.agents.map((agent) => {
						if (agent.id !== agentId) {
							return agent;
						}

						return touch({
							...agent,
							isEnabled: !agent.isEnabled,
						});
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
			},

			resetAgents: () => {
				const freshAgents = createStarterAgents();
				set({
					agents: freshAgents,
					selectedAgentId: freshAgents[0]?.id ?? null,
				});
			},
		}),
		{
			name: "agent-society-builder",
			storage,
			version: 4,
			migrate: (persistedState) => {
				if (!persistedState) {
					return {
						agents: starterAgents,
						selectedAgentId: starterAgents[0]?.id ?? null,
					};
				}

				// Backfill personality fields for agents saved before v3
				// And update old "qwen3.7-plus" model to "qwen/qwen3.7-plus"
				const migratedAgents = normalizeAgents(persistedState.agents ?? starterAgents).map((agent) => ({
					riskAppetite: 0.5,
					communicationStyle: 0.5,
					creativity: 0.5,
					flexibility: 0.5,
					coreValues: [],
					speakingStyle: "formal",
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
