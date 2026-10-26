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
    const isAuthPage = pathname === "/login" || pathname === "/register";
    const isChatPage = pathname === "/society";
    const needsAgentStore = pathname === "/builder";

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <div className={isChatPage ? "h-dvh overflow-hidden" : undefined}>
            {needsAgentStore && <StoreHydrator />}
            {!isChatPage && <NavBar />}
            <div
                key={pathname}
                className={isChatPage ? "h-full min-h-0" : undefined}
            >
                {children}
            </div>
        </div>
    );
}
