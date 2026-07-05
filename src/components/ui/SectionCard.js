import { cn } from "./cn";
import { Card } from "./Card";

/**
 * Titled glass section. Replaces the SectionCard pattern used across the
 * Society screen (title + body inside a glass panel).
 *
 * Props:
 *  - title, eyebrow (small uppercase label above title), action (right slot)
 */
export function SectionCard({ title, eyebrow, action, children, className, ...rest }) {
    return (
        <Card variant="default" className={cn("p-6", className)} {...rest}>
            {(title || action) && (
                <div className="flex items-start justify-between gap-4">
                    <div>
                        {eyebrow && (
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-subtle">
                                {eyebrow}
                            </p>
                        )}
                        {title && (
                            <h2 className={cn("text-lg font-semibold text-ink", eyebrow && "mt-2")}>
                                {title}
                            </h2>
                        )}
                    </div>
                    {action}
                </div>
            )}
            <div className={cn(title || action ? "mt-4" : undefined)}>{children}</div>
        </Card>
    );
}
