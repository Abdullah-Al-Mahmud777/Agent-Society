"use client";

import { useState, useEffect } from "react";
import { Send, Loader2, User, Bot, Sparkles, Check } from "lucide-react";
import { useAgentBuilderStore } from "@/store/agent-builder-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Input";
import { cn } from "@/components/ui/cn";

export default function SocietyPage() {
    const [mounted, setMounted] = useState(false);
    const [hydrated, setHydrated] = useState(false);
    const [agents, setAgents] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [prompt, setPrompt] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Rehydrate store
        useAgentBuilderStore.persist.rehydrate();
        
        // Get agents after hydration
        const unsubscribe = useAgentBuilderStore.subscribe((state) => {
            setAgents(state.agents);
            setHydrated(true);
        });
        
        // Initial load
        setAgents(useAgentBuilderStore.getState().agents);
        setHydrated(true);
        
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (mounted && hydrated && agents.length > 0 && !selectedAgent) {
            const enabledAgent = agents.find((a) => a.isEnabled) || agents[0];
            setSelectedAgent(enabledAgent);
        }
    }, [mounted, hydrated, agents, selectedAgent]);

    const handleSend = async () => {
        if (!prompt.trim() || loading || !selectedAgent) return;

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

    if (!mounted || !hydrated) {
        return (
            <main className="relative min-h-screen overflow-hidden bg-navy-900 text-ink">
                <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.14),_transparent_28%),linear-gradient(180deg,_#0b1526_0%,_#07111f_100%)]" />
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                </div>
            </main>
        );
    }

    const enabledAgents = agents.filter((a) => a.isEnabled);

    return (
        <main className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-navy-900 text-ink">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.14),_transparent_28%),linear-gradient(180deg,_#0b1526_0%,_#07111f_100%)]" />

            <div className="mx-auto flex h-screen max-w-7xl gap-6 overflow-x-hidden px-5 py-8">
                {/* Sidebar - Agent Selection */}
                <div className="w-80 shrink-0 space-y-4">
                    <Card variant="strong" className="p-5">
                        <div className="mb-4 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-cyan-400" />
                            <h2 className="text-lg font-semibold text-ink">Select Agent</h2>
                        </div>
                        
                        {enabledAgents.length === 0 ? (
                            <div className="rounded-card border border-dashed border-glass-border p-4 text-center">
                                <p className="text-sm text-ink-faint">
                                    No enabled agents. Go to Builder to create and enable agents.
                                </p>
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

                {/* Main Chat Area */}
                <div className="flex flex-1 flex-col">
                    <Card variant="strong" className="mb-4 p-5">
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
                    </Card>

                    {/* Messages */}
                    <Card variant="default" className="mb-4 flex-1 overflow-y-auto p-5">
                        {messages.length === 0 ? (
                            <div className="flex h-full items-center justify-center">
                                <div className="text-center">
                                    <Bot className="mx-auto h-16 w-16 text-cyan-400/40" />
                                    <p className="mt-4 text-sm text-ink-faint">
                                        {selectedAgent
                                            ? `Start chatting with ${selectedAgent.name}`
                                            : "Select an agent to start chatting"}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex gap-3",
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
                                                "max-w-[75%] rounded-2xl px-4 py-3",
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
                                                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
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
                                    <div className="flex gap-3">
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
                                        <div className="flex items-center gap-2 rounded-2xl border border-glass-border bg-glass px-4 py-3 text-sm text-ink-muted">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {selectedAgent?.name} is thinking...
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Input Area */}
                    <Card variant="strong" className="p-4">
                        <div className="flex gap-3">
                            <Textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder={
                                    selectedAgent
                                        ? `Ask ${selectedAgent.name} anything... (Press Enter to send)`
                                        : "Select an agent first..."
                                }
                                rows={2}
                                disabled={loading || !selectedAgent}
                                className="flex-1"
                            />
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleSend}
                                disabled={!prompt.trim() || loading || !selectedAgent}
                                className="self-end"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Send className="h-5 w-5" />
                                )}
                            </Button>
                        </div>
                        {selectedAgent && (
                            <p className="mt-2 text-xs text-ink-faint">
                                Chatting with {selectedAgent.name} • Press Enter to send, Shift+Enter for new line
                            </p>
                        )}
                    </Card>
                </div>
            </div>
        </main>
    );
}
