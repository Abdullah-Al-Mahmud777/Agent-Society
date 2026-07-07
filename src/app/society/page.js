"use client";

import { useState, useEffect } from "react";
import { Send, Loader2, User, Bot, Sparkles, Check, AlertCircle, Settings, Menu, X, Home, Users, Cog } from "lucide-react";
import { useAgentBuilderStore } from "@/store/agent-builder-store";
import { getActiveProvider } from "@/lib/provider-storage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Input";
import { cn } from "@/components/ui/cn";
import Link from "next/link";

export default function SocietyPage() {
    const [mounted, setMounted] = useState(false);
    const [agents, setAgents] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [prompt, setPrompt] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [providerConfig, setProviderConfig] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
        
        // Rehydrate store
        useAgentBuilderStore.persist.rehydrate();
        
        // Get agents after hydration
        const unsubscribe = useAgentBuilderStore.subscribe((state) => {
            setAgents(state.agents);
        });
        
        // Initial load
        const state = useAgentBuilderStore.getState();
        setAgents(state.agents);
        
        // Load active provider
        try {
            const activeProvider = getActiveProvider();
            setProviderConfig(activeProvider);
        } catch (err) {
            console.error("Failed to load provider:", err);
        }
        
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (mounted && agents.length > 0 && !selectedAgent) {
            const enabledAgent = agents.find((a) => a.isEnabled) || agents[0];
            setSelectedAgent(enabledAgent);
        }
    }, [mounted, agents, selectedAgent]);

    const handleSend = async () => {
        if (!prompt.trim() || loading || !selectedAgent) return;

        // Note: Even if providerConfig is null, send to API
        // API route has environment variable fallback for production

        const userMessage = {
            role: "user",
            content: prompt.trim(),
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setPrompt("");
        setLoading(true);

        try {
            const response = await fetch("/api/agent-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: userMessage.content,
                    agent: selectedAgent,
                    providerConfig: providerConfig, // Can be null - API will use env vars
                }),
            });

            const data = await response.json();

            if (data.success) {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content: data.response,
                        agent: data.agentName,
                        provider: data.provider,
                        model: data.model,
                        timestamp: data.timestamp,
                    },
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "error",
                        content: data.error || "Failed to get response",
                        timestamp: new Date().toISOString(),
                    },
                ]);
            }
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "error",
                    content: error.message || "Network error",
                    timestamp: new Date().toISOString(),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleAgentChange = (agent) => {
        setSelectedAgent(agent);
        setMessages([]);
    };

    const enabledAgents = agents.filter((a) => a.isEnabled);

    return (
        <main className="relative flex min-h-screen w-full max-w-full flex-col overflow-x-hidden bg-navy-900 text-ink">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.14),_transparent_28%),linear-gradient(180deg,_#0b1526_0%,_#07111f_100%)]" />

            {/* Mobile Header */}
            <header className="sticky top-0 z-50 border-b border-glass-border/50 bg-navy-900/95 backdrop-blur-sm md:hidden">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="flex h-11 w-11 items-center justify-center rounded-lg bg-glass hover:bg-glass-strong transition-colors"
                            aria-label="Open menu"
                        >
                            <Menu className="h-5 w-5 text-ink" />
                        </button>
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-cyan-400" />
                            <h1 className="text-base font-semibold text-ink">Agent Society</h1>
                        </div>
                    </div>
                    <Link href="/providers">
                        <button
                            className="flex h-11 w-11 items-center justify-center rounded-lg bg-glass hover:bg-glass-strong transition-colors"
                            aria-label="Settings"
                        >
                            <Cog className="h-5 w-5 text-ink" />
                        </button>
                    </Link>
                </div>
            </header>

            {/* Mobile Menu Drawer */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-navy-900/95 backdrop-blur-md border-r border-glass-border">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-glass-border/50 bg-navy-900/95 px-4 py-3">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-cyan-400" />
                                <h2 className="text-base font-semibold text-ink">Menu</h2>
                            </div>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-glass transition-colors"
                                aria-label="Close menu"
                            >
                                <X className="h-5 w-5 text-ink" />
                            </button>
                        </div>

                        {/* Navigation Links */}
                        <div className="p-4 space-y-2">
                            <Link href="/" className="block">
                                <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left hover:bg-glass transition-colors">
                                    <Home className="h-5 w-5 text-ink-subtle" />
                                    <span className="text-sm text-ink">Home</span>
                                </button>
                            </Link>
                            <Link href="/society" className="block">
                                <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left bg-cyan-400/10 text-cyan-400">
                                    <Users className="h-5 w-5" />
                                    <span className="text-sm font-medium">Agent Society</span>
                                </button>
                            </Link>
                            <Link href="/builder" className="block">
                                <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left hover:bg-glass transition-colors">
                                    <Sparkles className="h-5 w-5 text-ink-subtle" />
                                    <span className="text-sm text-ink">Agent Builder</span>
                                </button>
                            </Link>
                            <Link href="/providers" className="block">
                                <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left hover:bg-glass transition-colors">
                                    <Cog className="h-5 w-5 text-ink-subtle" />
                                    <span className="text-sm text-ink">Providers</span>
                                </button>
                            </Link>
                        </div>

                        {/* Provider Status Card */}
                        <div className="px-4 pb-4">
                            {!providerConfig ? (
                                <Card variant="default" className="border-amber-400/30 bg-amber-400/10 p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 shrink-0 text-amber-300" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-amber-200">
                                                No Provider Configured
                                            </p>
                                            <p className="mt-1 text-xs text-amber-200/70">
                                                Configure an LLM provider to enable full features.
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            ) : (
                                <Card variant="default" className="border-emerald-400/30 bg-emerald-400/10 p-4">
                                    <div className="flex items-start gap-3">
                                        <Check className="h-5 w-5 shrink-0 text-emerald-300" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-emerald-200">
                                                Provider Active
                                            </p>
                                            <p className="mt-1 text-xs text-emerald-200/70">
                                                {providerConfig.providerName} • {providerConfig.selectedModel}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </div>

                        {/* Agent Selection */}
                        <div className="px-4 pb-4">
                            <Card variant="strong" className="p-4">
                                <div className="mb-3 flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-cyan-400" />
                                    <h3 className="text-sm font-semibold text-ink">Select Agent</h3>
                                </div>
                                
                                {enabledAgents.length === 0 ? (
                                    <div className="rounded-card border border-dashed border-glass-border p-3 text-center">
                                        {!mounted ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                                                <p className="text-xs text-ink-faint">Loading agents...</p>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-ink-faint">
                                                No enabled agents. Go to Builder to create and enable agents.
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {enabledAgents.map((agent) => {
                                            const isSelected = selectedAgent?.id === agent.id;
                                            return (
                                                <button
                                                    key={agent.id}
                                                    onClick={() => {
                                                        handleAgentChange(agent);
                                                        setMobileMenuOpen(false);
                                                    }}
                                                    className={cn(
                                                        "w-full rounded-card border p-3 text-left transition-all",
                                                        isSelected
                                                            ? "border-cyan-400/50 bg-cyan-400/10"
                                                            : "border-glass-border bg-glass hover:border-glass-border-strong hover:bg-glass-strong"
                                                    )}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base"
                                                                style={{
                                                                    backgroundColor: `${agent.color}22`,
                                                                    color: agent.color,
                                                                }}
                                                            >
                                                                {agent.icon}
                                                            </span>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="truncate text-sm font-semibold text-ink">
                                                                        {agent.name}
                                                                    </span>
                                                                </div>
                                                                <p className="truncate text-xs text-ink-muted">
                                                                    {agent.role}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {isSelected && (
                                                            <Check className="h-4 w-4 shrink-0 text-cyan-400" />
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* Selected Agent Details */}
                        {selectedAgent && (
                            <div className="px-4 pb-4">
                                <Card variant="default" className="p-4">
                                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                                        Selected Agent
                                    </div>
                                    <div
                                        className="mb-3 h-1 w-full rounded-full"
                                        style={{ backgroundColor: selectedAgent.color }}
                                    />
                                    <h3 className="text-sm font-semibold text-ink">{selectedAgent.name}</h3>
                                    <p className="mt-1 text-xs text-ink-muted">{selectedAgent.description}</p>
                                    <div className="mt-3 space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-ink-faint">Role:</span>
                                            <Badge tone="neutral">{selectedAgent.role}</Badge>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-ink-faint">Provider:</span>
                                            <Badge tone="cyan">{selectedAgent.aiProvider}</Badge>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-ink-faint">Model:</span>
                                            <span className="text-ink-subtle">{selectedAgent.model}</span>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Desktop Header */}
            <header className="hidden md:block">
                <div className="mx-auto max-w-7xl px-5 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-ink">Agent Society</h1>
                            <p className="mt-1 text-sm text-ink-muted">
                                Chat with your custom agents. Select an agent and start the conversation.
                            </p>
                        </div>
                        <Badge tone="cyan" uppercase>
                            <Sparkles className="h-3 w-3" />
                            AI Powered
                        </Badge>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-4 md:px-5 md:py-8">
                {/* Desktop Sidebar */}
                <div className="hidden md:flex w-80 flex-shrink-0 flex-col space-y-4 overflow-y-auto">
                    {/* Provider Status Card */}
                    {!providerConfig ? (
                        <Card variant="default" className="border-amber-400/30 bg-amber-400/10 p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 shrink-0 text-amber-300" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-amber-200">
                                        No Provider Configured
                                    </p>
                                    <p className="mt-1 text-xs text-amber-200/70">
                                        Configure an LLM provider to enable full features.
                                    </p>
                                    <Link href="/providers">
                                        <Button variant="secondary" size="sm" className="mt-3 w-full">
                                            <Settings className="h-3.5 w-3.5" />
                                            Configure Provider
                                        </Button>
                                    </Link>
                                    <p className="mt-2 text-xs text-amber-100/60">
                                        Using fallback (environment variables)
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <Card variant="default" className="border-emerald-400/30 bg-emerald-400/10 p-4">
                            <div className="flex items-start gap-3">
                                <Check className="h-5 w-5 shrink-0 text-emerald-300" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-emerald-200">
                                        Provider Active
                                    </p>
                                    <p className="mt-1 text-xs text-emerald-200/70">
                                        {providerConfig.providerName} • {providerConfig.selectedModel}
                                    </p>
                                    <Link href="/providers">
                                        <Button variant="secondary" size="sm" className="mt-3 w-full">
                                            <Settings className="h-3.5 w-3.5" />
                                            Manage Providers
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    )}

                    <Card variant="strong" className="p-5">
                        <div className="mb-4 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-cyan-400" />
                            <h2 className="text-lg font-semibold text-ink">Select Agent</h2>
                        </div>
                        
                        {enabledAgents.length === 0 ? (
                            <div className="rounded-card border border-dashed border-glass-border p-4 text-center">
                                {!mounted ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                                        <p className="text-sm text-ink-faint">Loading agents...</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-ink-faint">
                                        No enabled agents. Go to Builder to create and enable agents.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {enabledAgents.map((agent) => {
                                    const isSelected = selectedAgent?.id === agent.id;
                                    return (
                                        <button
                                            key={agent.id}
                                            onClick={() => handleAgentChange(agent)}
                                            className={cn(
                                                "w-full rounded-card border p-3 text-left transition-all",
                                                isSelected
                                                    ? "border-cyan-400/50 bg-cyan-400/10"
                                                    : "border-glass-border bg-glass hover:border-glass-border-strong hover:bg-glass-strong"
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base"
                                                        style={{
                                                            backgroundColor: `${agent.color}22`,
                                                            color: agent.color,
                                                        }}
                                                    >
                                                        {agent.icon}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="truncate text-sm font-semibold text-ink">
                                                                {agent.name}
                                                            </span>
                                                        </div>
                                                        <p className="truncate text-xs text-ink-muted">
                                                            {agent.role}
                                                        </p>
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <Check className="h-4 w-4 shrink-0 text-cyan-400" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </Card>

                    {selectedAgent && (
                        <Card variant="default" className="p-4">
                            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                                Selected Agent
                            </div>
                            <div
                                className="mb-3 h-1 w-full rounded-full"
                                style={{ backgroundColor: selectedAgent.color }}
                            />
                            <h3 className="text-base font-semibold text-ink">{selectedAgent.name}</h3>
                            <p className="mt-1 text-xs text-ink-muted">{selectedAgent.description}</p>
                            <div className="mt-3 space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-ink-faint">Role:</span>
                                    <Badge tone="neutral">{selectedAgent.role}</Badge>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-ink-faint">Provider:</span>
                                    <Badge tone="cyan">{selectedAgent.aiProvider}</Badge>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-ink-faint">Model:</span>
                                    <span className="text-ink-subtle">{selectedAgent.model}</span>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Main Chat Area - Responsive */}
                <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
                    {/* Mobile Agent Selector */}
                    <div className="mb-3 md:hidden">
                        {selectedAgent ? (
                            <Card variant="default" className="p-3">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setMobileMenuOpen(true)}
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-glass hover:bg-glass-strong transition-colors"
                                    >
                                        <Menu className="h-5 w-5 text-ink" />
                                    </button>
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
                                            style={{
                                                backgroundColor: `${selectedAgent.color}22`,
                                                color: selectedAgent.color,
                                            }}
                                        >
                                            {selectedAgent.icon}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-sm font-semibold text-ink truncate">{selectedAgent.name}</h3>
                                            <p className="text-xs text-ink-muted truncate">{selectedAgent.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            <Card variant="default" className="p-3">
                                <button
                                    onClick={() => setMobileMenuOpen(true)}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-glass transition-colors"
                                >
                                    <Menu className="h-5 w-5 text-ink-subtle" />
                                    <span className="text-sm text-ink">Select an agent</span>
                                </button>
                            </Card>
                        )}
                    </div>

                    {/* Messages */}
                    <Card variant="default" className="mb-3 md:mb-4 flex-1 overflow-y-auto p-4 md:p-5">
                        {messages.length === 0 ? (
                            <div className="flex h-full items-center justify-center">
                                <div className="text-center px-4">
                                    <Bot className="mx-auto h-12 w-12 md:h-16 md:w-16 text-cyan-400/40" />
                                    <p className="mt-3 md:mt-4 text-sm text-ink-faint">
                                        {selectedAgent
                                            ? `Start chatting with ${selectedAgent.name}`
                                            : "Select an agent to start chatting"}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 md:space-y-4">
                                {messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex gap-2 md:gap-3",
                                            msg.role === "user" ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        {msg.role !== "user" && (
                                            <div
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                                style={{
                                                    backgroundColor: `${selectedAgent?.color || "#22c55e"}22`,
                                                }}
                                            >
                                                <span style={{ color: selectedAgent?.color || "#22c55e" }}>
                                                    {selectedAgent?.icon || "🤖"}
                                                </span>
                                            </div>
                                        )}

                                        <div
                                            className={cn(
                                                "max-w-[85%] md:max-w-[75%] rounded-2xl px-3 py-2 md:px-4 md:py-3",
                                                msg.role === "user"
                                                    ? "bg-cyan-400/15 text-ink"
                                                    : msg.role === "error"
                                                    ? "border border-rose-400/30 bg-rose-400/10 text-rose-200"
                                                    : "border border-glass-border bg-glass text-ink"
                                            )}
                                        >
                                            <div className="mb-1 flex items-center gap-2 text-xs text-ink-faint">
                                                {msg.role === "user" ? "You" : msg.agent || "Agent"}
                                                <span>•</span>
                                                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                                {msg.content}
                                            </div>
                                        </div>

                                        {msg.role === "user" && (
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-glass">
                                                <User className="h-4 w-4 text-ink-subtle" />
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex gap-2 md:gap-3">
                                        <div
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                            style={{
                                                backgroundColor: `${selectedAgent?.color || "#22c55e"}22`,
                                            }}
                                        >
                                            <span style={{ color: selectedAgent?.color || "#22c55e" }}>
                                                {selectedAgent?.icon || "🤖"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-2xl border border-glass-border bg-glass px-3 py-2 md:px-4 md:py-3 text-sm text-ink-muted">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {selectedAgent?.name} is thinking...
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Input Area */}
                    <Card variant="strong" className="p-3 md:p-4">
                        <div className="flex gap-2 md:gap-3">
                            <Textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder={
                                    selectedAgent
                                        ? `Ask ${selectedAgent.name} anything...`
                                        : "Select an agent first..."
                                }
                                rows={2}
                                disabled={loading || !selectedAgent}
                                className="flex-1 text-sm"
                            />
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleSend}
                                disabled={!prompt.trim() || loading || !selectedAgent}
                                className="self-end h-11 w-11 md:h-auto md:w-auto md:px-4"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Send className="h-5 w-5" />
                                )}
                            </Button>
                        </div>
                        {selectedAgent && (
                            <p className="mt-2 text-xs text-ink-faint hidden md:block">
                                Chatting with {selectedAgent.name} • Press Enter to send, Shift+Enter for new line
                            </p>
                        )}
                    </Card>
                </div>
            </div>
        </main>
    );
}
