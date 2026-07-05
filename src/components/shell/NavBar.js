"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Sparkles, Users, Wrench, Home } from "lucide-react";
import { cn } from "@/components/ui/cn";

const LINKS = [
    { href: "/", label: "Home", icon: Home },
    { href: "/builder", label: "Builder", icon: Wrench },
    { href: "/society", label: "Society", icon: Users },
];

function isActive(pathname, href) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavBar() {
    const pathname = usePathname();

    return (
        <div className="sticky top-0 z-40 px-4 pt-4">
            <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 rounded-pill border border-glass-border bg-navy-900/70 px-4 py-2.5 shadow-glass backdrop-blur-glass-xl sm:px-6">
                {/* Brand */}
                <Link href="/" className="group flex items-center gap-2.5">
                    <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-cyan/30 to-brand-violet/30 ring-1 ring-glass-border-strong">
                        <Sparkles className="h-4 w-4 text-cyan-200" />
                    </span>
                    <span className="text-sm font-semibold tracking-tight text-ink">
                        Agent<span className="text-ink-subtle">Society</span>
                    </span>
                </Link>

                {/* Links */}
                <div className="flex items-center gap-1">
                    {LINKS.map(({ href, label, icon: Icon }) => {
                        const active = isActive(pathname, href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "relative flex items-center gap-2 rounded-pill px-3 py-2 text-sm font-medium transition-colors sm:px-4",
                                    active ? "text-ink" : "text-ink-subtle hover:text-ink"
                                )}
                            >
                                {active && (
                                    <motion.span
                                        layoutId="nav-active"
                                        className="absolute inset-0 -z-10 rounded-pill border border-glass-border-strong bg-glass-strong"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}
                                <Icon className="h-4 w-4" />
                                <span className="hidden sm:inline">{label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
