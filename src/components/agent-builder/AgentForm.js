"use client";

import { useState } from "react";
import Link from "next/link";
import {
	ArrowUpRight,
	Brain,
	Check,
	Copy,
	Cpu,
	Palette,
	Plus,
	RotateCcw,
	Save,
	Sparkles,
	Trash2,
	UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { cn } from "@/components/ui/cn";
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
} from "@/lib/agent-builder-schema";
import AgentMemoryPanel from "./AgentMemoryPanel";

const TABS = [
	{ id: "identity", label: "Identity", icon: UserRound },
	{ id: "behavior", label: "Behavior", icon: Sparkles },
	{ id: "model", label: "Model", icon: Cpu },
	{ id: "memory", label: "Memory", icon: Brain },
];

const COLOR_PRESETS = ["#38bdf8", "#a855f7", "#f59e0b", "#f43f5e", "#10b981", "#e2e8f0"];

function buildFormState(agent) {
	if (!agent) return createAgentDefaults();

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
		expertise: agent.expertise ?? "General knowledge",
		capabilities: agent.capabilities ?? [],
	};
}

function mapErrors(error) {
	return Object.entries(error.flatten().fieldErrors).reduce((result, [field, messages]) => {
		if (messages?.[0]) result[field] = messages[0];
		return result;
	}, {});
}

function SectionIntro({ eyebrow, title, description, action }) {
	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
			<div>
				<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary-300/70">
					{eyebrow}
				</p>
				<h3 className="mt-1.5 text-base font-semibold text-white sm:text-lg">{title}</h3>
				{description ? (
					<p className="mt-1 max-w-2xl text-xs leading-5 text-neutral-500">{description}</p>
				) : null}
			</div>
			{action}
		</div>
	);
}

function TagInput({ values, onChange, placeholder, max, ariaLabel }) {
	const [draft, setDraft] = useState("");

	const add = () => {
		const value = draft.trim();
		if (!value || values.includes(value) || values.length >= max) return;
		onChange([...values, value]);
		setDraft("");
	};

	return (
		<div className="space-y-3">
			<div className="flex gap-2">
				<Input
					aria-label={ariaLabel}
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							add();
						}
					}}
					placeholder={values.length >= max ? `Maximum ${max} reached` : placeholder}
					disabled={values.length >= max}
					className="min-h-0 py-2.5 text-sm"
				/>
				<Button
					variant="secondary"
					size="sm"
					onClick={add}
					disabled={values.length >= max || !draft.trim()}
					className="shrink-0 self-stretch px-4"
				>
					<Plus className="h-3.5 w-3.5" />
					Add
				</Button>
			</div>

			{values.length ? (
				<div className="flex flex-wrap gap-2">
					{values.map((value) => (
						<span
							key={value}
							className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] py-1 pl-3 pr-1.5 text-xs text-neutral-300"
						>
							<span className="truncate">{value}</span>
							<button
								type="button"
								onClick={() => onChange(values.filter((item) => item !== value))}
								className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-neutral-600 transition hover:bg-white/10 hover:text-white"
								aria-label={`Remove ${value}`}
							>
								×
							</button>
						</span>
					))}
				</div>
			) : (
				<p className="text-[11px] text-neutral-600">Nothing added yet.</p>
			)}
		</div>
	);
}

function RangeField({ label, left, right, value, onChange, accent = "accent-primary-400" }) {
	return (
		<div className="rounded-2xl border border-white/6 bg-black/15 p-4">
			<div className="flex items-center justify-between gap-3">
				<span className="text-xs font-medium text-neutral-300">{label}</span>
				<span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] tabular-nums text-neutral-500">
					{Math.round(value * 100)}%
				</span>
			</div>
			<input
				type="range"
				min="0"
				max="1"
				step="0.05"
				value={value}
				onChange={(event) => onChange(Number(event.target.value))}
				className={cn("mt-3 w-full cursor-pointer", accent)}
				aria-label={label}
			/>
			<div className="mt-1 flex justify-between text-[10px] text-neutral-600">
				<span>{left}</span>
				<span>{right}</span>
			</div>
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
						"flex h-10 w-10 items-center justify-center rounded-xl border text-lg transition",
						value === icon
							? "border-primary-400/60 bg-primary-500/15"
							: "border-white/8 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]"
					)}
					aria-label={`Use ${icon} icon`}
					aria-pressed={value === icon}
				>
					{icon}
				</button>
			))}
		</div>
	);
}

