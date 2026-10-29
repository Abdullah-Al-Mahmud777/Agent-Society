"use client";

import { memo, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  AlertCircle,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Lightbulb,
  Rocket,
  Scale,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/components/ui/cn";

const MarkdownMessage = dynamic(
  () => import("@/components/chat/MarkdownMessage"),
  {
    ssr: false,
    loading: () => (
      <span className="inline-block h-4 w-48 animate-pulse rounded bg-[var(--app-surface)]" />
    ),
  }
);

const SUGGESTIONS = [
  {
    icon: Rocket,
    title: "Plan a launch",
    prompt: "Help me plan a focused product launch for a small team.",
  },
  {
    icon: Scale,
    title: "Compare options",
    prompt: "Have the society compare two approaches and recommend one with trade-offs.",
  },
  {
    icon: Lightbulb,
    title: "Challenge an idea",
    prompt: "Ask each agent to challenge my idea from their own perspective.",
  },
  {
    icon: Users,
    title: "Split the work",
    prompt: "Break this goal into specialist tasks and assign them to the right agents.",
  },
];

function TypingIndicator() {
  return (
    <div className="flex gap-1.5 py-2" aria-label="Agents are thinking">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--app-muted)]"
          style={{ animationDelay: `${dot * 120}ms` }}
        />
      ))}
    </div>
  );
}

function outputEntries(outputs) {
  if (Array.isArray(outputs)) {
    return outputs.map((output, index) => [
      output?.agentName || output?.agentId || `agent-${index + 1}`,
      output,
    ]);
  }
  return Object.entries(outputs || {});
}

