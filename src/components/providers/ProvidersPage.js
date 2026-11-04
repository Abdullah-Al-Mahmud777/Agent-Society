"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Plug,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Unplug,
} from "lucide-react";
import { chatApi } from "@/lib/chat-client";
import { PROVIDER_INFO, PROVIDER_IDS } from "@/lib/provider-catalog";
import { cn } from "@/components/ui/cn";

function modelIds(models) {
  return (Array.isArray(models) ? models : [])
    .map((model) => (typeof model === "string" ? model : model?.id))
    .filter(Boolean);
}

function formatRelative(value) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return null;
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function StatusBadge({ tone, children }) {
  const tones = {
    connected: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    active: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
    idle: "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-muted)]",
    error: "border-rose-400/30 bg-rose-400/10 text-rose-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        tones[tone] ?? tones.idle
      )}
    >
      {children}
    </span>
  );
}

function IconButton({ label, busy, children, ...rest }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={busy}
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 text-[11px] font-medium text-[var(--app-muted)] transition hover:border-[var(--app-border-strong)] hover:text-[var(--app-text)] disabled:opacity-50"
      )}
      {...rest}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : children}
    </button>
  );
}

export default function ProvidersPage() {
  const [connections, setConnections] = useState([]);
  const [supported, setSupported] = useState([]);
  const [hasEnvironmentKey, setHasEnvironmentKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");

  const [openForm, setOpenForm] = useState(null);
  const [formKey, setFormKey] = useState("");
  const [formModel, setFormModel] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [formError, setFormError] = useState("");
  const [formBusy, setFormBusy] = useState(false);

  const [busyId, setBusyId] = useState(null);
  const [modelsByProvider, setModelsByProvider] = useState({});
  const [modelsLoadingId, setModelsLoadingId] = useState(null);
  const [modelsError, setModelsError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await chatApi("/api/providers");
        if (cancelled) return;
        setConnections(data.providers || []);
        setSupported(data.supported || []);
        setHasEnvironmentKey(Boolean(data.hasEnvironmentKey));
        setPageError("");
      } catch (error) {
        if (!cancelled) setPageError(error.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const providerIds = useMemo(() => {
    const ids = supported.map((entry) => entry.id);
    return ids.length > 0 ? ids : PROVIDER_IDS;
  }, [supported]);

  const connectionFor = useCallback(
    (providerId) => connections.find((item) => item.providerName === providerId) || null,
    [connections]
  );

  const openConnectForm = (providerId) => {
    setOpenForm(providerId);
    setFormKey("");
    setFormModel("");
    setShowKey(false);
    setFormError("");
    setModelsError("");
  };

  const closeConnectForm = () => {
    setOpenForm(null);
    setFormKey("");
    setFormModel("");
    setFormError("");
    setModelsError("");
  };

  const fetchModels = async (providerId, apiKey) => {
    setModelsLoadingId(providerId);
    setModelsError("");
    try {
      const query = new URLSearchParams({ provider: providerId });
      if (apiKey) query.set("apiKey", apiKey);
      const data = await chatApi(`/api/providers/models?${query.toString()}`);
      const ids = modelIds(data.models);
      setModelsByProvider((current) => ({ ...current, [providerId]: ids }));
      return ids;
    } catch (error) {
      setModelsError(error.message);
      return null;
    } finally {
      setModelsLoadingId(null);
    }
  };

  const submitConnection = async (providerId) => {
    if (!formKey.trim()) {
      setFormError("Enter an API key.");
      return;
    }
    setFormBusy(true);
    setFormError("");
    try {
      const data = await chatApi("/api/providers", {
        method: "POST",
        body: JSON.stringify({
          provider: providerId,
          apiKey: formKey.trim(),
          ...(formModel ? { model: formModel } : {}),
        }),
      });
      setConnections((current) => {
        const next = current.filter((item) => item.providerName !== providerId);
        if (data.provider) next.unshift(data.provider);
        return next;
      });
      if (Array.isArray(data.models)) {
        setModelsByProvider((current) => ({
          ...current,
          [providerId]: modelIds(data.models),
        }));
      }
      setNotice(`${PROVIDER_INFO[providerId]?.name || providerId} connected and tested.`);
      closeConnectForm();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setFormBusy(false);
    }
  };

  const runAction = async (providerId, action) => {
    const connection = connectionFor(providerId);
    if (!connection) return;
    setBusyId(providerId);
    setPageError("");
    setNotice("");
    try {
      const data = await chatApi("/api/providers", {
        method: "PUT",
        body: JSON.stringify(action),
      });
      setConnections((current) =>
        current.map((item) =>
          item.id === data.provider?.id ? { ...item, ...data.provider } : item
        )
      );
      if (Array.isArray(data.models)) {
        setModelsByProvider((current) => ({
          ...current,
          [providerId]: modelIds(data.models),
        }));
      }
      setNotice(data.test?.message || "Provider updated.");
    } catch (error) {
      setPageError(error.message);
    } finally {
      setBusyId(null);
    }
  };

  const disconnect = async (providerId) => {
    const connection = connectionFor(providerId);
    if (!connection) return;
    setBusyId(providerId);
    try {
      await chatApi(`/api/providers?id=${encodeURIComponent(connection.id)}`, {
        method: "DELETE",
      });
      setConnections((current) => current.filter((item) => item.id !== connection.id));
      setModelsByProvider((current) => {
        const next = { ...current };
        delete next[providerId];
        return next;
      });
      setConfirmDeleteId(null);
      setNotice(`${PROVIDER_INFO[providerId]?.name || providerId} disconnected.`);
    } catch (error) {
      setPageError(error.message);
    } finally {
      setBusyId(null);
    }
  };

  const changeModel = async (providerId, model) => {
    const connection = connectionFor(providerId);
    if (!connection || !model) return;
    await runAction(providerId, { id: connection.id, model });
  };

  const activeConnection = connections.find((item) => item.isActive) || null;

  return (
    <div className="min-h-[100dvh] bg-[var(--app-bg)] text-[var(--app-text)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-faint)]">
            <KeyRound className="h-3.5 w-3.5" />
            Credentials
          </span>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Provider settings
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--app-muted)]">
                Connect your own API keys. Keys are encrypted with AES-256-GCM on the
                server and are never sent back to the browser.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={activeConnection ? "active" : "idle"}>
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    activeConnection ? "bg-cyan-300" : "bg-[var(--app-faint)]"
                  )}
                />
                {activeConnection
                  ? `Active: ${PROVIDER_INFO[activeConnection.providerName]?.name || activeConnection.providerName}`
                  : "No active connection"}
              </StatusBadge>
              <StatusBadge tone="idle">
                {connections.length} connected
              </StatusBadge>
            </div>
          </div>
        </header>

        {pageError && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="flex-1">{pageError}</p>
            <button
              type="button"
              onClick={() => setPageError("")}
              className="text-rose-300/70 hover:text-rose-300"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {notice && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="flex-1">{notice}</p>
            <button
              type="button"
              onClick={() => setNotice("")}
              className="text-emerald-300/70 hover:text-emerald-300"
              aria-label="Dismiss notice"
            >
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-2" aria-label="Loading connections">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-44 animate-pulse rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]"
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {providerIds.map((providerId) => {
              const info = PROVIDER_INFO[providerId] || {
                name: providerId,
                icon: "🔌",
                description: "",
                keyFormat: "",
                docsUrl: "",
              };
              const connection = connectionFor(providerId);
              const connected = Boolean(connection);
              const formOpen = openForm === providerId;
              const busy = busyId === providerId;
              const models = modelIds(
                modelsByProvider[providerId] || connection?.metadata?.models || []
              );
              const testFailed = connection?.metadata?.testStatus === "failed";
              const lastTested = formatRelative(connection?.metadata?.lastTested);

              return (
                <section
                  key={providerId}
                  className={cn(
                    "flex flex-col rounded-2xl border bg-[var(--app-bg-elevated)] p-5 transition",
                    connected
                      ? connection?.isActive
                        ? "border-[var(--app-accent)]/40"
                        : "border-[var(--app-border)]"
                      : "border-[var(--app-border)]"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] text-lg">
                        {info.icon}
                      </span>
                      <div className="min-w-0">
                        <h2 className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                          {info.name}
                          {connected && (
                            <StatusBadge tone="connected">
                              <Check className="h-3 w-3" />
                              Connected
                            </StatusBadge>
                          )}
                          {connection?.isActive && (
                            <StatusBadge tone="active">Active</StatusBadge>
                          )}
                          {testFailed && <StatusBadge tone="error">Last test failed</StatusBadge>}
                        </h2>
                        <p className="mt-1 text-xs leading-5 text-[var(--app-muted)]">
                          {info.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {connected ? (
                    <dl className="mt-4 space-y-1.5 text-xs text-[var(--app-muted)]">
                      <div className="flex items-center justify-between gap-3">
                        <dt>Model</dt>
                        <dd className="truncate font-medium text-[var(--app-text)]">
                          {connection.selectedModel || "—"}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt>Status</dt>
                        <dd className="truncate">
                          {connection.metadata?.testMessage || "Saved"}
                          {lastTested ? ` · ${lastTested}` : ""}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt>Available models</dt>
                        <dd>{connection.metadata?.modelCount ?? models.length ?? 0}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="mt-4 text-xs leading-5 text-[var(--app-faint)]">
                      Key format: <code className="text-[var(--app-text)]">{info.keyFormat}</code>
                      {info.docsUrl && (
                        <>
                          {" · "}
                          <a
                            href={info.docsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--app-accent)] underline underline-offset-2"
                          >
                            get a key
                          </a>
                        </>
                      )}
                    </p>
                  )}

                  {connected && models.length > 0 && (
                    <div className="mt-3">
                      <label className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-[var(--app-faint)]">
                        Selected model
                      </label>
                      <select
                        value={connection.selectedModel}
                        onChange={(event) => changeModel(providerId, event.target.value)}
                        disabled={busy}
                        className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)] outline-none focus:border-[var(--app-accent)] disabled:opacity-50"
                        aria-label={`Model for ${info.name}`}
                      >
                        {!models.includes(connection.selectedModel) && connection.selectedModel && (
                          <option value={connection.selectedModel}>
                            {connection.selectedModel}
                          </option>
                        )}
                        {models.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formOpen && (
                    <div className="mt-4 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3.5">
                      <label className="mb-1.5 block text-xs font-medium text-[var(--app-muted)]">
                        API key
                      </label>
                      <div className="flex gap-2">
                        <div className="relative min-w-0 flex-1">
                          <input
                            autoFocus
                            type={showKey ? "text" : "password"}
                            value={formKey}
                            onChange={(event) => setFormKey(event.target.value)}
                            placeholder={info.keyFormat || "Paste your API key"}
                            autoComplete="off"
                            spellCheck={false}
                            className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] py-2.5 pl-3 pr-10 text-sm text-[var(--app-text)] outline-none focus:border-[var(--app-accent)]"
                            aria-label={`${info.name} API key`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey((value) => !value)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--app-faint)] hover:text-[var(--app-text)]"
                            aria-label={showKey ? "Hide API key" : "Show API key"}
                          >
                            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => void fetchModels(providerId, formKey.trim())}
                          disabled={modelsLoadingId === providerId || !formKey.trim()}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--app-border)] px-3 py-2 text-xs font-medium text-[var(--app-muted)] transition hover:text-[var(--app-text)] disabled:opacity-50"
                        >
                          {modelsLoadingId === providerId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                          Models
                        </button>
                      </div>

                      {modelsByProvider[providerId]?.length > 0 && (
                        <select
                          value={formModel}
                          onChange={(event) => setFormModel(event.target.value)}
                          className="mt-2 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] px-3 py-2 text-sm text-[var(--app-text)] outline-none focus:border-[var(--app-accent)]"
                          aria-label="Default model"
                        >
                          <option value="">
                            Default (first available model)
                          </option>
                          {modelsByProvider[providerId].map((model) => (
                            <option key={model} value={model}>
                              {model}
                            </option>
                          ))}
                        </select>
                      )}

                      {modelsError && (
                        <p className="mt-2 text-xs text-rose-300">{modelsError}</p>
                      )}
                      {formError && (
                        <p className="mt-2 text-xs text-rose-300">{formError}</p>
                      )}

                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={closeConnectForm}
                          disabled={formBusy}
                          className="rounded-xl border border-[var(--app-border)] px-3 py-2 text-xs font-medium text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => void submitConnection(providerId)}
                          disabled={formBusy || !formKey.trim()}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--app-accent)] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[var(--app-accent-hover)] disabled:opacity-50"
                        >
                          {formBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          {formBusy ? "Testing…" : "Test & save"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--app-border)] pt-4">
                    {!connected ? (
                      <button
                        type="button"
                        onClick={() => (formOpen ? closeConnectForm() : openConnectForm(providerId))}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--app-accent)] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[var(--app-accent-hover)]"
                      >
                        {formOpen ? (
                          <>Close</>
                        ) : (
                          <>
                            <Plug className="h-3.5 w-3.5" />
                            Connect key
                          </>
                        )}
                      </button>
                    ) : (
                      <>
                        <IconButton
                          label="Test connection"
                          busy={busy}
                          onClick={() =>
                            void runAction(providerId, { id: connection.id, test: true })
                          }
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Test
                        </IconButton>
                        <IconButton
                          label="Fetch available models"
                          busy={modelsLoadingId === providerId}
                          onClick={() => void fetchModels(providerId)}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Models
                        </IconButton>
                        {!connection.isActive && (
                          <IconButton
                            label="Make active"
                            busy={busy}
                            onClick={() =>
                              void runAction(providerId, {
                                id: connection.id,
                                makeActive: true,
                              })
                            }
                          >
                            <Check className="h-3.5 w-3.5" />
                            Make active
                          </IconButton>
                        )}
                        <IconButton
                          label="Update API key"
                          busy={busy}
                          onClick={() =>
                            formOpen ? closeConnectForm() : openConnectForm(providerId)
                          }
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          Update key
                        </IconButton>
                        {confirmDeleteId === connection.id ? (
                          <IconButton
                            label="Confirm disconnect"
                            busy={busy}
                            onClick={() => void disconnect(providerId)}
                          >
                            <Unplug className="h-3.5 w-3.5" />
                            Confirm
                          </IconButton>
                        ) : (
                          <IconButton
                            label="Disconnect"
                            busy={false}
                            onClick={() => setConfirmDeleteId(connection.id)}
                          >
                            <Unplug className="h-3.5 w-3.5" />
                            Disconnect
                          </IconButton>
                        )}
                      </>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <section className="mt-6 flex items-start gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-5 text-sm text-[var(--app-muted)]">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--app-accent)]" />
          <div>
            <p className="font-medium text-[var(--app-text)]">How credentials are stored</p>
            <p className="mt-1 leading-6">
              Keys are encrypted server-side with AES-256-GCM before they reach Turso and are
              only decrypted inside API routes when a request runs. Responses expose connection
              status and model names — never the key itself.
              {hasEnvironmentKey &&
                " The deployment also has an environment key configured, so chat keeps working even without a personal connection."}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
