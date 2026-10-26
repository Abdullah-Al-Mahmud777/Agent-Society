"use client";

import { memo, useEffect, useRef, useState } from "react";
import { ArrowUp, Loader2, Users, Workflow } from "lucide-react";
import { cn } from "@/components/ui/cn";

function ChatComposer({
  onSend,
  loading,
  agents,
  selectedAgentIds,
  executionStrategy,
  onExecutionStrategyChange,
  focusToken = 0,
  initialPrompt = "",
}) {
  const textareaRef = useRef(null);
  const [prompt, setPrompt] = useState(initialPrompt);
  const selectedAgents = agents.filter((agent) => selectedAgentIds.includes(agent.id));
  const canSend = prompt.trim().length > 0 && !loading;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 192)}px`;
  }, [prompt]);

  useEffect(() => {
    if (focusToken > 0) textareaRef.current?.focus();
  }, [focusToken]);

  const submit = () => {
    if (!canSend) return;
    const accepted = onSend(prompt);
    if (accepted !== false) setPrompt("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-4 sm:px-6 sm:pb-5">
      <div className="rounded-[24px] border border-[var(--app-border-strong)] bg-[var(--app-input)] p-2 shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition focus-within:border-[var(--app-accent)]/60">
        <div className="flex flex-wrap items-center gap-1.5 px-1.5 pb-1.5 pt-1">
          {selectedAgents.length === 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--app-warning)]/10 px-2 py-1 text-[11px] font-medium text-[var(--app-warning)]">
              <Users className="h-3 w-3" />
              No agents selected
            </span>
          ) : (
            <>
              {selectedAgents.slice(0, 3).map((agent) => (
                <span
                  key={agent.id}
                  className="inline-flex max-w-[150px] items-center gap-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-2 py-1 text-[11px] text-[var(--app-muted)]"
                  title={`${agent.name} · ${agent.role}`}
                >
                  <span aria-hidden="true">{agent.icon || "🤖"}</span>
                  <span className="truncate">{agent.name}</span>
                </span>
              ))}
              {selectedAgents.length > 3 && (
                <span className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-2 py-1 text-[11px] text-[var(--app-faint)]">
                  +{selectedAgents.length - 3}
                </span>
              )}
            </>
          )}

          <label className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[11px] text-[var(--app-faint)]">
            <Workflow className="h-3 w-3" />
            <span className="hidden sm:inline">Strategy</span>
            <select
              value={executionStrategy}
              onChange={(event) => onExecutionStrategyChange(event.target.value)}
              className="rounded-md border-0 bg-transparent py-0.5 text-[11px] font-medium text-[var(--app-muted)] outline-none"
              aria-label="Execution strategy"
            >
              <option value="parallel">Parallel</option>
              <option value="sequential">Sequential</option>
            </select>
          </label>
        </div>

        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            autoFocus={Boolean(initialPrompt)}
            rows={1}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message your agent society..."
            className="min-h-[44px] w-full resize-none bg-transparent px-2.5 py-2.5 text-sm leading-6 text-[var(--app-text)] outline-none placeholder:text-[var(--app-faint)]"
            aria-label="Message"
          />

          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            className={cn(
              "mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition",
              canSend
                ? "bg-[var(--app-accent)] text-white hover:bg-[var(--app-accent-hover)]"
                : "bg-[var(--app-surface)] text-[var(--app-faint)]"
            )}
            aria-label="Send message"
            title="Send message"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <p className="mt-2 text-center text-[10px] leading-4 text-[var(--app-faint)]">
        Agents can make mistakes. Review important information.
      </p>
    </div>
  );
}

export default memo(ChatComposer);
