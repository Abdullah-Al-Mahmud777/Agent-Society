"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Eraser, Loader2, Send, Sparkles } from "lucide-react";
import MarkdownMessage from "@/components/chat/MarkdownMessage";
import { cn } from "@/components/ui/cn";

/**
 * Interactive chat playground for a single agent draft.
 * Talks to POST /api/builder/test — nothing here is persisted.
 */
export default function AgentPlayground({
  agent,
  messages,
  busy,
  meta,
  error,
  onSend,
  onClear,
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, busy]);

  const submit = () => {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    onSend(text);
  };

  const agentName = String(agent?.name || "").trim() || "this agent";

  return (
    <section className="flex h-[calc(100dvh-13rem)] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)]">
      <header className="flex items-center justify-between gap-2 border-b border-[var(--app-border)] px-4 py-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-[var(--app-accent)]" />
            Playground
          </h2>
          <p className="truncate text-[11px] text-[var(--app-faint)]">
            Test {agentName} before saving · nothing is stored
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={busy || messages.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--app-border)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--app-muted)] transition hover:text-[var(--app-text)] disabled:opacity-40"
        >
          <Eraser className="h-3.5 w-3.5" />
          Clear
        </button>
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-accent)]">
              <Sparkles className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium">Try the agent out</p>
            <p className="max-w-[26ch] text-xs leading-5 text-[var(--app-faint)]">
              Messages use the current form values — provider, model, prompt and parameters —
              without saving anything.
            </p>
          </div>
        )}

        {messages.map((message, index) => {
          const key = message.id || `playground-${index}`;
          const isError = message.role === "error";

          if (message.role === "user") {
            return (
              <div key={key} className="flex justify-end">
                <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-[var(--app-user-bubble)] px-3.5 py-2.5 text-sm leading-6 text-[var(--app-text)]">
                  {message.content}
                </div>
              </div>
            );
          }

          if (isError) {
            return (
              <div
                key={key}
                className="flex items-start gap-2 rounded-xl border border-[var(--app-danger)]/30 bg-[var(--app-danger)]/10 px-3 py-2.5 text-xs text-[var(--app-danger)]"
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p className="flex-1 whitespace-pre-wrap">{message.content}</p>
              </div>
            );
          }

          return (
            <div key={key} className="text-sm leading-6">
              <MarkdownMessage content={message.content} />
            </div>
          );
        })}

        {busy && (
          <div className="flex items-center gap-2 text-xs text-[var(--app-faint)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {agentName} is responding…
          </div>
        )}
      </div>

      {meta && (
        <p className="border-t border-[var(--app-border)] px-4 py-2 text-[11px] text-[var(--app-faint)]">
          {meta.provider} · {meta.model}
          {typeof meta.durationMs === "number" ? ` · ${(meta.durationMs / 1000).toFixed(1)}s` : ""}
          {meta.source === "environment" ? " · deployment key" : ""}
        </p>
      )}

      <div className="border-t border-[var(--app-border)] p-3">
        {error && <p className="mb-2 text-xs text-[var(--app-danger)]">{error}</p>}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder="Message this agent…"
            className="max-h-40 min-h-[64px] flex-1 resize-none rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-faint)] focus:border-[var(--app-accent)]"
            aria-label="Playground message"
          />
          <button
            type="button"
            onClick={submit}
            disabled={busy || !draft.trim()}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--studio-on-accent)] transition",
              busy || !draft.trim()
                ? "bg-[var(--app-surface)] text-[var(--app-faint)]"
                : "bg-[var(--app-accent)] hover:bg-[var(--app-accent-hover)]"
            )}
            aria-label="Send message"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </section>
  );
}
