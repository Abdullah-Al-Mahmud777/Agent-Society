"use client";

import { useEffect, useMemo, useState } from "react";

import {
	AI_PROVIDERS,
	DEFAULT_AGENT_COLOR,
	DEFAULT_AGENT_PROMPT,
	DEFAULT_SOCIETY_COLOR,
	DEFAULT_SOCIETY_PROMPT,
	ICON_OPTIONS,
	PROVIDER_DEFAULT_MODELS,
	PROVIDER_LABELS,
	agentInputSchema,
	societyInputSchema,
} from "../../lib/society-schema";
import { useSocietyStore } from "../../store/society-store";

function StatCard({ label, value, subtext }) {
	return (
		<div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur">
			<div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">{label}</div>
			<div className="mt-3 text-3xl font-semibold text-white">{value}</div>
			{subtext ? <p className="mt-2 text-sm leading-6 text-white/60">{subtext}</p> : null}
		</div>
	);
}

function mapErrors(error) {
	const fieldErrors = error.flatten().fieldErrors;
	return Object.entries(fieldErrors).reduce((result, [field, messages]) => {
		if (messages?.[0]) {
			result[field] = messages[0];
		}

		return result;
	}, {});
}

function Field({ label, error, hint, children }) {
	return (
		<label className="block space-y-2">
			<div className="flex items-center justify-between gap-3">
				<span className="text-sm font-medium text-white/80">{label}</span>
				{hint ? <span className="text-xs text-white/45">{hint}</span> : null}
			</div>
			{children}
			{error ? <p className="text-sm text-rose-300">{error}</p> : null}
		</label>
	);
}

function IconPicker({ value, onChange }) {
	return (
		<div className="flex flex-wrap gap-2">
			{ICON_OPTIONS.map((icon) => (
				<button
					key={icon}
					type="button"
					onClick={() => onChange(icon)}
					className={`rounded-2xl border px-3 py-2 text-lg transition ${
						value === icon
							? "border-cyan-300/60 bg-cyan-300/10"
							: "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
					}`}
				>
					{icon}
				</button>
			))}
		</div>
	);
}

function EmptyState({ title, description }) {
	return (
		<div className="rounded-[2rem] border border-dashed border-white/15 bg-black/15 p-8 text-sm leading-7 text-white/60">
			<div className="text-base font-semibold text-white">{title}</div>
			<p className="mt-2">{description}</p>
		</div>
	);
}

function createAgentFormState(agent) {
	if (!agent) {
		return {
			name: "",
			description: "",
			role: "",
			goal: "",
			systemPrompt: DEFAULT_AGENT_PROMPT,
			aiProvider: "openai",
			model: PROVIDER_DEFAULT_MODELS.openai,
			temperature: 0.7,
			maxTokens: 1024,
			icon: "🤖",
			color: DEFAULT_AGENT_COLOR,
			isEnabled: true,
		};
	}

	return {
		name: agent.name,
		description: agent.description,
		role: agent.role,
		goal: agent.goal,
		systemPrompt: agent.systemPrompt,
		aiProvider: agent.aiProvider,
		model: agent.model,
		temperature: agent.temperature,
		maxTokens: agent.maxTokens,
		icon: agent.icon,
		color: agent.color,
		isEnabled: agent.isEnabled,
	};
}

function createSocietyFormState(society) {
	if (!society) {
		return {
			name: "",
			description: "",
			goal: "",
			systemPrompt: DEFAULT_SOCIETY_PROMPT,
			icon: "🏛️",
			color: DEFAULT_SOCIETY_COLOR,
			isEnabled: true,
		};
	}

	return {
		name: society.name,
		description: society.description,
		goal: society.goal,
		systemPrompt: society.systemPrompt,
		icon: society.icon,
		color: society.color,
		isEnabled: society.isEnabled,
	};
}

