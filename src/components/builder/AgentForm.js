"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, RefreshCw, X } from "lucide-react";
import {
  AI_PROVIDERS,
  ICON_OPTIONS,
  PROVIDER_DEFAULT_MODELS,
  PROVIDER_LABELS,
  SPEAKING_STYLES,
  SPEAKING_STYLE_LABELS,
} from "@/lib/agent-builder-schema";
import { PROVIDER_INFO } from "@/lib/provider-catalog";
import { cn } from "@/components/ui/cn";

const INPUT =
  "w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-faint)] focus:border-[var(--app-accent)] disabled:opacity-50";

const COLORS = ["#22c55e", "#38bdf8", "#a855f7", "#f59e0b", "#f472b6", "#10a37f", "#ef4444", "#94a3b8"];

function Field({ label, hint, error, htmlFor, children }) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-xs font-medium text-[var(--app-muted)]">
          {label}
        </label>
        {hint && <span className="text-[11px] text-[var(--app-faint)]">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1 text-xs text-[var(--app-danger)]">{error}</p>}
    </div>
  );
}

function Section({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && (
          <p className="mt-1 text-xs leading-5 text-[var(--app-faint)]">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Slider({ label, value, min, max, step, onChange, display }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[var(--app-muted)]">{label}</span>
        <span className="rounded-md bg-[var(--app-surface)] px-2 py-0.5 font-mono text-[11px] text-[var(--app-text)]">
          {display ?? value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--app-surface)] accent-[var(--app-accent)]"
        aria-label={label}
      />
    </div>
  );
}

function ChipEditor({ values, maxItems, maxLength, placeholder, onChange }) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const next = draft.trim();
    if (!next || values.length >= maxItems || values.includes(next)) return;
    onChange([...values, next.slice(0, maxLength)]);
    setDraft("");
  };

  return (
    <div className="space-y-2">
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 py-1 text-[11px] text-[var(--app-text)]"
            >
              {value}
              <button
                type="button"
                onClick={() => onChange(values.filter((item) => item !== value))}
                className="text-[var(--app-faint)] transition hover:text-[var(--app-danger)]"
                aria-label={`Remove ${value}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={INPUT}
          aria-label={placeholder}
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim() || values.length >= maxItems}
          className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-[var(--app-border)] px-3 text-xs font-medium text-[var(--app-muted)] transition hover:text-[var(--app-text)] disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
      <p className="text-[11px] text-[var(--app-faint)]">
        {values.length}/{maxItems}
      </p>
    </div>
  );
}

export default function AgentForm({
  form,
  errors = {},
  onChange,
  models = [],
  modelsStatus,
  onLoadModels,
}) {
  const info = PROVIDER_INFO[form.aiProvider];
  const modelOptions = (() => {
    const set = new Set(models);
    set.add(form.model);
    return [...set].filter(Boolean);
  })();

  useEffect(() => {
    if (!models.length) return;
    if (form.model && models.includes(form.model)) return;
    if (form.model && !Object.values(PROVIDER_DEFAULT_MODELS).includes(form.model)) return;
    onChange({ model: models[0] });
  }, [models, form.model, onChange]);

  const set = (patch) => onChange(patch);
  const fieldError = (name) => errors?.[name]?.[0];

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Section title="Identity" description="How this agent appears across the society.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" error={fieldError("name")} htmlFor="agent-name">
            <input
              id="agent-name"
              value={form.name}
              onChange={(event) => set({ name: event.target.value })}
              placeholder="e.g. Market Analyst"
              maxLength={80}
              className={INPUT}
            />
          </Field>
          <Field label="Role" error={fieldError("role")} htmlFor="agent-role">
            <input
              id="agent-role"
              value={form.role}
              onChange={(event) => set({ role: event.target.value })}
              placeholder="e.g. Research specialist"
              maxLength={80}
              className={INPUT}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Icon" error={fieldError("icon")}>
            <div className="flex flex-wrap gap-1.5">
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => set({ icon })}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl border text-base transition",
                    form.icon === icon
                      ? "border-[var(--app-accent)] bg-[var(--app-surface)]"
                      : "border-[var(--app-border)] hover:border-[var(--app-border-strong)]"
                  )}
                  aria-label={`Use icon ${icon}`}
                  aria-pressed={form.icon === icon}
                >
                  {icon}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Color" error={fieldError("color")}>
            <div className="flex flex-wrap items-center gap-1.5">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => set({ color })}
                  className={cn(
                    "h-8 w-8 rounded-lg border-2 transition",
                    form.color === color ? "border-[var(--app-text)]" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`Use color ${color}`}
                  aria-pressed={form.color === color}
                />
              ))}
              <input
                type="color"
                value={form.color}
                onChange={(event) => set({ color: event.target.value })}
                className="h-8 w-10 cursor-pointer rounded-lg border border-[var(--app-border)] bg-transparent"
                aria-label="Custom color"
              />
            </div>
          </Field>
        </div>
      </Section>

      <Section title="Purpose" description="What the agent is responsible for.">
        <Field label="Description" error={fieldError("description")} htmlFor="agent-desc">
          <textarea
            id="agent-desc"
            value={form.description}
            onChange={(event) => set({ description: event.target.value })}
            rows={2}
            maxLength={240}
            placeholder="One or two sentences shown in lists."
            className={cn(INPUT, "resize-none")}
          />
        </Field>
        <Field label="Goal" error={fieldError("goal")} htmlFor="agent-goal">
          <textarea
            id="agent-goal"
            value={form.goal}
            onChange={(event) => set({ goal: event.target.value })}
            rows={2}
            maxLength={240}
            placeholder="The outcome this agent optimizes for."
            className={cn(INPUT, "resize-none")}
          />
        </Field>
        <Field label="Expertise" error={fieldError("expertise")} htmlFor="agent-expertise">
          <input
            id="agent-expertise"
            value={form.expertise}
            onChange={(event) => set({ expertise: event.target.value })}
            maxLength={500}
            placeholder="e.g. SaaS pricing, competitor analysis"
            className={INPUT}
          />
        </Field>
      </Section>

      <Section
        title="System prompt"
        description="The instruction prepended to every request. Personality sliders are converted to text automatically."
      >
        <Field
          label="System prompt"
          hint={`${form.systemPrompt.length}/4000`}
          error={fieldError("systemPrompt")}
          htmlFor="agent-system"
        >
          <textarea
            id="agent-system"
            value={form.systemPrompt}
            onChange={(event) => set({ systemPrompt: event.target.value })}
            rows={7}
            maxLength={4000}
            className={cn(INPUT, "min-h-[160px] resize-y font-mono text-[13px] leading-6")}
          />
        </Field>
      </Section>

      <Section title="Model" description="Provider credentials come from Provider settings.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Provider" error={fieldError("aiProvider")} htmlFor="agent-provider">
            <select
              id="agent-provider"
              value={form.aiProvider}
              onChange={(event) => {
                const aiProvider = event.target.value;
                set({
                  aiProvider,
                  model: PROVIDER_DEFAULT_MODELS[aiProvider] || form.model,
                });
              }}
              className={cn(INPUT, "cursor-pointer")}
            >
              {AI_PROVIDERS.map((provider) => (
                <option key={provider} value={provider}>
                  {PROVIDER_LABELS[provider] || provider}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Model"
            hint={
              modelsStatus?.state === "loaded"
                ? `${models.length} live models`
                : PROVIDER_INFO[form.aiProvider]?.keyFormat
            }
            error={fieldError("model")}
            htmlFor="agent-model"
          >
            <div className="flex gap-2">
              <select
                id="agent-model"
                value={form.model}
                onChange={(event) => set({ model: event.target.value })}
                className={cn(INPUT, "cursor-pointer")}
              >
                {modelOptions.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onLoadModels?.(form.aiProvider)}
                disabled={modelsStatus?.state === "loading"}
                title="Load available models for this provider"
                className="shrink-0 rounded-xl border border-[var(--app-border)] px-2.5 text-[var(--app-muted)] transition hover:text-[var(--app-text)] disabled:opacity-50"
                aria-label="Load available models"
              >
                {modelsStatus?.state === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </button>
            </div>
          </Field>
        </div>

        <p className="text-[11px] leading-5 text-[var(--app-faint)]">
          {modelsStatus?.state === "error"
            ? `${modelsStatus.message} Showing the built-in ${info?.name || "provider"} model list instead.`
            : modelsStatus?.state === "loading"
              ? "Fetching the live model list from the provider…"
              : `Live model lists require a connected ${info?.name || "provider"} key. ${info?.keyFormat ? `Key format: ${info.keyFormat}.` : ""}`}
        </p>
      </Section>

      <Section title="Parameters" description="Sampling and personality applied at run time.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Temperature"
            hint="0 = focused · 2 = wild"
            error={fieldError("temperature")}
          >
            <Slider
              label="Temperature"
              min={0}
              max={2}
              step={0.05}
              value={form.temperature}
              onChange={(temperature) => set({ temperature })}
              display={Number(form.temperature).toFixed(2)}
            />
          </Field>
          <Field label="Max tokens" hint="1 – 32768" error={fieldError("maxTokens")}>
            <input
              type="number"
              min={1}
              max={32768}
              value={form.maxTokens}
              onChange={(event) =>
                set({ maxTokens: event.target.value === "" ? 1 : Number(event.target.value) })
              }
              className={INPUT}
              aria-label="Max tokens"
            />
          </Field>
        </div>

        <Field label="Speaking style" error={fieldError("speakingStyle")}>
          <div className="flex flex-wrap gap-1.5">
            {SPEAKING_STYLES.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => set({ speakingStyle: style })}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  form.speakingStyle === style
                    ? "border-[var(--app-accent)] bg-[var(--app-accent)]/15 text-[var(--app-accent)]"
                    : "border-[var(--app-border)] text-[var(--app-muted)] hover:text-[var(--app-text)]"
                )}
                aria-pressed={form.speakingStyle === style}
              >
                {SPEAKING_STYLE_LABELS[style]}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Slider
            label="Risk appetite"
            min={0}
            max={1}
            step={0.05}
            value={form.riskAppetite}
            onChange={(riskAppetite) => set({ riskAppetite })}
            display={`${Math.round(form.riskAppetite * 100)}%`}
          />
          <Slider
            label="Communication style"
            min={0}
            max={1}
            step={0.05}
            value={form.communicationStyle}
            onChange={(communicationStyle) => set({ communicationStyle })}
            display={`${Math.round(form.communicationStyle * 100)}%`}
          />
          <Slider
            label="Creativity"
            min={0}
            max={1}
            step={0.05}
            value={form.creativity}
            onChange={(creativity) => set({ creativity })}
            display={`${Math.round(form.creativity * 100)}%`}
          />
          <Slider
            label="Flexibility"
            min={0}
            max={1}
            step={0.05}
            value={form.flexibility}
            onChange={(flexibility) => set({ flexibility })}
            display={`${Math.round(form.flexibility * 100)}%`}
          />
        </div>
      </Section>

      <Section title="Details" description="Optional structure for discovery and delegation.">
        <Field label="Core values" error={fieldError("coreValues")} hint="max 4">
          <ChipEditor
            values={form.coreValues || []}
            maxItems={4}
            maxLength={60}
            placeholder="e.g. Evidence first"
            onChange={(coreValues) => set({ coreValues })}
          />
        </Field>
        <Field label="Capabilities" error={fieldError("capabilities")} hint="max 10">
          <ChipEditor
            values={form.capabilities || []}
            maxItems={10}
            maxLength={100}
            placeholder="e.g. Competitive benchmarking"
            onChange={(capabilities) => set({ capabilities })}
          />
        </Field>

        <label className="flex items-center gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5">
          <input
            type="checkbox"
            checked={Boolean(form.isEnabled)}
            onChange={(event) => set({ isEnabled: event.target.checked })}
            className="h-4 w-4 accent-[var(--app-accent)]"
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium">Enabled</span>
            <span className="block text-[11px] text-[var(--app-faint)]">
              Disabled agents stay saved but never run in chats.
            </span>
          </span>
        </label>
      </Section>
    </div>
  );
}
