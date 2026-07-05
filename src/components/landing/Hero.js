"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Wrench, Brain, Network, History } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import AgentConstellation from "./AgentConstellation";

const PILLARS = [
    {
        icon: Brain,
        title: "Distinct personalities",
        body: "Each agent has its own risk appetite, reasoning style, values, and voice — so no two see a problem the same way.",
        tone: "cyan",
    },
    {
        icon: History,
        title: "Long-term memory",
        body: "Agents remember past debates and conclusions, referencing their own experience as the society evolves.",
        tone: "violet",
    },
    {
        icon: Network,
        title: "Real debate",
        body: "Agents respond to each other, challenge conclusions, and change their minds — then an orchestrator synthesizes.",
        tone: "pink",
    },
];

function fadeUp(delay, shouldAnimate) {
    return {
        initial: shouldAnimate ? { opacity: 0, y: 16 } : { opacity: 1, y: 0 },
        animate: { opacity: 1, y: 0 },
        transition: shouldAnimate ? { duration: 0.5, delay, ease: "easeOut" } : { duration: 0 },
    };
}

export default function Hero() {
    const reduce = useReducedMotion();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent hydration mismatch by disabling animations until mounted
    const shouldAnimate = mounted && !reduce;

    return (
        <main className="relative min-h-screen overflow-hidden bg-navy-900 text-ink">
            {/* Atmospheric backdrop */}
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.14),_transparent_30%),radial-gradient(circle_at_bottom,_rgba(244,114,182,0.08),_transparent_40%),linear-gradient(180deg,_#0b1526_0%,_#07111f_100%)]" />

            <div className="mx-auto w-full max-w-7xl px-5 pt-16 sm:px-8 lg:px-10">
                {/* Hero grid */}
                <section className="grid items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
                    <div>
                        <motion.div {...fadeUp(0, shouldAnimate)}>
                            <Badge tone="cyan" uppercase>Multi-agent orchestration</Badge>
                        </motion.div>

                        <motion.h1
                            {...fadeUp(0.08, shouldAnimate)}
                            className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl"
                        >
                            A society of AI agents that{" "}
                            <span className="bg-gradient-to-r from-brand-cyan via-cyan-300 to-brand-violet bg-clip-text text-transparent">
                                debate and decide.
                            </span>
                        </motion.h1>

                        <motion.p
                            {...fadeUp(0.16, shouldAnimate)}
                            className="mt-6 max-w-xl text-base leading-8 text-ink-muted sm:text-lg"
                        >
                            Not isolated chatbots — distinct individuals with personality, expertise, and
                            long-term memory. They collaborate, challenge one another, and reason toward
                            conclusions like a team of human experts.
                        </motion.p>

                        <motion.div {...fadeUp(0.24, shouldAnimate)} className="mt-9 flex flex-wrap gap-3">
                            <Link
                                href="/society"
                                className="group inline-flex items-center gap-2 rounded-pill bg-white px-6 py-3 text-sm font-semibold text-navy-900 shadow-[0_8px_30px_rgba(34,211,238,0.2)] transition hover:bg-cyan-200"
                            >
                                Enter the Society
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                            <Link
                                href="/builder"
                                className="inline-flex items-center gap-2 rounded-pill border border-glass-border-strong bg-glass px-6 py-3 text-sm font-medium text-ink-muted backdrop-blur-glass transition hover:bg-glass-strong hover:text-ink"
                            >
                                <Wrench className="h-4 w-4" />
                                Build agents
                            </Link>
                        </motion.div>
                    </div>

                    {/* Constellation visual */}
                    <motion.div
                        initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : { opacity: 1, scale: 1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={shouldAnimate ? { duration: 0.7, delay: 0.1, ease: "easeOut" } : { duration: 0 }}
                    >
                        <AgentConstellation />
                    </motion.div>
                </section>

                {/* Pillars */}
                <section className="grid gap-5 pb-24 md:grid-cols-3">
                    {PILLARS.map((p, i) => {
                        const Icon = p.icon;
                        return (
                            <motion.div
                                key={p.title}
                                {...fadeUp(0.3 + i * 0.1, shouldAnimate)}
                                className="rounded-card border border-glass-border bg-glass p-6 shadow-glass-lg backdrop-blur-glass"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-glass-border bg-glass-strong">
                                    <Icon className="h-5 w-5 text-cyan-200" />
                                </div>
                                <h3 className="mt-4 text-base font-semibold text-ink">{p.title}</h3>
                                <p className="mt-2 text-sm leading-6 text-ink-muted">{p.body}</p>
                            </motion.div>
                        );
                    })}
                </section>
            </div>
        </main>
    );
}
