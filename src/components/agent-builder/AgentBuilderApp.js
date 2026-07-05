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
	const [mounted, setMounted] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [isCreating, setIsCreating] = useState(false);
	
	// Local state for agents to prevent hydration mismatch
	const [agents, setAgents] = useState([]);
	const [selectedAgentId, setSelectedAgentId] = useState(null);

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
		setMounted(true);
		void useAgentBuilderStore.persist.rehydrate();
		void useMemoryStore.persist.rehydrate();
		
		// Subscribe to store changes
		const unsubscribe = useAgentBuilderStore.subscribe((state) => {
			setAgents(state.agents);
			setSelectedAgentId(state.selectedAgentId);
		});
		
		// Initial load
		const state = useAgentBuilderStore.getState();
		setAgents(state.agents);
		setSelectedAgentId(state.selectedAgentId);
		
		return () => unsubscribe();
	}, []);

	useEffect(() => {
		// Don't auto-select while the user is intentionally creating a new agent
		// (that flow sets the selection to null on purpose).
		if (isCreating || !agents.length || !mounted) {
			return;
		}

		const selectedExists = agents.some((agent) => agent.id === selectedAgentId);
		if (!selectedExists) {
			selectAgentId(agents[0].id);
		}
	}, [agents, selectedAgentId, selectAgentId, isCreating, mounted]);

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
		setSelectedAgentId(null);
		if (typeof window !== "undefined") {
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	};

	const handleSelectAgent = (agentId) => {
		setIsCreating(false);
		selectAgentId(agentId);
		setSelectedAgentId(agentId);
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

	if (!mounted) {
		return (
			<main className="relative min-h-screen overflow-hidden bg-navy-900 text-ink">
				<div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.12),_transparent_28%),linear-gradient(180deg,_#0b1526_0%,_#07111f_100%)]" />
				<div className="flex min-h-screen items-center justify-center">
					<div className="text-center">
						<div className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/70">Loading</div>
						<p className="mt-2 text-ink-muted">Preparing builder...</p>
					</div>
				</div>
			</main>
		);
	}

	return (
		<main className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-navy-900 text-ink">
			<div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.12),_transparent_28%),linear-gradient(180deg,_#0b1526_0%,_#07111f_100%)]" />
			
			{/* Mobile: py-6 px-4, Tablet: py-8 px-6, Desktop: py-10 px-8 */}
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 overflow-x-hidden px-4 py-6 sm:gap-8 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
				
				{/* Header - Responsive */}
				<motion.header
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
				>
					<Card variant="strong" radius="panel" className="p-5 sm:p-6 lg:p-8" glow="#22d3ee">
						<div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
							{/* Title Section */}
							<div className="max-w-3xl">
								<div className="flex flex-wrap gap-2">
									<Badge tone="cyan" uppercase>Agent Builder</Badge>
									<Badge tone="neutral" uppercase>Local-first</Badge>
								</div>
								<h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:mt-4 sm:text-3xl md:text-4xl lg:mt-5 lg:text-5xl xl:text-6xl">
									Design the individuals in your society.
								</h1>
								<p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted sm:mt-4 sm:text-base sm:leading-7">
									Give each agent a personality, expertise, and voice. Everything persists in your
									browser and feeds directly into the council debates.
								</p>
							</div>

							{/* Action Section - Responsive */}
							<div className="flex flex-col gap-3 sm:flex-row sm:items-start lg:flex-col">
								<Button 
									variant="primary" 
									size="lg" 
									onClick={handleNewAgent} 
									className="w-full justify-center sm:w-auto lg:w-full"
								>
									<Plus className="h-4 w-4" />
									New agent
								</Button>
								<div className="grid gap-2 rounded-card border border-brand-cyan/20 bg-brand-cyan/10 p-3 text-xs text-cyan-50 sm:p-4 sm:text-sm">
									<div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-200/80 sm:text-xs">
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

				{/* Stats Grid - Responsive: 1 col mobile, 3 cols tablet/desktop */}
				<section className="grid gap-3 sm:gap-4 md:grid-cols-3">
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

				{/* Output Toolbar */}
				<OutputToolbar agents={agents} />

				{/* Main Content - Responsive Layout */}
				<section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
					{/* Agent List - Full width on mobile, sidebar on desktop */}
					<div className="order-2 lg:order-1">
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
					</div>

					{/* Editor Section - Full width on mobile, main on desktop */}
					<div className="order-1 space-y-4 sm:space-y-6 lg:order-2">
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

						{/* Agent Snapshot - Hidden on mobile, visible on tablet+ */}
						<Card variant="default" radius="panel" className="hidden p-5 sm:block sm:p-6">
							<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
								<div>
									<p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-200/70 sm:text-xs">
										Current selection
									</p>
									<h2 className="mt-2 text-lg font-semibold text-ink sm:text-xl">Agent snapshot</h2>
									<p className="mt-2 text-xs leading-5 text-ink-muted sm:text-sm sm:leading-6">
										A compact preview of the selected agent's stored state.
									</p>
								</div>
								<Button variant="secondary" size="sm" onClick={resetAgents} className="shrink-0">
									<RotateCcw className="h-3.5 w-3.5" />
									<span className="hidden sm:inline">Reset starters</span>
									<span className="sm:hidden">Reset</span>
								</Button>
							</div>

							<div className="mt-4 sm:mt-5">
								{selectedAgent ? (
									<pre className="overflow-x-auto rounded-card border border-glass-border bg-navy-950/90 p-4 text-[10px] leading-5 text-cyan-100 sm:p-5 sm:text-xs sm:leading-6">
{JSON.stringify(selectedAgent, null, 2)}
									</pre>
								) : (
									<EmptyPreview />
								)}
							</div>
						</Card>

						{/* Memory Panel - Responsive */}
						{selectedAgent && (() => {
							const agentMemories = getAgentMemories(selectedAgent.id);
							return (
								<Card variant="default" radius="panel" className="border-brand-violet/20 bg-brand-violet/5 p-5 sm:p-6">
									<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
										<div>
											<p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-violet-300/70 sm:text-xs">
												<Brain className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
												Long-term memory
											</p>
											<h2 className="mt-2 text-lg font-semibold text-ink sm:text-xl">
												{agentMemories.length} {agentMemories.length === 1 ? "memory" : "memories"}
											</h2>
											<p className="mt-2 text-xs leading-5 text-ink-subtle sm:text-sm sm:leading-6">
												{agentMemories.length > 0
													? "Accumulated from past debates. Injected into this agent's context on relevant topics."
													: "No memories yet. Run a council debate to start building this agent's experience."}
											</p>
										</div>
										{agentMemories.length > 0 && (
											<Button variant="danger" size="sm" onClick={() => clearAgentMemories(selectedAgent.id)} className="shrink-0">
												Clear
											</Button>
										)}
									</div>

									{agentMemories.length > 0 && (
										<ul className="mt-4 space-y-2 sm:mt-5">
											{agentMemories.map((m) => (
												<li key={m.id} className="rounded-card border border-glass-border bg-black/15 px-3 py-2.5 sm:px-4 sm:py-3">
													<div className="flex items-center gap-2">
														<Badge tone={m.type === "episodic" ? "cyan" : "violet"} uppercase>
															{m.type}
														</Badge>
														<span className="text-[10px] text-ink-faint sm:text-[11px]">
															{new Date(m.createdAt).toLocaleDateString()}
														</span>
													</div>
													<p className="mt-2 text-xs leading-5 text-ink-muted sm:text-sm sm:leading-6">{m.content}</p>
												</li>
											))}
										</ul>
									)}

									{totalMemories > 0 && (
										<div className="mt-4 flex justify-end">
											<button
												type="button"
												onClick={clearAllMemories}
												className="inline-flex items-center gap-1.5 text-[10px] text-ink-faint underline underline-offset-2 transition hover:text-ink-subtle sm:text-xs"
											>
												<Trash2 className="h-3 w-3" />
												<span className="hidden sm:inline">Clear all agent memories ({totalMemories})</span>
												<span className="sm:hidden">Clear all ({totalMemories})</span>
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
