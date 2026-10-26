"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
	AlertCircle,
	ArrowRight,
	CheckCircle2,
	Layers3,
	Plus,
	RefreshCw,
	Sparkles,
	UsersRound,
	X,
	Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/components/ui/cn";
import { useAgentBuilderStore } from "@/store/agent-builder-store";
import AgentForm from "./AgentForm";
import AgentLibrary from "./AgentLibrary";

function Stat({ icon: Icon, label, value, hint }) {
	return (
		<div className="rounded-2xl border border-white/7 bg-white/[0.025] px-4 py-3.5 backdrop-blur-sm">
			<div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-600">
				<Icon className="h-3.5 w-3.5" />
				{label}
			</div>
			<div className="mt-1.5 flex items-baseline gap-2">
				<span className="text-xl font-semibold tabular-nums text-white">{value}</span>
				{hint ? <span className="truncate text-[11px] text-neutral-600">{hint}</span> : null}
			</div>
		</div>
	);
}

function EditorSkeleton() {
	return (
		<Card variant="default" className="overflow-hidden">
			<div className="border-b border-white/8 p-5">
				<div className="flex animate-pulse items-center gap-3.5">
					<div className="h-14 w-14 rounded-2xl bg-white/[0.05]" />
					<div className="space-y-2">
						<div className="h-4 w-40 rounded bg-white/[0.06]" />
						<div className="h-3 w-52 rounded bg-white/[0.035]" />
					</div>
				</div>
				<div className="mt-5 h-10 animate-pulse rounded-xl bg-white/[0.035]" />
			</div>
			<div className="space-y-5 p-5">
				<div className="h-24 animate-pulse rounded-2xl bg-white/[0.035]" />
				<div className="grid gap-4 md:grid-cols-2">
					<div className="h-20 animate-pulse rounded-2xl bg-white/[0.035]" />
					<div className="h-20 animate-pulse rounded-2xl bg-white/[0.035]" />
				</div>
				<div className="h-40 animate-pulse rounded-2xl bg-white/[0.035]" />
			</div>
		</Card>
	);
}


function EditorError({ message, onRetry }) {
	return (
		<Card variant="default" className="overflow-hidden p-8 sm:p-10">
			<div className="mx-auto flex max-w-md flex-col items-center text-center">
				<div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-200">
					<AlertCircle className="h-5 w-5" />
				</div>
				<h2 className="mt-4 text-lg font-semibold text-white">Agents could not be loaded</h2>
				<p className="mt-2 text-sm leading-6 text-neutral-500">
					{message || "The database connection is unavailable right now."}
				</p>
				<Button variant="secondary" onClick={onRetry} className="mt-5">
					<RefreshCw className="h-4 w-4" />
					Try again
				</Button>
			</div>
		</Card>
	);
}

