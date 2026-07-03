import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
	agentSchema,
	createAgentCopy,
	createAgentFromInput,
	createSocietyCopy,
	createSocietyFromInput,
	societySchema,
} from "../lib/society-schema";

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

function getNextSelection(items, deletedId) {
	if (!items.length) {
		return null;
	}

	const deletedIndex = items.findIndex((item) => item.id === deletedId);
	if (deletedIndex === -1) {
		return items[0].id;
	}

	return items[Math.min(deletedIndex, items.length - 1)].id;
}

function touch(record) {
	return {
		...record,
		updatedAt: new Date().toISOString(),
	};
}

function moveItem(list, fromIndex, toIndex) {
	if (fromIndex === toIndex) {
		return list;
	}

	if (fromIndex < 0 || fromIndex >= list.length) {
		return list;
	}

	if (toIndex < 0 || toIndex >= list.length) {
		return list;
	}

	const nextList = [...list];
	const [item] = nextList.splice(fromIndex, 1);
	nextList.splice(toIndex, 0, item);
	return nextList;
}

function removeAgentFromAllSocieties(societies, agentId) {
	return societies.map((society) => ({
		...society,
		agentIds: society.agentIds.filter((memberId) => memberId !== agentId),
		updatedAt: new Date().toISOString(),
	}));
}

export const useSocietyStore = create(
	persist(
		(set, get) => ({
			agents: [],
			societies: [],
			selectedAgentId: null,
			selectedSocietyId: null,

			selectAgentId: (agentId) => set({ selectedAgentId: agentId }),
			selectSocietyId: (societyId) => set({ selectedSocietyId: societyId }),

			createAgent: (input) => {
				const createdAgent = createAgentFromInput(input);

				set((state) => ({
					agents: [...state.agents, createdAgent],
					selectedAgentId: createdAgent.id,
				}));

				return createdAgent;
			},

			updateAgent: (input) => {
				const parsed = agentSchema.parse(input);

				set((state) => ({
					agents: state.agents.map((agent) => (agent.id === parsed.id ? touch(parsed) : agent)),
					selectedAgentId: parsed.id,
				}));

				return parsed;
			},

			duplicateAgent: (agentId) => {
				const source = get().agents.find((agent) => agent.id === agentId);
				if (!source) {
					return null;
				}

				const duplicate = createAgentCopy(source, {
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
					const nextSocieties = removeAgentFromAllSocieties(state.societies, agentId);

					return {
						agents: nextAgents,
						societies: nextSocieties,
						selectedAgentId: getNextSelection(nextAgents, agentId),
					};
				});
			},

			resetAgents: () => {
				set({
					agents: [],
					selectedAgentId: null,
				});
			},

			createSociety: (input) => {
				const createdSociety = createSocietyFromInput(input);

				set((state) => ({
					societies: [...state.societies, createdSociety],
					selectedSocietyId: createdSociety.id,
				}));

				return createdSociety;
			},

			updateSociety: (input) => {
				const parsed = societySchema.parse(input);

				set((state) => ({
					societies: state.societies.map((society) => (society.id === parsed.id ? touch(parsed) : society)),
					selectedSocietyId: parsed.id,
				}));

				return parsed;
			},

			duplicateSociety: (societyId) => {
				const source = get().societies.find((society) => society.id === societyId);
				if (!source) {
					return null;
				}

				const duplicate = createSocietyCopy(source, {
					name: `${source.name} Copy`,
				});

				set((state) => ({
					societies: [...state.societies, duplicate],
					selectedSocietyId: duplicate.id,
				}));

				return duplicate;
			},

			deleteSociety: (societyId) => {
				set((state) => {
					const nextSocieties = state.societies.filter((society) => society.id !== societyId);
					return {
						societies: nextSocieties,
						selectedSocietyId: getNextSelection(nextSocieties, societyId),
					};
				});
			},

			addAgentToSociety: (societyId, agentId) => {
				set((state) => ({
					societies: state.societies.map((society) => {
						if (society.id !== societyId || society.agentIds.includes(agentId)) {
							return society;
						}

						return touch({
							...society,
							agentIds: [...society.agentIds, agentId],
						});
					}),
				}));
			},

			removeAgentFromSociety: (societyId, agentId) => {
				set((state) => ({
					societies: state.societies.map((society) => {
						if (society.id !== societyId) {
							return society;
						}

						return touch({
							...society,
							agentIds: society.agentIds.filter((memberId) => memberId !== agentId),
						});
					}),
				}));
			},

			moveAgentInSociety: (societyId, fromIndex, toIndex) => {
				set((state) => ({
					societies: state.societies.map((society) => {
						if (society.id !== societyId) {
							return society;
						}

						return touch({
							...society,
							agentIds: moveItem(society.agentIds, fromIndex, toIndex),
						});
					}),
				}));
			},

			resetAll: () => {
				set({
					agents: [],
					societies: [],
					selectedAgentId: null,
					selectedSocietyId: null,
				});
			},
		}),
		{
			name: "society-builder-state",
			storage,
			version: 1,
			partialize: (state) => ({
				agents: state.agents,
				societies: state.societies,
				selectedAgentId: state.selectedAgentId,
				selectedSocietyId: state.selectedSocietyId,
			}),
			skipHydration: true,
		},
	),
);
