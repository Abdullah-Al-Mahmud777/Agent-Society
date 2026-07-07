"use client";

import { usePathname } from "next/navigation";
import NavBar from "./NavBar";
import StoreHydrator from "./StoreHydrator";

/**
 * Client shell wrapping every route: triggers store rehydration, renders the
 * persistent glass nav, and handles page transitions.
 */
export default function AppShell({ children }) {
    const pathname = usePathname();

    return (
        <>
            <StoreHydrator />
            <NavBar />
            {/* Remove animations completely - they cause blank screens during navigation */}
            <div key={pathname}>
                {children}
            </div>
        </>
    );
}
