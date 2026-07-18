"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Wrench, Brain, Network, History } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
        <main className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
            {/* Atmospheric backdrop */}
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.15),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.14),_transparent_30%),radial-gradient(circle_at_bottom,_rgba(244,114,182,0.08),_transparent_40%),linear-gradient(180deg,_#09090b_0%,_#0a0a0b_100%)]" />

            <div className="mx-auto w-full max-w-7xl px-5 pt-16 sm:px-8 lg:px-10">
                {/* Hero grid */}
                <section className="grid items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
                    <div>
                        <motion.div {...fadeUp(0, shouldAnimate)}>
                            <Badge variant="primary" size="sm">Multi-agent orchestration</Badge>
                        </motion.div>

                        <motion.h1
                            {...fadeUp(0.08, shouldAnimate)}
                            className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl"
                        >
                            A society of AI agents that{" "}
                            <span className="bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 bg-clip-text text-transparent">
                                debate and decide.
                            </span>
                        </motion.h1>

                        <motion.p
                            {...fadeUp(0.16, shouldAnimate)}
                            className="mt-6 max-w-xl text-base leading-8 text-neutral-400 sm:text-lg"
                        >
                            Not isolated chatbots — distinct individuals with personality, expertise, and
                            long-term memory. They collaborate, challenge one another, and reason toward
                            conclusions like a team of human experts.
                        </motion.p>

                        <motion.div {...fadeUp(0.24, shouldAnimate)} className="mt-9 flex flex-wrap gap-3">
                            <Button
                                variant="primary"
                                size="lg"
                                href="/society"
                                className="group"
                            >
                                Enter the Society
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </Button>
                            <Button
                                variant="secondary"
                                size="lg"
                                href="/builder"
                            >
                                <Wrench className="h-4 w-4" />
                                Build agents
                            </Button>
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
                                className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-6 backdrop-blur-xl"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-700 bg-neutral-800">
                                    <Icon className="h-5 w-5 text-primary-400" />
                                </div>
                                <h3 className="mt-4 text-base font-semibold text-white">{p.title}</h3>
                                <p className="mt-2 text-sm leading-6 text-neutral-400">{p.body}</p>
                            </motion.div>
                        );
                    })}
                </section>
            </div>
        </main>
    );
}
