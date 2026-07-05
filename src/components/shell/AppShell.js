"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import NavBar from "./NavBar";
import StoreHydrator from "./StoreHydrator";

/**
 * Client shell wrapping every route: triggers store rehydration, renders the
 * persistent glass nav, and animates page transitions keyed on pathname.
 * The server `layout.js` stays a Server Component (metadata + fonts).
 */
export default function AppShell({ children }) {
    const pathname = usePathname();
    const reduce = useReducedMotion();

    return (
        <>
            <StoreHydrator />
            <NavBar />
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={pathname}
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </>
    );
}
