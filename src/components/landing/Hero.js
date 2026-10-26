import Link from "next/link";
import { ArrowRight, Wrench, Brain, Network, History } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import AgentConstellation from "./AgentConstellation";

const PILLARS = [
    {
        icon: Brain,
        title: "Distinct personalities",
        body: "Each agent has its own risk appetite, reasoning style, values, and voice — so no two see a problem the same way.",
    },
    {
        icon: History,
        title: "Long-term memory",
        body: "Agents remember past debates and conclusions, referencing their own experience as the society evolves.",
    },
    {
        icon: Network,
        title: "Real debate",
        body: "Agents respond to each other, challenge conclusions, and change their minds — then an orchestrator synthesizes.",
    },
];

export default function Hero() {
    return (
        <main className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.15),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.14),_transparent_30%),radial-gradient(circle_at_bottom,_rgba(244,114,182,0.08),_transparent_40%),linear-gradient(180deg,_#09090b_0%,_#0a0a0b_100%)]" />

            <div className="mx-auto w-full max-w-7xl px-5 pt-16 sm:px-8 lg:px-10">
                <section className="grid items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
                    <div>
                        <div className="animate-fade-up">
                            <Badge tone="cyan" uppercase>Multi-agent orchestration</Badge>
                        </div>

                        <h1 className="animate-fade-up mt-6 text-5xl font-semibold leading-[1.05] tracking-tight text-white [animation-delay:80ms] sm:text-6xl lg:text-7xl">
                            A society of AI agents that{" "}
                            <span className="bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 bg-clip-text text-transparent">
                                debate and decide.
                            </span>
                        </h1>

                        <p className="animate-fade-up mt-6 max-w-xl text-base leading-8 text-neutral-400 [animation-delay:160ms] sm:text-lg">
                            Not isolated chatbots — distinct individuals with personality, expertise, and
                            long-term memory. They collaborate, challenge one another, and reason toward
                            conclusions like a team of human experts.
                        </p>

                        <div className="animate-fade-up mt-9 flex flex-wrap gap-3 [animation-delay:240ms]">
                            <Link
                                href="/society"
                                className="group inline-flex items-center justify-center gap-2 rounded-pill bg-white px-6 py-3 text-sm font-semibold text-navy-900 shadow-[0_8px_30px_rgba(34,211,238,0.15)] transition-colors hover:bg-cyan-200"
                            >
                                Enter the Society
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                            <Link
                                href="/builder"
                                className="inline-flex items-center justify-center gap-2 rounded-pill border border-glass-border px-6 py-3 text-sm font-medium text-ink-muted transition-colors hover:border-glass-border-strong hover:bg-glass hover:text-ink"
                            >
                                <Wrench className="h-4 w-4" />
                                Build agents
                            </Link>
                        </div>
                    </div>

                    <div className="animate-scale-in">
                        <AgentConstellation />
                    </div>
                </section>

                <section className="grid gap-5 pb-24 md:grid-cols-3">
                    {PILLARS.map((pillar, index) => {
                        const Icon = pillar.icon;
                        return (
                            <div
                                key={pillar.title}
                                className="animate-fade-up rounded-lg border border-neutral-700 bg-neutral-800/50 p-6"
                                style={{ animationDelay: `${300 + index * 80}ms` }}
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-700 bg-neutral-800">
                                    <Icon className="h-5 w-5 text-primary-400" />
                                </div>
                                <h3 className="mt-4 text-base font-semibold text-white">{pillar.title}</h3>
                                <p className="mt-2 text-sm leading-6 text-neutral-400">{pillar.body}</p>
                            </div>
                        );
                    })}
                </section>
            </div>
        </main>
    );
}
