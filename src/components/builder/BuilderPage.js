"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  GitBranch,
  Home,
  Loader2,
  MessagesSquare,
  Moon,
  Plus,
  Save,
  SlidersHorizontal,
  Sun,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { chatApi } from "@/lib/chat-client";
import {
  PROVIDER_LABELS,
  agentInputSchema,
  createAgentDefaults,
} from "@/lib/agent-builder-schema";
import { cn } from "@/components/ui/cn";
import AgentLibrary from "@/components/builder/AgentLibrary";
import AgentForm from "@/components/builder/AgentForm";
import AgentPlayground from "@/components/builder/AgentPlayground";
import WorkflowCanvas from "@/components/builder/WorkflowCanvas";
import ProvidersPanel from "@/components/builder/ProvidersPanel";

const TABS = [
  { id: "canvas", label: "Canvas", icon: GitBranch },
  { id: "configure", label: "Configure", icon: SlidersHorizontal },
  { id: "playground", label: "Playground", icon: MessagesSquare },
];

function modelIds(models) {
  return (Array.isArray(models) ? models : [])
    .map((model) => (typeof model === "string" ? model : model?.id))
    .filter(Boolean);
}

function flattenErrors(result) {
  if (result?.success || !result?.error) return {};
  try {
    return result.error.flatten?.().fieldErrors || {};
  } catch {
    return {};
  }
}

