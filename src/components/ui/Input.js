"use client";

import { cn } from "./cn";

const FIELD_BASE =
    "w-full min-w-0 max-w-full rounded-2xl border border-glass-border bg-navy-950/80 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand-cyan/60 focus:ring-2 focus:ring-brand-cyan/20 disabled:opacity-40";

/**
 * Field wrapper — label + control + error + hint.
 * Replaces the repeated FormField pattern.
 */
export function Field({ label, error, hint, children, className }) {
    return (
        <label className={cn("block w-full min-w-0 max-w-full space-y-2 overflow-hidden", className)}>
            {(label || hint) && (
                <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2 overflow-hidden">
                    {label && <span className="min-w-0 break-words text-sm font-medium text-ink-muted">{label}</span>}
                    {hint && <span className="min-w-0 break-words text-xs text-ink-subtle">{hint}</span>}
                </div>
            )}
            <div className="w-full min-w-0 max-w-full overflow-hidden">{children}</div>
            {error && <p className="break-words text-sm text-rose-300">{error}</p>}
        </label>
    );
}

export function Input({ className, ...rest }) {
    return <input className={cn(FIELD_BASE, className)} {...rest} />;
}

export function Textarea({ className, rows = 4, onFocus, onBlur, onWheel, onChange, ...rest }) {
    const handleFocus = (e) => {
        onFocus?.(e);
    };

    const handleBlur = (e) => {
        onBlur?.(e);
    };

    const handleWheel = (e) => {
        const target = e.currentTarget;
        const atTop = target.scrollTop === 0;
        const atBottom = target.scrollHeight - target.scrollTop === target.clientHeight;
        
        // Prevent parent scroll when scrolling inside textarea
        if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
            return;
        }
        
        e.stopPropagation();
        onWheel?.(e);
    };

    const handleChange = (e) => {
        // Auto-resize textarea height
        const target = e.currentTarget;
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`;
        
        onChange?.(e);
    };

    return (
        <textarea 
            className={cn(
                FIELD_BASE, 
                "min-h-[80px] resize-none overflow-y-auto",
                className
            )} 
            rows={rows}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onWheel={handleWheel}
            onChange={handleChange}
            style={{ 
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
                whiteSpace: 'pre-wrap',
                maxWidth: '100%',
                width: '100%'
            }}
            {...rest} 
        />
    );
}

export function Select({ className, children, ...rest }) {
    return (
        <select className={cn(FIELD_BASE, "cursor-pointer", className)} {...rest}>
            {children}
        </select>
    );
}
