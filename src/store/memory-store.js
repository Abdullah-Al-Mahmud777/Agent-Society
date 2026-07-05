import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const storageFallback = {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
};

export const useMemoryStore = create(
    persist(
        (set, get) => ({
            memories: [],

            addMemories: (entries) => {
                set((state) => {
                    const existingIds = new Set(state.memories.map((m) => m.id));
                    const fresh = entries.filter((m) => !existingIds.has(m.id));
                    if (!fresh.length) return state;
                    return { memories: [...state.memories, ...fresh] };
                });
            },

            getAgentMemories: (agentId) => {
                return get().memories.filter((m) => m.agentId === agentId);
            },

            clearAgentMemories: (agentId) => {
                set((state) => ({
                    memories: state.memories.filter((m) => m.agentId !== agentId),
                }));
            },

            clearAllMemories: () => set({ memories: [] }),
        }),
        {
            name: "agent-society-memories",
            storage: createJSONStorage(() => {
                if (typeof globalThis === "undefined" || typeof globalThis.localStorage === "undefined") {
                    return storageFallback;
                }
                return window.localStorage;
            }),
            skipHydration: true,
        }
    )
);
