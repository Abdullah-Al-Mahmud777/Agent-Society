"use client";

import { useEffect } from "react";
import { useAgentBuilderStore } from "@/store/agent-builder-store";

/**
 * Loads account-scoped agents from Turso once for every protected route.
 * No user data is read from browser storage, so switching accounts cannot
 * expose another user's agents or memory.
 */
export default function StoreHydrator() {
    useEffect(() => {
        const hydrate = async () => {
            await useAgentBuilderStore.getState().hydrateAgents();
        };

        void hydrate();
    }, []);

    return null;
}
