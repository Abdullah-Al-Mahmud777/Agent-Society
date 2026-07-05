"use client";

import { motion, useReducedMotion } from "motion/react";
import { Search, Power, Copy, Trash2, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/components/ui/cn";

export default function AgentList({
	agents,
	selectedAgentId,
	searchTerm,
	onSearchTermChange,
	onSelect,
	onNew,
	onDuplicate,
	onDelete,
	onToggleEnabled,
}) {
	const reduce = useReducedMotion();

	return (
		<Card variant="default" radius="panel" className="p-5">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">
						Agent library
					</p>
					<h2 className="mt-2 text-xl font-semibold text-ink">All agents</h2>
					<p className="mt-2 text-sm leading-6 text-ink-muted">
						Create, duplicate, disable, and remove agents without leaving the browser.
					</p>
				</div>
				<div className="flex shrink-0 flex-col items-end gap-2">
					{onNew && (
						<Button variant="accent" size="sm" onClick={onNew}>
							<Plus className="h-3.5 w-3.5" />
							New agent
						</Button>
					)}
					<Badge tone="neutral">{agents.length} total</Badge>
				</div>
			</div>

			<div className="relative mt-5">
				<Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
				<Input
					id="agent-search"
					value={searchTerm}
					onChange={(event) => onSearchTermChange(event.target.value)}
					placeholder="Search by name, role, or goal"
					className="pl-11"
				/>
			</div>

			<div className="mt-5 space-y-3">
				{agents.length === 0 && (
					<div className="rounded-2xl border border-dashed border-glass-border bg-black/15 p-6 text-sm text-ink-muted">
						No agents match. Create one from the editor, or clear the search.
					</div>
				)}

				{agents.map((agent, i) => {
					const isSelected = agent.id === selectedAgentId;

					return (
						<motion.article
							key={agent.id}
							layout
							initial={reduce ? false : { opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
							className={cn(
								"rounded-card border p-4 transition",
								isSelected
									? "border-brand-cyan/50 bg-brand-cyan/10"
									: "border-glass-border bg-black/15 hover:border-glass-border-strong hover:bg-glass"
							)}
							style={
								isSelected
									? { boxShadow: `0 0 0 1px ${agent.color}40, 0 0 30px ${agent.color}22` }
									: undefined
							}
						>
							<button type="button" onClick={() => onSelect(agent.id)} className="w-full text-left">
								<div className="flex items-start gap-4">
									<div
										className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-xl"
										style={{
											backgroundColor: `${agent.color}1f`,
											borderColor: `${agent.color}44`,
											color: agent.color,
										}}
									>
										<span>{agent.icon}</span>
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<h3 className="truncate text-base font-semibold text-ink">{agent.name}</h3>
											<Badge tone={agent.isEnabled ? "emerald" : "neutral"} uppercase>
												{agent.isEnabled ? "Enabled" : "Disabled"}
											</Badge>
										</div>
										<p className="mt-1 text-sm font-medium text-ink-muted">{agent.role}</p>
										<p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-subtle">
											{agent.description}
										</p>
									</div>
								</div>
							</button>

							<div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-subtle">
								<span className="rounded-pill border border-glass-border bg-glass px-2.5 py-1">
									{agent.aiProvider}
								</span>
								<span className="rounded-pill border border-glass-border bg-glass px-2.5 py-1">
									{agent.model}
								</span>
								<span className="rounded-pill border border-glass-border bg-glass px-2.5 py-1">
									{agent.temperature.toFixed(1)} temp
								</span>
							</div>

							<div className="mt-4 flex flex-wrap gap-2">
								<button
									type="button"
									onClick={() => onToggleEnabled(agent.id)}
									className="inline-flex items-center gap-1.5 rounded-pill border border-glass-border px-3 py-2 text-xs font-medium text-ink-muted transition hover:border-glass-border-strong hover:bg-glass"
								>
									<Power className="h-3.5 w-3.5" />
									{agent.isEnabled ? "Disable" : "Enable"}
								</button>
								<button
									type="button"
									onClick={() => onDuplicate(agent.id)}
									className="inline-flex items-center gap-1.5 rounded-pill border border-glass-border px-3 py-2 text-xs font-medium text-ink-muted transition hover:border-glass-border-strong hover:bg-glass"
								>
									<Copy className="h-3.5 w-3.5" />
									Duplicate
								</button>
								<button
									type="button"
									onClick={() => onDelete(agent.id)}
									className="inline-flex items-center gap-1.5 rounded-pill border border-rose-400/30 px-3 py-2 text-xs font-medium text-rose-200 transition hover:bg-rose-400/10"
								>
									<Trash2 className="h-3.5 w-3.5" />
									Delete
								</button>
							</div>
						</motion.article>
					);
				})}
			</div>
		</Card>
	);
}
