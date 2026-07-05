"use client";

import { motion, useReducedMotion } from "motion/react";

// Preview roster — static, no store/localStorage needed.
const NODES = [
    { icon: "👑", label: "CEO", color: "#22c55e", x: 50, y: 18 },
    { icon: "📈", label: "Research", color: "#0ea5e9", x: 84, y: 42 },
    { icon: "🎯", label: "Product", color: "#f59e0b", x: 72, y: 82 },
    { icon: "💰", label: "Finance", color: "#a855f7", x: 28, y: 82 },
    { icon: "📣", label: "Marketing", color: "#f43f5e", x: 16, y: 42 },
];

// Edges between agents (indices into NODES) — the "debate" web.
const EDGES = [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [1, 2], [2, 3], [3, 4], [4, 1],
];

export default function AgentConstellation() {
    const reduce = useReducedMotion();

    return (
        <div className="relative mx-auto aspect-square w-full max-w-md">
            {/* Soft central glow */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-40 w-40 rounded-full bg-brand-cyan/20 blur-3xl" />
            </div>

            {/* Connection web */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                <defs>
                    <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.5" />
                    </linearGradient>
                </defs>
                {EDGES.map(([a, b], i) => (
                    <motion.line
                        key={i}
                        x1={NODES[a].x}
                        y1={NODES[a].y}
                        x2={NODES[b].x}
                        y2={NODES[b].y}
                        stroke="url(#edge)"
                        strokeWidth="0.4"
                        initial={reduce ? { opacity: 0.35 } : { pathLength: 0, opacity: 0 }}
                        animate={reduce ? { opacity: 0.35 } : { pathLength: 1, opacity: 0.35 }}
                        transition={{ duration: 1.1, delay: 0.3 + i * 0.08, ease: "easeOut" }}
                    />
                ))}
            </svg>

            {/* Agent nodes */}
            {NODES.map((node, i) => (
                <motion.div
                    key={node.label}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
                    animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.2 + i * 0.1 }}
                >
                    <motion.div
                        animate={reduce ? undefined : { y: [0, -6, 0] }}
                        transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
                        className="flex flex-col items-center gap-1.5"
                    >
                        <div
                            className="flex h-14 w-14 items-center justify-center rounded-2xl border text-2xl backdrop-blur-glass"
                            style={{
                                backgroundColor: `${node.color}1f`,
                                borderColor: `${node.color}55`,
                                boxShadow: `0 0 24px ${node.color}33`,
                            }}
                        >
                            {node.icon}
                        </div>
                        <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-ink-subtle">
                            {node.label}
                        </span>
                    </motion.div>
                </motion.div>
            ))}
        </div>
    );
}
