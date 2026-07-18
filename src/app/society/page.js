"use client";

import { useState, useEffect } from "react";
import { Send, Loader2, User, Bot, Sparkles, Check, AlertCircle, Settings, Menu, X, Home, Users, Cog, Plus, Trash2 } from "lucide-react";
import { useAgentBuilderStore } from "@/store/agent-builder-store";
import { getActiveProvider } from "@/lib/provider-storage";
import { AgentMemory } from "@/lib/agent-memory";
import agentDatabase from "@/lib/agent-database";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Textarea, InputGroup, Label } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/Loading";
import { cn } from "@/components/ui/cn";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function SocietyPage() {
    const [mounted, setMounted] = useState(false);
    const [agents, setAgents] = useState([]);
    const [selectedAgents, setSelectedAgents] = useState([]);
    const [prompt, setPrompt] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [providerConfig, setProviderConfig] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [executionStrategy, setExecutionStrategy] = useState("parallel");
    const [agentMemory] = useState(() => new AgentMemory());
    const [expandedMessageIds, setExpandedMessageIds] = useState(new Set());

    const toggleMessageExpanded = (index) => {
        const next = new Set(expandedMessageIds);
        if (next.has(index)) {
            next.delete(index);
        } else {
            next.add(index);
        }
        setExpandedMessageIds(next);
    };

    useEffect(() => {
        setMounted(true);
        
        // Rehydrate store
        useAgentBuilderStore.persist.rehydrate();
        
        // Get agents after hydration
        const unsubscribe = useAgentBuilderStore.subscribe((state) => {
            setAgents(state.agents);
            // Also sync with database
            agentDatabase.initializeFromStore(state.agents);
        });
        
        // Initial load
        const state = useAgentBuilderStore.getState();
        setAgents(state.agents);
        
        // Initialize database with existing agents
        agentDatabase.initializeFromStore(state.agents);
        
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
        if (mounted && agents.length > 0 && selectedAgents.length === 0) {
            const enabledAgents = agents.filter((a) => a.isEnabled);
            if (enabledAgents.length > 0) {
                setSelectedAgents(enabledAgents.slice(0, 3)); // Select first 3 enabled agents by default
            } else if (agents.length > 0) {
                setSelectedAgents([agents[0]]); // Select first agent if no enabled ones
            }
        }
    }, [mounted, agents, selectedAgents]);

    const handleAgentToggle = (agent) => {
        setSelectedAgents((prev) => {
            const isSelected = prev.some((a) => a.id === agent.id);
            if (isSelected) {
                return prev.filter((a) => a.id !== agent.id);
            } else {
                return [...prev, agent];
            }
        });
    };

    const handleSend = async () => {
        if (!prompt.trim() || loading) return;

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
            // Build global context from previous messages
            const globalContext = messages
                .map(msg => `${msg.role === 'user' ? 'User' : 'Agent'}: ${msg.content}`)
                .join('\n');

            // Collect agent memories for all agents
            const agentMemories = {};
            agents.forEach(agent => {
                agentMemories[agent.id] = agentMemory.getAgentMemory(agent.id);
            });

            // Get API key from providerConfig if available
            let apiKey = null;
            let encryptedApiKey = null;
            if (providerConfig?.encryptedApiKey) {
                encryptedApiKey = providerConfig.encryptedApiKey;
            }

            const response = await fetch("/api/orchestrator/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userRequest: userMessage.content,
                    agents: agents, // All available agents
                    selectedAgents: selectedAgents, // User-selected agents
                    globalContext,
                    executionStrategy,
                    apiKey,
                    encryptedApiKey,
                    agentMemories,
                }),
            });

            console.log("Response status:", response.status);
            console.log("Response headers:", Object.fromEntries(response.headers.entries()));

            // Check if response is JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                console.error("Non-JSON response received:", text.substring(0, 500));
                throw new Error(`Server returned non-JSON response (status: ${response.status}). Please check the server logs.`);
            }

            const data = await response.json();

            if (data.success) {
                // Save conversation and execution history to each relevant agent's private memory
                data.relevantAgents.forEach(({ id }) => {
                    // Add user request to conversation history
                    agentMemory.addConversationEntry(id, {
                        role: "user",
                        content: userMessage.content,
                    });

                    // Find agent output
                    const agentOutput = data.agentOutputs.find(o => o.agentId === id);
                    if (agentOutput) {
                        // Save execution entry
                        agentMemory.addExecutionEntry(id, {
                            userRequest: userMessage.content,
                            globalContext: globalContext,
                            success: agentOutput.success,
                            output: agentOutput.content,
                            error: agentOutput.error,
                            executionStrategy: executionStrategy,
                        });

                        if (agentOutput.success) {
                            // Add response to conversation history
                            agentMemory.addConversationEntry(id, {
                                role: "assistant",
                                content: agentOutput.content,
                            });
                        }
                    }
                });

                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content: data.finalResponse,
                        agentOutputs: data.agentOutputs,
                        relevantAgents: data.relevantAgents,
                        timestamp: new Date().toISOString(),
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
                            <h1 className="text-3xl font-bold text-white">Agent Society</h1>
                            <p className="mt-2 text-base text-neutral-400">
                                Chat with your custom agents. Select multiple agents and start the conversation.
                            </p>
                        </div>
                        <Badge variant="primary" size="lg">
                            <Sparkles className="h-4 w-4 mr-1.5" />
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
                        <Card variant="outlined" className="border-warning-500/30 bg-warning-500/10 p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 shrink-0 text-warning-400" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-warning-200">
                                        No Provider Configured
                                    </p>
                                    <p className="mt-1 text-xs text-warning-200/70">
                                        Configure an LLM provider to enable full features.
                                    </p>
                                    <Link href="/providers">
                                        <Button variant="secondary" size="sm" className="mt-3 w-full">
                                            <Settings className="h-3.5 w-3.5" />
                                            Configure Provider
                                        </Button>
                                    </Link>
                                    <p className="mt-2 text-xs text-warning-100/60">
                                        Using fallback (environment variables)
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <Card variant="outlined" className="border-success-500/30 bg-success-500/10 p-4">
                            <div className="flex items-start gap-3">
                                <Check className="h-5 w-5 shrink-0 text-success-400" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-success-200">
                                        Provider Active
                                    </p>
                                    <p className="mt-1 text-xs text-success-200/70">
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

                    <Card variant="default" className="p-5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary-400" />
                                Select Agents
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {enabledAgents.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-neutral-700 p-4 text-center">
                                    {!mounted ? (
                                        <LoadingState message="Loading agents..." />
                                    ) : (
                                        <p className="text-sm text-neutral-500">
                                            No enabled agents. Go to Builder to create and enable agents.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {enabledAgents.map((agent) => {
                                        const isSelected = selectedAgents.some((a) => a.id === agent.id);
                                        return (
                                            <button
                                                key={agent.id}
                                                onClick={() => handleAgentToggle(agent)}
                                                className={cn(
                                                    "w-full rounded-lg border p-3 text-left transition-all",
                                                    isSelected
                                                        ? "border-primary-500/50 bg-primary-500/10"
                                                        : "border-neutral-700 bg-neutral-800/50 hover:border-neutral-600 hover:bg-neutral-800"
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
                                                            <span className="truncate text-sm font-semibold text-white">
                                                                {agent.name}
                                                            </span>
                                                        </div>
                                                        <p className="truncate text-xs text-neutral-400">
                                                            {agent.role}
                                                        </p>
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <Check className="h-4 w-4 shrink-0 text-primary-400" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        </CardContent>
                    </Card>

                    {selectedAgents.length > 0 && (
                        <Card variant="default" className="p-4">
                            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                                Selected Agents ({selectedAgents.length})
                            </div>
                            <div className="space-y-2">
                                {selectedAgents.map((agent) => (
                                    <div key={agent.id} className="flex items-center gap-2 p-2 rounded-lg bg-neutral-800">
                                        <span
                                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-sm"
                                            style={{
                                                backgroundColor: `${agent.color}22`,
                                                color: agent.color,
                                            }}
                                        >
                                            {agent.icon}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <span className="text-sm font-semibold text-white truncate block">
                                                {agent.name}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleAgentToggle(agent)}
                                            className="text-neutral-500 hover:text-error-400 transition-colors"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Main Chat Area - Responsive */}
                <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
                    {/* Mobile Agent Selector */}
                    <div className="mb-3 md:hidden">
                        {selectedAgents.length > 0 ? (
                            <Card variant="default" className="p-3">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setMobileMenuOpen(true)}
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-glass hover:bg-glass-strong transition-colors"
                                    >
                                        <Menu className="h-5 w-5 text-ink" />
                                    </button>
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="flex -space-x-2">
                                            {selectedAgents.slice(0, 3).map((agent) => (
                                                <span
                                                    key={agent.id}
                                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg border-2 border-[#0a1628]"
                                                    style={{
                                                        backgroundColor: `${agent.color}22`,
                                                        color: agent.color,
                                                    }}
                                                >
                                                    {agent.icon}
                                                </span>
                                            ))}
                                            {selectedAgents.length > 3 && (
                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg bg-glass border-2 border-[#0a1628] text-ink-subtle">
                                                    +{selectedAgents.length - 3}
                                                </span>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-sm font-semibold text-ink truncate">
                                                {selectedAgents.length} agent{selectedAgents.length !== 1 ? 's' : ''} selected
                                            </h3>
                                            <p className="text-xs text-ink-muted truncate">
                                                {selectedAgents.map(a => a.name).join(', ')}
                                            </p>
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
                                    <span className="text-sm text-ink">Select agents</span>
                                </button>
                            </Card>
                        )}
                    </div>

                    {/* Messages */}
                    <Card variant="default" className="mb-3 md:mb-4 flex-1 overflow-y-auto p-4 md:p-5">
                        {messages.length === 0 ? (
                            <div className="flex h-full items-center justify-center">
                                <div className="text-center px-4">
                                    <Bot className="mx-auto h-12 w-12 md:h-16 md:w-16 text-primary-400/40" />
                                    <p className="mt-3 md:mt-4 text-sm text-neutral-500">
                                        Start chatting with your agent society!
                                    </p>
                                    <p className="mt-2 text-xs text-neutral-600">
                                        Create agents in Builder, then use @AgentName to mention specific ones!
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
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/10">
                                                <Sparkles className="h-4 w-4 text-primary-400" />
                                            </div>
                                        )}

                                        <div
                                            className={cn(
                                                "max-w-[85%] md:max-w-[75%] rounded-2xl px-3 py-2 md:px-4 md:py-3",
                                                msg.role === "user"
                                                    ? "bg-primary-500/15 text-white"
                                                    : msg.role === "error"
                                                    ? "border border-error-500/30 bg-error-500/10 text-error-200"
                                                    : "border border-neutral-700 bg-neutral-800/50 text-white"
                                            )}
                                        >
                                            <div className="mb-1 flex items-center gap-2 text-xs text-neutral-500">
                                                {msg.role === "user" ? "You" : "Orchestrator"}
                                                <span>•</span>
                                                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        h1: ({node, ...props}) => <h1 className="text-lg font-bold text-white mt-4 mb-2" {...props} />,
                                                        h2: ({node, ...props}) => <h2 className="text-base font-semibold text-white mt-3 mb-2" {...props} />,
                                                        h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-white mt-2 mb-1" {...props} />,
                                                        p: ({node, ...props}) => <p className="my-2 text-neutral-300" {...props} />,
                                                        strong: ({node, ...props}) => <strong className="font-semibold text-primary-400" {...props} />,
                                                        em: ({node, ...props}) => <em className="italic text-neutral-400" {...props} />,
                                                        code: ({node, inline, ...props}) => 
                                                            inline 
                                                                ? <code className="bg-neutral-800 text-primary-400 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
                                                                : <code className="block bg-neutral-800 text-primary-300 p-3 rounded-lg text-xs font-mono overflow-x-auto my-2" {...props} />,
                                                        pre: ({node, ...props}) => <pre className="bg-neutral-800 p-3 rounded-lg overflow-x-auto my-2" {...props} />,
                                                        ul: ({node, ...props}) => <ul className="list-disc list-inside my-2 space-y-1" {...props} />,
                                                        ol: ({node, ...props}) => <ol className="list-decimal list-inside my-2 space-y-1" {...props} />,
                                                        li: ({node, ...props}) => <li className="text-neutral-400" {...props} />,
                                                        blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-primary-500/30 pl-3 my-2 italic text-neutral-400" {...props} />,
                                                        a: ({node, ...props}) => <a className="text-primary-400 hover:text-primary-300 underline" {...props} />,
                                                        hr: ({node, ...props}) => <hr className="border-neutral-700 my-3" {...props} />,
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                            {msg.agentOutputs && msg.agentOutputs.length > 0 && (
                                                <div className="mt-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleMessageExpanded(i)}
                                                        className="flex items-center gap-1 text-[10px] text-primary-400 hover:text-primary-300 transition-colors"
                                                    >
                                                        {expandedMessageIds.has(i) ? '▼' : '▶'}
                                                        {expandedMessageIds.has(i) ? 'Hide agent outputs' : 'Show agent outputs'}
                                                    </button>
                                                    {expandedMessageIds.has(i) && (
                                                        <div className="mt-2 space-y-2">
                                                            {msg.agentOutputs.map((output, j) => (
                                                                <div
                                                                    key={j}
                                                                    className="rounded-xl border border-neutral-700 bg-neutral-800/50 p-2"
                                                                >
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-xs font-semibold text-white">
                                                                            {output.agentName}
                                                                        </span>
                                                                        {!output.success && (
                                                                            <span className="text-[10px] text-error-400">
                                                                                (Failed)
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {output.success ? (
                                                                        <div className="prose prose-invert prose-xs max-w-none text-xs text-neutral-400">
                                                                            <ReactMarkdown
                                                                                remarkPlugins={[remarkGfm]}
                                                                                components={{
                                                                                    h1: ({node, ...props}) => <h1 className="text-sm font-bold text-white mt-2 mb-1" {...props} />,
                                                                                    h2: ({node, ...props}) => <h2 className="text-xs font-semibold text-white mt-2 mb-1" {...props} />,
                                                                                    p: ({node, ...props}) => <p className="my-1 text-neutral-400" {...props} />,
                                                                                    strong: ({node, ...props}) => <strong className="font-semibold text-primary-400" {...props} />,
                                                                                    code: ({node, inline, ...props}) => 
                                                                                        inline 
                                                                                            ? <code className="bg-neutral-800 text-primary-400 px-1 py-0.5 rounded text-[10px] font-mono" {...props} />
                                                                                            : <code className="block bg-neutral-800 text-primary-300 p-2 rounded text-[10px] font-mono overflow-x-auto my-1" {...props} />,
                                                                                    pre: ({node, ...props}) => <pre className="bg-neutral-800 p-2 rounded overflow-x-auto my-1" {...props} />,
                                                                                    ul: ({node, ...props}) => <ul className="list-disc list-inside my-1 space-y-0.5" {...props} />,
                                                                                    ol: ({node, ...props}) => <ol className="list-decimal list-inside my-1 space-y-0.5" {...props} />,
                                                                                }}
                                                                            >
                                                                                {output.content}
                                                                            </ReactMarkdown>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-xs text-error-300">
                                                                            {output.error}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {msg.relevantAgents && msg.relevantAgents.length > 0 && (
                                                <div className="mt-2 text-[10px] text-neutral-600">
                                                    Agents used: {msg.relevantAgents.map(a => a.name).join(", ")}
                                                </div>
                                            )}
                                        </div>

                                        {msg.role === "user" && (
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-800">
                                                <User className="h-4 w-4 text-neutral-400" />
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex gap-2 md:gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/10">
                                            <Sparkles className="h-4 w-4 text-primary-400" />
                                        </div>
                                        <div className="flex items-center gap-2 rounded-2xl border border-neutral-700 bg-neutral-800/50 px-3 py-2 md:px-4 md:py-3 text-sm text-neutral-400">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Orchestrator is coordinating agents...
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Execution Strategy */}
                    <Card variant="default" className="p-3 md:p-4 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-neutral-500">Execution Strategy</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setExecutionStrategy("parallel")}
                                className={cn(
                                    "flex-1 rounded-lg border px-3 py-2 text-xs transition-all",
                                    executionStrategy === "parallel"
                                        ? "border-primary-500/50 bg-primary-500/10 text-primary-400"
                                        : "border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800 text-neutral-400"
                                )}
                            >
                                Parallel
                            </button>
                            <button
                                onClick={() => setExecutionStrategy("sequential")}
                                className={cn(
                                    "flex-1 rounded-lg border px-3 py-2 text-xs transition-all",
                                    executionStrategy === "sequential"
                                        ? "border-primary-500/50 bg-primary-500/10 text-primary-400"
                                        : "border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800 text-neutral-400"
                                )}
                            >
                                Sequential
                            </button>
                        </div>
                    </Card>

                    {/* Input Area */}
                    <Card variant="default" className="p-3 md:p-4">
                        <div className="flex gap-2 md:gap-3">
                            <Textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Ask your agents anything... (e.g., @AgentName for specific agent)"
                                rows={2}
                                disabled={loading}
                                className="flex-1 text-sm"
                            />
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleSend}
                                disabled={!prompt.trim() || loading}
                                className="self-end h-11 w-11 md:h-auto md:w-auto md:px-4"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Send className="h-5 w-5" />
                                )}
                            </Button>
                        </div>
                        <p className="mt-2 text-xs text-neutral-600 hidden md:block">
                            Use @AgentName to mention a specific agent • Press Enter to send, Shift+Enter for new line
                        </p>
                    </Card>
                </div>
            </div>
        </main>
    );
}
