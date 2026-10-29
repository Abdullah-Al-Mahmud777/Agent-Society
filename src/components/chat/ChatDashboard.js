"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Loader2,
  Menu,
  MessageSquarePlus,
  Moon,
  Sun,
  X,
} from "lucide-react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatComposer from "@/components/chat/ChatComposer";
import MessageList from "@/components/chat/MessageList";
import { useSession } from "@/components/auth/SessionProvider";
import { useTheme } from "@/components/theme/ThemeProvider";
import { chatApi } from "@/lib/chat-client";
import { clearUserCaches } from "@/lib/client-cache";
import { cn } from "@/components/ui/cn";

const CONVERSATION_LIMIT = 100;

function DialogShell({ title, description, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/55 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg)] p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--app-text)]">{title}</h2>
            {description && (
              <p className="mt-1 text-xs leading-5 text-[var(--app-muted)]">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--app-faint)] transition hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ChatDashboard() {
  const user = useSession();
  const { theme, toggleTheme } = useTheme();
  const messagesScrollRef = useRef(null);
  const messagesBottomRef = useRef(null);
  const loadRequestRef = useRef(0);

  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [selectedAgentIds, setSelectedAgentIds] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  const [executionStrategy, setExecutionStrategy] = useState("parallel");
  const [suggestion, setSuggestion] = useState(null);
  const [composerResetToken, setComposerResetToken] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [focusToken, setFocusToken] = useState(0);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dialogError, setDialogError] = useState("");

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId
  );

  const selectedAgents = useMemo(
    () => agents.filter((agent) => selectedAgentIds.includes(agent.id)),
    [agents, selectedAgentIds]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await chatApi(
          `/api/workspace?conversationLimit=${CONVERSATION_LIMIT}`
        );

        if (cancelled) return;
        const nextAgents = data.agents || [];
        setAgents(nextAgents);
        setSelectedAgentIds(nextAgents.map((agent) => agent.id));
        setConversations(data.conversations || []);
        setProvider(data.provider || null);
      } catch (error) {
        if (!cancelled) setPageError(error.message);
      } finally {
        if (!cancelled) {
          setAgentsLoading(false);
          setConversationsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const container = messagesScrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, loading, messagesLoading]);

  useEffect(() => {
    if (!renameTarget && !deleteTarget) return;
    const handleKey = (event) => {
      if (event.key === "Escape") {
        setRenameTarget(null);
        setDeleteTarget(null);
        setDialogError("");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [renameTarget, deleteTarget]);

  const focusComposer = useCallback(() => {
    setFocusToken((current) => current + 1);
  }, []);

  const refreshConversations = useCallback(async () => {
    const data = await chatApi(`/api/db/conversations?limit=${CONVERSATION_LIMIT}`);
    setConversations(data.conversations || []);
  }, []);

  const handleNewChat = useCallback(() => {
    loadRequestRef.current += 1;
    setActiveConversationId(null);
    setMessages([]);
    setMessagesLoading(false);
    setComposerResetToken((current) => current + 1);
    setSuggestion(null);
    setPageError("");
    setNotice("");
    setMobileSidebarOpen(false);
    focusComposer();
  }, [focusComposer]);

  const handleSelectConversation = useCallback(async (conversationId) => {
    if (conversationId === activeConversationId && !messagesLoading) {
      setMobileSidebarOpen(false);
      return;
    }

    const requestId = loadRequestRef.current + 1;
    loadRequestRef.current = requestId;
    setActiveConversationId(conversationId);
    setMessages([]);
    setMessagesLoading(true);
    setPageError("");
    setNotice("");
    setMobileSidebarOpen(false);

    try {
      const data = await chatApi(
        `/api/db/conversations?id=${encodeURIComponent(conversationId)}`
      );
      if (loadRequestRef.current !== requestId) return;
      setMessages(data.messages || []);
    } catch (error) {
      if (loadRequestRef.current !== requestId) return;
      setPageError(error.message);
    } finally {
      if (loadRequestRef.current === requestId) setMessagesLoading(false);
    }
  }, [activeConversationId, messagesLoading]);

  const handleToggleAgent = useCallback((agentId) => {
    setSelectedAgentIds((current) =>
      current.includes(agentId)
        ? current.filter((id) => id !== agentId)
        : [...current, agentId]
    );
  }, []);

  const handleSuggestion = useCallback((text) => {
    setSuggestion({ text, token: Date.now() });
  }, []);

  const handleSend = useCallback((rawText) => {
    const text = String(rawText || "").trim();
    if (!text || loading) return false;

    if (agents.length === 0) {
      setPageError("Create an agent before sending a message.");
      return false;
    }

    if (selectedAgents.length === 0) {
      setPageError("Select at least one agent in the sidebar.");
      return false;
    }

    const userMessage = {
      id: `local-user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage]);
    setPageError("");
    setNotice("");
    setLoading(true);

    void (async () => {
    try {
      const data = await chatApi("/api/orchestrator/chat", {
        method: "POST",
        body: JSON.stringify({
          userRequest: text,
          agents: selectedAgents,
          selectedAgents: selectedAgents.map((agent) => agent.id),
          conversationId: activeConversationId,
          executionStrategy,
        }),
      });

      if (data.conversationId) setActiveConversationId(data.conversationId);

      if (data.persistence && data.persistence.ok === false) {
        setNotice("The reply was generated, but could not be saved to the database.");
      }

      const failed = data.success === false;
      const content =
        data.finalResponse ||
        (failed ? data.error || "The agents could not complete this request." : "");

      setMessages((current) => [
        ...current,
        {
          id: `local-assistant-${Date.now()}`,
          role: failed && !data.finalResponse ? "error" : "assistant",
          content,
          isError: failed && !data.finalResponse,
          metadata: {
            agentOutputs: data.agentOutputs || [],
            relevantAgents: data.relevantAgents || [],
          },
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `local-error-${Date.now()}`,
          role: "error",
          content: error.message,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
      void refreshConversations().catch(() => {});
    }
    })();

    return true;
  }, [
    activeConversationId,
    agents.length,
    executionStrategy,
    loading,
    refreshConversations,
    selectedAgents,
  ]);

  const openRename = useCallback((conversation) => {
    setDialogError("");
    setRenameTarget(conversation);
    setRenameValue(conversation.title || "");
  }, []);

  const submitRename = async () => {
    const title = renameValue.trim();
    if (!title || !renameTarget || renameLoading) return;

    setRenameLoading(true);
    setDialogError("");
    try {
      const data = await chatApi("/api/db/conversations", {
        method: "PUT",
        body: JSON.stringify({ id: renameTarget.id, title }),
      });
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === renameTarget.id
            ? { ...conversation, ...data.conversation, title }
            : conversation
        )
      );
      setRenameTarget(null);
    } catch (error) {
      setDialogError(error.message);
    } finally {
      setRenameLoading(false);
    }
  };

  const openDelete = useCallback((conversation) => {
    setDialogError("");
    setDeleteTarget(conversation);
  }, []);

  const submitDelete = async () => {
    if (!deleteTarget || deleteLoading) return;

    setDeleteLoading(true);
    setDialogError("");
    try {
      await chatApi(`/api/db/conversations?id=${encodeURIComponent(deleteTarget.id)}`, {
        method: "DELETE",
      });
      setConversations((current) =>
        current.filter((conversation) => conversation.id !== deleteTarget.id)
      );
      if (activeConversationId === deleteTarget.id) {
        loadRequestRef.current += 1;
        setActiveConversationId(null);
        setMessages([]);
        setMessagesLoading(false);
      }
      setDeleteTarget(null);
    } catch (error) {
      setDialogError(error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleLogout = useCallback(async () => {
    try {
      await chatApi("/api/auth/logout", { method: "POST" });
    } catch {
      // Clear local state even if the server session is already gone.
    } finally {
      clearUserCaches();
      window.location.assign("/login");
    }
  }, []);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((current) => !current);
  }, []);
  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-[var(--app-bg)] text-[var(--app-text)]">
      {mobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <ChatSidebar
        user={user}
        conversations={conversations}
        conversationsLoading={conversationsLoading}
        activeConversationId={activeConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onRenameConversation={openRename}
        onDeleteConversation={openDelete}
        agents={agents}
        selectedAgentIds={selectedAgentIds}
        onToggleAgent={handleToggleAgent}
        agentsLoading={agentsLoading}
        provider={provider}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={toggleSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={closeMobileSidebar}
        onLogout={handleLogout}
      />

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--app-border)] bg-[var(--app-bg)]/90 px-3 backdrop-blur sm:px-5">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--app-muted)] transition hover:bg-[var(--app-surface)] hover:text-[var(--app-text)] lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold">
              {activeConversation?.title || "New chat"}
            </h1>
            <p className="truncate text-[10px] text-[var(--app-faint)]">
              {agentsLoading
                ? "Loading agents..."
                : `${selectedAgents.length} of ${agents.length} agents selected`}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "hidden max-w-[240px] items-center gap-1.5 truncate rounded-lg border px-2.5 py-1.5 text-[11px] sm:flex",
                provider
                  ? "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-muted)]"
                  : "border-[var(--app-warning)]/30 bg-[var(--app-warning)]/10 text-[var(--app-warning)]"
              )}
              title={provider ? `${provider.providerName} · ${provider.selectedModel}` : "No active provider"}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--app-accent)]" />
              <span className="truncate">
                {provider ? provider.selectedModel : "No provider"}
              </span>
            </span>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--app-muted)] transition hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={handleNewChat}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--app-muted)] transition hover:bg-[var(--app-surface)] hover:text-[var(--app-text)] lg:hidden"
              aria-label="New chat"
            >
              <MessageSquarePlus className="h-4 w-4" />
            </button>
          </div>
        </header>

        {pageError && (
          <div className="flex items-start gap-2 border-b border-[var(--app-danger)]/20 bg-[var(--app-danger)]/10 px-4 py-2.5 text-xs text-[var(--app-danger)]">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p className="flex-1">{pageError}</p>
            <button
              type="button"
              onClick={() => setPageError("")}
              className="flex h-5 w-5 items-center justify-center rounded text-[var(--app-danger)]/70 hover:bg-[var(--app-danger)]/10 hover:text-[var(--app-danger)]"
              aria-label="Dismiss error"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {notice && (
          <div className="flex items-start gap-2 border-b border-[var(--app-warning)]/20 bg-[var(--app-warning)]/10 px-4 py-2.5 text-xs text-[var(--app-warning)]">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p className="flex-1">{notice}</p>
            <button
              type="button"
              onClick={() => setNotice("")}
              className="flex h-5 w-5 items-center justify-center rounded text-[var(--app-warning)]/70 hover:bg-[var(--app-warning)]/10 hover:text-[var(--app-warning)]"
              aria-label="Dismiss notice"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <MessageList
          messages={messages}
          loading={loading}
          messagesLoading={messagesLoading}
          agents={agents}
          agentsLoading={agentsLoading}
          provider={provider}
          scrollRef={messagesScrollRef}
          bottomRef={messagesBottomRef}
          onSuggestion={handleSuggestion}
        />

        <div className="shrink-0 bg-gradient-to-t from-[var(--app-bg)] via-[var(--app-bg)] to-transparent">
          <ChatComposer
            key={`${composerResetToken}:${suggestion?.token || 0}`}
            onSend={handleSend}
            loading={loading}
            agents={agents}
            selectedAgentIds={selectedAgentIds}
            executionStrategy={executionStrategy}
            onExecutionStrategyChange={setExecutionStrategy}
            focusToken={focusToken}
            initialPrompt={suggestion?.text || ""}
          />
        </div>
      </main>

      {renameTarget && (
        <DialogShell
          title="Rename conversation"
          description="Give this conversation a short, recognizable name."
          onClose={() => {
            setRenameTarget(null);
            setDialogError("");
          }}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submitRename();
            }}
          >
            <input
              autoFocus
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              maxLength={120}
              className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-input)] px-3.5 py-2.5 text-sm text-[var(--app-text)] outline-none focus:border-[var(--app-accent)]"
              aria-label="Conversation title"
            />
            {dialogError && (
              <p className="mt-2 text-xs text-[var(--app-danger)]">{dialogError}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                className="rounded-xl border border-[var(--app-border)] px-3.5 py-2 text-xs font-medium text-[var(--app-muted)] transition hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!renameValue.trim() || renameLoading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--app-accent)] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[var(--app-accent-hover)] disabled:opacity-50"
              >
                {renameLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Save
              </button>
            </div>
          </form>
        </DialogShell>
      )}

      {deleteTarget && (
        <DialogShell
          title="Delete conversation"
          description="This removes the conversation and its messages. This action cannot be undone."
          onClose={() => {
            setDeleteTarget(null);
            setDialogError("");
          }}
        >
          <p className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)]">
            {deleteTarget.title || "New conversation"}
          </p>
          {dialogError && (
            <p className="mt-2 text-xs text-[var(--app-danger)]">{dialogError}</p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl border border-[var(--app-border)] px-3.5 py-2 text-xs font-medium text-[var(--app-muted)] transition hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void submitDelete()}
              disabled={deleteLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--app-danger)] px-3.5 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {deleteLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Delete
            </button>
          </div>
        </DialogShell>
      )}
    </div>
  );
}
