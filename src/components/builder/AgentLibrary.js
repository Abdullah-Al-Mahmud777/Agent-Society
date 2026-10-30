"use client";

import { useState } from "react";
import { Check, Loader2, Pencil, Plus, Power, Search, Trash2 } from "lucide-react";
import { PROVIDER_LABELS } from "@/lib/agent-builder-schema";
import { cn } from "@/components/ui/cn";

function formatRelative(value) {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}

/**
 * Left rail: saved agents, search, create/edit/delete/enable toggles.
 */
export default function AgentLibrary({
  agents,
  loading,
  selectedId,
  search,
  onSearchChange,
  onSelect,
  onCreate,
  onToggle,
  onDelete,
  deleteTarget,
  onDeleteConfirm,
  onDeleteCancel,
}) {
  const [togglingId, setTogglingId] = useState(null);

  const filtered = agents.filter((agent) => {
    const haystack = `${agent.name} ${agent.role} ${agent.description}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  const handleToggle = async (agent) => {
    setTogglingId(agent.id);
    try {
      await onToggle(agent);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <aside className="flex flex-col gap-3 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-8rem)] lg:overflow-hidden">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Agent library</h2>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--app-accent)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--studio-on-accent)] transition hover:bg-[var(--app-accent-hover)]"
        >
          <Plus className="h-3.5 w-3.5" />
          New agent
        </button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--app-faint)]" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search agents…"
          className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] py-2 pl-9 pr-3 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-faint)] focus:border-[var(--app-accent)]"
          aria-label="Search agents"
        />
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pb-2 lg:pr-1">
        {loading && (
          <div className="flex items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-3 py-3 text-xs text-[var(--app-faint)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading agents…
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-3 py-6 text-center">
            <p className="text-xs font-medium">
              {agents.length === 0 ? "No agents yet" : "No matches"}
            </p>
            <p className="mt-1 text-[11px] leading-5 text-[var(--app-faint)]">
              {agents.length === 0
                ? "Create your first agent to start a society."
                : "Try a different search term."}
            </p>
          </div>
        )}

        {filtered.map((agent) => {
          const selected = agent.id === selectedId;
          const busy = togglingId === agent.id;
          const confirming = deleteTarget === agent.id;

          if (confirming) {
            return (
              <div
                key={agent.id}
                className="rounded-xl border border-[var(--app-danger)]/40 bg-[var(--app-danger)]/10 p-3 text-xs"
              >
                <p className="font-medium text-[var(--app-danger)]">
                  Delete “{agent.name}”? This cannot be undone.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onDeleteConfirm(agent)}
                    className="rounded-lg bg-[var(--app-danger)] px-2.5 py-1.5 font-semibold text-white transition hover:opacity-90"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={onDeleteCancel}
                    className="rounded-lg border border-[var(--app-border)] px-2.5 py-1.5 text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={agent.id}
              className={cn(
                "group rounded-xl border bg-[var(--app-bg-elevated)] p-3 transition",
                selected
                  ? "border-[var(--app-accent)]"
                  : "border-[var(--app-border)] hover:border-[var(--app-border-strong)]"
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(agent)}
                className="flex w-full items-start gap-2.5 text-left"
              >
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm"
                  style={{
                    backgroundColor: `${agent.color || "#22c55e"}26`,
                    color: agent.color || "#22c55e",
                  }}
                >
                  {agent.icon || "🤖"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{agent.name}</span>
                    {!agent.isEnabled && (
                      <span className="rounded-full bg-[var(--app-surface)] px-1.5 py-0.5 text-[10px] text-[var(--app-faint)]">
                        off
                      </span>
                    )}
                    {selected && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-[var(--app-accent)]" />
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-[var(--app-faint)]">
                    {agent.role || "No role"} · {PROVIDER_LABELS[agent.aiProvider] || agent.aiProvider}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-[var(--app-faint)]">
                    {formatRelative(agent.updatedAt)}
                  </span>
                </span>
              </button>

              <div className="mt-2 flex gap-1 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100">
                <button
                  type="button"
                  onClick={() => onSelect(agent)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--app-border)] px-2 py-1 text-[11px] text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle(agent)}
                  disabled={busy}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--app-border)] px-2 py-1 text-[11px] text-[var(--app-muted)] transition hover:text-[var(--app-text)] disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Power className="h-3 w-3" />
                  )}
                  {agent.isEnabled ? "Disable" : "Enable"}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(agent)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--app-border)] px-2 py-1 text-[11px] text-[var(--app-muted)] transition hover:border-[var(--app-danger)]/50 hover:text-[var(--app-danger)]"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
