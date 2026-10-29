"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Users, Home, Menu, X } from "lucide-react";
import { cn } from "@/components/ui/cn";

const LINKS = [
    { href: "/", label: "Home", icon: Home },
    { href: "/society", label: "Society", icon: Users },
];

function isActive(pathname, href) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavBar() {
    const pathname = usePathname();
    const [mobileMenu, setMobileMenu] = useState({ path: pathname, open: false });
    const mobileMenuOpen = mobileMenu.open && mobileMenu.path === pathname;
    const toggleMobileMenu = () =>
        setMobileMenu({ path: pathname, open: !mobileMenuOpen });

    return (
        <div className="sticky top-0 z-50 shrink-0 px-4 pt-4">
            <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/90 px-4 py-3 shadow-lg sm:px-6">
                <Link href="/" prefetch={false} className="group flex items-center gap-2.5">
                    <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 ring-1 ring-primary-500/30 transition-all group-hover:ring-primary-500/50">
                        <Sparkles className="h-5 w-5 text-primary-400" />
                    </span>
                    <div className="flex flex-col">
                        <span className="text-base font-semibold tracking-tight text-white">
                            Agent<span className="text-neutral-400">Society</span>
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-neutral-500">Multi-Agent Platform</span>
                    </div>
                </Link>

                <div className="hidden items-center gap-1 md:flex">
                    {LINKS.map(({ href, label, icon: Icon }) => {
                        const active = isActive(pathname, href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                prefetch={false}
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                    "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                                    active
                                        ? "bg-primary-500/10 text-primary-400 ring-1 ring-primary-500/20"
                                        : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{label}</span>
                            </Link>
                        );
                    })}
                </div>

                <button
                    type="button"
                    onClick={toggleMobileMenu}
                    className="flex items-center justify-center rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white md:hidden"
                    aria-label="Toggle menu"
                    aria-expanded={mobileMenuOpen}
                    aria-controls="mobile-navigation"
                >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </nav>

            {mobileMenuOpen && (
                <div
                    id="mobile-navigation"
                    className="animate-menu-in mt-2 rounded-2xl border border-neutral-800 bg-neutral-900 p-2 shadow-xl md:hidden"
                >
                    {LINKS.map(({ href, label, icon: Icon }) => {
                        const active = isActive(pathname, href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                prefetch={false}
                                aria-current={active ? "page" : undefined}
                                onClick={() => setMobileMenu({ path: pathname, open: false })}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
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
                </div>
            )}
        </div>
    );
}