function AgentEditor({ agent, onCreate, onUpdate, onNew, onDuplicate, onDelete, onToggleEnabled }) {
	const [form, setForm] = useState(() => createAgentFormState(agent));
	const [errors, setErrors] = useState({});

	const isEditing = Boolean(agent);

	const providerHint = useMemo(
		() => `Suggested default: ${PROVIDER_DEFAULT_MODELS[form.aiProvider]}`,
		[form.aiProvider],
	);

	const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

	const handleProviderChange = (provider) => {
		setForm((current) => ({
			...current,
			aiProvider: provider,
			model: PROVIDER_DEFAULT_MODELS[provider],
		}));
	};

	const handleSubmit = (event) => {
		event.preventDefault();

		const validation = agentInputSchema.safeParse(form);
		if (!validation.success) {
			setErrors(mapErrors(validation.error));
			return;
		}

		setErrors({});
		if (isEditing) {
			onUpdate({
				...validation.data,
				id: agent.id,
				createdAt: agent.createdAt,
				updatedAt: new Date().toISOString(),
			});
			return;
		}

		onCreate(validation.data);
	};

	return (
		<section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
			<div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/70">Agent registry</p>
					<h2 className="mt-2 text-xl font-semibold text-white">{isEditing ? "Edit agent" : "Create agent"}</h2>
					<p className="mt-2 text-sm leading-6 text-white/65">Create only the agents your society actually needs. No starter agents are seeded.</p>
				</div>

				<div className="flex flex-wrap gap-2">
					<button type="button" onClick={onNew} className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/5">New agent</button>
					{agent ? (
						<>
							<button type="button" onClick={() => onToggleEnabled(agent.id)} className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/5">{agent.isEnabled ? "Disable" : "Enable"}</button>
							<button type="button" onClick={() => onDuplicate(agent.id)} className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/5">Duplicate</button>
							<button type="button" onClick={() => onDelete(agent.id)} className="rounded-full border border-rose-400/30 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-400/10">Delete</button>
						</>
					) : null}
				</div>
			</div>

			<form className="mt-6 space-y-6" onSubmit={handleSubmit}>
				{Object.keys(errors).length ? (
					<div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">Please fix the highlighted fields before saving.</div>
				) : null}

				<div className="grid gap-4 lg:grid-cols-2">
					<Field label="Name" error={errors.name}><input className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20" value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Agent name" /></Field>
					<Field label="Role" error={errors.role}><input className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20" value={form.role} onChange={(event) => updateField("role", event.target.value)} placeholder="e.g. Researcher" /></Field>
				</div>

				<Field label="Description" error={errors.description}><textarea rows={3} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20" value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="What does this agent do?" /></Field>

				<Field label="Goal" error={errors.goal}><textarea rows={3} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20" value={form.goal} onChange={(event) => updateField("goal", event.target.value)} placeholder="What outcome should it deliver?" /></Field>

				<Field label="System prompt" error={errors.systemPrompt} hint="This is the exact instruction sent to the model"><textarea rows={6} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20" value={form.systemPrompt} onChange={(event) => updateField("systemPrompt", event.target.value)} placeholder={DEFAULT_AGENT_PROMPT} /></Field>

				<div className="grid gap-4 lg:grid-cols-2">
					<Field label="AI provider" error={errors.aiProvider}><select className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20" value={form.aiProvider} onChange={(event) => handleProviderChange(event.target.value)}>{AI_PROVIDERS.map((provider) => <option key={provider} value={provider}>{PROVIDER_LABELS[provider]}</option>)}</select></Field>
					<Field label="Model" error={errors.model} hint={providerHint}><input className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20" value={form.model} onChange={(event) => updateField("model", event.target.value)} placeholder={PROVIDER_DEFAULT_MODELS[form.aiProvider]} /></Field>
				</div>

				<div className="grid gap-4 lg:grid-cols-2">
					<Field label={`Temperature: ${form.temperature.toFixed(1)}`} error={errors.temperature}><input type="range" min="0" max="2" step="0.1" value={form.temperature} onChange={(event) => updateField("temperature", Number(event.target.value))} className="w-full accent-cyan-300" /></Field>
					<Field label="Max tokens" error={errors.maxTokens}><input type="number" min="1" max="32768" step="1" className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20" value={form.maxTokens} onChange={(event) => updateField("maxTokens", Number(event.target.value))} /></Field>
				</div>

				<div className="grid gap-4 lg:grid-cols-2">
					<Field label="Icon" error={errors.icon}><div className="space-y-3"><input className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20" value={form.icon} onChange={(event) => updateField("icon", event.target.value)} placeholder="🤖" /><IconPicker value={form.icon} onChange={(icon) => updateField("icon", icon)} /></div></Field>
					<Field label="Color" error={errors.color}><div className="flex items-center gap-3"><input type="color" value={form.color} onChange={(event) => updateField("color", event.target.value)} className="h-12 w-14 cursor-pointer rounded-2xl border border-white/10 bg-transparent p-1" /><input className="flex-1 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20" value={form.color} onChange={(event) => updateField("color", event.target.value)} placeholder={DEFAULT_AGENT_COLOR} /></div></Field>
				</div>

				<label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white/80"><input type="checkbox" checked={form.isEnabled} onChange={(event) => updateField("isEnabled", event.target.checked)} className="h-4 w-4 rounded border-white/20 bg-slate-950 text-cyan-400 focus:ring-cyan-300" /><span>Enabled for society routing</span></label>

				<div className="flex flex-wrap gap-3 border-t border-white/10 pt-5"><button type="submit" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">{isEditing ? "Save agent" : "Create agent"}</button><button type="button" onClick={() => setForm(createAgentFormState(agent))} className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/5">Reset form</button></div>
			</form>
		</section>
	);
}

