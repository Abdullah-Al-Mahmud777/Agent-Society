"use client";

import { useEffect, useState } from "react";
import {
	AlertTriangle,
	Brain,
	CheckCircle2,
	Clock3,
	History,
	MessageSquare,
	Save,
	Trash2,
	XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { cn } from "@/components/ui/cn";
import { AgentMemory } from "@/lib/agent-memory";

function formatDate(value) {
	if (!value) return "Unknown time";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Unknown time";
	return date.toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function MemoryStat({ icon: Icon, label, value }) {
	return (
		<div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
			<div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600">
				<Icon className="h-3.5 w-3.5" />
				{label}
			</div>
			<div className="mt-2 text-2xl font-semibold text-white">{value}</div>
		</div>
	);
}

export default function AgentMemoryPanel({ agent, active, onNotice }) {
	const [memoryClient] = useState(() => new AgentMemory());
	const [memory, setMemory] = useState(null);
	const [notes, setNotes] = useState("");
	const [savingNotes, setSavingNotes] = useState(false);
	const [clearing, setClearing] = useState(false);
	const [confirmingClear, setConfirmingClear] = useState(false);

	useEffect(() => {
		if (!active || !agent?.id || memory) return undefined;

		let cancelled = false;
		void memoryClient.loadFromServer(agent.id).then((loadedMemory) => {
			if (cancelled) return;
			setMemory(loadedMemory);
			setNotes(loadedMemory.notes || "");
		});

		return () => {
			cancelled = true;
		};
	}, [active, agent?.id, memory, memoryClient]);

	if (!agent) return null;

	const conversationHistory = memory?.conversationHistory || [];
	const executionHistory = memory?.executionHistory || [];
	const notesDirty = memory ? notes !== (memory.notes || "") : false;

	const handleSaveNotes = async () => {
		setSavingNotes(true);
		try {
			await memoryClient.updateNotes(agent.id, notes.trim());
			setMemory((current) => ({ ...(current || {}), notes: notes.trim() }));
			onNotice?.("success", "Private notes saved to Turso.");
		} catch (error) {
			onNotice?.("error", error.message || "Notes could not be saved.");
		} finally {
			setSavingNotes(false);
		}
	};

	const handleClearMemory = async () => {
		setClearing(true);
		try {
			await memoryClient.clearAgentMemory(agent.id);
			setMemory({ conversationHistory: [], executionHistory: [], notes: "" });
			setNotes("");
			setConfirmingClear(false);
			onNotice?.("success", "Agent memory cleared.");
		} catch (error) {
			onNotice?.("error", error.message || "Memory could not be cleared.");
		} finally {
			setClearing(false);
		}
	};

	return (
		<div className={cn("space-y-5", !active && "hidden")}>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-300/80">
						<Brain className="h-3.5 w-3.5" />
						Memory & context
					</div>
					<h3 className="mt-2 text-lg font-semibold text-white">What this agent remembers</h3>
					<p className="mt-1 max-w-2xl text-xs leading-5 text-neutral-500">
						Notes and conversation history are stored per account in Turso. Notes are private to this agent.
					</p>
				</div>
				<Badge tone="violet">Cloud synced</Badge>
			</div>

			<div className="grid gap-3 sm:grid-cols-3">
				<MemoryStat icon={MessageSquare} label="Conversations" value={conversationHistory.length} />
				<MemoryStat icon={History} label="Executions" value={executionHistory.length} />
				<MemoryStat icon={Clock3} label="Notes" value={notes.trim() ? "Saved" : "Empty"} />
			</div>

			<section className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 sm:p-5">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h4 className="text-sm font-semibold text-white">Private notes</h4>
						<p className="mt-1 text-xs text-neutral-600">Only visible to this agent&apos;s editor.</p>
					</div>
					<Button
						variant="secondary"
						size="sm"
						onClick={handleSaveNotes}
						disabled={!notesDirty}
						loading={savingNotes}
					>
						<Save className="h-3.5 w-3.5" />
						Save notes
					</Button>
				</div>
				<Textarea
					aria-label="Private agent notes"
					rows={4}
					value={notes}
					onChange={(event) => setNotes(event.target.value)}
					placeholder="Decisions, preferences, context…"
					className="mt-4 min-h-[112px] text-sm"
				/>
			</section>

			<section className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 sm:p-5">
				<div className="flex items-center justify-between gap-3">
					<div>
						<h4 className="text-sm font-semibold text-white">Conversation history</h4>
						<p className="mt-1 text-xs text-neutral-600">Recent turns shared with this agent.</p>
					</div>
					<Badge tone="neutral">{conversationHistory.length}</Badge>
				</div>

				{!memory ? (
					<div className="mt-4 h-24 animate-pulse rounded-xl bg-white/[0.035]" />
				) : conversationHistory.length === 0 ? (
					<div className="mt-4 rounded-xl border border-dashed border-white/8 px-4 py-8 text-center text-xs text-neutral-600">
						No conversation history yet.
					</div>
				) : (
					<div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
						{conversationHistory.slice(-12).reverse().map((entry, index) => (
							<div
								key={`${entry.timestamp}-${index}`}
								className="rounded-xl border border-white/6 bg-black/15 px-3.5 py-3"
							>
								<div className="flex items-center justify-between gap-3 text-[10px] text-neutral-600">
									<span className="font-semibold uppercase tracking-[0.16em]">
										{entry.role === "user" ? "You" : agent.name}
									</span>
									<span>{formatDate(entry.timestamp)}</span>
								</div>
								<p className="mt-1.5 whitespace-pre-wrap text-xs leading-5 text-neutral-300">
									{entry.content}
								</p>
							</div>
						))}
					</div>
				)}
			</section>

			<section className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 sm:p-5">
				<div className="flex items-center justify-between gap-3">
					<div>
						<h4 className="text-sm font-semibold text-white">Execution history</h4>
						<p className="mt-1 text-xs text-neutral-600">The latest runs involving this agent.</p>
					</div>
					<Badge tone="neutral">{executionHistory.length}</Badge>
				</div>

				{!memory ? (
					<div className="mt-4 h-20 animate-pulse rounded-xl bg-white/[0.035]" />
				) : executionHistory.length === 0 ? (
					<div className="mt-4 rounded-xl border border-dashed border-white/8 px-4 py-8 text-center text-xs text-neutral-600">
						No execution history yet.
					</div>
				) : (
					<div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
						{executionHistory.slice(-8).reverse().map((entry, index) => {
							const succeeded = entry.success !== false;
							return (
								<div
									key={`${entry.timestamp}-${index}`}
									className="flex items-start gap-3 rounded-xl border border-white/6 bg-black/15 px-3.5 py-3"
								>
									{succeeded ? (
										<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/80" />
									) : (
										<XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400/80" />
									)}
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-neutral-600">
											<span className="font-semibold uppercase tracking-[0.16em]">
												{succeeded ? "Completed" : "Failed"}
											</span>
											<span>{formatDate(entry.timestamp)}</span>
										</div>
										<p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-400">
											{entry.content || entry.userRequest || entry.error || "No output recorded."}
										</p>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</section>

			<section className="rounded-2xl border border-rose-400/15 bg-rose-400/[0.035] p-4 sm:p-5">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h4 className="text-sm font-semibold text-rose-100">Reset memory</h4>
						<p className="mt-1 text-xs text-rose-200/45">
							Deletes stored notes, conversation history, and execution context for this agent.
						</p>
					</div>
					{!confirmingClear ? (
						<Button variant="danger" size="sm" onClick={() => setConfirmingClear(true)}>
							<Trash2 className="h-3.5 w-3.5" />
							Clear memory
						</Button>
					) : (
						<div className="flex items-center gap-2">
							<Button variant="ghost" size="sm" onClick={() => setConfirmingClear(false)}>
								Cancel
							</Button>
							<Button
								variant="danger"
								size="sm"
								onClick={handleClearMemory}
								loading={clearing}
							>
								<AlertTriangle className="h-3.5 w-3.5" />
								Confirm clear
							</Button>
						</div>
					)}
				</div>
			</section>
		</div>
	);
}