export default function AgentBuilderPage() {
	const agents = useAgentBuilderStore((state) => state.agents);
	const selectedAgentId = useAgentBuilderStore((state) => state.selectedAgentId);
	const selectAgentId = useAgentBuilderStore((state) => state.selectAgentId);
	const hydrateAgents = useAgentBuilderStore((state) => state.hydrateAgents);
	const createAgent = useAgentBuilderStore((state) => state.createAgent);
	const updateAgent = useAgentBuilderStore((state) => state.updateAgent);
	const duplicateAgent = useAgentBuilderStore((state) => state.duplicateAgent);
	const deleteAgent = useAgentBuilderStore((state) => state.deleteAgent);
	const hydrated = useAgentBuilderStore((state) => state.hydrated);
	const hydrating = useAgentBuilderStore((state) => state.hydrating);
	const hydrateError = useAgentBuilderStore((state) => state.hydrateError);

	const [isCreating, setIsCreating] = useState(false);
	const [query, setQuery] = useState("");
	const [filter, setFilter] = useState("all");
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [deleting, setDeleting] = useState(false);
	const [busyAgentId, setBusyAgentId] = useState(null);
	const [notice, setNotice] = useState(null);

	useEffect(() => {
		if (!hydrated && !hydrating) {
			void hydrateAgents();
		}
	}, [hydrated, hydrating, hydrateAgents]);

	useEffect(() => {
		if (!notice) return undefined;
		const timeout = window.setTimeout(() => setNotice(null), 5000);
		return () => window.clearTimeout(timeout);
	}, [notice]);

	const selectedAgent = useMemo(
		() => agents.find((agent) => agent.id === selectedAgentId) || null,
		[agents, selectedAgentId]
	);

	const filteredAgents = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();

		return agents.filter((agent) => {
			if (filter === "enabled" && !agent.isEnabled) return false;
			if (filter === "paused" && agent.isEnabled) return false;
			if (!normalizedQuery) return true;

			return [agent.name, agent.role, agent.goal, agent.description, agent.expertise]
				.filter(Boolean)
				.join(" ")
				.toLowerCase()
				.includes(normalizedQuery);
		});
	}, [agents, filter, query]);

	const enabledCount = agents.filter((agent) => agent.isEnabled).length;
	const providerCount = new Set(agents.map((agent) => agent.aiProvider)).size;
	const createMode = isCreating || !selectedAgent;

	const notify = (tone, message) => setNotice({ tone, message });

	const handleNewAgent = () => {
		setIsCreating(true);
		selectAgentId(null);
		if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
			window.requestAnimationFrame(() => {
				document.getElementById("agent-editor")?.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
			});
		}
	};

	const handleSelectAgent = (agentId) => {
		setIsCreating(false);
		selectAgentId(agentId);
	};

	const handleCreateAgent = async (input) => {
		const savedAgent = await createAgent(input);
		setIsCreating(false);
		notify("success", `${savedAgent.name} was created and saved to Turso.`);
		return savedAgent;
	};

	const handleUpdateAgent = async (input) => {
		const savedAgent = await updateAgent(input);
		notify("success", `${savedAgent.name} was saved.`);
		return savedAgent;
	};

	const handleDuplicateAgent = async (agentId) => {
		setBusyAgentId(agentId);
		try {
			const duplicate = await duplicateAgent(agentId);
			if (duplicate) {
				setIsCreating(false);
				notify("success", `${duplicate.name} was created.`);
			}
		} catch (error) {
			notify("error", error.message || "The agent could not be duplicated.");
		} finally {
			setBusyAgentId(null);
		}
	};

	const handleDeleteRequest = (agentId) => {
		const agent = agents.find((item) => item.id === agentId);
		if (agent) setDeleteTarget(agent);
	};

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		setDeleting(true);
		try {
			await deleteAgent(deleteTarget.id);
			setIsCreating(false);
			setDeleteTarget(null);
			notify("success", `${deleteTarget.name} was deleted.`);
		} catch (error) {
			notify("error", error.message || "The agent could not be deleted.");
		} finally {
			setDeleting(false);
		}
	};

	return (
		<main className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-neutral-950 text-white">
			<div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_0%,rgba(56,189,248,0.14),transparent_32%),radial-gradient(circle_at_88%_8%,rgba(168,85,247,0.11),transparent_30%),linear-gradient(180deg,#080b12_0%,#09090b_55%,#070709_100%)]" />

			<div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
				<header className="overflow-hidden rounded-panel border border-white/8 bg-white/[0.025] p-5 shadow-glass-lg backdrop-blur-glass sm:p-6 lg:p-7">
					<div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
						<div className="max-w-3xl">
							<div className="flex flex-wrap items-center gap-2">
								<Badge tone="cyan" uppercase>
									<Sparkles className="h-3 w-3" />
									Agent Builder
								</Badge>
								<Badge tone="emerald" uppercase>
									<span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
									Turso synced
								</Badge>
							</div>
							<h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl">
								Build the people behind the society.
							</h1>
							<p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400 sm:text-base sm:leading-7">
								Create specialists with distinct expertise, personalities, and guardrails. Every
								change is stored securely in your account.
							</p>
						</div>

						<div className="flex flex-col gap-2 sm:flex-row">
							<Link
								href="/society"
								className="inline-flex items-center justify-center gap-2 rounded-pill border border-white/10 px-4 py-2.5 text-sm font-medium text-neutral-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
							>
								Open Society
								<ArrowRight className="h-4 w-4" />
							</Link>
							<Button variant="primary" onClick={handleNewAgent}>
								<Plus className="h-4 w-4" />
								New agent
							</Button>
						</div>
					</div>

					<div className="mt-6 grid gap-3 sm:grid-cols-3">
						<Stat icon={UsersRound} label="Council size" value={agents.length} hint="agents" />
						<Stat
							icon={Zap}
							label="Routing"
							value={enabledCount}
							hint={`${agents.length - enabledCount} paused`}
						/>
						<Stat icon={Layers3} label="Providers" value={providerCount} hint="configured" />
					</div>
				</header>

				{notice ? (
					<div
						role="status"
						className={cn(
							"mt-4 flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm backdrop-blur-sm",
							notice.tone === "error"
								? "border-rose-400/20 bg-rose-400/[0.07] text-rose-100"
								: "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100"
						)}
					>
						<div className="flex items-center gap-2">
							{notice.tone === "error" ? (
								<AlertCircle className="h-4 w-4 shrink-0" />
							) : (
								<CheckCircle2 className="h-4 w-4 shrink-0" />
							)}
							{notice.message}
						</div>
						<button
							type="button"
							onClick={() => setNotice(null)}
							className="rounded-lg p-1 opacity-60 transition hover:bg-white/10 hover:opacity-100"
							aria-label="Dismiss notification"
						>
							<X className="h-3.5 w-3.5" />
						</button>
					</div>
				) : null}

				{hydrateError ? (
					<div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-center gap-2">
							<AlertCircle className="h-4 w-4 shrink-0" />
							{hydrateError}
						</div>
						<Button variant="secondary" size="sm" onClick={() => void hydrateAgents()}>
							<RefreshCw className="h-3.5 w-3.5" />
							Retry
						</Button>
					</div>
				) : null}

				<div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(280px,350px)_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]">
					<AgentLibrary
						agents={filteredAgents}
						totalAgents={agents.length}
						selectedAgentId={createMode ? null : selectedAgentId}
						query={query}
						onQueryChange={setQuery}
						filter={filter}
						onFilterChange={setFilter}
						onSelect={handleSelectAgent}
						onNew={handleNewAgent}
						onDuplicate={handleDuplicateAgent}
						onDelete={handleDeleteRequest}
						busyAgentId={busyAgentId}
						isCreating={hydrated && !hydrateError && createMode}
						hydrating={!hydrated || hydrating}
					/>

					<section id="agent-editor" className="min-w-0 scroll-mt-24">
						{!hydrated ? (
							<EditorSkeleton />
						) : hydrateError && !agents.length ? (
							<EditorError
								message={hydrateError}
								onRetry={() => void hydrateAgents()}
							/>
						) : (
							<AgentForm
								key={createMode ? "new-agent" : selectedAgent.id}
								agent={createMode ? null : selectedAgent}
								onCreate={handleCreateAgent}
								onUpdate={handleUpdateAgent}
								onDuplicate={handleDuplicateAgent}
								onDelete={handleDeleteRequest}
								onNotice={notify}
								actionBusy={Boolean(selectedAgent && busyAgentId === selectedAgent.id)}
							/>
						)}
					</section>
				</div>
			</div>

			<Modal
				open={Boolean(deleteTarget)}
				onClose={() => {
					if (!deleting) setDeleteTarget(null);
				}}
				title="Delete agent?"
				size="md"
				footer={
					<div className="flex justify-end gap-2">
						<Button
							variant="ghost"
							onClick={() => setDeleteTarget(null)}
							disabled={deleting}
						>
							Cancel
						</Button>
						<Button variant="danger" onClick={handleConfirmDelete} loading={deleting}>
							Delete agent
						</Button>
					</div>
				}
			>
				<div className="p-6">
					<div className="flex items-start gap-4">
						<div
							className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-xl"
							style={{
								backgroundColor: `${deleteTarget?.color || "#f43f5e"}20`,
								borderColor: `${deleteTarget?.color || "#f43f5e"}4d`,
							}}
						>
							{deleteTarget?.icon || "🤖"}
						</div>
						<div>
							<p className="text-sm leading-6 text-neutral-300">
								<strong className="text-white">{deleteTarget?.name}</strong> will be removed from
								your agent library. This cannot be undone.
							</p>
							<p className="mt-2 text-xs leading-5 text-neutral-600">
								Its stored memory and execution history are account-scoped and may remain until
								removed separately.
							</p>
						</div>
					</div>
				</div>
			</Modal>
		</main>
	);
}
