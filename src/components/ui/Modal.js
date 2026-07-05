"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "./cn";

/**
 * Animated glass modal. Replaces the ad-hoc overlay markup in ExportDialog /
 * ContentEditor. Handles Escape-to-close, body scroll lock, backdrop blur,
 * and enter/exit animation via AnimatePresence.
 *
 * Props:
 *  - open, onClose, title, footer, size ("md" | "lg" | "xl")
 */
const SIZES = {
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-5xl",
};

export function Modal({ open, onClose, title, footer, size = "md", children, className }) {
    const reduce = useReducedMotion();

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                >
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                        aria-hidden
                    />
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        className={cn(
                            "relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-panel border border-glass-border-strong bg-navy-800 shadow-glass-xl",
                            SIZES[size] ?? SIZES.md,
                            className
                        )}
                        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
                        animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }}
                        transition={{ type: "spring", stiffness: 260, damping: 26 }}
                    >
                        {title && (
                            <div className="flex items-center justify-between gap-3 border-b border-glass-border px-6 py-4">
                                <h2 className="text-lg font-semibold text-ink">{title}</h2>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-xl border border-glass-border p-2 text-ink-subtle transition hover:bg-glass hover:text-ink"
                                    aria-label="Close"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
                        {footer && (
                            <div className="border-t border-glass-border bg-glass px-6 py-4">{footer}</div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