function AgentList({ agents, selectedAgentId, searchTerm, onSearchTermChange, onSelect, onDuplicate, onDelete, onToggleEnabled }) {
	return (
		<section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">Agent library</p>
					<h2 className="mt-2 text-xl font-semibold text-white">All agents</h2>
					<p className="mt-2 text-sm leading-6 text-white/65">Create as many agents as you need. Societies can use any user-created agent.</p>
				</div>
				<div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/60">{agents.length} total</div>
			</div>

			<div className="mt-5"><label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-white/45" htmlFor="agent-search">Search</label><input id="agent-search" value={searchTerm} onChange={(event) => onSearchTermChange(event.target.value)} placeholder="Name, role, or goal" className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20" /></div>

			<div className="mt-5 space-y-3">
				{agents.length === 0 ? <EmptyState title="No agents yet" description="Create your first agent in the editor. Societies stay empty until you add agents." /> : null}
				{agents.map((agent) => {
					const isSelected = agent.id === selectedAgentId;
					return (
						<article key={agent.id} className={`rounded-3xl border p-4 transition ${isSelected ? "border-cyan-300/50 bg-cyan-300/10 shadow-[0_0_0_1px_rgba(103,232,249,0.25)]" : "border-white/10 bg-black/15 hover:border-white/20 hover:bg-white/5"}`}>
							<button type="button" onClick={() => onSelect(agent.id)} className="w-full text-left"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-xl" style={{ backgroundColor: `${agent.color}22`, color: agent.color }}><span>{agent.icon}</span></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-base font-semibold text-white">{agent.name}</h3><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white/55">{agent.isEnabled ? "Enabled" : "Disabled"}</span></div><p className="mt-1 text-sm font-medium text-white/75">{agent.role}</p><p className="mt-2 line-clamp-2 text-sm leading-6 text-white/60">{agent.description}</p></div></div></button>
							<div className="mt-4 flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/60">{agent.aiProvider}</span><span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/60">{agent.model}</span><span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/60">{agent.temperature.toFixed(1)} temp</span></div>
							<div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => onToggleEnabled(agent.id)} className="rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-white/75 transition hover:border-white/20 hover:bg-white/5">{agent.isEnabled ? "Disable" : "Enable"}</button><button type="button" onClick={() => onDuplicate(agent.id)} className="rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-white/75 transition hover:border-white/20 hover:bg-white/5">Duplicate</button><button type="button" onClick={() => onDelete(agent.id)} className="rounded-full border border-rose-400/30 px-3 py-2 text-xs font-medium text-rose-200 transition hover:bg-rose-400/10">Delete</button></div>
						</article>
					);
				})}
			</div>
		</section>
	);
}

