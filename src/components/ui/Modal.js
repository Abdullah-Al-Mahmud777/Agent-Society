"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "./cn";

const SIZES = {
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-5xl",
};

export function Modal({ open, onClose, title, footer, size = "md", children, className }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (event) => {
            if (event.key === "Escape") onClose?.();
        };
        document.addEventListener("keydown", onKey);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = previousOverflow;
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="animate-modal-backdrop absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden
            />
            <div
                role="dialog"
                aria-modal="true"
                className={cn(
                    "animate-modal-panel relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-panel border border-glass-border-strong bg-navy-800 shadow-glass-xl",
                    SIZES[size] ?? SIZES.md,
                    className
                )}
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
            </div>
        </div>
    );
}
