"use client";

import { useMemo, useState } from "react";
import { Plus, Power, Copy, Trash2, AlertCircle, Sparkles } from "lucide-react";

import {
	AI_PROVIDERS,
	DEFAULT_AGENT_COLOR,
	DEFAULT_SYSTEM_PROMPT,
	ICON_OPTIONS,
	PROVIDER_DEFAULT_MODELS,
	PROVIDER_LABELS,
	SPEAKING_STYLES,
	SPEAKING_STYLE_LABELS,
	agentInputSchema,
	createAgentDefaults,
} from "../../lib/agent-builder-schema";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea, Select } from "@/components/ui/Input";
import { cn } from "@/components/ui/cn";

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
		riskAppetite: agent.riskAppetite ?? 0.5,
		communicationStyle: agent.communicationStyle ?? 0.5,
		creativity: agent.creativity ?? 0.5,
		flexibility: agent.flexibility ?? 0.5,
		coreValues: agent.coreValues ?? [],
		speakingStyle: agent.speakingStyle ?? "formal",
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

function PersonalitySlider({ label, leftLabel, rightLabel, value, onChange }) {
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between gap-2">
				<span className="text-sm font-medium text-ink-muted">{label}</span>
				<span className="text-xs tabular-nums text-ink-faint">{Math.round(value * 100)}%</span>
			</div>
			<input
				type="range"
				min="0"
				max="1"
				step="0.05"
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-full accent-brand-cyan"
			/>
			<div className="flex justify-between text-[11px] text-ink-faint">
				<span>{leftLabel}</span>
				<span>{rightLabel}</span>
			</div>
		</div>
	);
}

