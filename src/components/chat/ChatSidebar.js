"use client";

import { memo, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Check,
  LogOut,
  MessageSquarePlus,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Sun,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/components/ui/cn";
import { useTheme } from "@/components/theme/ThemeProvider";

function initials(name, email) {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function dateGroup(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Older";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((startOfToday - startOfDate) / 86400000);

  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days <= 7) return "Previous 7 days";
  return "Older";
}

function groupConversations(conversations) {
  const groups = new Map();
  for (const conversation of conversations) {
    const group = dateGroup(conversation.updatedAt || conversation.createdAt);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(conversation);
  }
  return [...groups.entries()];
}

function MiniAction({ label, children, onClick, href }) {
  const className =
    "flex h-10 w-10 items-center justify-center rounded-xl text-[var(--app-muted)] transition hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]";

  if (href) {
    return (
      <Link href={href} prefetch={false} title={label} aria-label={label} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function ChatSidebar({
  user,
  conversations,
  conversationsLoading,
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
  agents,
  selectedAgentIds,
  onToggleAgent,
  agentsLoading,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  onLogout,
}) {
  const { theme, toggleTheme } = useTheme();
  const [search, setSearch] = useState("");
  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const visible = query
      ? conversations.filter((conversation) =>
          String(conversation.title || "").toLowerCase().includes(query)
        )
      : conversations;
    return groupConversations(visible);
  }, [conversations, search]);
  const selectedCount = selectedAgentIds.length;

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full w-[280px] shrink-0 flex-col border-r border-[var(--app-border)] bg-[var(--app-sidebar)] text-[var(--app-text)] transition-[transform,width] duration-300 ease-out lg:static lg:z-auto lg:translate-x-0",
        collapsed ? "lg:w-[64px]" : "lg:w-[280px]",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}
      aria-label="Chat sidebar"
    >
      <div className={cn("flex items-center gap-2 px-3 py-3", collapsed ? "lg:justify-center" : "justify-between")}>
        <Link href="/society" prefetch={false} className="flex min-w-0 items-center gap-2.5 rounded-xl p-1">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--app-accent)] text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className={cn("min-w-0", collapsed && "lg:hidden")}>
            <span className="block truncate text-sm font-semibold">Agent Society</span>
            <span className="block truncate text-[10px] uppercase tracking-[0.18em] text-[var(--app-faint)]">
              Multi-agent chat
            </span>
          </span>
        </Link>

        <button
          type="button"
          onClick={onToggleCollapsed}
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--app-muted)] transition hover:bg-[var(--app-surface)] hover:text-[var(--app-text)] lg:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--app-muted)] transition hover:bg-[var(--app-surface)] hover:text-[var(--app-text)] lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className={cn("px-3", collapsed && "lg:hidden")}>
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] px-3 py-2.5 text-sm font-medium transition hover:bg-[var(--app-surface)]"
        >
          <span className="flex items-center gap-2.5">
            <MessageSquarePlus className="h-4 w-4" />
            New chat
          </span>
          <Plus className="h-4 w-4 text-[var(--app-faint)]" />
        </button>
      </div>

      <div className={cn("hidden px-3 pt-2", collapsed && "lg:block")}>
        <MiniAction label="New chat" onClick={onNewChat}>
          <MessageSquarePlus className="h-4 w-4" />
        </MiniAction>
      </div>

      <div className={cn("flex min-h-0 flex-1 flex-col px-3 pt-3", collapsed && "lg:hidden")}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-faint)]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search conversations"
            className="w-full rounded-xl border border-transparent bg-[var(--app-surface)] py-2 pl-9 pr-3 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-faint)] focus:border-[var(--app-border-strong)]"
            aria-label="Search conversations"
          />
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-3">
          {conversationsLoading ? (
            <div className="space-y-1.5" aria-label="Loading conversations">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-9 animate-pulse rounded-lg bg-[var(--app-surface)]" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs leading-5 text-[var(--app-faint)]">
              {search ? "No conversations match your search." : "Your conversations will appear here."}
            </p>
          ) : (
            <div className="space-y-4">
              {groups.map(([label, items]) => (
                <div key={label}>
                  <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--app-faint)]">
                    {label}
                  </p>
                  <div className="space-y-0.5">
                    {items.map((conversation) => {
                      const active = conversation.id === activeConversationId;
                      return (
                        <div
                          key={conversation.id}
                          className={cn(
                            "group flex items-center gap-1 rounded-lg transition",
                            active
                              ? "bg-[var(--app-surface)]"
                              : "hover:bg-[var(--app-surface)]"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => onSelectConversation(conversation.id)}
                            className="min-w-0 flex-1 truncate rounded-lg px-2.5 py-2 text-left text-sm text-[var(--app-text)]"
                            title={conversation.title}
                          >
                            {conversation.title || "New conversation"}
                          </button>
                          <div className="flex shrink-0 items-center pr-1 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100">
                            <button
                              type="button"
                              onClick={() => onRenameConversation(conversation)}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--app-faint)] hover:bg-[var(--app-bg)] hover:text-[var(--app-text)]"
                              aria-label={`Rename ${conversation.title}`}
                              title="Rename"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteConversation(conversation)}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--app-faint)] hover:bg-[var(--app-bg)] hover:text-[var(--app-danger)]"
                              aria-label={`Delete ${conversation.title}`}
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[var(--app-border)] pt-3">
          <div className="flex items-center justify-between px-2 pb-2">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--app-faint)]">
              <Bot className="h-3.5 w-3.5" />
              Agents
            </span>
            <span className="text-[10px] text-[var(--app-faint)]">
              {agentsLoading ? "..." : `${selectedCount}/${agents.length}`}
            </span>
          </div>

          <div className="max-h-44 space-y-0.5 overflow-y-auto overscroll-contain pr-0.5">
            {agentsLoading ? (
              <div className="space-y-1.5">
                {[0, 1].map((item) => (
                  <div key={item} className="h-10 animate-pulse rounded-lg bg-[var(--app-surface)]" />
                ))}
              </div>
            ) : agents.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg px-2.5 py-2.5 text-xs text-[var(--app-muted)]">
                <Plus className="h-3.5 w-3.5" />
                No agents yet
              </div>
            ) : (
              agents.map((agent) => {
                const selected = selectedAgentIds.includes(agent.id);
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => onToggleAgent(agent.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-[var(--app-surface)]"
                    title={`${agent.name} · ${agent.role}`}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm"
                      style={{
                        backgroundColor: `${agent.color || "#10a37f"}20`,
                        color: agent.color || "#10a37f",
                      }}
                    >
                      {agent.icon || "🤖"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium">{agent.name}</span>
                      <span className="block truncate text-[10px] text-[var(--app-faint)]">
                        {agent.role}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        selected
                          ? "border-[var(--app-accent)] bg-[var(--app-accent)] text-white"
                          : "border-[var(--app-border-strong)] text-transparent"
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className={cn("hidden flex-col items-center gap-1 px-2 py-2", collapsed && "lg:flex")}>
        <MiniAction label={theme === "dark" ? "Light mode" : "Dark mode"} onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </MiniAction>
        <MiniAction label="Log out" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
        </MiniAction>
      </div>

      <div className={cn("border-t border-[var(--app-border)] p-3", collapsed && "lg:hidden")}>
        <div className={cn("mb-2 space-y-0.5", collapsed && "lg:hidden")}>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-xs text-[var(--app-muted)] transition hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>

        <div className={cn("flex items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] p-2", collapsed && "lg:justify-center lg:border-0 lg:bg-transparent lg:p-0")}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--app-accent)] text-xs font-semibold text-white">
            {initials(user?.displayName, user?.email)}
          </span>
          <span className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>
            <span className="block truncate text-xs font-medium">{user?.displayName || "Account"}</span>
            <span className="block truncate text-[10px] text-[var(--app-faint)]">{user?.email}</span>
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--app-faint)] transition hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default memo(ChatSidebar);
