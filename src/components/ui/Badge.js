import { cn } from "./cn";

const TONES = {
    neutral: "border-glass-border bg-glass text-ink-muted",
    cyan: "border-brand-cyan/25 bg-brand-cyan/10 text-cyan-200",
    violet: "border-brand-violet/25 bg-brand-violet/10 text-violet-200",
    pink: "border-brand-pink/25 bg-brand-pink/10 text-pink-200",
    amber: "border-amber-400/25 bg-amber-400/10 text-amber-200",
    emerald: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    rose: "border-rose-400/25 bg-rose-400/10 text-rose-200",
};

/**
 * Pill / status badge. Replaces the repeated
 * `rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs ...`.
 *
 * Props:
 *  - tone: neutral | cyan | violet | pink | amber | emerald | rose
 *  - uppercase: adds tracking + uppercase (label style)
 */
export function Badge({ children, tone = "neutral", uppercase = false, className, ...rest }) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 text-xs font-medium",
                uppercase && "uppercase tracking-[0.2em] text-[10px]",
                TONES[tone] ?? TONES.neutral,
                className
            )}
            {...rest}
        >
            {children}
        </span>
    );
}
