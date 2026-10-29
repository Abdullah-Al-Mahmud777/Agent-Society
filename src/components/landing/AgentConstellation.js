const NODES = [
    { icon: "👑", label: "CEO", color: "#22c55e", x: 50, y: 18 },
    { icon: "📈", label: "Research", color: "#0ea5e9", x: 84, y: 42 },
    { icon: "🎯", label: "Product", color: "#f59e0b", x: 72, y: 82 },
    { icon: "💰", label: "Finance", color: "#a855f7", x: 28, y: 82 },
    { icon: "📣", label: "Marketing", color: "#f43f5e", x: 16, y: 42 },
];

const EDGES = [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [1, 2], [2, 3], [3, 4], [4, 1],
];

export default function AgentConstellation() {
    return (
        <div className="relative mx-auto aspect-square w-full max-w-md">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-40 w-40 rounded-full bg-brand-cyan/20 blur-3xl" />
            </div>

            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
                <defs>
                    <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.5" />
                    </linearGradient>
                </defs>
                {EDGES.map(([a, b], index) => (
                    <line
                        key={`${a}-${b}`}
                        x1={NODES[a].x}
                        y1={NODES[a].y}
                        x2={NODES[b].x}
                        y2={NODES[b].y}
                        stroke="url(#edge)"
                        strokeWidth="0.4"
                        className="animate-constellation-line"
                        style={{ animationDelay: `${300 + index * 80}ms` }}
                    />
                ))}
            </svg>

            {NODES.map((node, index) => (
                <div
                    key={node.label}
                    className="animate-constellation-node absolute -translate-x-1/2 -translate-y-1/2"
                    style={{
                        left: `${node.x}%`,
                        top: `${node.y}%`,
                        animationDelay: `${200 + index * 100}ms`,
                    }}
                >
                    <div
                        className="animate-constellation-float flex flex-col items-center gap-1.5"
                        style={{
                            animationDuration: `${4 + index}s`,
                            animationDelay: `${index * 250}ms`,
                        }}
                    >
                        <div
                            className="flex h-14 w-14 items-center justify-center rounded-2xl border text-2xl"
                            style={{
                                backgroundColor: `${node.color}1f`,
                                borderColor: `${node.color}55`,
                                boxShadow: `0 0 24px ${node.color}33`,
                            }}
                        >
                            {node.icon}
                        </div>
                        <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-ink-subtle">
                            {node.label}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
