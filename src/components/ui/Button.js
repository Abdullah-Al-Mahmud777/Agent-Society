"use client";

import Link from "next/link";
import { cn } from "./cn";

const VARIANTS = {
    primary:
        "bg-white text-navy-900 font-semibold hover:bg-cyan-200 shadow-[0_8px_30px_rgba(34,211,238,0.15)]",
    secondary:
        "border border-glass-border text-ink-muted hover:border-glass-border-strong hover:bg-glass hover:text-ink",
    ghost: "text-ink-subtle hover:text-ink hover:bg-glass",
    danger: "border border-rose-400/30 text-rose-200 hover:bg-rose-400/10",
    accent:
        "bg-brand-cyan/15 border border-brand-cyan/30 text-cyan-100 hover:bg-brand-cyan/25 hover:border-brand-cyan/50",
};

const SIZES = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-sm",
    icon: "p-2",
};

function Spinner() {
    return (
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
    );
}

/**
 * Button primitive. Consolidates button and link actions into one consistent
 * control without shipping a client animation library.
 */
export function Button({
    children,
    variant = "secondary",
    size = "md",
    loading = false,
    disabled = false,
    className,
    type = "button",
    href,
    ...rest
}) {
    const isDisabled = disabled || loading;

    const classes = cn(
        "inline-flex items-center justify-center gap-2 rounded-pill transition-[color,background-color,border-color,transform] duration-150 outline-none",
        "active:scale-[0.98] motion-reduce:transform-none",
        "focus-visible:ring-2 focus-visible:ring-brand-cyan/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant] ?? VARIANTS.secondary,
        SIZES[size] ?? SIZES.md,
        className
    );

    if (href) {
        return (
            <Link
                href={href}
                className={classes}
                aria-disabled={isDisabled || undefined}
                {...rest}
            >
                {loading && <Spinner />}
                {children}
            </Link>
        );
    }

    return (
        <button type={type} className={classes} disabled={isDisabled} {...rest}>
            {loading && <Spinner />}
            {children}
        </button>
    );
}
