"use client";

import { cn } from "./cn";

const FIELD_BASE =
    "w-full rounded-2xl border border-glass-border bg-navy-950/80 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand-cyan/60 focus:ring-2 focus:ring-brand-cyan/20 disabled:opacity-40";

/**
 * Field wrapper — label + control + error + hint.
 * Replaces the repeated FormField pattern.
 */
export function Field({ label, error, hint, children, className }) {
    return (
        <label className={cn("block space-y-2", className)}>
            {(label || hint) && (
                <div className="flex items-center justify-between gap-3">
                    {label && <span className="text-sm font-medium text-ink-muted">{label}</span>}
                    {hint && <span className="text-xs text-ink-subtle">{hint}</span>}
                </div>
            )}
            {children}
            {error && <p className="text-sm text-rose-300">{error}</p>}
        </label>
    );
}

export function Input({ className, ...rest }) {
    return <input className={cn(FIELD_BASE, className)} {...rest} />;
}

export function Textarea({ className, ...rest }) {
    return <textarea className={cn(FIELD_BASE, "resize-none", className)} {...rest} />;
}

export function Select({ className, children, ...rest }) {
    return (
        <select className={cn(FIELD_BASE, className)} {...rest}>
            {children}
        </select>
    );
}
