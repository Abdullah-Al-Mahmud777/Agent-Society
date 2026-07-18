"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Sparkles, Users, Wrench, Home, Settings, Menu, X } from "lucide-react";
import { cn } from "@/components/ui/cn";

const LINKS = [
    { href: "/", label: "Home", icon: Home },
    { href: "/builder", label: "Builder", icon: Wrench },
    { href: "/society", label: "Society", icon: Users },
    { href: "/providers", label: "Providers", icon: Settings },
];

function isActive(pathname, href) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavBar() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="sticky top-0 z-50 px-4 pt-4">
            <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/80 px-4 py-3 shadow-lg backdrop-blur-xl sm:px-6">
                {/* Brand */}
                <Link href="/" className="group flex items-center gap-2.5">
                    <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 ring-1 ring-primary-500/30 transition-all group-hover:ring-primary-500/50">
                        <Sparkles className="h-5 w-5 text-primary-400" />
                    </span>
                    <div className="flex flex-col">
                        <span className="text-base font-semibold tracking-tight text-white">
                            Agent<span className="text-neutral-400">Society</span>
                        </span>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Multi-Agent Platform</span>
                    </div>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-1">
                    {LINKS.map(({ href, label, icon: Icon }) => {
                        const active = isActive(pathname, href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                                    active 
                                        ? "bg-primary-500/10 text-primary-400" 
                                        : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{label}</span>
                                {active && (
                                    <motion.div
                                        layoutId="nav-indicator"
                                        className="absolute inset-0 rounded-xl bg-primary-500/10 ring-1 ring-primary-500/20"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden flex items-center justify-center p-2 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </nav>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="md:hidden mt-2 rounded-2xl border border-neutral-800 bg-neutral-900 p-2 shadow-xl"
                >
                    {LINKS.map(({ href, label, icon: Icon }) => {
                        const active = isActive(pathname, href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                                    active 
                                        ? "bg-primary-500/10 text-primary-400" 
                                        : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{label}</span>
                            </Link>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
}
