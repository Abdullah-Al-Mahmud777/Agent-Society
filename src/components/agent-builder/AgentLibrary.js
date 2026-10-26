"use client";

import { Copy, Loader2, Plus, Search, Trash2, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn } from "@/components/ui/cn";
import { PROVIDER_LABELS } from "@/lib/agent-builder-schema";

const FILTERS = [
	{ id: "all", label: "All" },
	{ id: "enabled", label: "Active" },
	{ id: "paused", label: "Paused" },
];

function AgentCard({
	agent,
	selected,
	busy,
	onSelect,
	onDuplicate,
	onDelete,
}) {
	return (
		<article
			className={cn(
				"group relative overflow-hidden rounded-2xl border transition-all duration-200",
				selected
					? "border-primary-400/50 bg-primary-500/10 shadow-[0_0_40px_rgba(56,189,248,0.08)]"
					: "border-white/8 bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.045]"
			)}
		>
			<span
				aria-hidden
				className="absolute inset-y-4 left-0 w-0.5 rounded-r-full opacity-80"
				style={{ background: agent.color }}
			/>

			<button
				type="button"
				onClick={() => onSelect(agent.id)}
				className="flex w-full items-start gap-3.5 px-4 py-4 pr-20 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400/60"
				aria-pressed={selected}
			>
				<span
					className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-xl"
					style={{
						backgroundColor: `${agent.color}20`,
						borderColor: `${agent.color}4d`,
					}}
					aria-hidden
				>
					{agent.icon}
				</span>

				<span className="min-w-0 flex-1">
					<span className="flex items-center gap-2">
						<span className="truncate text-sm font-semibold text-white">
							{agent.name}
						</span>
						{!agent.isEnabled ? (
							<span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-600">
								Paused
							</span>
						) : null}
					</span>
					<span className="mt-0.5 block truncate text-xs text-neutral-400">
						{agent.role}
					</span>
					<span className="mt-2 flex min-w-0 items-center gap-1.5 text-[11px] text-neutral-600">
						<span className="truncate">{PROVIDER_LABELS[agent.aiProvider] || agent.aiProvider}</span>
						<span aria-hidden>·</span>
						<span className="truncate">{agent.model}</span>
					</span>
				</span>
			</button>

			<div className="absolute right-3 top-3 flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
				<button
					type="button"
					onClick={() => onDuplicate(agent.id)}
					disabled={busy}
					className="rounded-xl p-2 text-neutral-500 transition hover:bg-white/8 hover:text-white disabled:opacity-40"
					aria-label={`Duplicate ${agent.name}`}
					title="Duplicate agent"
				>
					{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
				</button>
				<button
					type="button"
					onClick={() => onDelete(agent.id)}
					disabled={busy}
					className="rounded-xl p-2 text-neutral-500 transition hover:bg-rose-400/10 hover:text-rose-300 disabled:opacity-40"
					aria-label={`Delete ${agent.name}`}
					title="Delete agent"
				>
					<Trash2 className="h-3.5 w-3.5" />
				</button>
			</div>
		</article>
	);
}

export default function AgentLibrary({
	agents,
	totalAgents,
	selectedAgentId,
	query,
	onQueryChange,
	filter,
	onFilterChange,
	onSelect,
	onNew,
	onDuplicate,
	onDelete,
	busyAgentId,
	isCreating,
	hydrating,
}) {
	return (
		<Card variant="default" className="flex min-h-0 flex-col overflow-hidden lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7.5rem)]">
			<div className="border-b border-white/8 px-4 pb-4 pt-5 sm:px-5">
				<div className="flex items-start justify-between gap-3">
					<div>
						<div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-primary-300/80">
							<UsersRound className="h-3.5 w-3.5" />
							Agent library
						</div>
						<h2 className="mt-2 text-lg font-semibold text-white">Your council</h2>
					</div>
					<Badge tone="neutral">{totalAgents} total</Badge>
				</div>

				<div className="relative mt-4">
					<Search
						aria-hidden
						className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600"
					/>
					<Input
						aria-label="Search agents"
						value={query}
						onChange={(event) => onQueryChange(event.target.value)}
						placeholder="Search name, role, goal…"
						className="h-10 rounded-xl py-2 pl-10 text-xs"
					/>
				</div>

				<div className="mt-3 flex items-center gap-1 rounded-xl border border-white/6 bg-black/20 p-1">
					{FILTERS.map((item) => (
						<button
							key={item.id}
							type="button"
							onClick={() => onFilterChange(item.id)}
							className={cn(
								"flex-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition",
								filter === item.id
									? "bg-white/10 text-white shadow-sm"
									: "text-neutral-500 hover:text-neutral-300"
							)}
							aria-pressed={filter === item.id}
						>
							{item.label}
						</button>
					))}
				</div>
			</div>

			<div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 sm:p-4">
				{isCreating ? (
					<div className="rounded-2xl border border-dashed border-primary-400/40 bg-primary-500/[0.06] px-4 py-3">
						<div className="flex items-center gap-2 text-xs font-semibold text-primary-200">
							<Plus className="h-3.5 w-3.5" />
							New agent draft
						</div>
						<p className="mt-1 text-[11px] leading-5 text-neutral-500">
							Fill in the editor, then create the agent.
						</p>
					</div>
				) : null}

				{hydrating ? (
					<div className="space-y-2" aria-label="Loading agents">
						{[0, 1, 2].map((item) => (
							<div key={item} className="h-[84px] animate-pulse rounded-2xl bg-white/[0.035]" />
						))}
					</div>
				) : agents.length ? (
					agents.map((agent) => (
						<AgentCard
							key={agent.id}
							agent={agent}
							selected={agent.id === selectedAgentId}
							busy={busyAgentId === agent.id}
							onSelect={onSelect}
							onDuplicate={onDuplicate}
							onDelete={onDelete}
						/>
					))
				) : (
					<div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-8 text-center">
						<UsersRound className="h-7 w-7 text-neutral-700" />
						<p className="mt-3 text-sm font-medium text-neutral-300">
							{totalAgents ? "No matching agents" : "No agents yet"}
						</p>
						<p className="mt-1 text-xs leading-5 text-neutral-600">
							{totalAgents
								? "Try a different search or filter."
								: "Create your first specialist to start the council."}
						</p>
						{!totalAgents ? (
							<Button variant="accent" size="sm" onClick={onNew} className="mt-4">
								<Plus className="h-3.5 w-3.5" />
								New agent
							</Button>
						) : null}
					</div>
				)}
			</div>

			<div className="border-t border-white/8 p-3 sm:p-4">
				<Button variant="accent" className="w-full" onClick={onNew}>
					<Plus className="h-4 w-4" />
					New agent
				</Button>
			</div>
		</Card>
	);
}
