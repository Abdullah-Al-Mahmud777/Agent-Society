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
	if (typeof window === "undefined") {
		return storageFallback;
	}

	return window.localStorage;
});

function getNextSelection(agents, deletedId) {
	if (!agents.length) {
		return null;
	}

	const deletedIndex = agents.findIndex((agent) => agent.id === deletedId);
	if (deletedIndex === -1) {
		return agents[0].id;
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

				const duplicate = createAgentFromInput({
					...source,
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
					const nextAgents = state.agents.filter((agent) => agent.id !== agentId);
					return {
						agents: nextAgents,
						selectedAgentId: getNextSelection(nextAgents, agentId),
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
			version: 1,
			partialize: (state) => ({
				agents: state.agents,
				selectedAgentId: state.selectedAgentId,
			}),
			skipHydration: true,
		},
	),
);
