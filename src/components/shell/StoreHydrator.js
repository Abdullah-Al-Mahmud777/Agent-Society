"use client";

import { useEffect } from "react";
import { useAgentBuilderStore } from "@/store/agent-builder-store";
import { useMemoryStore } from "@/store/memory-store";

/**
 * Both Zustand stores use `skipHydration: true`. This triggers a one-time
 * rehydrate for every route from a single place in the app shell.
 * Screens still gate their own render on a local `hydrated` flag to avoid
 * flashing starter/fallback data.
 */
export default function StoreHydrator() {
    useEffect(() => {
        void useAgentBuilderStore.persist.rehydrate();
        void useMemoryStore.persist.rehydrate();
    }, []);

    return null;
}