function SocietyMembers({ society, agents, onAddAgent, onRemoveAgent, onMoveAgent }) {
	const societyAgents = agents.filter((agent) => society.agentIds.includes(agent.id));
	const availableAgents = agents.filter((agent) => !society.agentIds.includes(agent.id));

	return (
		<div className="space-y-5">
			<div className="grid gap-5 lg:grid-cols-2">
				<div className="rounded-3xl border border-white/10 bg-black/15 p-4">
					<div className="flex items-center justify-between gap-3"><h4 className="text-sm font-semibold text-white">Members</h4><span className="text-xs text-white/45">{societyAgents.length}</span></div>
					<div className="mt-4 space-y-3">
						{societyAgents.length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-white/55">Add agents from the right to build the society.</div> : null}
						{societyAgents.map((agent, index) => (
							<div key={agent.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><span className="text-lg">{agent.icon}</span><span className="truncate text-sm font-semibold text-white">{agent.name}</span></div><p className="mt-1 text-xs text-white/55">{agent.role}</p></div><button type="button" onClick={() => onRemoveAgent(agent.id)} className="rounded-full border border-rose-400/25 px-3 py-1.5 text-xs font-medium text-rose-200 transition hover:bg-rose-400/10">Remove</button></div>
								<div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => onMoveAgent(index, index - 1)} disabled={index === 0} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40">Move up</button><button type="button" onClick={() => onMoveAgent(index, index + 1)} disabled={index === societyAgents.length - 1} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40">Move down</button></div>
							</div>
						))}
					</div>
				</div>

				<div className="rounded-3xl border border-white/10 bg-black/15 p-4">
					<div className="flex items-center justify-between gap-3"><h4 className="text-sm font-semibold text-white">Available agents</h4><span className="text-xs text-white/45">{availableAgents.length}</span></div>
					<div className="mt-4 space-y-3">
						{availableAgents.length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-white/55">Create more agents or keep this society focused on its current members.</div> : null}
						{availableAgents.map((agent) => (
							<div key={agent.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><span className="text-lg">{agent.icon}</span><span className="truncate text-sm font-semibold text-white">{agent.name}</span></div><p className="mt-1 text-xs text-white/55">{agent.role}</p></div><button type="button" onClick={() => onAddAgent(agent.id)} className="rounded-full border border-cyan-300/25 px-3 py-1.5 text-xs font-medium text-cyan-100 transition hover:bg-cyan-300/10">Add</button></div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

function SocietyEditor({ society, agents, onCreate, onUpdate, onNew, onDuplicate, onDelete, onAddAgent, onRemoveAgent, onMoveAgent }) {
	const [form, setForm] = useState(() => createSocietyFormState(society));
	const [errors, setErrors] = useState({});

	const isEditing = Boolean(society);

	const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

	const handleSubmit = (event) => {
		event.preventDefault();

		const validation = societyInputSchema.safeParse(form);
		if (!validation.success) {
			setErrors(mapErrors(validation.error));
			return;
		}

		setErrors({});
		if (isEditing) {
			onUpdate({
				...validation.data,
				id: society.id,
				createdAt: society.createdAt,
				updatedAt: new Date().toISOString(),
				agentIds: society.agentIds,
			});
			return;
		}

		onCreate(validation.data);
	};

	return (
		<section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
			<div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/70">Society workspace</p>
					<h2 className="mt-2 text-xl font-semibold text-white">{isEditing ? "Edit society" : "Create society"}</h2>
					<p className="mt-2 text-sm leading-6 text-white/65">Societies are ordered collections of your own agents. Nothing is preloaded.</p>
				</div>

				<div className="flex flex-wrap gap-2">
					<button type="button" onClick={onNew} className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/5">New society</button>
					{society ? (
						<>
							<button type="button" onClick={() => onDuplicate(society.id)} className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/5">Duplicate</button>
							<button type="button" onClick={() => onDelete(society.id)} className="rounded-full border border-rose-400/30 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-400/10">Delete</button>
						</>
					) : null}
				</div>
			</div>

			<form className="mt-6 space-y-6" onSubmit={handleSubmit}>
				{Object.keys(errors).length ? <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">Please fix the highlighted fields before saving.</div> : null}

				<div className="grid gap-4 lg:grid-cols-2">
					<Field label="Name" error={errors.name}><input className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20" value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Society name" /></Field>
					<Field label="Goal" error={errors.goal}><input className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20" value={form.goal} onChange={(event) => updateField("goal", event.target.value)} placeholder="What should this society achieve?" /></Field>
				</div>

				<Field label="Description" error={errors.description}><textarea rows={3} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20" value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Describe the society in plain language." /></Field>

				<Field label="System prompt" error={errors.systemPrompt} hint="Used when the society orchestrates its member agents"><textarea rows={6} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20" value={form.systemPrompt} onChange={(event) => updateField("systemPrompt", event.target.value)} placeholder={DEFAULT_SOCIETY_PROMPT} /></Field>

				<div className="grid gap-4 lg:grid-cols-2">
					<Field label="Icon" error={errors.icon}><div className="space-y-3"><input className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20" value={form.icon} onChange={(event) => updateField("icon", event.target.value)} placeholder="🏛️" /><IconPicker value={form.icon} onChange={(icon) => updateField("icon", icon)} /></div></Field>
					<Field label="Color" error={errors.color}><div className="flex items-center gap-3"><input type="color" value={form.color} onChange={(event) => updateField("color", event.target.value)} className="h-12 w-14 cursor-pointer rounded-2xl border border-white/10 bg-transparent p-1" /><input className="flex-1 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20" value={form.color} onChange={(event) => updateField("color", event.target.value)} placeholder={DEFAULT_SOCIETY_COLOR} /></div></Field>
				</div>

				<label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white/80"><input type="checkbox" checked={form.isEnabled} onChange={(event) => updateField("isEnabled", event.target.checked)} className="h-4 w-4 rounded border-white/20 bg-slate-950 text-cyan-400 focus:ring-cyan-300" /><span>Enabled for orchestration</span></label>

				<div className="border-t border-white/10 pt-5">
					{isEditing ? (
						<SocietyMembers
							society={society}
							agents={agents}
							onAddAgent={(agentId) => onAddAgent?.(agentId)}
							onRemoveAgent={(agentId) => onRemoveAgent?.(agentId)}
							onMoveAgent={(fromIndex, toIndex) => onMoveAgent?.(fromIndex, toIndex)}
						/>
					) : (
						<EmptyState title="Save the society first" description="Create the society before adding, removing, or reordering member agents." />
					)}
				</div>

				<div className="flex flex-wrap gap-3 border-t border-white/10 pt-5"><button type="submit" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">{isEditing ? "Save society" : "Create society"}</button><button type="button" onClick={() => setForm(createSocietyFormState(society))} className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/5">Reset form</button></div>
			</form>
		</section>
	);
}

function SocietyList({ societies, selectedSocietyId, searchTerm, onSearchTermChange, onSelect, onDuplicate, onDelete }) {
	return (
		<section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/70">Society library</p>
					<h2 className="mt-2 text-xl font-semibold text-white">All societies</h2>
					<p className="mt-2 text-sm leading-6 text-white/65">Create unlimited societies, then add, remove, and reorder your agents inside each one.</p>
				</div>
				<div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/60">{societies.length} total</div>
			</div>

			<div className="mt-5"><label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-white/45" htmlFor="society-search">Search</label><input id="society-search" value={searchTerm} onChange={(event) => onSearchTermChange(event.target.value)} placeholder="Name, goal, or description" className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20" /></div>

			<div className="mt-5 space-y-3">
				{societies.length === 0 ? <EmptyState title="No societies yet" description="Create your first society in the editor. Then add any user-created agents to it." /> : null}
				{societies.map((society) => {
					const isSelected = society.id === selectedSocietyId;
					return (
						<article key={society.id} className={`rounded-3xl border p-4 transition ${isSelected ? "border-cyan-300/50 bg-cyan-300/10 shadow-[0_0_0_1px_rgba(103,232,249,0.25)]" : "border-white/10 bg-black/15 hover:border-white/20 hover:bg-white/5"}`}>
							<button type="button" onClick={() => onSelect(society.id)} className="w-full text-left"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-xl" style={{ backgroundColor: `${society.color}22`, color: society.color }}><span>{society.icon}</span></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-base font-semibold text-white">{society.name}</h3><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white/55">{society.isEnabled ? "Enabled" : "Disabled"}</span></div><p className="mt-1 text-sm font-medium text-white/75">{society.goal}</p><p className="mt-2 line-clamp-2 text-sm leading-6 text-white/60">{society.description}</p></div></div></button>
							<div className="mt-4 flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/60">{society.agentIds.length} agents</span><span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/60">ordered</span></div>
							<div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => onDuplicate(society.id)} className="rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-white/75 transition hover:border-white/20 hover:bg-white/5">Duplicate</button><button type="button" onClick={() => onDelete(society.id)} className="rounded-full border border-rose-400/30 px-3 py-2 text-xs font-medium text-rose-200 transition hover:bg-rose-400/10">Delete</button></div>
						</article>
					);
				})}
			</div>
		</section>
	);
}

export default function SocietyBuilderApp() {
	const [agentSearchTerm, setAgentSearchTerm] = useState("");
	const [societySearchTerm, setSocietySearchTerm] = useState("");

	const agents = useSocietyStore((state) => state.agents);
	const societies = useSocietyStore((state) => state.societies);
	const selectedAgentId = useSocietyStore((state) => state.selectedAgentId);
	const selectedSocietyId = useSocietyStore((state) => state.selectedSocietyId);
	const selectAgentId = useSocietyStore((state) => state.selectAgentId);
	const selectSocietyId = useSocietyStore((state) => state.selectSocietyId);
	const createAgent = useSocietyStore((state) => state.createAgent);
	const updateAgent = useSocietyStore((state) => state.updateAgent);
	const duplicateAgent = useSocietyStore((state) => state.duplicateAgent);
	const deleteAgent = useSocietyStore((state) => state.deleteAgent);
	const toggleAgentEnabled = useSocietyStore((state) => state.toggleAgentEnabled);
	const createSociety = useSocietyStore((state) => state.createSociety);
	const updateSociety = useSocietyStore((state) => state.updateSociety);
	const duplicateSociety = useSocietyStore((state) => state.duplicateSociety);
	const deleteSociety = useSocietyStore((state) => state.deleteSociety);
	const addAgentToSociety = useSocietyStore((state) => state.addAgentToSociety);
	const removeAgentFromSociety = useSocietyStore((state) => state.removeAgentFromSociety);
	const moveAgentInSociety = useSocietyStore((state) => state.moveAgentInSociety);
	const resetAll = useSocietyStore((state) => state.resetAll);

	useEffect(() => {
		void useSocietyStore.persist.rehydrate();
	}, []);

	useEffect(() => {
		if (selectedAgentId && !agents.some((agent) => agent.id === selectedAgentId)) {
			selectAgentId(agents[0]?.id ?? null);
		}

		if (selectedSocietyId && !societies.some((society) => society.id === selectedSocietyId)) {
			selectSocietyId(societies[0]?.id ?? null);
		}
	}, [agents, societies, selectAgentId, selectSocietyId, selectedAgentId, selectedSocietyId]);

	const filteredAgents = useMemo(() => {
		const query = agentSearchTerm.trim().toLowerCase();
		if (!query) return agents;
		return agents.filter((agent) => [agent.name, agent.role, agent.goal, agent.description].join(" ").toLowerCase().includes(query));
	}, [agents, agentSearchTerm]);

	const filteredSocieties = useMemo(() => {
		const query = societySearchTerm.trim().toLowerCase();
		if (!query) return societies;
		return societies.filter((society) => [society.name, society.goal, society.description].join(" ").toLowerCase().includes(query));
	}, [societies, societySearchTerm]);

	const selectedAgent = useMemo(() => agents.find((agent) => agent.id === selectedAgentId) ?? null, [agents, selectedAgentId]);
	const selectedSociety = useMemo(() => societies.find((society) => society.id === selectedSocietyId) ?? null, [societies, selectedSocietyId]);

	const enabledAgents = agents.filter((agent) => agent.isEnabled).length;
	const enabledSocieties = societies.filter((society) => society.isEnabled).length;
	const totalMemberships = societies.reduce((total, society) => total + society.agentIds.length, 0);

	return (
		<main className="min-h-screen overflow-hidden bg-[#07111f] text-white">
			<div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(244,114,182,0.12),_transparent_28%),linear-gradient(180deg,_#0b1526_0%,_#07111f_100%)]" />
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
				<header className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_20px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl">
					<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
						<div className="max-w-3xl">
							<div className="flex flex-wrap gap-2">
								<span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">Society Builder</span>
								<span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">Local Storage</span>
								<span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">Zustand</span>
							</div>
							<h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">Build societies from any agents you create.</h1>
							<p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">Create unlimited agents, assemble them into societies, and reorder the society membership without any hardcoded starter data.</p>
						</div>

						<div className="grid gap-3 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-50">
							<div className="font-semibold uppercase tracking-[0.25em] text-cyan-200/80">Persisted state</div>
							<div>{agents.length} agents saved locally</div>
							<div>{societies.length} societies saved locally</div>
						</div>
					</div>
				</header>

				<section className="grid gap-4 md:grid-cols-4">
					<StatCard label="Total agents" value={agents.length.toString()} subtext="Agents are created by users only." />
					<StatCard label="Enabled agents" value={enabledAgents.toString()} subtext="Disabled agents stay stored in the library." />
					<StatCard label="Societies" value={societies.length.toString()} subtext="Each society can contain any ordered agent set." />
					<StatCard label="Memberships" value={totalMemberships.toString()} subtext="This counts every agent assigned across societies." />
				</section>

				<section className="grid gap-8 xl:grid-cols-2">
					<div className="space-y-6">
						<AgentList agents={filteredAgents} selectedAgentId={selectedAgentId} searchTerm={agentSearchTerm} onSearchTermChange={setAgentSearchTerm} onSelect={selectAgentId} onDuplicate={duplicateAgent} onDelete={deleteAgent} onToggleEnabled={toggleAgentEnabled} />
						<AgentEditor key={selectedAgent?.id ?? "new-agent"} agent={selectedAgent} onCreate={createAgent} onUpdate={updateAgent} onNew={() => selectAgentId(null)} onDuplicate={duplicateAgent} onDelete={deleteAgent} onToggleEnabled={toggleAgentEnabled} />
					</div>

					<div className="space-y-6">
						<SocietyList societies={filteredSocieties} selectedSocietyId={selectedSocietyId} searchTerm={societySearchTerm} onSearchTermChange={setSocietySearchTerm} onSelect={selectSocietyId} onDuplicate={duplicateSociety} onDelete={deleteSociety} />
						<SocietyEditor key={selectedSociety?.id ?? "new-society"} society={selectedSociety} agents={agents} onCreate={createSociety} onUpdate={updateSociety} onNew={() => selectSocietyId(null)} onDuplicate={duplicateSociety} onDelete={deleteSociety} onAddAgent={(agentId) => selectedSociety && addAgentToSociety(selectedSociety.id, agentId)} onRemoveAgent={(agentId) => selectedSociety && removeAgentFromSociety(selectedSociety.id, agentId)} onMoveAgent={(fromIndex, toIndex) => selectedSociety && moveAgentInSociety(selectedSociety.id, fromIndex, toIndex)} />
						<section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
							<div className="flex items-start justify-between gap-4">
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/70">Current selection</p>
									<h2 className="mt-2 text-xl font-semibold text-white">Snapshot</h2>
									<p className="mt-2 text-sm leading-6 text-white/65">Review the selected agent or society before saving changes.</p>
								</div>
								<button type="button" onClick={resetAll} className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/5">Clear all</button>
							</div>

							<div className="mt-5 space-y-4">
								{selectedAgent ? <pre className="overflow-x-auto rounded-3xl border border-white/10 bg-slate-950/90 p-5 text-xs leading-6 text-cyan-100">{JSON.stringify(selectedAgent, null, 2)}</pre> : <EmptyState title="No agent selected" description="Select an agent or create a new one to inspect the saved record." />}
								{selectedSociety ? <pre className="overflow-x-auto rounded-3xl border border-white/10 bg-slate-950/90 p-5 text-xs leading-6 text-cyan-100">{JSON.stringify(selectedSociety, null, 2)}</pre> : <EmptyState title="No society selected" description="Select a society or create a new one to inspect the ordered membership list." />}
							</div>
						</section>
					</div>
				</section>
			</div>
		</main>
	);
}
