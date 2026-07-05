"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
    Play,
    RotateCcw,
    Crown,
    ChevronDown,
    Brain,
    AlertCircle,
    Network,
    Sparkles,
} from "lucide-react";
import { useAgentBuilderStore } from "@/store/agent-builder-store";
import { useMemoryStore } from "@/store/memory-store";
import { Card } from "@/components/ui/Card";
import { SectionCard } from "@/components/ui/SectionCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/components/ui/cn";

const FALLBACK_ROSTER = [
    { name: "CEO Agent", role: "Orchestrator", icon: "👑", color: "#22c55e", description: "Coordinates the council and synthesizes the final recommendation." },
    { name: "Market Research Agent", role: "Demand scout", icon: "📈", color: "#0ea5e9", description: "Checks customer demand, competitors, and market gaps." },
    { name: "Product Manager Agent", role: "MVP planner", icon: "🎯", color: "#f59e0b", description: "Converts the idea into a product scope and roadmap." },
    { name: "Financial Analyst Agent", role: "Viability check", icon: "💰", color: "#a855f7", description: "Estimates costs, revenue, runway, and financial risk." },
    { name: "Marketing Agent", role: "Go-to-market", icon: "📣", color: "#f43f5e", description: "Defines positioning, launch channels, and messaging." },
    { name: "Investor Agent", role: "Funding lens", icon: "💼", color: "#64748b", description: "Evaluates the startup for funding appeal and risk." },
];

const workflowSteps = [
    "User submits an idea.",
    "Orchestrator agent creates a plan and assigns specialist tasks.",
    "Specialist agents return structured findings independently.",
    "Agents debate — reacting to each other, agreeing and disagreeing.",
    "Orchestrator synthesizes everything into one final decision.",
];

// ─── Agent roster card ────────────────────────────────────────────────────────

function AgentCard({ agent, index }) {
    const reduce = useReducedMotion();
    return (
        <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4) }}
        >
            <Card interactive variant="default" className="p-5">
                <div className="h-1.5 w-20 rounded-full" style={{ backgroundColor: agent.color ?? "#22c55e" }} />
                <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-lg leading-none">{agent.icon}</span>
                        <h3 className="text-base font-semibold text-ink">{agent.name}</h3>
                    </div>
                    <span className="rounded-pill border border-glass-border px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-ink-subtle">
                        {agent.role}
                    </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink-muted">{agent.description}</p>
            </Card>
        </motion.div>
    );
}

// ─── Debate reaction (animated expand) ────────────────────────────────────────