function ColorPicker({ value, onChange }) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			{COLOR_PRESETS.map((color) => (
				<button
					key={color}
					type="button"
					onClick={() => onChange(color)}
					className={cn(
						"relative h-9 w-9 rounded-xl border transition",
						value.toLowerCase() === color ? "border-white/70" : "border-white/10 hover:border-white/30"
					)}
					style={{ backgroundColor: color }}
					aria-label={`Use color ${color}`}
					aria-pressed={value.toLowerCase() === color}
				>
					{value.toLowerCase() === color ? (
						<Check className="absolute inset-0 m-auto h-4 w-4 text-black/70" />
					) : null}
				</button>
			))}
			<div className="ml-1 flex min-w-0 items-center gap-2 rounded-xl border border-white/8 bg-black/15 px-2.5 py-1.5">
				<Palette className="h-3.5 w-3.5 text-neutral-600" />
				<input
					type="color"
					value={value}
					onChange={(event) => onChange(event.target.value)}
					className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
					aria-label="Custom accent color"
				/>
				<input
					type="text"
					value={value}
					onChange={(event) => onChange(event.target.value)}
					className="w-20 bg-transparent text-xs uppercase text-neutral-400 outline-none"
					aria-label="Accent color hex value"
					maxLength={7}
				/>
			</div>
		</div>
	);
}

function ToggleSwitch({ checked, onChange, label, description }) {
	return (
		<div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.025] p-4">
			<div>
				<p className="text-sm font-medium text-white">{label}</p>
				<p className="mt-0.5 text-xs leading-5 text-neutral-500">{description}</p>
			</div>
			<button
				type="button"
				role="switch"
				aria-checked={checked}
				onClick={() => onChange(!checked)}
				className={cn(
					"relative h-6 w-11 shrink-0 rounded-full border transition-colors",
					checked
						? "border-primary-300/40 bg-primary-500/70"
						: "border-white/10 bg-white/8"
				)}
			>
				<span
					className={cn(
						"absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
						checked ? "translate-x-5" : "translate-x-0.5"
					)}
				/>
			</button>
		</div>
	);
}

