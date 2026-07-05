import { cn } from "./cn";

/**
 * Loading shimmer. A subtle animated gradient sweep over a glass surface.
 */
export function Skeleton({ className }) {
    return (
        <div
            className={cn(
                "overflow-hidden rounded-2xl bg-glass",
                "bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_25%,rgba(255,255,255,0.08)_37%,rgba(255,255,255,0.02)_63%)]",
                "bg-[length:200%_100%] animate-shimmer",
                className
            )}
        />
    );
}
