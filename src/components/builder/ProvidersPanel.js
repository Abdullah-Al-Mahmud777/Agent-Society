"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { chatApi } from "@/lib/chat-client";
import { PROVIDER_IDS, PROVIDER_INFO } from "@/lib/provider-catalog";
import { cn } from "@/components/ui/cn";

/** Demo-only usage figures — the platform does not track vendor usage yet. */
const DEMO_USAGE = {
  openai: 64,
  gemini: 42,
  anthropic: 28,
  openrouter: 55,
  qwen: 17,
};

function StatusPill({ tone, children }) {
  const tones = {
    active: "border-[var(--app-accent)]/40 bg-[var(--app-accent)]/10 text-[var(--app-accent)]",
    connected: "border-[var(--app-border-strong)] bg-[var(--app-surface)] text-[var(--app-text)]",
    idle: "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-faint)]",
  };
  const dots = {
    active: "bg-[var(--app-accent)]",
    connected: "bg-[var(--app-text)]",
    idle: "bg-[var(--app-faint)]",
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
        tones[tone]
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dots[tone])} />
      {children}
    </span>
  );
}

function Toggle({ checked, busy, disabled, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={busy || disabled}
      onClick={onChange}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        checked
          ? "border-[var(--app-accent)]/50 bg-[var(--app-accent)]"
          : "border-[var(--app-border-strong)] bg-[var(--app-surface)]"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-3.5 w-3.5 rounded-full shadow transition-all",
          checked ? "left-[18px] bg-[var(--studio-on-accent)]" : "left-0.5 bg-[var(--app-faint)]"
        )}
      />
    </button>
  );
}

/**
 * Right-hand Providers & Integrations rail: real connection status,
 * active toggles, stored model pickers, and a demo usage meter.
 */
