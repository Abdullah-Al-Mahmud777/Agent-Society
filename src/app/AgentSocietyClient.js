"use client";

import { useCallback, useEffect, useState } from "react";
import { useAgentBuilderStore } from "../store/agent-builder-store";
import { useMemoryStore } from "../store/memory-store";

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
    "Specialist agents return structured findings.",
    "Orchestrator merges the outputs into one decision package.",
    "Final recommendation is delivered with key decisions and next steps.",
];

// ─── Primitives ───────────────────────────────────────────────────────────────

function Pill({ children }) {
    return (
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
            {children}
        </span>
    );
}

function SectionCard({ title, children, className = "" }) {
    return (
        <section className={`rounded-3xl border border-white/10 bg-white/6 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur ${className}`}>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <div className="mt-4">{children}</div>
        </section>
    );
}

// ─── Agent roster card ────────────────────────────────────────────────────────

function AgentCard({ agent }) {
    return (
        <article className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="h-1.5 w-20 rounded-full" style={{ backgroundColor: agent.color ?? "#22c55e" }} />
            <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">{agent.icon}</span>
                    <h3 className="text-base font-semibold text-white">{agent.name}</h3>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/50">
                    {agent.role}
                </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/70">{agent.description}</p>
        </article>
    );
}

// ─── Result display components ────────────────────────────────────────────────