function CoreValuesInput({ values, onChange }) {
	const [draft, setDraft] = useState("");

	const addValue = () => {
		const trimmed = draft.trim();
		if (!trimmed || values.includes(trimmed) || values.length >= 4) return;
		onChange([...values, trimmed]);
		setDraft("");
	};

	const removeValue = (index) => {
		onChange(values.filter((_, i) => i !== index));
	};

	return (
		<div className="w-full space-y-3">
			<div className="flex w-full gap-2">
				<Input
					type="text"
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addValue(); } }}
					disabled={values.length >= 4}
					className="flex-1 py-2.5"
					placeholder={values.length >= 4 ? "Max 4 values" : 'e.g. "data over gut feel"'}
				/>
				<Button
					type="button"
					variant="secondary"
					onClick={addValue}
					disabled={values.length >= 4 || !draft.trim()}
					className="shrink-0"
				>
					Add
				</Button>
			</div>
			{values.length > 0 && (
				<div className="flex w-full flex-wrap gap-2">
					{values.map((v, i) => (
						<span key={i} className="inline-flex items-center gap-1.5 rounded-pill border border-glass-border bg-glass px-3 py-1 text-xs text-ink-muted">
							<span className="break-words">{v}</span>
							<button type="button" onClick={() => removeValue(i)} className="shrink-0 text-ink-faint hover:text-ink">×</button>
						</span>
					))}
				</div>
			)}
		</div>
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
					className={cn(
						"rounded-2xl border px-3 py-2 text-lg transition",
						value === icon
							? "border-brand-cyan/60 bg-brand-cyan/10"
							: "border-glass-border bg-glass hover:border-glass-border-strong hover:bg-glass-strong"
					)}
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
		<Card variant="default" radius="panel" className="w-full overflow-hidden p-5 sm:p-6">
			<div className="flex flex-col gap-4 border-b border-glass-border pb-4 sm:pb-5 lg:flex-row lg:items-center lg:justify-between">
				<div className="min-w-0 flex-1">
					<p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/70">
						Agent editor
					</p>
					<h2 className="mt-2 break-words text-lg font-semibold text-ink sm:text-xl">
						{isEditing ? "Edit agent" : "Create a new agent"}
					</h2>
					<p className="mt-2 break-words text-sm leading-6 text-ink-muted">
						Validate and save every field locally. Personality traits shape how the agent debates.
					</p>
				</div>

				<div className="flex flex-shrink-0 flex-wrap gap-2">
					<Button variant="secondary" size="sm" onClick={onNew}>
						<Plus className="h-3.5 w-3.5" />
						<span className="hidden sm:inline">New</span>
					</Button>
					{agent ? (
						<>
							<Button variant="secondary" size="sm" onClick={() => onToggleEnabled(agent.id)}>
								<Power className="h-3.5 w-3.5" />
								<span className="hidden sm:inline">{agent.isEnabled ? "Disable" : "Enable"}</span>
							</Button>
							<Button variant="secondary" size="sm" onClick={() => onDuplicate(agent.id)}>
								<Copy className="h-3.5 w-3.5" />
								<span className="hidden sm:inline">Duplicate</span>
							</Button>
							<Button variant="danger" size="sm" onClick={() => onDelete(agent.id)}>
								<Trash2 className="h-3.5 w-3.5" />
								<span className="hidden sm:inline">Delete</span>
							</Button>
						</>
					) : null}
				</div>
			</div>

			<form className="mt-5 w-full space-y-5 sm:mt-6 sm:space-y-6" onSubmit={handleSave}>
				{Object.keys(errors).length ? (
					<div className="flex items-start gap-2 rounded-card border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-100 sm:items-center sm:p-4">
						<AlertCircle className="h-4 w-4 shrink-0" />
						<span className="break-words">Please fix the highlighted fields before saving.</span>
					</div>
				) : null}

				<div className="grid w-full gap-4 lg:grid-cols-2">
					<Field label="Name" error={errors.name}>
						<Input
							type="text"
							value={form.name}
							onChange={(event) => updateField("name", event.target.value)}
							placeholder="Agent name"
							className="w-full"
						/>
					</Field>

					<Field label="Role" error={errors.role}>
						<Input
							type="text"
							value={form.role}
							onChange={(event) => updateField("role", event.target.value)}
							placeholder="e.g. Product strategist"
							className="w-full"
						/>
					</Field>
				</div>

				<Field label="Description" error={errors.description}>
					<Textarea
						rows={3}
						value={form.description}
						onChange={(event) => updateField("description", event.target.value)}
						placeholder="What does this agent do?"
						className="w-full break-words whitespace-pre-wrap"
						style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}
					/>
				</Field>

				<Field label="Goal" error={errors.goal}>
					<Textarea
						rows={3}
						value={form.goal}
						onChange={(event) => updateField("goal", event.target.value)}
						placeholder="What outcome should it deliver?"
						className="w-full break-words whitespace-pre-wrap"
						style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}
					/>
				</Field>

				<Field label="System prompt" error={errors.systemPrompt} hint="The exact instruction sent to the model">
					<Textarea
						rows={6}
						value={form.systemPrompt}
						onChange={(event) => updateField("systemPrompt", event.target.value)}
						placeholder={DEFAULT_SYSTEM_PROMPT}
						className="w-full break-words whitespace-pre-wrap"
						style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}
					/>
				</Field>

				<div className="grid w-full gap-4 lg:grid-cols-2">
					<Field label="AI provider" error={errors.aiProvider}>
						<Select
							value={form.aiProvider}
							onChange={(event) => handleProviderChange(event.target.value)}
							className="w-full"
						>
							{AI_PROVIDERS.map((provider) => (
								<option key={provider} value={provider}>
									{PROVIDER_LABELS[provider]}
								</option>
							))}
						</Select>
					</Field>

					<Field label="Model" error={errors.model} hint={providerHint}>
						<Input
							type="text"
							value={form.model}
							onChange={(event) => updateField("model", event.target.value)}
							placeholder={PROVIDER_DEFAULT_MODELS[form.aiProvider]}
							className="w-full"
						/>
					</Field>
				</div>

				<div className="grid w-full gap-4 lg:grid-cols-2">
					<Field label={`Temperature: ${form.temperature.toFixed(1)}`} error={errors.temperature}>
						<input
							type="range"
							min="0"
							max="2"
							step="0.1"
							value={form.temperature}
							onChange={(event) => updateField("temperature", Number(event.target.value))}
							className="w-full accent-brand-cyan"
						/>
					</Field>

					<Field label="Max tokens" error={errors.maxTokens}>
						<Input
							type="number"
							min="1"
							max="32768"
							step="1"
							value={form.maxTokens}
							onChange={(event) => updateField("maxTokens", Number(event.target.value))}
							className="w-full"
						/>
					</Field>
				</div>

				<div className="grid w-full gap-4 lg:grid-cols-2">
					<Field label="Icon" error={errors.icon}>
						<div className="w-full space-y-3">
							<Input
								type="text"
								value={form.icon}
								onChange={(event) => updateField("icon", event.target.value)}
								placeholder="🤖"
								className="w-full"
							/>
							<div className="w-full overflow-x-auto">
								<IconPicker value={form.icon} onChange={(icon) => updateField("icon", icon)} />
							</div>
						</div>
					</Field>

					<Field label="Color" error={errors.color}>
						<div className="flex w-full items-center gap-3">
							<input
								type="color"
								value={form.color}
								onChange={(event) => updateField("color", event.target.value)}
								className="h-12 w-14 shrink-0 cursor-pointer rounded-2xl border border-glass-border bg-transparent p-1"
							/>
							<Input
								type="text"
								value={form.color}
								onChange={(event) => updateField("color", event.target.value)}
								placeholder={DEFAULT_AGENT_COLOR}
								className="flex-1"
							/>
						</div>
					</Field>
				</div>

				<label className="flex w-full items-center gap-3 rounded-2xl border border-glass-border bg-black/15 px-4 py-3 text-sm text-ink-muted">
					<input
						type="checkbox"
						checked={form.isEnabled}
						onChange={(event) => updateField("isEnabled", event.target.checked)}
						className="h-4 w-4 shrink-0 rounded border-white/20 bg-navy-950 text-brand-cyan focus:ring-brand-cyan"
					/>
					<span className="break-words">Enabled for routing</span>
				</label>

				{/* Personality */}
				<div className="w-full space-y-5 rounded-panel border border-glass-border bg-black/15 p-4 sm:p-5">
					<div className="min-w-0">
						<p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/70">
							<Sparkles className="h-3.5 w-3.5 shrink-0" />
							<span className="break-words">Personality</span>
						</p>
						<p className="mt-1 break-words text-sm text-ink-subtle">
							These traits shape how this agent reasons, communicates, and responds under pressure.
						</p>
					</div>

					<div className="grid w-full gap-5 lg:grid-cols-2">
						<PersonalitySlider
							label="Risk appetite"
							leftLabel="Conservative"
							rightLabel="Bold"
							value={form.riskAppetite}
							onChange={(v) => updateField("riskAppetite", v)}
						/>
						<PersonalitySlider
							label="Communication"
							leftLabel="Direct"
							rightLabel="Diplomatic"
							value={form.communicationStyle}
							onChange={(v) => updateField("communicationStyle", v)}
						/>
						<PersonalitySlider
							label="Reasoning"
							leftLabel="Analytical"
							rightLabel="Intuitive"
							value={form.creativity}
							onChange={(v) => updateField("creativity", v)}
						/>
						<PersonalitySlider
							label="Flexibility"
							leftLabel="Stubborn"
							rightLabel="Open"
							value={form.flexibility}
							onChange={(v) => updateField("flexibility", v)}
						/>
					</div>

					<Field label="Core values" hint="Up to 4 — press Enter to add">
						<CoreValuesInput
							values={form.coreValues}
							onChange={(v) => updateField("coreValues", v)}
						/>
					</Field>

					<Field label="Speaking style">
						<div className="flex w-full flex-wrap gap-2">
							{SPEAKING_STYLES.map((style) => (
								<button
									key={style}
									type="button"
									onClick={() => updateField("speakingStyle", style)}
									className={cn(
										"flex-1 rounded-2xl border px-3 py-2.5 text-xs font-medium transition sm:text-sm",
										form.speakingStyle === style
											? "border-brand-cyan/60 bg-brand-cyan/10 text-cyan-200"
											: "border-glass-border bg-glass text-ink-subtle hover:border-glass-border-strong hover:bg-glass-strong"
									)}
								>
									<span className="break-words">{SPEAKING_STYLE_LABELS[style]}</span>
								</button>
							))}
						</div>
					</Field>
				</div>

				<div className="flex w-full flex-wrap gap-3 border-t border-glass-border pt-5">
					<Button type="submit" variant="primary" size="lg" className="flex-1 sm:flex-initial">
						{isEditing ? "Save agent" : "Create agent"}
					</Button>
					<Button type="button" variant="secondary" size="lg" onClick={handleReset} className="flex-1 sm:flex-initial">
						Reset form
					</Button>
				</div>
			</form>
		</Card>
	);
}
