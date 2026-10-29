"use client";

import { usePathname } from "next/navigation";
import NavBar from "./NavBar";

/**
 * Client shell wrapping every route: renders the persistent glass nav and
 * handles page transitions.
 */
export default function AppShell({ children }) {
    const pathname = usePathname();
    const isAuthPage = pathname === "/login" || pathname === "/register";
    const isChatPage = pathname === "/society";

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <div className={isChatPage ? "h-dvh overflow-hidden" : undefined}>
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