export default function BuilderPage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme !== "light";
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(() => createAgentDefaults());
  const [dirty, setDirty] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [playError, setPlayError] = useState("");
  const [meta, setMeta] = useState(null);

  const [tab, setTab] = useState("canvas");
  const [modelsByProvider, setModelsByProvider] = useState({});
  const [modelsStatus, setModelsStatus] = useState({ state: "idle", message: "" });
  const loadedProviders = useRef(new Set());
  const initialModelLoad = useRef(false);

  const resetPlayground = useCallback(() => {
    setMessages([]);
    setMeta(null);
    setPlayError("");
  }, []);

  const loadModels = useCallback(async (provider, { force = false, silent = false } = {}) => {
    if (!provider) return [];
    if (!force && loadedProviders.current.has(provider)) {
      return modelsByProvider[provider] || [];
    }
    loadedProviders.current.add(provider);
    if (!silent) setModelsStatus({ state: "loading", message: "" });
    try {
      const data = await chatApi(`/api/providers/models?provider=${encodeURIComponent(provider)}`);
      const ids = modelIds(data.models);
      setModelsByProvider((current) => ({ ...current, [provider]: ids }));
      setModelsStatus({ state: "loaded", message: "" });
      return ids;
    } catch (err) {
      // The first automatic lookup runs before a key exists; stay quiet and let
      // the Configure tab explain. User-triggered loads surface the error.
      setModelsStatus(
        silent
          ? { state: "idle", message: "" }
          : { state: "error", message: err?.message || "Could not load the model list." }
      );
      return [];
    }
  }, [modelsByProvider]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await chatApi("/api/db/agents");
        if (cancelled) return;
        setAgents(Array.isArray(data.agents) ? data.agents : []);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load agents");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectAgent = useCallback(
    (agent, { force = false } = {}) => {
      if (!force && dirty && !window.confirm("Discard unsaved changes?")) return;
      setSelectedId(agent.id);
      setForm({ ...createAgentDefaults(), ...agent });
      setDirty(false);
      setFieldErrors({});
      setError("");
      setNotice("");
      resetPlayground();
      setDeleteTarget(null);
    },
    [dirty, resetPlayground]
  );

  useEffect(() => {
    if (loading || selectedId || dirty || agents.length === 0) return;
    selectAgent(agents[0], { force: true });
  }, [loading, selectedId, dirty, agents, selectAgent]);

  const startNew = () => {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    setSelectedId(null);
    setForm(createAgentDefaults());
    setDirty(false);
    setFieldErrors({});
    setError("");
    setNotice("");
    setDeleteTarget(null);
    resetPlayground();
  };

  const onFormChange = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
    setDirty(true);
    setFieldErrors((current) => {
      if (Object.keys(current).length === 0) return current;
      const next = { ...current };
      for (const key of Object.keys(patch)) delete next[key];
      return next;
    });
  };

  const save = async () => {
    const parsed = agentInputSchema.safeParse(form);
    if (!parsed.success) {
      const flat = flattenErrors(parsed);
      setFieldErrors(flat);
      const first = Object.values(flat).flat()[0];
      setError(first || "Fix the highlighted fields before saving.");
      return;
    }

    setFieldErrors({});
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        ...parsed.data,
        ...(form.id ? { id: form.id } : {}),
        ...(form.createdAt ? { createdAt: form.createdAt } : {}),
        updatedAt: new Date().toISOString(),
      };
      const data = await chatApi("/api/db/agents", {
        method: "POST",
        body: JSON.stringify({ agent: payload }),
      });
      const saved = data.agent;
      if (!saved) throw new Error(data.error || "The server rejected this agent");
      setAgents((current) =>
        current.some((agent) => agent.id === saved.id)
          ? current.map((agent) => (agent.id === saved.id ? saved : agent))
          : [saved, ...current]
      );
      setSelectedId(saved.id);
      setForm({ ...createAgentDefaults(), ...saved });
      setDirty(false);
      setNotice(`“${saved.name}” saved.`);
    } catch (err) {
      setError(err?.message || "Failed to save the agent");
    } finally {
      setSaving(false);
    }
  };

  const toggleAgent = async (agent) => {
    const payload = {
      ...agent,
      isEnabled: !agent.isEnabled,
      updatedAt: new Date().toISOString(),
    };
    try {
      const data = await chatApi("/api/db/agents", {
        method: "POST",
        body: JSON.stringify({ agent: payload }),
      });
      const saved = data.agent || payload;
      setAgents((current) =>
        current.map((item) => (item.id === saved.id ? saved : item))
      );
      if (selectedId === saved.id) {
        setForm((current) => ({ ...current, isEnabled: saved.isEnabled }));
      }
      setNotice(`${saved.name} ${saved.isEnabled ? "enabled" : "disabled"}.`);
    } catch (err) {
      setError(err?.message || "Failed to update the agent");
      throw err;
    }
  };

  const deleteAgent = async (agent) => {
    try {
      await chatApi(`/api/db/agents?id=${encodeURIComponent(agent.id)}`, {
        method: "DELETE",
      });
      setAgents((current) => current.filter((item) => item.id !== agent.id));
      setDeleteTarget(null);
      setNotice(`“${agent.name}” deleted.`);
      if (selectedId === agent.id) {
        setSelectedId(null);
        setForm(createAgentDefaults());
        setDirty(false);
        setFieldErrors({});
        resetPlayground();
      }
    } catch (err) {
      setError(err?.message || "Failed to delete the agent");
      setDeleteTarget(null);
    }
  };

  const send = async (text) => {
    const parsed = agentInputSchema.safeParse(form);
    if (!parsed.success) {
      const flat = flattenErrors(parsed);
      const first = Object.values(flat).flat()[0];
      setPlayError(first || "Fix the form before testing this agent.");
      return;
    }

    const history = [...messages, { role: "user", content: text }];
    setMessages(history);
    setPlayError("");
    setBusy(true);
    try {
      const data = await chatApi("/api/builder/test", {
        method: "POST",
        body: JSON.stringify({ agent: parsed.data, messages: history }),
      });
      setMessages((current) => [...current, { role: "assistant", content: data.reply || "" }]);
      setMeta({
        provider: data.provider,
        model: data.model,
        durationMs: data.durationMs,
        source: data.source,
      });
    } catch (err) {
      setMessages((current) => [
        ...current,
        { role: "error", content: err?.message || "The test request failed." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!form.aiProvider) return;
    if (!initialModelLoad.current) {
      initialModelLoad.current = true;
      loadModels(form.aiProvider, { silent: true });
      return;
    }
    loadModels(form.aiProvider);
  }, [form.aiProvider, loadModels]);

  const models = modelsByProvider[form.aiProvider] || [];

  return (
    <div
      className={cn("studio min-h-[100dvh]", isDark ? "studio--dark" : "studio--light")}
    >
      <header className="sticky top-0 z-40 border-b border-[var(--app-border)] bg-[var(--studio-header-bg)] backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1720px] items-center gap-3 px-4 py-2.5 sm:px-6">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--app-accent)]/30 bg-[var(--app-accent)]/10 text-[var(--app-accent)]">
            <Wrench className="h-4 w-4" />
          </span>
          <div className="hidden min-w-0 sm:block">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--app-faint)]">
              Agent Society · Studio
            </p>
            <h1 className="truncate text-sm font-semibold tracking-tight">
              Agent Builder
            </h1>
          </div>
          <span className="hidden min-w-0 truncate text-xs text-[var(--app-muted)] md:block">
            / {form.name || "Untitled draft"}
          </span>
          {dirty && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--app-border-strong)] bg-[var(--app-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--app-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--app-muted)]" />
              Unsaved
            </span>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? "Switch to white mode" : "Switch to dark mode"}
              aria-label={isDark ? "Switch to white mode" : "Switch to dark mode"}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--app-border)] text-[var(--app-muted)] transition hover:border-[var(--app-accent)]/40 hover:text-[var(--app-accent)]"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="hidden items-center gap-1.5 sm:flex">
              {[
                { href: "/", label: "Home", icon: Home },
                { href: "/society", label: "Society", icon: Users },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  prefetch={false}
                  title={label}
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--app-border)] text-[var(--app-muted)] transition hover:border-[var(--app-accent)]/40 hover:text-[var(--app-accent)]"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
              <span className="mx-1 h-5 w-px bg-[var(--app-border)]" />
            </div>
            <button
              type="button"
              onClick={startNew}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--app-border)] px-2.5 py-2 text-xs font-semibold text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New draft</span>
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--app-accent)] px-3 py-2 text-xs font-semibold text-[var(--studio-on-accent)] transition hover:bg-[var(--app-accent-hover)] disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save agent
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1720px] px-4 py-4 sm:px-6">
        <div className="space-y-2">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-[var(--app-danger)]/30 bg-[var(--app-danger)]/10 px-3.5 py-2.5 text-sm text-[var(--app-danger)]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="flex-1">{error}</p>
              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
                className="opacity-70 transition hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {notice && (
            <div className="flex items-start gap-2 rounded-xl border border-[var(--app-accent)]/30 bg-[var(--app-accent)]/10 px-3.5 py-2.5 text-sm text-[var(--app-accent)]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="flex-1">{notice}</p>
              <button
                type="button"
                onClick={() => setNotice("")}
                aria-label="Dismiss notice"
                className="opacity-70 transition hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {modelsStatus.state === "error" && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--app-danger)]/30 bg-[var(--app-danger)]/10 px-3.5 py-2.5 text-xs text-[var(--app-danger)]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="flex-1">{modelsStatus.message}</span>
              <Link
                href="/providers"
                className="font-semibold underline underline-offset-2 hover:opacity-80"
              >
                Open Provider settings →
              </Link>
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[236px_minmax(0,1fr)] xl:grid-cols-[236px_minmax(0,1fr)_352px]">
          <AgentLibrary
            agents={agents}
            loading={loading}
            selectedId={selectedId}
            search={search}
            onSearchChange={setSearch}
            onSelect={(agent) => selectAgent(agent)}
            onCreate={startNew}
            onToggle={toggleAgent}
            onDelete={(agent) => setDeleteTarget(agent.id)}
            deleteTarget={deleteTarget}
            onDeleteConfirm={deleteAgent}
            onDeleteCancel={() => setDeleteTarget(null)}
          />

          <section className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-1.5">
              <div className="flex gap-1" role="tablist" aria-label="Builder views">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={tab === id}
                    onClick={() => setTab(id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition",
                      tab === id
                        ? "bg-[var(--app-accent)]/15 text-[var(--app-accent)] ring-1 ring-inset ring-[var(--app-accent)]/30"
                        : "text-[var(--app-muted)] hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                    {id === "playground" && messages.length > 0 && (
                      <span className="rounded-full bg-[var(--app-accent)]/20 px-1.5 py-px text-[10px] text-[var(--app-accent)]">
                        {messages.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <p className="hidden truncate pr-2 text-[11px] text-[var(--app-faint)] lg:block">
                {form.name} · {PROVIDER_LABELS[form.aiProvider] || form.aiProvider} ·{" "}
                {form.model}
              </p>
            </div>

            {tab === "canvas" && <WorkflowCanvas agent={form} onOpen={setTab} />}
            {tab === "configure" && (
              <AgentForm
                form={form}
                errors={fieldErrors}
                onChange={onFormChange}
                models={models}
                modelsStatus={modelsStatus}
                onLoadModels={(provider) => loadModels(provider, { force: true })}
              />
            )}
            {tab === "playground" && (
              <AgentPlayground
                agent={form}
                messages={messages}
                busy={busy}
                meta={meta}
                error={playError}
                onSend={send}
                onClear={resetPlayground}
              />
            )}
          </section>

          <ProvidersPanel />
        </div>
      </div>
    </div>
  );
}