export default function AgentForm({
	agent,
	onCreate,
	onUpdate,
	onDuplicate,
	onDelete,
	onNotice,
	actionBusy,
}) {
	const initialForm = buildFormState(agent);
	const [form, setForm] = useState(initialForm);
	const [snapshot, setSnapshot] = useState(() => JSON.stringify(initialForm));
	const [activeTab, setActiveTab] = useState("identity");
	const [errors, setErrors] = useState({});
	const [formError, setFormError] = useState("");
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	const isEditing = Boolean(agent);
	const dirty = JSON.stringify(form) !== snapshot;
	const tabs = TABS.filter((tab) => tab.id !== "memory" || isEditing);
	const providerHint = `Suggested: ${PROVIDER_DEFAULT_MODELS[form.aiProvider]}`;

	const updateField = (field, value) => {
		setSaved(false);
		setForm((current) => ({ ...current, [field]: value }));
	};

	const handleProviderChange = (provider) => {
		setSaved(false);
		setForm((current) => ({
			...current,
			aiProvider: provider,
			model: PROVIDER_DEFAULT_MODELS[provider],
		}));
	};

	const handleSave = async (event) => {
		event.preventDefault();
		const validation = agentInputSchema.safeParse(form);

		if (!validation.success) {
			setErrors(mapErrors(validation.error));
			setFormError("Please fix the highlighted fields before saving.");
			setSaved(false);
			return;
		}

		setErrors({});
		setFormError("");
		setSaving(true);

		try {
			const payload = validation.data;
			const savedAgent = isEditing
				? await onUpdate({
						...payload,
						id: agent.id,
						createdAt: agent.createdAt,
					})
				: await onCreate(payload);

			const nextForm = buildFormState(savedAgent);
			setForm(nextForm);
			setSnapshot(JSON.stringify(nextForm));
			setSaved(true);
		} catch (error) {
			setFormError(error.message || "The agent could not be saved.");
		} finally {
			setSaving(false);
		}
	};

	const handleReset = () => {
		const resetForm = buildFormState(agent);
		setForm(resetForm);
		setSnapshot(JSON.stringify(resetForm));
		setErrors({});
		setFormError("");
		setSaved(false);
	};

	return (
		<form onSubmit={handleSave} className="min-w-0">
			<Card variant="default" className="overflow-hidden">
				<div className="border-b border-white/8 p-4 sm:p-5">
					<div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
						<div className="flex min-w-0 items-center gap-3.5">
							<div
								className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-2xl shadow-lg"
								style={{
									backgroundColor: `${form.color}22`,
									borderColor: `${form.color}55`,
									boxShadow: `0 12px 40px ${form.color}16`,
								}}
								aria-hidden
							>
								{form.icon}
							</div>
							<div className="min-w-0">
								<div className="flex flex-wrap items-center gap-2">
									<h2 className="truncate text-lg font-semibold text-white sm:text-xl">
										{form.name || "Untitled agent"}
									</h2>
									<Badge tone={form.isEnabled ? "emerald" : "neutral"}>
										{form.isEnabled ? "Active" : "Paused"}
									</Badge>
								</div>
								<p className="mt-0.5 truncate text-xs text-neutral-500">
									{form.role || "Define a role"} · {PROVIDER_LABELS[form.aiProvider]}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-2">
							{isEditing ? (
								<>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => onDuplicate(agent.id)}
										disabled={actionBusy}
									>
										<Copy className="h-3.5 w-3.5" />
										Duplicate
									</Button>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => onDelete(agent.id)}
										className="text-neutral-500 hover:text-rose-300"
										aria-label={`Delete ${agent.name}`}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</>
							) : (
								<Badge tone="cyan">New draft</Badge>
							)}
						</div>
					</div>

					<div
						className="mt-4 flex gap-1 overflow-x-auto rounded-xl border border-white/6 bg-black/20 p-1"
						role="tablist"
						aria-label="Agent editor sections"
					>
						{tabs.map(({ id, label, icon: Icon }) => (
							<button
								key={id}
								type="button"
								onClick={() => setActiveTab(id)}
								className={cn(
									"flex shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition sm:flex-1",
									activeTab === id
										? "bg-white/10 text-white shadow-sm"
										: "text-neutral-500 hover:bg-white/5 hover:text-neutral-300"
								)}
								aria-selected={activeTab === id}
								role="tab"
							>
								<Icon className="h-3.5 w-3.5" />
								{label}
							</button>
						))}
					</div>
				</div>

				<div className="space-y-6 p-4 sm:p-5 lg:p-6">
					{formError ? (
						<div
							role="alert"
							className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.07] px-4 py-3 text-sm text-rose-100"
						>
							{formError}
						</div>
					) : null}

					<div className={cn("space-y-6", activeTab !== "identity" && "hidden")} role="tabpanel">
						<SectionIntro
							eyebrow="Foundation"
							title="Identity & purpose"
							description="Give the agent a clear role, a specific goal, and the context that makes its perspective useful."
						/>

						<div className="grid gap-4 md:grid-cols-2">
							<Field label="Name" error={errors.name}>
								<Input
									value={form.name}
									onChange={(event) => updateField("name", event.target.value)}
									placeholder="e.g. Maya Chen"
									autoComplete="off"
								/>
							</Field>
							<Field label="Role" error={errors.role}>
								<Input
									value={form.role}
									onChange={(event) => updateField("role", event.target.value)}
									placeholder="e.g. Product strategist"
									autoComplete="off"
								/>
							</Field>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<Field label="Description" error={errors.description} hint={`${form.description.length}/240`}>
								<Textarea
									rows={3}
									value={form.description}
									onChange={(event) => updateField("description", event.target.value)}
									placeholder="What does this agent do?"
									maxLength={240}
									className="min-h-[96px] text-sm"
								/>
							</Field>
							<Field label="Goal" error={errors.goal} hint={`${form.goal.length}/240`}>
								<Textarea
									rows={3}
									value={form.goal}
									onChange={(event) => updateField("goal", event.target.value)}
									placeholder="What outcome should it deliver?"
									maxLength={240}
									className="min-h-[96px] text-sm"
								/>
							</Field>
						</div>

						<Field
							label="Expertise"
							error={errors.expertise}
							hint={`${form.expertise.length}/500`}
						>
							<Textarea
								rows={2}
								value={form.expertise}
								onChange={(event) => updateField("expertise", event.target.value)}
								placeholder="The domains, methods, and experience this agent draws from."
								maxLength={500}
								className="min-h-[76px] text-sm"
							/>
						</Field>

						<Field label="Capabilities" error={errors.capabilities} hint="Up to 10">
							<TagInput
								values={form.capabilities}
								onChange={(value) => updateField("capabilities", value)}
								placeholder="e.g. Competitive analysis"
								max={10}
								ariaLabel="Add a capability"
							/>
						</Field>

						<div className="grid gap-5 border-t border-white/6 pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
							<div className="space-y-4">
								<SectionIntro
									eyebrow="Appearance"
									title="How it shows up"
									description="Used in the builder, chat sidebar, and council views."
								/>
								<Field label="Icon" error={errors.icon}>
									<IconPicker value={form.icon} onChange={(icon) => updateField("icon", icon)} />
								</Field>
								<Field label="Accent color" error={errors.color}>
									<ColorPicker value={form.color} onChange={(color) => updateField("color", color)} />
								</Field>
							</div>

							<div className="space-y-3">
								<SectionIntro
									eyebrow="Availability"
									title="Routing status"
									description="Paused agents stay saved but are skipped in the council."
								/>
								<ToggleSwitch
									checked={form.isEnabled}
									onChange={(value) => updateField("isEnabled", value)}
									label="Enabled for routing"
									description="Include this agent in new orchestration runs."
								/>
								<div className="rounded-2xl border border-white/6 bg-black/15 p-4">
									<p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600">
										Preview
									</p>
									<div className="mt-3 flex items-center gap-3">
										<div
											className="flex h-10 w-10 items-center justify-center rounded-xl border text-lg"
											style={{
												backgroundColor: `${form.color}20`,
												borderColor: `${form.color}4d`,
											}}
										>
											{form.icon}
										</div>
										<div className="min-w-0">
											<p className="truncate text-sm font-medium text-white">{form.name || "Untitled agent"}</p>
											<p className="truncate text-xs text-neutral-500">{form.role || "Specialist"}</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className={cn("space-y-6", activeTab !== "behavior" && "hidden")} role="tabpanel">
						<SectionIntro
							eyebrow="Behavior"
							title="Reasoning & voice"
							description="The system prompt sets the guardrails. Personality traits shape how the agent debates and communicates."
							action={
								<Button
									variant="ghost"
									size="sm"
									onClick={() => updateField("systemPrompt", DEFAULT_SYSTEM_PROMPT)}
								>
									<RotateCcw className="h-3.5 w-3.5" />
									Restore default
								</Button>
							}
						/>

						<Field
							label="System prompt"
							error={errors.systemPrompt}
							hint={`${form.systemPrompt.length}/4000`}
						>
							<Textarea
								rows={7}
								value={form.systemPrompt}
								onChange={(event) => updateField("systemPrompt", event.target.value)}
								placeholder={DEFAULT_SYSTEM_PROMPT}
								maxLength={4000}
								className="min-h-[180px] font-mono text-xs leading-6"
							/>
						</Field>

						<div className="space-y-3">
							<SectionIntro
								eyebrow="Personality"
								title="Working style"
								description="Small shifts here change how the same model approaches a problem."
							/>
							<div className="grid gap-3 md:grid-cols-2">
								<RangeField
									label="Risk appetite"
									left="Conservative"
									right="Bold"
									value={form.riskAppetite}
									onChange={(value) => updateField("riskAppetite", value)}
								/>
								<RangeField
									label="Communication"
									left="Direct"
									right="Diplomatic"
									value={form.communicationStyle}
									onChange={(value) => updateField("communicationStyle", value)}
								/>
								<RangeField
									label="Reasoning"
									left="Analytical"
									right="Intuitive"
									value={form.creativity}
									onChange={(value) => updateField("creativity", value)}
								/>
								<RangeField
									label="Flexibility"
									left="Principled"
									right="Adaptable"
									value={form.flexibility}
									onChange={(value) => updateField("flexibility", value)}
								/>
							</div>
						</div>

						<div className="grid gap-5 border-t border-white/6 pt-5 md:grid-cols-2">
							<Field label="Core values" error={errors.coreValues} hint="Up to 4">
								<TagInput
									values={form.coreValues}
									onChange={(value) => updateField("coreValues", value)}
									placeholder="e.g. Evidence over instinct"
									max={4}
									ariaLabel="Add a core value"
								/>
							</Field>

							<Field label="Speaking style" error={errors.speakingStyle}>
								<div className="flex flex-wrap gap-2">
									{SPEAKING_STYLES.map((style) => (
										<button
											key={style}
											type="button"
											onClick={() => updateField("speakingStyle", style)}
											className={cn(
												"flex-1 rounded-xl border px-3 py-2.5 text-xs font-medium transition",
												form.speakingStyle === style
													? "border-primary-400/50 bg-primary-500/10 text-primary-200"
													: "border-white/8 bg-white/[0.025] text-neutral-500 hover:border-white/15 hover:text-neutral-300"
											)}
											aria-pressed={form.speakingStyle === style}
										>
											{SPEAKING_STYLE_LABELS[style]}
										</button>
									))}
								</div>
							</Field>
						</div>
					</div>

					<div className={cn("space-y-6", activeTab !== "model" && "hidden")} role="tabpanel">
						<SectionIntro
							eyebrow="Model"
							title="Provider & generation"
							description="Set the intended provider, model, and sampling behavior for this agent."
						/>

						<div className="grid gap-4 md:grid-cols-2">
							<Field label="AI provider" error={errors.aiProvider}>
								<Select
									value={form.aiProvider}
									onChange={(event) => handleProviderChange(event.target.value)}
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
									value={form.model}
									onChange={(event) => updateField("model", event.target.value)}
									placeholder={PROVIDER_DEFAULT_MODELS[form.aiProvider]}
									autoComplete="off"
								/>
							</Field>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div className="rounded-2xl border border-white/6 bg-black/15 p-4">
								<div className="flex items-center justify-between gap-3">
									<span className="text-xs font-medium text-neutral-300">Temperature</span>
									<span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] tabular-nums text-neutral-500">
										{form.temperature.toFixed(1)}
									</span>
								</div>
								<input
									type="range"
									min="0"
									max="2"
									step="0.1"
									value={form.temperature}
									onChange={(event) => updateField("temperature", Number(event.target.value))}
									className="mt-3 w-full cursor-pointer accent-primary-400"
									aria-label="Temperature"
								/>
								<div className="mt-1 flex justify-between text-[10px] text-neutral-600">
									<span>Precise</span>
									<span>Creative</span>
								</div>
								{errors.temperature ? (
									<p className="mt-2 text-xs text-rose-300">{errors.temperature}</p>
								) : null}
							</div>

							<Field label="Max output tokens" error={errors.maxTokens} hint="1–32,768">
								<Input
									type="number"
									min="1"
									max="32768"
									step="1"
									value={form.maxTokens}
									onChange={(event) => updateField("maxTokens", Number(event.target.value))}
								/>
							</Field>
						</div>

						<div className="flex flex-col gap-3 rounded-2xl border border-primary-400/15 bg-primary-500/[0.045] p-4 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<p className="text-sm font-medium text-primary-100">Provider credentials</p>
								<p className="mt-1 max-w-xl text-xs leading-5 text-primary-100/45">
									API keys are stored securely per account. The active provider in Providers supplies the key at runtime.
								</p>
							</div>
							<Link
								href="/providers"
								className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-primary-300 transition hover:text-primary-200"
							>
								Manage providers
								<ArrowUpRight className="h-3.5 w-3.5" />
							</Link>
						</div>
					</div>

					{isEditing ? (
						<AgentMemoryPanel
							agent={agent}
							active={activeTab === "memory"}
							onNotice={onNotice}
						/>
					) : null}
				</div>

				<div className="sticky bottom-0 flex flex-col gap-3 border-t border-white/8 bg-neutral-950/90 px-4 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:px-6">
					<div className="flex items-center gap-2 text-xs text-neutral-600">
						{formError ? (
							<span className="text-rose-300">Fix the errors above</span>
						) : saved ? (
							<>
								<Check className="h-3.5 w-3.5 text-emerald-400" />
								<span className="text-emerald-300/70">Saved to Turso</span>
							</>
						) : dirty ? (
							<>
								<span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
								Unsaved changes
							</>
						) : (
							<span>{isEditing ? "All changes saved" : "Ready to create"}</span>
						)}
					</div>

					<div className="flex gap-2">
						<Button
							type="button"
							variant="secondary"
							onClick={handleReset}
							disabled={saving || (isEditing && !dirty)}
							className="flex-1 sm:flex-none"
						>
							<RotateCcw className="h-3.5 w-3.5" />
							Reset
						</Button>
						<Button
							type="submit"
							variant="primary"
							loading={saving}
							disabled={isEditing && !dirty}
							className="flex-1 sm:flex-none"
						>
							<Save className="h-4 w-4" />
							{isEditing ? "Save changes" : "Create agent"}
						</Button>
					</div>
				</div>
			</Card>
		</form>
	);
}
