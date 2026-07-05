"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Users, Wrench, Cpu, RotateCcw, Trash2, Brain, Plus } from "lucide-react";

import AgentEditor from "./AgentEditor";
import AgentList from "./AgentList";
import { PROVIDER_LABELS } from "../../lib/agent-builder-schema";
import { useAgentBuilderStore } from "../../store/agent-builder-store";
import { useMemoryStore } from "../../store/memory-store";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import OutputToolbar from "@/components/output/OutputToolbar";

function StatCard({ icon: Icon, label, value, subtext }) {
	return (
		<Card variant="default" className="p-5">
			<div className="flex items-center gap-2 text-ink-subtle">
				<Icon className="h-4 w-4" />
				<div className="text-xs font-semibold uppercase tracking-[0.2em]">{label}</div>
			</div>
			<div className="mt-3 text-3xl font-semibold text-ink">{value}</div>
			{subtext ? <p className="mt-2 text-sm leading-6 text-ink-muted">{subtext}</p> : null}
		</Card>
	);
}

function EmptyPreview() {
	return (
		<div className="rounded-panel border border-dashed border-glass-border bg-black/15 p-8 text-sm leading-7 text-ink-muted">
			Select an agent to edit it, or create a new one to start from a blank slate. Every change is
			saved to local storage.
		</div>
	);
}

