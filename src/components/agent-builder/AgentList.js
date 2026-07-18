"use client";

import { motion, useReducedMotion } from "motion/react";
import { Search, Power, Copy, Trash2, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, InputGroup } from "@/components/ui/Input";
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
		<Card variant="default" className="p-5">
			<CardHeader>
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-400/70">
							Agent library
						</p>
						<CardTitle className="mt-2 text-xl">All agents</CardTitle>
						<p className="mt-2 text-sm leading-6 text-neutral-400">
							Create, duplicate, disable, and remove agents without leaving the browser.
						</p>
					</div>
					<div className="flex shrink-0 flex-col items-end gap-2">
						{onNew && (
							<Button variant="secondary" size="sm" onClick={onNew}>
								<Plus className="h-3.5 w-3.5" />
								New agent
							</Button>
						)}
						<Badge variant="neutral">{agents.length} total</Badge>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="relative mt-5">
					<Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
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
						<div className="rounded-2xl border border-dashed border-neutral-700 bg-neutral-800/30 p-6 text-sm text-neutral-400">
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
								"rounded-lg border p-4 transition",
								isSelected
									? "border-primary-500/50 bg-primary-500/10"
									: "border-neutral-700 bg-neutral-800/50 hover:border-neutral-600 hover:bg-neutral-800"
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
											<h3 className="truncate text-base font-semibold text-white">{agent.name}</h3>
											<Badge variant={agent.isEnabled ? "success" : "neutral"} size="sm">
												{agent.isEnabled ? "Enabled" : "Disabled"}
											</Badge>
										</div>
										<p className="mt-1 text-sm font-medium text-neutral-400">{agent.role}</p>
										<p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-500">
											{agent.description}
										</p>
									</div>
								</div>
							</button>

							<div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
								<span className="rounded-full border border-neutral-700 bg-neutral-800 px-2.5 py-1">
									{agent.aiProvider}
								</span>
								<span className="rounded-full border border-neutral-700 bg-neutral-800 px-2.5 py-1">
									{agent.model}
								</span>
								<span className="rounded-full border border-neutral-700 bg-neutral-800 px-2.5 py-1">
									{agent.temperature.toFixed(1)} temp
								</span>
							</div>

							<div className="mt-4 flex flex-wrap gap-2">
								<button
									type="button"
									onClick={() => onToggleEnabled(agent.id)}
									className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 px-3 py-2 text-xs font-medium text-neutral-400 transition hover:border-neutral-600 hover:bg-neutral-800"
								>
									<Power className="h-3.5 w-3.5" />
									{agent.isEnabled ? "Disable" : "Enable"}
								</button>
								<button
									type="button"
									onClick={() => onDuplicate(agent.id)}
									className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 px-3 py-2 text-xs font-medium text-neutral-400 transition hover:border-neutral-600 hover:bg-neutral-800"
								>
									<Copy className="h-3.5 w-3.5" />
									Duplicate
								</button>
								<button
									type="button"
									onClick={() => onDelete(agent.id)}
									className="inline-flex items-center gap-1.5 rounded-full border border-error-500/30 px-3 py-2 text-xs font-medium text-error-200 transition hover:bg-error-500/10"
								>
									<Trash2 className="h-3.5 w-3.5" />
									Delete
								</button>
							</div>
						</motion.article>
					);
				})}
			</div>
			</CardContent>
		</Card>
	);
}
