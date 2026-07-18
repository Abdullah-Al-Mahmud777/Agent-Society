"use client";

import { useMemo, useState, useEffect } from "react";
import { Plus, Power, Copy, Trash2, AlertCircle, Sparkles, History, User } from "lucide-react";

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
import { AgentMemory } from "@/lib/agent-memory";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea, Label, Select } from "@/components/ui/Input";
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
		expertise: agent.expertise ?? "General knowledge",
		capabilities: agent.capabilities ?? [],
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
				<span className="text-sm font-medium text-neutral-400">{label}</span>
				<span className="text-xs tabular-nums text-neutral-600">{Math.round(value * 100)}%</span>
			</div>
			<input
				type="range"
				min="0"
				max="1"
				step="0.05"
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-full accent-primary-500"
			/>
			<div className="flex justify-between text-[11px] text-neutral-600">
				<span>{leftLabel}</span>
				<span>{rightLabel}</span>
			</div>
		</div>
	);
}

function CoreValuesInput({ values, onChange, max = 4 }) {
	const [draft, setDraft] = useState("");

	const addValue = () => {
		const trimmed = draft.trim();
		if (!trimmed || values.includes(trimmed) || values.length >= max) return;
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
					disabled={values.length >= max}
					className="flex-1 py-2.5"
					placeholder={values.length >= max ? `Max ${max} values` : 'e.g. "data over gut feel"'}
				/>
				<Button
					type="button"
					variant="secondary"
					onClick={addValue}
					disabled={values.length >= max || !draft.trim()}
					className="shrink-0"
				>
					Add
				</Button>
			</div>
			{values.length > 0 && (
				<div className="flex w-full flex-wrap gap-2">
					{values.map((v, i) => (
						<span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1 text-xs text-neutral-400">
							<span className="break-words">{v}</span>
							<button type="button" onClick={() => removeValue(i)} className="shrink-0 text-neutral-600 hover:text-white">×</button>
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
							? "border-primary-500/60 bg-primary-500/10"
							: "border-neutral-700 bg-neutral-800/50 hover:border-neutral-600 hover:bg-neutral-800"
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
	const [activeTab, setActiveTab] = useState("config");
	const [agentMemory] = useState(() => new AgentMemory());
	const [agentNotes, setAgentNotes] = useState("");
	const [currentAgentMemory, setCurrentAgentMemory] = useState(null);

	useEffect(() => {
		if (agent) {
			const mem = agentMemory.getAgentMemory(agent.id);
			setCurrentAgentMemory(mem);
			setAgentNotes(mem.notes || "");
		}
	}, [agent, agentMemory]);

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

	const handleSaveNotes = () => {
		if (agent) {
			agentMemory.updateNotes(agent.id, agentNotes);
		}
	};

	const handleClearMemory = () => {
		if (agent && confirm("Are you sure you want to clear this agent's memory?")) {
			agentMemory.clearAgentMemory(agent.id);
			const mem = agentMemory.getAgentMemory(agent.id);
			setCurrentAgentMemory(mem);
			setAgentNotes(mem.notes || "");
		}
	};

	return (
		<Card variant="default" className="w-full overflow-hidden p-5 sm:p-6">
			<CardHeader>
				<div className="flex flex-col gap-4 border-b border-neutral-700 pb-4 sm:pb-5 lg:flex-row lg:items-center lg:justify-between">
					<div className="min-w-0 flex-1">
						<p className="text-xs font-semibold uppercase tracking-[0.28em] text-warning-400/70">
							Agent editor
						</p>
						<CardTitle className="mt-2 break-words text-lg sm:text-xl">
							{isEditing ? "Edit agent" : "Create a new agent"}
						</CardTitle>
						<p className="mt-2 break-words text-sm leading-6 text-neutral-400">
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
								<Button variant="error" size="sm" onClick={() => onDelete(agent.id)}>
									<Trash2 className="h-3.5 w-3.5" />
									<span className="hidden sm:inline">Delete</span>
								</Button>
							</>
						) : null}
					</div>
				</div>

				{isEditing && (
					<div className="flex gap-2 border-b border-neutral-700 py-3 mt-4">
						<button
							type="button"
							onClick={() => setActiveTab("config")}
							className={cn(
								"px-3 py-1.5 rounded-xl text-xs font-medium transition",
								activeTab === "config"
									? "bg-primary-500/10 text-primary-400"
									: "text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800"
							)}
						>
							Configuration
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("memory")}
							className={cn(
								"px-3 py-1.5 rounded-xl text-xs font-medium transition",
								activeTab === "memory"
									? "bg-primary-500/10 text-primary-400"
									: "text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800"
							)}
						>
							Memory & History
						</button>
					</div>
				)}
			</CardHeader>

			<CardContent>
			{activeTab === "config" && (
			<form className="mt-5 w-full space-y-5 sm:mt-6 sm:space-y-6" onSubmit={handleSave}>
				{Object.keys(errors).length ? (
					<div className="flex items-start gap-2 rounded-lg border border-error-500/20 bg-error-500/10 p-3 text-sm text-error-100 sm:items-center sm:p-4">
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
						className="w-full"
					/>
				</Field>

				<Field label="Goal" error={errors.goal}>
					<Textarea
						rows={3}
						value={form.goal}
						onChange={(event) => updateField("goal", event.target.value)}
						placeholder="What outcome should it deliver?"
						className="w-full"
					/>
				</Field>

				<Field label="Expertise" error={errors.expertise}>
					<Textarea
						rows={2}
						value={form.expertise}
						onChange={(event) => updateField("expertise", event.target.value)}
						placeholder="What is this agent an expert in?"
						className="w-full"
					/>
				</Field>

				<Field label="Capabilities" hint="Up to 10 — press Enter to add">
					<CoreValuesInput
						values={form.capabilities}
						onChange={(v) => updateField("capabilities", v)}
						max={10}
					/>
				</Field>

				<Field label="System prompt" error={errors.systemPrompt} hint="The exact instruction sent to the model">
					<Textarea
						rows={6}
						value={form.systemPrompt}
						onChange={(event) => updateField("systemPrompt", event.target.value)}
						placeholder={DEFAULT_SYSTEM_PROMPT}
						className="w-full"
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

				<label className="flex w-full items-center gap-3 rounded-2xl border border-neutral-700 bg-neutral-800/30 px-4 py-3 text-sm text-neutral-400">
					<input
						type="checkbox"
						checked={form.isEnabled}
						onChange={(event) => updateField("isEnabled", event.target.checked)}
						className="h-4 w-4 shrink-0 rounded border-white/20 bg-neutral-950 text-primary-500 focus:ring-primary-500"
					/>
					<span className="break-words">Enabled for routing</span>
				</label>

				{/* Personality */}
				<div className="w-full space-y-5 rounded-lg border border-neutral-700 bg-neutral-800/30 p-4 sm:p-5">
					<div className="min-w-0">
						<p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-warning-400/70">
							<Sparkles className="h-3.5 w-3.5 shrink-0" />
							<span className="break-words">Personality</span>
						</p>
						<p className="mt-1 break-words text-sm text-neutral-500">
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
			)}

			{activeTab === "memory" && isEditing && (
				<div className="mt-5 space-y-5">
					<Field label="Private notes" hint="Only visible to this agent">
						<div className="flex gap-2">
							<Textarea
								rows={4}
								value={agentNotes}
								onChange={(e) => setAgentNotes(e.target.value)}
								placeholder="Add notes only this agent can see..."
								className="w-full"
							/>
						</div>
						<div className="mt-2">
							<Button variant="secondary" size="sm" onClick={handleSaveNotes}>
								Save notes
							</Button>
						</div>
					</Field>

					<Card variant="default" className="p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-2">
								<History className="h-4 w-4 text-neutral-500" />
								<h3 className="text-sm font-medium text-white">Conversation history</h3>
							</div>
							<Button variant="error" size="sm" onClick={handleClearMemory}>
								Clear memory
							</Button>
						</div>
						{currentAgentMemory?.conversationHistory?.length === 0 ? (
							<p className="text-sm text-neutral-500">No conversation history yet.</p>
						) : (
							<div className="max-h-96 overflow-y-auto space-y-3">
								{currentAgentMemory?.conversationHistory?.map((msg, i) => (
									<div key={i} className="flex gap-2">
										<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-800">
											{msg.role === "user" ? (
												<User className="h-4 w-4 text-neutral-400" />
											) : (
												<span className="text-sm">{agent.icon}</span>
											)}
										</div>
										<div className="flex-1 rounded-2xl border border-neutral-700 bg-neutral-800/50 px-3 py-2">
											<p className="text-xs text-neutral-600 mb-1">
												{msg.role === "user" ? "You" : agent.name} • {new Date(msg.timestamp).toLocaleString()}
											</p>
											<p className="text-sm text-white">{msg.content}</p>
										</div>
									</div>
								))}
							</div>
						)}
					</Card>
				</div>
			)}
			</CardContent>
		</Card>
	);
}