export default function AgentBuilderApp() {
	const [searchTerm, setSearchTerm] = useState("");
	const [isCreating, setIsCreating] = useState(false);

	const agents = useAgentBuilderStore((state) => state.agents);
	const selectedAgentId = useAgentBuilderStore((state) => state.selectedAgentId);
	const selectAgentId = useAgentBuilderStore((state) => state.selectAgentId);
	const createAgent = useAgentBuilderStore((state) => state.createAgent);
	const updateAgent = useAgentBuilderStore((state) => state.updateAgent);
	const duplicateAgent = useAgentBuilderStore((state) => state.duplicateAgent);
	const deleteAgent = useAgentBuilderStore((state) => state.deleteAgent);
	const toggleAgentEnabled = useAgentBuilderStore((state) => state.toggleAgentEnabled);
	const resetAgents = useAgentBuilderStore((state) => state.resetAgents);

	const getAgentMemories = useMemoryStore((state) => state.getAgentMemories);
	const clearAgentMemories = useMemoryStore((state) => state.clearAgentMemories);
	const clearAllMemories = useMemoryStore((state) => state.clearAllMemories);
	const totalMemories = useMemoryStore((state) => state.memories.length);

	useEffect(() => {
		void useAgentBuilderStore.persist.rehydrate();
		void useMemoryStore.persist.rehydrate();
	}, []);

	useEffect(() => {
		// Don't auto-select while the user is intentionally creating a new agent
		// (that flow sets the selection to null on purpose).
		if (isCreating || !agents.length) {
			return;
		}

		const selectedExists = agents.some((agent) => agent.id === selectedAgentId);
		if (!selectedExists) {
			selectAgentId(agents[0].id);
		}
	}, [agents, selectedAgentId, selectAgentId, isCreating]);

	const filteredAgents = useMemo(() => {
		const query = searchTerm.trim().toLowerCase();
		if (!query) {
			return agents;
		}

		return agents.filter((agent) => {
			return [agent.name, agent.role, agent.goal, agent.description]
				.join(" ")
				.toLowerCase()
				.includes(query);
		});
	}, [agents, searchTerm]);

	const selectedAgent = useMemo(
		() => agents.find((agent) => agent.id === selectedAgentId) ?? null,
		[agents, selectedAgentId],
	);

	const enabledAgents = agents.filter((agent) => agent.isEnabled).length;
	const openaiCount = agents.filter((agent) => agent.aiProvider === "openai").length;
	const geminiCount = agents.filter((agent) => agent.aiProvider === "gemini").length;

	const handleNewAgent = () => {
		setIsCreating(true);
		selectAgentId(null);
		if (typeof window !== "undefined") {
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	};

	const handleSelectAgent = (agentId) => {
		setIsCreating(false);
		selectAgentId(agentId);
	};

	const handleCreateAgent = (agentInput) => {
		createAgent(agentInput);
		setIsCreating(false);
	};

	const handleUpdateAgent = (agentInput) => {
		updateAgent(agentInput);
	};

	const handleDuplicateAgent = (agentId) => {
		setIsCreating(false);
		duplicateAgent(agentId);
	};

	const handleDeleteAgent = (agentId) => {
		if (typeof window === 'undefined') return;
		const shouldDelete = window.confirm("Delete this agent? This cannot be undone.");
		if (!shouldDelete) {
			return;
		}

		deleteAgent(agentId);
	};

	const handleToggleAgentEnabled = (agentId) => {
		toggleAgentEnabled(agentId);
	};

	return (
		<main className="relative min-h-screen overflow-hidden bg-navy-900 text-ink">
			<div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.12),_transparent_28%),linear-gradient(180deg,_#0b1526_0%,_#07111f_100%)]" />
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-10 sm:px-8 lg:px-10">
				<motion.header
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
				>
					<Card variant="strong" radius="panel" className="p-8" glow="#22d3ee">
						<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
							<div className="max-w-3xl">
								<div className="flex flex-wrap gap-2">
									<Badge tone="cyan" uppercase>Agent Builder</Badge>
									<Badge tone="neutral" uppercase>Local-first</Badge>
								</div>
								<h1 className="mt-5 text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-6xl">
									Design the individuals in your society.
								</h1>
								<p className="mt-4 max-w-2xl text-sm leading-7 text-ink-muted sm:text-base">
									Give each agent a personality, expertise, and voice. Everything persists in your
									browser and feeds directly into the council debates.
								</p>
							</div>

							<div className="flex flex-col gap-3">
								<Button variant="primary" size="lg" onClick={handleNewAgent} className="justify-center">
									<Plus className="h-4 w-4" />
									New agent
								</Button>
								<div className="grid gap-2 rounded-card border border-brand-cyan/20 bg-brand-cyan/10 p-4 text-sm text-cyan-50">
									<div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200/80">
										Persisted state
									</div>
									<div>{agents.length} agents saved locally</div>
									<div className="text-cyan-100/70">
										{enabledAgents} enabled · {agents.length - enabledAgents} disabled
									</div>
								</div>
							</div>
						</div>
					</Card>
				</motion.header>

				<section className="grid gap-4 md:grid-cols-3">
					<StatCard
						icon={Users}
						label="Total agents"
						value={agents.length.toString()}
						subtext="The library can grow without a fixed limit."
					/>
					<StatCard
						icon={Wrench}
						label="Enabled agents"
						value={enabledAgents.toString()}
						subtext="Disabled agents stay stored but are skipped by routing."
					/>
					<StatCard
						icon={Cpu}
						label="Providers"
						value={`${openaiCount}/${geminiCount}`}
						subtext={`${PROVIDER_LABELS.openai} / ${PROVIDER_LABELS.gemini}`}
					/>
				</section>

				<OutputToolbar agents={agents} />

				<section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
					<AgentList
						agents={filteredAgents}
						selectedAgentId={isCreating ? null : selectedAgentId}
						searchTerm={searchTerm}
						onSearchTermChange={setSearchTerm}
						onSelect={handleSelectAgent}
						onNew={handleNewAgent}
						onDuplicate={handleDuplicateAgent}
						onDelete={handleDeleteAgent}
						onToggleEnabled={handleToggleAgentEnabled}
					/>

					<div className="space-y-6">
						<AgentEditor
							key={isCreating ? "new-agent" : selectedAgent?.id ?? "new-agent"}
							agent={isCreating ? null : selectedAgent}
							onCreate={handleCreateAgent}
							onUpdate={handleUpdateAgent}
							onNew={handleNewAgent}
							onDuplicate={handleDuplicateAgent}
							onDelete={handleDeleteAgent}
							onToggleEnabled={handleToggleAgentEnabled}
						/>

						<Card variant="default" radius="panel" className="p-6">
							<div className="flex items-start justify-between gap-4">
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/70">
										Current selection
									</p>
									<h2 className="mt-2 text-xl font-semibold text-ink">Agent snapshot</h2>
									<p className="mt-2 text-sm leading-6 text-ink-muted">
										A compact preview of the selected agent's stored state.
									</p>
								</div>
								<Button variant="secondary" size="sm" onClick={resetAgents}>
									<RotateCcw className="h-3.5 w-3.5" />
									Reset starters
								</Button>
							</div>

							<div className="mt-5">
								{selectedAgent ? (
									<pre className="overflow-x-auto rounded-card border border-glass-border bg-navy-950/90 p-5 text-xs leading-6 text-cyan-100">
{JSON.stringify(selectedAgent, null, 2)}
									</pre>
								) : (
									<EmptyPreview />
								)}
							</div>
						</Card>

						{/* Memory panel */}
						{selectedAgent && (() => {
							const agentMemories = getAgentMemories(selectedAgent.id);
							return (
								<Card variant="default" radius="panel" className="border-brand-violet/20 bg-brand-violet/5 p-6">
									<div className="flex items-start justify-between gap-4">
										<div>
											<p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-violet-300/70">
												<Brain className="h-3.5 w-3.5" />
												Long-term memory
											</p>
											<h2 className="mt-2 text-xl font-semibold text-ink">
												{agentMemories.length} {agentMemories.length === 1 ? "memory" : "memories"}
											</h2>
											<p className="mt-2 text-sm leading-6 text-ink-subtle">
												{agentMemories.length > 0
													? "Accumulated from past debates. Injected into this agent's context on relevant topics."
													: "No memories yet. Run a council debate to start building this agent's experience."}
											</p>
										</div>
										{agentMemories.length > 0 && (
											<Button variant="danger" size="sm" onClick={() => clearAgentMemories(selectedAgent.id)}>
												Clear
											</Button>
										)}
									</div>

									{agentMemories.length > 0 && (
										<ul className="mt-5 space-y-2">
											{agentMemories.map((m) => (
												<li key={m.id} className="rounded-card border border-glass-border bg-black/15 px-4 py-3">
													<div className="flex items-center gap-2">
														<Badge tone={m.type === "episodic" ? "cyan" : "violet"} uppercase>
															{m.type}
														</Badge>
														<span className="text-[11px] text-ink-faint">
															{new Date(m.createdAt).toLocaleDateString()}
														</span>
													</div>
													<p className="mt-2 text-sm leading-6 text-ink-muted">{m.content}</p>
												</li>
											))}
										</ul>
									)}

									{totalMemories > 0 && (
										<div className="mt-4 flex justify-end">
											<button
												type="button"
												onClick={clearAllMemories}
												className="inline-flex items-center gap-1.5 text-xs text-ink-faint underline underline-offset-2 transition hover:text-ink-subtle"
											>
												<Trash2 className="h-3 w-3" />
												Clear all agent memories ({totalMemories})
											</button>
										</div>
									)}
								</Card>
							);
						})()}
					</div>
				</section>
			</div>
		</main>
	);
}
