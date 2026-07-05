"use client";

import { useMemo, useState } from "react";

import {
	AI_PROVIDERS,
	DEFAULT_AGENT_COLOR,
	DEFAULT_SYSTEM_PROMPT,
	ICON_OPTIONS,
	PROVIDER_DEFAULT_MODELS,
	PROVIDER_LABELS,
	agentInputSchema,
	createAgentDefaults,
} from "../../lib/agent-builder-schema";

function buildFormState(agent) {
	if (!agent) {
		return createAgentDefaults();
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

function mapErrors(error) {
	const fieldErrors = error.flatten().fieldErrors;
	return Object.entries(fieldErrors).reduce((result, [field, messages]) => {
		if (messages && messages[0]) {
			result[field] = messages[0];
		}

		return result;
	}, {});
}

function FormField({ label, error, children, hint }) {
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

export default function AgentEditor({
	agent,
	onCreate,
	onUpdate,
	onNew,
	onDuplicate,
	onDelete,
	onToggleEnabled,
}) {
	const [form, setForm] = useState(() => buildFormState(agent));
	const [errors, setErrors] = useState({});

	const isEditing = Boolean(agent);
	const providerHint = useMemo(
		() => `Suggested default: ${PROVIDER_DEFAULT_MODELS[form.aiProvider]}`,
		[form.aiProvider],
	);

	const updateField = (field, value) => {
		setForm((current) => ({
			...current,
			[field]: value,
		}));
	};

	const handleProviderChange = (nextProvider) => {
		setForm((current) => ({
			...current,
			aiProvider: nextProvider,
			model: PROVIDER_DEFAULT_MODELS[nextProvider],
		}));
	};

	const handleSave = (event) => {
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

	const handleReset = () => {
		setForm(buildFormState(agent));
		setErrors({});
	};

	return (
		<section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
			<div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/70">Agent editor</p>
					<h2 className="mt-2 text-xl font-semibold text-white">
						{isEditing ? "Edit agent" : "Create a new agent"}
					</h2>
					<p className="mt-2 text-sm leading-6 text-white/65">Validate and save every field locally. Nothing leaves the browser unless you wire it to an API later.</p>
				</div>

				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={onNew}
						className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/5"
					>
						New agent
					</button>
					{agent ? (
						<>
							<button
								type="button"
								onClick={() => onToggleEnabled(agent.id)}
								className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/5"
							>
								{agent.isEnabled ? "Disable" : "Enable"}
							</button>
							<button
								type="button"
								onClick={() => onDuplicate(agent.id)}
								className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/5"
							>
								Duplicate
							</button>
							<button
								type="button"
								onClick={() => onDelete(agent.id)}
								className="rounded-full border border-rose-400/30 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-400/10"
							>
								Delete
							</button>
						</>
					) : null}
				</div>
			</div>

			<form className="mt-6 space-y-6" onSubmit={handleSave}>
				{Object.keys(errors).length ? (
					<div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
						Please fix the highlighted fields before saving.
					</div>
				) : null}

				<div className="grid gap-4 lg:grid-cols-2">
					<FormField label="Name" error={errors.name}>
						<input
							type="text"
							value={form.name}
							onChange={(event) => updateField("name", event.target.value)}
							className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
							placeholder="Agent name"
						/>
					</FormField>

					<FormField label="Role" error={errors.role}>
						<input
							type="text"
							value={form.role}
							onChange={(event) => updateField("role", event.target.value)}
							className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
							placeholder="e.g. Product strategist"
						/>
					</FormField>
				</div>

				<FormField label="Description" error={errors.description}>
					<textarea
						rows={3}
						value={form.description}
						onChange={(event) => updateField("description", event.target.value)}
						className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
						placeholder="What does this agent do?"
					/>
				</FormField>

				<FormField label="Goal" error={errors.goal}>
					<textarea
						rows={3}
						value={form.goal}
						onChange={(event) => updateField("goal", event.target.value)}
						className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
						placeholder="What outcome should it deliver?"
					/>
				</FormField>

				<FormField label="System prompt" error={errors.systemPrompt} hint="This is the exact instruction sent to the model">
					<textarea
						rows={6}
						value={form.systemPrompt}
						onChange={(event) => updateField("systemPrompt", event.target.value)}
						className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
						placeholder={DEFAULT_SYSTEM_PROMPT}
					/>
				</FormField>

				<div className="grid gap-4 lg:grid-cols-2">
					<FormField label="AI provider" error={errors.aiProvider}>
						<select
							value={form.aiProvider}
							onChange={(event) => handleProviderChange(event.target.value)}
							className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
						>
							{AI_PROVIDERS.map((provider) => (
								<option key={provider} value={provider}>
									{PROVIDER_LABELS[provider]}
								</option>
							))}
						</select>
					</FormField>

					<FormField label="Model" error={errors.model} hint={providerHint}>
						<input
							type="text"
							value={form.model}
							onChange={(event) => updateField("model", event.target.value)}
							className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
							placeholder={PROVIDER_DEFAULT_MODELS[form.aiProvider]}
						/>
					</FormField>
				</div>

				<div className="grid gap-4 lg:grid-cols-2">
					<FormField label={`Temperature: ${form.temperature.toFixed(1)}`} error={errors.temperature}>
						<input
							type="range"
							min="0"
							max="2"
							step="0.1"
							value={form.temperature}
							onChange={(event) => updateField("temperature", Number(event.target.value))}
							className="w-full accent-cyan-300"
						/>
					</FormField>

					<FormField label="Max tokens" error={errors.maxTokens}>
						<input
							type="number"
							min="1"
							max="32768"
							step="1"
							value={form.maxTokens}
							onChange={(event) => updateField("maxTokens", Number(event.target.value))}
							className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
						/>
					</FormField>
				</div>

				<div className="grid gap-4 lg:grid-cols-2">
					<FormField label="Icon" error={errors.icon}>
						<div className="space-y-3">
							<input
								type="text"
								value={form.icon}
								onChange={(event) => updateField("icon", event.target.value)}
								className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
								placeholder="🤖"
							/>
							<IconPicker value={form.icon} onChange={(icon) => updateField("icon", icon)} />
						</div>
					</FormField>

					<FormField label="Color" error={errors.color}>
						<div className="flex items-center gap-3">
							<input
								type="color"
								value={form.color}
								onChange={(event) => updateField("color", event.target.value)}
								className="h-12 w-14 cursor-pointer rounded-2xl border border-white/10 bg-transparent p-1"
							/>
							<input
								type="text"
								value={form.color}
								onChange={(event) => updateField("color", event.target.value)}
								className="flex-1 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
								placeholder={DEFAULT_AGENT_COLOR}
							/>
						</div>
					</FormField>
				</div>

				<label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white/80">
					<input
						type="checkbox"
						checked={form.isEnabled}
						onChange={(event) => updateField("isEnabled", event.target.checked)}
						className="h-4 w-4 rounded border-white/20 bg-slate-950 text-cyan-400 focus:ring-cyan-300"
					/>
					<span>Enabled for routing</span>
				</label>

				<div className="flex flex-wrap gap-3 border-t border-white/10 pt-5">
					<button
						type="submit"
						className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
					>
						{isEditing ? "Save agent" : "Create agent"}
					</button>
					<button
						type="button"
						onClick={handleReset}
						className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/5"
					>
						Reset form
					</button>
				</div>
			</form>
		</section>
	);
}