function DebateSection({ debate, agentColor }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="mt-3 rounded-xl border border-white/8 bg-black/20">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left"
            >
                <div className="flex items-center gap-2">
                    {debate.positionChanged ? (
                        <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                            Position changed
                        </span>
                    ) : (
                        <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                            Position held
                        </span>
                    )}
                    <span className="text-xs text-white/35">Round 2 — debate reaction</span>
                </div>
                <span className="text-white/30 text-xs">{open ? "▲" : "▼"}</span>
            </button>

            {open && (
                <div className="space-y-3 border-t border-white/8 px-4 pb-4 pt-3">
                    {debate.agrees?.length > 0 && (
                        <div>
                            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400/70">Agrees with</div>
                            <ul className="space-y-1">
                                {debate.agrees.map((a, i) => (
                                    <li key={i} className="flex gap-2 text-sm leading-6 text-white/70">
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
                                    <li key={i} className="flex gap-2 text-sm leading-6 text-white/70">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400/60" />
                                        {d}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {debate.updatedPosition && (
                        <div>
                            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/35">
                                {debate.positionChanged ? "Updated position" : "Final position"}
                            </div>
                            <p className="text-sm leading-6 text-white/70 italic">{debate.updatedPosition}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function SpecialistResultCard({ result }) {
    const hasError = Boolean(result.error);

    return (
        <div
            className="rounded-2xl border p-4"
            style={{
                borderColor: `${result.agentColor ?? "#64748b"}33`,
                backgroundColor: `${result.agentColor ?? "#64748b"}15`,
            }}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{result.agentIcon}</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                        {result.agentName}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {result.memoriesUsed > 0 && (
                        <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2 py-0.5 text-[11px] text-violet-300/70">
                            {result.memoriesUsed} {result.memoriesUsed === 1 ? "memory" : "memories"}
                        </span>
                    )}
                    {result.confidence && !hasError && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/50">
                            {result.confidence} confidence
                        </span>
                    )}
                </div>
            </div>

            {hasError ? (
                <p className="mt-3 text-sm text-red-400/80">{result.summary}</p>
            ) : (
                <>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-white/80">
                        {result.summary && (
                            <li className="flex gap-3">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                                <span>{result.summary}</span>
                            </li>
                        )}
                        {result.findings && result.findings !== "N/A" && (
                            <li className="flex gap-3">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                                <span>{result.findings}</span>
                            </li>
                        )}
                        {result.recommendation && result.recommendation !== "N/A" && (
                            <li className="flex gap-3">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                                <span className="text-white/60 italic">{result.recommendation}</span>
                            </li>
                        )}
                    </ul>
                    {result.debate && (
                        <DebateSection debate={result.debate} agentColor={result.agentColor} />
                    )}
                </>
            )}
        </div>
    );
}

function OrchestratorResultCard({ orchestrator, final }) {
    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{orchestrator.agentIcon ?? "👑"}</span>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
                        {orchestrator.agentName ?? "Orchestrator"} — final decision
                    </div>
                </div>
                <p className="mt-2 text-sm leading-7 text-white/85">{final.summary}</p>
                {final.recommendation && (
                    <p className="mt-2 text-sm leading-6 text-cyan-200/70 italic">{final.recommendation}</p>
                )}
            </div>

            {final.keyDecisions?.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-white/45">Key decisions</div>
                    <ul className="mt-3 space-y-2">
                        {final.keyDecisions.map((d, i) => (
                            <li key={i} className="flex gap-3 text-sm leading-6 text-white/75">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/60" />
                                <span>{d}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {final.nextSteps?.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-white/45">Next steps</div>
                    <ul className="mt-3 space-y-2">
                        {final.nextSteps.map((s, i) => (
                            <li key={i} className="flex gap-3 text-sm leading-6 text-white/75">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-white/60">
                                    {i + 1}
                                </span>
                                <span>{s}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function Skeleton({ className = "" }) {
    return <div className={`animate-pulse rounded-xl bg-white/8 ${className}`} />;
}

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

// ─── Idle placeholder ─────────────────────────────────────────────────────────

function IdlePlaceholder({ message }) {
    return (
        <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-white/10 p-6">
            <p className="text-center text-sm text-white/35">{message}</p>
        </div>
    );
}

// ─── Error banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ message }) {
    return (
        <div className="rounded-2xl border border-red-400/25 bg-red-400/10 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300/80">Error</div>
            <p className="mt-1 text-sm leading-6 text-red-200/80">{message}</p>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AgentSocietyClient() {
    const agents = useAgentBuilderStore((state) => state.agents);
    const memories = useMemoryStore((state) => state.memories);
    const addMemories = useMemoryStore((state) => state.addMemories);
    const [hydrated, setHydrated] = useState(false);

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
    }, [idea, enabledAgents]);

    const specialists = result?.agents?.specialists ?? [];
    const orchestrator = result?.agents?.orchestrator ?? null;
    const final = result?.final ?? null;

    return (
        <main className="min-h-screen overflow-hidden bg-[#07111f] text-white">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(244,114,182,0.14),_transparent_28%),linear-gradient(180deg,_#0b1526_0%,_#07111f_100%)]" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">

                {/* Header */}
                <header className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_20px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <div className="flex flex-wrap gap-2">
                                <Pill>Agent Society</Pill>
                                <Pill>Multi-agent orchestration</Pill>
                                {hydrated && enabledAgents.length > 0 && (
                                    <Pill>{enabledAgents.length} agent{enabledAgents.length !== 1 ? "s" : ""} active</Pill>
                                )}
                                {hydrated && enabledAgents.length >= 3 && (
                                    <Pill>2-round debate</Pill>
                                )}
                            </div>
                            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                                A society of AI agents that debate and decide.
                            </h1>
                            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                                Each agent analyzes from its own perspective. The orchestrator synthesizes every view into a final recommendation.
                            </p>
                        </div>
                        <div className="grid gap-3 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-50">
                            <div className="font-semibold uppercase tracking-[0.25em] text-cyan-200/80">Orchestrator</div>
                            <div>The CEO-role agent owns task routing, conflict resolution, and final synthesis.</div>
                        </div>
                    </div>
                </header>

                {/* Input + Results */}
                <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                    <SectionCard title="Run the council">
                        <p className="text-sm leading-7 text-white/70">
                            Enter any idea. Your enabled agents will each analyze it from their own perspective, then the orchestrator synthesizes a final recommendation.
                        </p>
                        <div className="mt-5 space-y-3">
                            <label className="block text-sm font-medium text-white/80" htmlFor="idea">
                                Business idea
                            </label>
                            <textarea
                                id="idea"
                                value={idea}
                                onChange={(e) => setIdea(e.target.value)}
                                rows={4}
                                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
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
                            <p className="mt-3 text-xs text-white/35">
                                {enabledAgents.length} agent{enabledAgents.length !== 1 ? "s" : ""} will run — configure them in the Agent Builder.
                            </p>
                        )}
                        <div className="mt-4 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={handleRunCouncil}
                                disabled={status === "loading" || !hydrated}
                                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {status === "loading" ? "Running council…" : "Run council"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIdea("I want to build an AI startup")}
                                className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-white/80 transition hover:border-white/25 hover:bg-white/5"
                            >
                                Reset example
                            </button>
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
                    {rosterAgents.map((agent) => (
                        <AgentCard key={agent.id ?? agent.name} agent={agent} />
                    ))}
                </section>

                {/* How data flows + Specialist outputs */}
                <section className="grid gap-8 xl:grid-cols-2">
                    <SectionCard title="How data flows between agents">
                        <div className="space-y-3">
                            {workflowSteps.map((step, index) => (
                                <div key={step} className="flex gap-4 rounded-2xl border border-white/10 bg-black/15 p-4">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white/80">
                                        {index + 1}
                                    </div>
                                    <p className="text-sm leading-6 text-white/75">{step}</p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    <SectionCard
                        title={
                            status === "success" && result?.input?.businessIdea
                                ? `Specialist outputs — "${result.input.businessIdea.slice(0, 50)}${result.input.businessIdea.length > 50 ? "…" : ""}"`
                                : "Specialist outputs"
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
                            <div className="space-y-4">
                                {specialists.map((s, i) => (
                                    <SpecialistResultCard key={i} result={s} />
                                ))}
                            </div>
                        )}
                        {status === "success" && specialists.length === 0 && (
                            <IdlePlaceholder message="Only one agent is enabled — add more specialist agents in the Builder to see outputs here." />
                        )}
                    </SectionCard>
                </section>

                {/* Memory activity */}
                {status === "success" && result?.newMemories?.length > 0 && (
                    <section className="rounded-3xl border border-violet-400/20 bg-violet-400/8 p-6 backdrop-blur">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300/70">Memory</p>
                                <h2 className="mt-1 text-lg font-semibold text-white">
                                    {result.newMemories.length} new {result.newMemories.length === 1 ? "memory" : "memories"} saved
                                </h2>
                                <p className="mt-1 text-sm text-white/50">
                                    Agents will recall these in future debates on similar topics.
                                    {memories.length > 0 && ` Total stored: ${memories.length + result.newMemories.length}.`}
                                </p>
                            </div>
                            {Object.values(result.memoriesInjected ?? {}).some((n) => n > 0) && (
                                <div className="rounded-2xl border border-violet-400/20 bg-violet-400/10 px-4 py-3 text-sm text-violet-200/80">
                                    {Object.values(result.memoriesInjected).reduce((a, b) => a + b, 0)} memories injected this run
                                </div>
                            )}
                        </div>
                        <ul className="mt-4 space-y-2">
                            {result.newMemories.map((m) => (
                                <li key={m.id} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/15 px-4 py-3">
                                    <span className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                        m.type === "episodic"
                                            ? "bg-cyan-400/15 text-cyan-300/80"
                                            : "bg-violet-400/15 text-violet-300/80"
                                    }`}>
                                        {m.type}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <span className="text-xs font-medium text-white/50">{m.agentName} · </span>
                                        <span className="text-sm text-white/75">{m.content.slice(0, 120)}{m.content.length > 120 ? "…" : ""}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Footer context strip */}
                <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-white">How the orchestrator controls everything</h2>
                            <p className="mt-2 max-w-3xl text-sm leading-7 text-white/70">
                                The orchestrator decides which specialists run, merges conflicting answers, and determines when enough information exists to commit to a recommendation.
                            </p>
                        </div>
                        {status === "success" && result?.context && (
                            <div className="text-sm text-white/40">
                                {result.context.marketType} · confidence {result.final?.confidence}
                            </div>
                        )}
                    </div>
                </section>

            </div>
        </main>
    );
}