export default function ProvidersPanel() {
  const [connections, setConnections] = useState([]);
  const [supported, setSupported] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await chatApi("/api/providers");
      setConnections(Array.isArray(data.providers) ? data.providers : []);
      setSupported(Array.isArray(data.supported) ? data.supported : []);
      setError("");
    } catch (err) {
      setError(err?.message || "Could not load providers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await chatApi("/api/providers");
        if (cancelled) return;
        setConnections(Array.isArray(data.providers) ? data.providers : []);
        setSupported(Array.isArray(data.supported) ? data.supported : []);
        setError("");
      } catch (err) {
        if (!cancelled) setError(err?.message || "Could not load providers");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ids = supported.length > 0 ? supported.map((entry) => entry.id) : PROVIDER_IDS;
  const connectedCount = connections.length;
  const activeConnection = connections.find((item) => item.isActive) || null;

  const update = async (id, payload, successMessage) => {
    setBusyId(id);
    setError("");
    setNotice("");
    try {
      await chatApi("/api/providers", {
        method: "PUT",
        body: JSON.stringify({ id, ...payload }),
      });
      if (successMessage) setNotice(successMessage);
      await load();
    } catch (err) {
      setError(err?.message || "Provider update failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <aside className="flex min-w-0 flex-col gap-3 xl:sticky xl:top-24 xl:max-h-[calc(100dvh-8rem)] xl:overflow-y-auto xl:pr-1">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight">
            Providers &amp; Integrations
          </h2>
          <p className="text-[11px] text-[var(--app-faint)]">
            {loading
              ? "Loading connections…"
              : `${connectedCount} of ${ids.length} connected`}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading || busyId !== null}
          title="Refresh connections"
          aria-label="Refresh connections"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--app-border)] text-[var(--app-muted)] transition hover:text-[var(--app-text)] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-[var(--app-danger)]/30 bg-[var(--app-danger)]/10 px-3 py-2 text-xs text-[var(--app-danger)]">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p className="flex-1">{error}</p>
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-[var(--app-accent)]/30 bg-[var(--app-accent)]/10 px-3 py-2 text-xs text-[var(--app-accent)]">
          {notice}
        </div>
      )}

      <div className="space-y-2.5">
        {loading &&
          [0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-[132px] animate-pulse rounded-xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)]"
            />
          ))}

        {!loading &&
          ids.map((id) => {
            const info = PROVIDER_INFO[id] || { name: id, icon: "🔌" };
            const connection =
              connections.find((item) => item.providerName === id) || null;
            const active = Boolean(connection?.isActive);
            const usage = DEMO_USAGE[id] ?? 24;
            const busy = busyId === connection?.id;
            const metadataModels = (connection?.metadata?.models || [])
              .map((model) => (typeof model === "string" ? model : model?.id))
              .filter(Boolean);
            const modelOptions = [
              ...new Set([...metadataModels, connection?.selectedModel].filter(Boolean)),
            ];

            return (
              <article
                key={id}
                className={cn(
                  "rounded-xl border bg-[var(--app-bg-elevated)] p-3 transition",
                  active
                    ? "border-[var(--app-accent)]/50"
                    : "border-[var(--app-border)] hover:border-[var(--app-border-strong)]"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-base">
                    {info.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold leading-tight">
                      {info.name}
                    </p>
                    <p className="truncate font-mono text-[10px] text-[var(--app-faint)]">
                      {connection ? connection.selectedModel : info.keyFormat}
                    </p>
                  </div>
                  <StatusPill tone={active ? "active" : connection ? "connected" : "idle"}>
                    {active ? "Active" : connection ? "Connected" : "Inactive"}
                  </StatusPill>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[10px] text-[var(--app-faint)]">
                    <span className="flex items-center gap-1.5">
                      API usage
                      <span className="rounded border border-[var(--app-border)] bg-[var(--app-surface)] px-1 py-px uppercase tracking-[0.1em]">
                        demo
                      </span>
                    </span>
                    <span className="font-mono">{usage}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--app-surface)]">
                    <div
                      className="h-full rounded-full bg-[var(--app-accent)] transition-all"
                      style={{ width: `${usage}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {connection ? (
                    <>
                      <Toggle
                        checked={active}
                        busy={busy}
                        onChange={() =>
                          update(
                            connection.id,
                            { makeActive: !connection.isActive },
                            active
                              ? `${info.name} deactivated.`
                              : `${info.name} is now the active provider.`
                          )
                        }
                        label={`${active ? "Deactivate" : "Activate"} ${info.name}`}
                      />
                      <span className="flex-1 text-[10px] uppercase tracking-[0.14em] text-[var(--app-faint)]">
                        {active ? "Active" : "Inactive"}
                      </span>
                      {active && modelOptions.length > 0 && (
                        <select
                          value={connection.selectedModel}
                          onChange={(event) =>
                            update(connection.id, { model: event.target.value })
                          }
                          disabled={busy}
                          aria-label={`Model for ${info.name}`}
                          className="max-w-[46%] cursor-pointer truncate rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-2 py-1 text-[11px] text-[var(--app-text)] outline-none focus:border-[var(--app-accent)]/50"
                        >
                          {modelOptions.map((model) => (
                            <option key={model} value={model}>
                              {model}
                            </option>
                          ))}
                        </select>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-[11px] text-[var(--app-faint)]">
                        No key connected
                      </span>
                      <Link
                        href="/providers"
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--app-accent)]/35 bg-[var(--app-accent)]/10 px-2.5 py-1.5 text-[11px] font-semibold text-[var(--app-accent)] transition hover:bg-[var(--app-accent)]/20"
                      >
                        <KeyRound className="h-3 w-3" />
                        Connect
                      </Link>
                    </>
                  )}
                </div>
              </article>
            );
          })}
      </div>

      {activeConnection && (
        <p className="rounded-xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-3 py-2 text-[11px] leading-5 text-[var(--app-faint)]">
          Chats and playground runs use{" "}
          <span className="text-[var(--app-muted)]">
            {PROVIDER_INFO[activeConnection.providerName]?.name ||
              activeConnection.providerName}
          </span>{" "}
          · {activeConnection.selectedModel}
        </p>
      )}

      <Link
        href="/providers"
        className="flex items-center justify-between gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-3 py-2.5 text-xs font-medium text-[var(--app-muted)] transition hover:border-[var(--app-accent)]/30 hover:text-[var(--app-text)]"
      >
        Manage keys, tests &amp; models
        <RefreshCw className="h-3.5 w-3.5" />
      </Link>

      <p className="px-1 text-[10px] leading-4 text-[var(--app-faint)]">
        API keys are AES-256-GCM encrypted on the server and never reach the
        browser. Usage figures are demo values.
      </p>
    </aside>
  );
}
