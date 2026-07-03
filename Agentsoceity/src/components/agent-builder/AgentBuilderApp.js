"use client";

import { useEffect, useMemo, useState } from "react";

import AgentEditor from "./AgentEditor";
import AgentList from "./AgentList";
import { PROVIDER_LABELS } from "../../lib/agent-builder-schema";
import { useAgentBuilderStore } from "../../store/agent-builder-store";

function StatCard({ label, value, subtext }) {
	return (
		<div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur">
			<div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">{label}</div>
			<div className="mt-3 text-3xl font-semibold text-white">{value}</div>
			{subtext ? <p className="mt-2 text-sm leading-6 text-white/60">{subtext}</p> : null}
		</div>
	);
}

function EmptyPreview() {
	return (
		<div className="rounded-[2rem] border border-dashed border-white/15 bg-black/15 p-8 text-sm leading-7 text-white/60">
			Select an agent to edit it, or create a new one to start from a blank slate. Every change is saved to local storage.
		</div>
	);
}

export default function AgentBuilderApp() {
	const [searchTerm, setSearchTerm] = useState("");

	const agents = useAgentBuilderStore((state) => state.agents);
	const selectedAgentId = useAgentBuilderStore((state) => state.selectedAgentId);
	const selectAgentId = useAgentBuilderStore((state) => state.selectAgentId);
	const createAgent = useAgentBuilderStore((state) => state.createAgent);
	const updateAgent = useAgentBuilderStore((state) => state.updateAgent);
	const duplicateAgent = useAgentBuilderStore((state) => state.duplicateAgent);
	const deleteAgent = useAgentBuilderStore((state) => state.deleteAgent);
	const toggleAgentEnabled = useAgentBuilderStore((state) => state.toggleAgentEnabled);
	const resetAgents = useAgentBuilderStore((state) => state.resetAgents);

	useEffect(() => {
		void useAgentBuilderStore.persist.rehydrate();
	}, []);

	useEffect(() => {
		if (!agents.length) {
			return;
		}

		const selectedExists = agents.some((agent) => agent.id === selectedAgentId);
		if (!selectedExists) {
			selectAgentId(agents[0].id);
		}
	}, [agents, selectedAgentId, selectAgentId]);

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

	const handleCreateAgent = (agentInput) => {
		createAgent(agentInput);
	};

	const handleUpdateAgent = (agentInput) => {
		updateAgent(agentInput);
	};

	const handleDuplicateAgent = (agentId) => {
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
		<main className="min-h-screen overflow-hidden bg-[#07111f] text-white">
			<div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(244,114,182,0.12),_transparent_28%),linear-gradient(180deg,_#0b1526_0%,_#07111f_100%)]" />
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
				<header className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_20px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl">
					<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
						<div className="max-w-3xl">
							<div className="flex flex-wrap gap-2">
								<span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">Agent Builder</span>
								<span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">Local Storage</span>
								<span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">Zustand</span>
							</div>
							<h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
								Build and manage an unlimited agent library.
							</h1>
							<p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
								Create, edit, duplicate, enable, disable, and delete agents. Everything stays on the client and persists in the browser.
							</p>
						</div>

						<div className="grid gap-3 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-50">
							<div className="font-semibold uppercase tracking-[0.25em] text-cyan-200/80">Persisted state</div>
							<div>{agents.length} agents saved locally</div>
							<div>{enabledAgents} enabled, {agents.length - enabledAgents} disabled</div>
						</div>
					</div>
				</header>

				<section className="grid gap-4 md:grid-cols-3">
					<StatCard label="Total agents" value={agents.length.toString()} subtext="The library can grow without a fixed limit." />
					<StatCard label="Enabled agents" value={enabledAgents.toString()} subtext="Disabled agents stay stored but are skipped by routing." />
					<StatCard label="Providers" value={`${openaiCount}/${geminiCount}`} subtext={`${PROVIDER_LABELS.openai} / ${PROVIDER_LABELS.gemini}`} />
				</section>

				<section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
					<AgentList
						agents={filteredAgents}
						selectedAgentId={selectedAgentId}
						searchTerm={searchTerm}
						onSearchTermChange={setSearchTerm}
						onSelect={selectAgentId}
						onDuplicate={handleDuplicateAgent}
						onDelete={handleDeleteAgent}
						onToggleEnabled={handleToggleAgentEnabled}
					/>

					<div className="space-y-6">
						<AgentEditor
							key={selectedAgent?.id ?? "new-agent"}
							agent={selectedAgent}
							onCreate={handleCreateAgent}
							onUpdate={handleUpdateAgent}
							onNew={() => selectAgentId(null)}
							onDuplicate={handleDuplicateAgent}
							onDelete={handleDeleteAgent}
							onToggleEnabled={handleToggleAgentEnabled}
						/>

						<section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
							<div className="flex items-start justify-between gap-4">
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/70">Current selection</p>
									<h2 className="mt-2 text-xl font-semibold text-white">Agent snapshot</h2>
									<p className="mt-2 text-sm leading-6 text-white/65">A compact preview of the selected agent makes it easier to confirm the final stored state.</p>
								</div>
								<button
									type="button"
									onClick={resetAgents}
									className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/5"
								>
									Reset starter set
								</button>
							</div>

							<div className="mt-5">
								{selectedAgent ? (
									<pre className="overflow-x-auto rounded-3xl border border-white/10 bg-slate-950/90 p-5 text-xs leading-6 text-cyan-100">
{JSON.stringify(selectedAgent, null, 2)}
									</pre>
								) : (
									<EmptyPreview />
								)}
							</div>
						</section>
					</div>
				</section>
			</div>
		</main>
	);
}
