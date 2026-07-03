export default function AgentList({
	agents,
	selectedAgentId,
	searchTerm,
	onSearchTermChange,
	onSelect,
	onDuplicate,
	onDelete,
	onToggleEnabled,
}) {
	return (
		<section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">Agent library</p>
					<h2 className="mt-2 text-xl font-semibold text-white">All agents</h2>
					<p className="mt-2 text-sm leading-6 text-white/65">Create, duplicate, disable, and remove agents without leaving the browser.</p>
				</div>
				<div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/60">
					{agents.length} total
				</div>
			</div>

			<div className="mt-5">
				<label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-white/45" htmlFor="agent-search">
					Search
				</label>
				<input
					id="agent-search"
					value={searchTerm}
					onChange={(event) => onSearchTermChange(event.target.value)}
					placeholder="Name, role, or goal"
					className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
				/>
			</div>

			<div className="mt-5 space-y-3">
				{agents.length === 0 ? (
					<div className="rounded-2xl border border-dashed border-white/15 bg-black/15 p-6 text-sm text-white/65">
						No agents yet. Create your first one from the editor.
					</div>
				) : null}

				{agents.map((agent) => {
					const isSelected = agent.id === selectedAgentId;

					return (
						<article
							key={agent.id}
							className={`rounded-3xl border p-4 transition ${
								isSelected
									? "border-cyan-300/50 bg-cyan-300/10 shadow-[0_0_0_1px_rgba(103,232,249,0.25)]"
									: "border-white/10 bg-black/15 hover:border-white/20 hover:bg-white/5"
							}`}
						>
							<button type="button" onClick={() => onSelect(agent.id)} className="w-full text-left">
								<div className="flex items-start gap-4">
									<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-xl" style={{ backgroundColor: `${agent.color}22`, color: agent.color }}>
										<span>{agent.icon}</span>
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<h3 className="truncate text-base font-semibold text-white">{agent.name}</h3>
											<span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white/55">
												{agent.isEnabled ? "Enabled" : "Disabled"}
											</span>
										</div>
										<p className="mt-1 text-sm font-medium text-white/75">{agent.role}</p>
										<p className="mt-2 line-clamp-2 text-sm leading-6 text-white/60">{agent.description}</p>
									</div>
								</div>
							</button>

							<div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
								<span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/60">{agent.aiProvider}</span>
								<span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/60">{agent.model}</span>
								<span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/60">{agent.temperature.toFixed(1)} temp</span>
							</div>

							<div className="mt-4 flex flex-wrap gap-2">
								<button
									type="button"
									onClick={() => onToggleEnabled(agent.id)}
									className="rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-white/75 transition hover:border-white/20 hover:bg-white/5"
								>
									{agent.isEnabled ? "Disable" : "Enable"}
								</button>
								<button
									type="button"
									onClick={() => onDuplicate(agent.id)}
									className="rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-white/75 transition hover:border-white/20 hover:bg-white/5"
								>
									Duplicate
								</button>
								<button
									type="button"
									onClick={() => onDelete(agent.id)}
									className="rounded-full border border-rose-400/30 px-3 py-2 text-xs font-medium text-rose-200 transition hover:bg-rose-400/10"
								>
									Delete
								</button>
							</div>
						</article>
					);
				})}
			</div>
		</section>
	);
}