function DebateSection({ debate }) {
    const [open, setOpen] = useState(false);
    const reduce = useReducedMotion();

    return (
        <div className="mt-3 overflow-hidden rounded-2xl border border-glass-border bg-black/20">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left"
            >
                <div className="flex items-center gap-2">
                    {debate.positionChanged ? (
                        <Badge tone="amber" uppercase>Position changed</Badge>
                    ) : (
                        <Badge tone="neutral" uppercase>Position held</Badge>
                    )}
                    <span className="text-xs text-ink-faint">Round 2 — debate reaction</span>
                </div>
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="h-4 w-4 text-ink-faint" />
                </motion.span>
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="content"
                        initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                        exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-3 border-t border-glass-border px-4 pb-4 pt-3">
                            {debate.agrees?.length > 0 && (
                                <div>
                                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400/70">Agrees with</div>
                                    <ul className="space-y-1">
                                        {debate.agrees.map((a, i) => (
                                            <li key={i} className="flex gap-2 text-sm leading-6 text-ink-muted">
                                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/60" />
                                                {a}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {debate.disagrees?.length > 0 && (
                                <div>
                                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-rose-400/70">Disagrees with</div>
                                    <ul className="space-y-1">
                                        {debate.disagrees.map((d, i) => (
                                            <li key={i} className="flex gap-2 text-sm leading-6 text-ink-muted">
                                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400/60" />
                                                {d}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {debate.updatedPosition && (
                                <div>
                                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                                        {debate.positionChanged ? "Updated position" : "Final position"}
                                    </div>
                                    <p className="text-sm leading-6 text-ink-muted italic">{debate.updatedPosition}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function SpecialistResultCard({ result }) {
    const hasError = Boolean(result.error);

    return (
        <div
            className="rounded-card border p-4"
            style={{
                borderColor: `${result.agentColor ?? "#64748b"}33`,
                backgroundColor: `${result.agentColor ?? "#64748b"}12`,
            }}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-sm"
                        style={{ backgroundColor: `${result.agentColor ?? "#64748b"}22` }}
                    >
                        {result.agentIcon}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                        {result.agentName}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {result.memoriesUsed > 0 && (
                        <Badge tone="violet">
                            <Brain className="h-3 w-3" />
                            {result.memoriesUsed}
                        </Badge>
                    )}
                    {result.confidence && !hasError && (
                        <Badge tone="neutral">{result.confidence}</Badge>
                    )}
                </div>
            </div>

            {hasError ? (
                <p className="mt-3 text-sm text-rose-400/80">{result.summary}</p>
            ) : (
                <>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-ink-muted">
                        {result.summary && (
                            <li className="flex gap-3">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-faint" />
                                <span>{result.summary}</span>
                            </li>
                        )}
                        {result.findings && result.findings !== "N/A" && (
                            <li className="flex gap-3">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-faint" />
                                <span>{result.findings}</span>
                            </li>
                        )}
                        {result.recommendation && result.recommendation !== "N/A" && (
                            <li className="flex gap-3">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-faint" />
                                <span className="italic text-ink-subtle">{result.recommendation}</span>
                            </li>
                        )}
                    </ul>
                    {result.debate && <DebateSection debate={result.debate} />}
                </>
            )}
        </div>
    );
}

function OrchestratorResultCard({ orchestrator, final }) {
    const reduce = useReducedMotion();
    return (
        <motion.div
            className="space-y-4"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="rounded-card border border-brand-cyan/25 bg-brand-cyan/10 p-4">
                <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-cyan-200" />
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
                        {orchestrator.agentName ?? "Orchestrator"} — final decision
                    </div>
                </div>
                <p className="mt-2 text-sm leading-7 text-ink">{final.summary}</p>
                {final.recommendation && (
                    <p className="mt-2 text-sm leading-6 text-cyan-200/70 italic">{final.recommendation}</p>
                )}
            </div>

            {final.keyDecisions?.length > 0 && (
                <div className="rounded-card border border-glass-border bg-glass p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-ink-subtle">Key decisions</div>
                    <ul className="mt-3 space-y-2">
                        {final.keyDecisions.map((d, i) => (
                            <li key={i} className="flex gap-3 text-sm leading-6 text-ink-muted">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cyan/60" />
                                <span>{d}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {final.nextSteps?.length > 0 && (
                <div className="rounded-card border border-glass-border bg-glass p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-ink-subtle">Next steps</div>
                    <ul className="mt-3 space-y-2">
                        {final.nextSteps.map((s, i) => (
                            <li key={i} className="flex gap-3 text-sm leading-6 text-ink-muted">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-glass-strong text-[11px] font-semibold text-ink-subtle">
                                    {i + 1}
                                </span>
                                <span>{s}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </motion.div>
    );
}

// ─── State helpers ────────────────────────────────────────────────────────────

function LoadingSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-28 w-full" />
            <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
            </div>
        </div>
    );
}

function IdlePlaceholder({ message }) {
    return (
        <div className="flex min-h-[120px] items-center justify-center rounded-card border border-dashed border-glass-border p-6">
            <p className="text-center text-sm text-ink-faint">{message}</p>
        </div>
    );
}

function ErrorBanner({ message }) {
    return (
        <div className="rounded-card border border-rose-400/25 bg-rose-400/10 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-300/80">
                <AlertCircle className="h-3.5 w-3.5" />
                Error
            </div>
            <p className="mt-1 text-sm leading-6 text-rose-200/80">{message}</p>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AgentSocietyClient() {
    const agents = useAgentBuilderStore((state) => state.agents);
    const memories = useMemoryStore((state) => state.memories);
    const addMemories = useMemoryStore((state) => state.addMemories);
    const [hydrated, setHydrated] = useState(false);
    const reduce = useReducedMotion();

    useEffect(() => {
        useAgentBuilderStore.persist.rehydrate();
        useMemoryStore.persist.rehydrate();
        setHydrated(true);
    }, []);

    const enabledAgents = hydrated ? agents.filter((a) => a.isEnabled) : [];
    const rosterAgents = hydrated && agents.length > 0 ? agents : FALLBACK_ROSTER;

    const [idea, setIdea] = useState("I want to build an AI startup");
    const [status, setStatus] = useState("idle"); // idle | loading | success | error
    const [result, setResult] = useState(null);
    const [apiError, setApiError] = useState(null);

    const handleRunCouncil = useCallback(async () => {
        const trimmed = idea.trim();
        if (!trimmed) return;

        if (!enabledAgents.length) {
            setApiError("No enabled agents found. Go to the Agent Builder and enable at least one agent.");
            setStatus("error");
            return;
        }

        setStatus("loading");
        setResult(null);
        setApiError(null);

        try {
            const response = await fetch("/api/agents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ businessIdea: trimmed, agents: enabledAgents, memories }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Request failed. Check that GEMINI_API_KEY is set.");
            }

            if (Array.isArray(data.newMemories) && data.newMemories.length > 0) {
                addMemories(data.newMemories);
            }
            setResult(data);
            setStatus("success");
        } catch (err) {
            setApiError(err.message);
            setStatus("error");
        }
    }, [idea, enabledAgents, memories, addMemories]);

    const specialists = result?.agents?.specialists ?? [];
    const orchestrator = result?.agents?.orchestrator ?? null;
    const final = result?.final ?? null;

    return (
        <main className="relative min-h-screen overflow-hidden bg-navy-900 text-ink">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.14),_transparent_28%),linear-gradient(180deg,_#0b1526_0%,_#07111f_100%)]" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-10 sm:px-8 lg:px-10">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <Card variant="strong" radius="panel" className="p-8" glow="#22d3ee">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="flex flex-wrap gap-2">
                                    <Badge tone="cyan" uppercase>Agent Society</Badge>
                                    <Badge tone="neutral" uppercase>Multi-agent orchestration</Badge>
                                    {hydrated && enabledAgents.length > 0 && (
                                        <Badge tone="emerald" uppercase>
                                            {enabledAgents.length} agent{enabledAgents.length !== 1 ? "s" : ""} active
                                        </Badge>
                                    )}
                                    {hydrated && enabledAgents.length >= 3 && (
                                        <Badge tone="violet" uppercase>2-round debate</Badge>
                                    )}
                                </div>
                                <h1 className="mt-5 text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-6xl">
                                    A society of AI agents that debate and decide.
                                </h1>
                                <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-muted sm:text-base">
                                    Each agent analyzes from its own perspective, then they debate one another. The
                                    orchestrator synthesizes every view into a final recommendation.
                                </p>
                            </div>
                            <div className="grid gap-2 rounded-card border border-brand-cyan/20 bg-brand-cyan/10 p-4 text-sm text-cyan-50">
                                <div className="flex items-center gap-2 font-semibold uppercase tracking-[0.25em] text-cyan-200/80">
                                    <Crown className="h-3.5 w-3.5" />
                                    Orchestrator
                                </div>
                                <div className="text-cyan-100/80">
                                    The CEO-role agent owns task routing, conflict resolution, and final synthesis.
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Input + Results */}
                <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                    <SectionCard title="Run the council">
                        <p className="text-sm leading-7 text-ink-muted">
                            Enter any idea. Your enabled agents will each analyze it from their own perspective,
                            debate one another, then the orchestrator synthesizes a final recommendation.
                        </p>
                        <div className="mt-5 space-y-3">
                            <label className="block text-sm font-medium text-ink-muted" htmlFor="idea">
                                Business idea
                            </label>
                            <Textarea
                                id="idea"
                                value={idea}
                                onChange={(e) => setIdea(e.target.value)}
                                rows={4}
                                placeholder="Describe your business idea..."
                            />
                        </div>
                        {!hydrated || enabledAgents.length === 0 ? (
                            <p className="mt-3 text-xs text-amber-400/70">
                                {!hydrated
                                    ? "Loading agents..."
                                    : "No enabled agents. Go to the Agent Builder and enable at least one."}
                            </p>
                        ) : (
                            <p className="mt-3 text-xs text-ink-faint">
                                {enabledAgents.length} agent{enabledAgents.length !== 1 ? "s" : ""} will run — configure them in the Agent Builder.
                            </p>
                        )}
                        <div className="mt-4 flex flex-wrap gap-3">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleRunCouncil}
                                loading={status === "loading"}
                                disabled={status === "loading" || !hydrated}
                            >
                                {status !== "loading" && <Play className="h-4 w-4" />}
                                {status === "loading" ? "Running council…" : "Run council"}
                            </Button>
                            <Button
                                variant="secondary"
                                size="lg"
                                onClick={() => setIdea("I want to build an AI startup")}
                            >
                                <RotateCcw className="h-4 w-4" />
                                Reset example
                            </Button>
                        </div>
                    </SectionCard>

                    <SectionCard title="Orchestrator summary">
                        {status === "idle" && (
                            <IdlePlaceholder message="Run the council to see the orchestrator's final decision." />
                        )}
                        {status === "loading" && <LoadingSkeleton />}
                        {status === "error" && <ErrorBanner message={apiError} />}
                        {status === "success" && orchestrator && final && (
                            <OrchestratorResultCard orchestrator={orchestrator} final={final} />
                        )}
                    </SectionCard>
                </section>

                {/* Agent roster */}
                <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {rosterAgents.map((agent, i) => (
                        <AgentCard key={agent.id ?? agent.name} agent={agent} index={i} />
                    ))}
                </section>

                {/* How data flows + Specialist outputs */}
                <section className="grid gap-8 xl:grid-cols-2">
                    <SectionCard
                        title="How data flows between agents"
                        eyebrow={null}
                    >
                        <div className="space-y-3">
                            {workflowSteps.map((step, index) => (
                                <div key={step} className="flex gap-4 rounded-card border border-glass-border bg-black/15 p-4">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-glass-strong text-sm font-semibold text-ink-muted">
                                        {index + 1}
                                    </div>
                                    <p className="text-sm leading-6 text-ink-muted">{step}</p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    <SectionCard
                        title={
                            status === "success" && result?.input?.businessIdea
                                ? `Specialist debate — "${result.input.businessIdea.slice(0, 42)}${result.input.businessIdea.length > 42 ? "…" : ""}"`
                                : "Specialist debate"
                        }
                    >
                        {status === "idle" && (
                            <IdlePlaceholder message="Specialist outputs will appear here after you run the council." />
                        )}
                        {status === "loading" && (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
                            </div>
                        )}
                        {status === "error" && (
                            <IdlePlaceholder message="No results — fix the error above and run again." />
                        )}
                        {status === "success" && specialists.length > 0 && (
                            <motion.div
                                className="space-y-4"
                                initial="hidden"
                                animate="show"
                                variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.1 } } }}
                            >
                                {specialists.map((s, i) => (
                                    <motion.div
                                        key={i}
                                        variants={{
                                            hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
                                            show: { opacity: 1, y: 0 },
                                        }}
                                        transition={{ duration: 0.35, ease: "easeOut" }}
                                    >
                                        <SpecialistResultCard result={s} />
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                        {status === "success" && specialists.length === 0 && (
                            <IdlePlaceholder message="Only one agent is enabled — add more specialist agents in the Builder to see the debate here." />
                        )}
                    </SectionCard>
                </section>

                {/* Memory activity */}
                <AnimatePresence>
                    {status === "success" && result?.newMemories?.length > 0 && (
                        <motion.div
                            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                        >
                            <Card variant="default" className="border-brand-violet/20 bg-brand-violet/8 p-6">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-violet-300/70">
                                            <Brain className="h-3.5 w-3.5" />
                                            Memory
                                        </p>
                                        <h2 className="mt-1 text-lg font-semibold text-ink">
                                            {result.newMemories.length} new {result.newMemories.length === 1 ? "memory" : "memories"} saved
                                        </h2>
                                        <p className="mt-1 text-sm text-ink-subtle">
                                            Agents will recall these in future debates on similar topics.
                                            {memories.length > 0 && ` Total stored: ${memories.length + result.newMemories.length}.`}
                                        </p>
                                    </div>
                                    {Object.values(result.memoriesInjected ?? {}).some((n) => n > 0) && (
                                        <Badge tone="violet">
                                            {Object.values(result.memoriesInjected).reduce((a, b) => a + b, 0)} injected this run
                                        </Badge>
                                    )}
                                </div>
                                <ul className="mt-4 space-y-2">
                                    {result.newMemories.map((m) => (
                                        <li key={m.id} className="flex items-start gap-3 rounded-card border border-glass-border bg-black/15 px-4 py-3">
                                            <Badge tone={m.type === "episodic" ? "cyan" : "violet"} uppercase>
                                                {m.type}
                                            </Badge>
                                            <div className="min-w-0 flex-1">
                                                <span className="text-xs font-medium text-ink-subtle">{m.agentName} · </span>
                                                <span className="text-sm text-ink-muted">{m.content.slice(0, 120)}{m.content.length > 120 ? "…" : ""}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer context strip */}
                <Card variant="default" radius="panel" className="p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
                                <Network className="h-4 w-4 text-cyan-200" />
                                How the orchestrator controls everything
                            </h2>
                            <p className="mt-2 max-w-3xl text-sm leading-7 text-ink-muted">
                                The orchestrator decides which specialists run, merges conflicting answers, and
                                determines when enough information exists to commit to a recommendation.
                            </p>
                        </div>
                        {status === "success" && result?.context && (
                            <div className="flex items-center gap-2 text-sm text-ink-faint">
                                <Sparkles className="h-3.5 w-3.5" />
                                {result.context.marketType} · confidence {result.final?.confidence}
                            </div>
                        )}
                    </div>
                </Card>

            </div>
        </main>
    );
}
