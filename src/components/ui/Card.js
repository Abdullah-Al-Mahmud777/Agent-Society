"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "./cn";

const SURFACE = {
    default: "bg-glass border-glass-border shadow-glass-lg",
    strong: "bg-glass-strong border-glass-border-strong shadow-glass-lg",
    panel: "bg-glass border-glass-border shadow-glass-xl",
    bare: "bg-black/15 border-glass-border",
};

const RADIUS = {
    card: "rounded-card",
    panel: "rounded-panel",
};

/**
 * Glass panel primitive. Consolidates the ubiquitous
 * `rounded-3xl border border-white/10 bg-white/5 shadow-[...] backdrop-blur-xl`.
 *
 * Props:
 *  - variant: "default" | "strong" | "panel" | "bare"
 *  - radius: "card" | "panel"
 *  - interactive: adds a subtle hover-lift (motion)
 *  - glow: hex color for a soft top accent glow
 */
export function Card({
    children,
    variant = "default",
    radius = "card",
    interactive = false,
    glow,
    className,
    ...rest
}) {
    const reduce = useReducedMotion();
    const base = cn(
        "relative border backdrop-blur-glass",
        SURFACE[variant] ?? SURFACE.default,
        RADIUS[radius] ?? RADIUS.card,
        className
    );

    const glowNode = glow ? (
        <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-px h-px opacity-70"
            style={{ background: `linear-gradient(90deg, transparent, ${glow}, transparent)` }}
        />
    ) : null;

    if (interactive && !reduce) {
        return (
            <motion.div
                className={base}
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                {...rest}
            >
                {glowNode}
                {children}
            </motion.div>
        );
    }

    return (
        <div className={base} {...rest}>
            {glowNode}
            {children}
        </div>
    );
}

export function CardHeader({ children, className }) {
    return <div className={cn("flex flex-col gap-2", className)}>{children}</div>;
}

export function CardTitle({ children, className }) {
    return <h2 className={cn("text-lg font-semibold text-ink", className)}>{children}</h2>;
}

export function CardContent({ children, className }) {
    return <div className={cn("mt-4", className)}>{children}</div>;
}