function AgentOutputs({ outputs, messageKey, expanded, onToggle }) {
  const entries = outputEntries(outputs).filter(([, output]) => {
    return output?.content || output?.response || output?.error;
  });

  if (entries.length === 0) return null;

  return (
    <div className="mt-4 space-y-1.5">
      {entries.map(([name, output]) => {
        const key = `${messageKey}-${name}`;
        const isOpen = expanded.has(key);
        const content = output?.content || output?.response || "";
        const failed = output?.success === false || Boolean(output?.error);

        return (
          <div key={key} className="overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)]/50">
            <button
              type="button"
              onClick={() => onToggle(key)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[var(--app-muted)] transition hover:bg-[var(--app-surface)]"
            >
              {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              <Bot className="h-3.5 w-3.5" />
              <span className="min-w-0 flex-1 truncate font-medium text-[var(--app-text)]">{name}</span>
              {failed ? (
                <span className="text-[10px] text-[var(--app-danger)]">failed</span>
              ) : typeof output?.duration === "number" ? (
                <span className="text-[10px] text-[var(--app-faint)]">
                  {(output.duration / 1000).toFixed(1)}s
                </span>
              ) : null}
            </button>
            {isOpen && (
              <div className="border-t border-[var(--app-border)] px-3 py-2.5">
                {failed && (
                  <p className="mb-2 flex items-start gap-1.5 text-xs text-[var(--app-danger)]">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {output.error || "This agent did not return a response."}
                  </p>
                )}
                {content && <MarkdownMessage content={content} compact />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MessageList({
  messages,
  loading,
  messagesLoading,
  agents,
  agentsLoading = false,
  provider,
  scrollRef,
  bottomRef,
  onSuggestion,
}) {
  const [expanded, setExpanded] = useState(() => new Set());
  const [copiedKey, setCopiedKey] = useState(null);
  const copiedTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const toggleExpanded = (key) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const copyMessage = async (key, content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedKey(key);
      if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = window.setTimeout(() => {
        copiedTimerRef.current = null;
        setCopiedKey(null);
      }, 1500);
    } catch {
      setCopiedKey(null);
    }
  };

  const isEmpty = messages.length === 0 && !loading && !messagesLoading;
  const noAgents = !agentsLoading && agents.length === 0;
  const noProvider = !agentsLoading && !provider;

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      {messagesLoading ? (
        <div className="flex h-full items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--app-border-strong)] border-t-[var(--app-accent)]" />
        </div>
      ) : isEmpty ? (
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center px-5 py-10 sm:px-6">
          <div className="mb-8 text-center">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-accent)]">
              <Sparkles className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              What can your society work on?
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--app-muted)]">
              {agentsLoading
                ? "Loading your agent society..."
                : noAgents
                  ? "Your society has no agents yet."
                  : `${agents.length} agent${agents.length === 1 ? "" : "s"} ready to collaborate. Ask a question or start with a prompt.`}
            </p>
          </div>

          {noAgents && (
            <div className="mx-auto mb-6 flex items-center gap-2 rounded-xl border border-[var(--app-warning)]/30 bg-[var(--app-warning)]/10 px-4 py-3 text-sm text-[var(--app-warning)]">
              <Users className="h-4 w-4" />
              No agents available yet
            </div>
          )}

          {noProvider && (
            <div className="mx-auto mb-6 flex items-center gap-2 rounded-xl border border-[var(--app-warning)]/30 bg-[var(--app-warning)]/10 px-4 py-3 text-sm text-[var(--app-warning)]">
              <AlertCircle className="h-4 w-4" />
              No active provider configured
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            {SUGGESTIONS.map(({ icon: Icon, title, prompt }) => (
              <button
                key={title}
                type="button"
                onClick={() => onSuggestion(prompt)}
                className="group rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3.5 text-left transition hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-hover)]"
              >
                <span className="flex items-center gap-2 text-xs font-semibold text-[var(--app-text)]">
                  <Icon className="h-3.5 w-3.5 text-[var(--app-accent)]" />
                  {title}
                </span>
                <span className="mt-1.5 block text-xs leading-5 text-[var(--app-muted)]">{prompt}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="space-y-6" aria-live="polite">
            {messages.map((message, index) => {
              const messageKey = message.id || `message-${index}`;
              const isUser = message.role === "user";
              const isError = message.isError || message.role === "error";

              if (isUser) {
                return (
                  <div key={messageKey} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[var(--app-user-bubble)] px-4 py-2.5 text-sm leading-6 text-[var(--app-text)] sm:max-w-[75%]">
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                  </div>
                );
              }

              const outputs = message.metadata?.agentOutputs || message.agentOutputs;
              const totalAgents = outputEntries(outputs).length;
              const showOutputs = totalAgents > 0;

              return (
                <div key={messageKey} className="group flex gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                      isError
                        ? "bg-[var(--app-danger)]/10 text-[var(--app-danger)]"
                        : "bg-[var(--app-accent)] text-white"
                    )}
                  >
                    {isError ? <AlertCircle className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </span>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--app-text)]">
                        {isError ? "Agent Society error" : "Agent Society"}
                      </span>
                      {!isError && totalAgents > 0 && (
                        <span className="rounded-md bg-[var(--app-surface)] px-1.5 py-0.5 text-[10px] text-[var(--app-faint)]">
                          {totalAgents} agent{totalAgents === 1 ? "" : "s"}
                        </span>
                      )}
                      {!isError && (
                        <button
                          type="button"
                          onClick={() => copyMessage(messageKey, message.content || "")}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--app-faint)] opacity-0 transition hover:bg-[var(--app-surface)] hover:text-[var(--app-text)] group-hover:opacity-100 focus:opacity-100"
                          aria-label="Copy response"
                          title="Copy response"
                        >
                          {copiedKey === messageKey ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {isError ? (
                      <p className="text-sm leading-6 text-[var(--app-danger)]">{message.content}</p>
                    ) : (
                      <MarkdownMessage content={message.content} />
                    )}

                    {showOutputs && (
                      <AgentOutputs
                        outputs={outputs}
                        messageKey={messageKey}
                        expanded={expanded}
                        onToggle={toggleExpanded}
                      />
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--app-accent)] text-white">
                  <Bot className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs font-semibold">Agent Society</p>
                  <TypingIndicator />
                </div>
              </div>
            )}
          </div>
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}

export default memo(MessageList);
