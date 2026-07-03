"use client";

import { useMemo, useState } from "react";

const agentRoster = [
	{
		name: "CEO Agent",
		role: "Orchestrator",
		summary: "Owns the plan, routes tasks, resolves conflicts, and finalizes the recommendation.",
		accent: "from-cyan-400 to-blue-500",
	},
	{
		name: "Market Research Agent",
		role: "Demand scout",
		summary: "Checks customer demand, competitors, and market gaps.",
		accent: "from-emerald-400 to-teal-500",
	},
	{
		name: "Product Manager Agent",
		role: "MVP planner",
		summary: "Converts the idea into a product scope, roadmap, and feature priorities.",
		accent: "from-amber-400 to-orange-500",
	},
	{
		name: "Financial Analyst Agent",
		role: "Viability check",
		summary: "Estimates costs, revenue, runway, and basic financial risk.",
		accent: "from-violet-400 to-fuchsia-500",
	},
	{
		name: "Marketing Agent",
		role: "Go-to-market",
		summary: "Defines positioningI want to build an AI startup, launch channels, and messaging.",
		accent: "from-rose-400 to-pink-500",
	},
	{
		name: "Investor Agent",
		role: "Funding lens",
		summary: "Evaluates the startup for funding appeal, upside, and risk.",
		accent: "from-slate-300 to-slate-500",
	},
];

const workflowSteps = [
	"User submits an idea.",
	"CEO Agent creates a plan and assigns specialist tasks.",
	"Specialist agents return structured findings.",
	"CEO Agent merges the outputs into one decision package.",
	"CEO Agent asks follow-up questions or produces the startup plan.",
];

function buildCouncilResponse(input) {
	const normalized = input.toLowerCase();
	const isAiStartup = normalized.includes("ai startup") || normalized.includes("build an ai startup and Business");

	return {
		ceo: isAiStartup
			? "This is a high-potential idea, but the CEO Agent should first validate the target customer, narrow the problem, and define a small MVP before execution."
			: "The CEO Agent should route the idea through research, product, finance, marketing, and investor review before locking the plan.",
		market: isAiStartup
			? [
					"Strong demand exists in AI tools, but the market is crowded.",
					"Best chance is a narrow use case with a clear workflow pain point.",
					"The CEO should validate one buyer persona before scaling.",
				]
			: [
					"Identify the exact customer segment first.",
					"Compare the idea against direct and indirect competitors.",
					"Validate that the market is large enough to justify the build.",
				],
		product: isAiStartup
			? [
					"Build one wedge product instead of a broad AI platform.",
					"Start with a single workflow that saves time or money.",
					"Ship an MVP with one core use case and one success metric.",
				]
			: [
					"Define the smallest version of the product.",
					"List the core user journey and one north-star metric.",
					"Separate must-have features from later enhancements.",
				],
		finance: isAiStartup
			? [
					"Keep initial burn low by using a narrow MVP and simple stack.",
					"Track compute cost, tooling cost, and acquisition cost early.",
					"Revenue should come from a specific business pain, not generic AI usage.",
				]
			: [
					"Estimate build cost, runway, and break-even point.",
					"Check whether early revenue can cover operating expenses.",
					"Flag any expensive dependencies before launch.",
				],
		marketing: isAiStartup
			? [
					"Position the product around the result, not the model.",
					"Lead with a clear pain point and a fast proof of value.",
					"Use founder-led content and direct outreach for the first users.",
				]
			: [
					"Choose one clear positioning statement.",
					"Match channels to the buyer type.",
					"Build a launch narrative before spending on growth.",
				],
		investor: isAiStartup
			? [
					"Investability improves if the startup owns a specific workflow or data advantage.",
					"Generic AI wrappers are weak pitches.",
					"A strong team, clear wedge, and early traction make the story fundable.",
				]
			: [
					"Show a defendable wedge and a believable growth path.",
					"Explain why this team can win.",
					"Make traction and market size easy to understand.",
				],
	};
}

function Pill({ children }) {
	return (
		<span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
			{children}
		</span>
	);
}

function SectionCard({ title, children, className = "" }) {
	return (
		<section className={`rounded-3xl border border-white/10 bg-white/6 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur ${className}`}>
			<h2 className="text-lg font-semibold text-white">{title}</h2>
			<div className="mt-4">{children}</div>
		</section>
	);
}

export default function AgentSocietyClient() {
	const [idea, setIdea] = useState("I want to build an AI Business planing and startup");
	const [submittedIdea, setSubmittedIdea] = useState("I want to build an AI Business planing and startup");

	const council = useMemo(() => buildCouncilResponse(submittedIdea), [submittedIdea]);

	const handleRunCouncil = () => {
		const trimmed = idea.trim();
		setSubmittedIdea(trimmed.length ? trimmed : "I want to build an AI Business planing and startup");
	};

	return (
		<main className="min-h-screen overflow-hidden bg-[#07111f] text-white">
			<div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(244,114,182,0.14),_transparent_28%),linear-gradient(180deg,_#0b1526_0%,_#07111f_100%)]" />
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
				<header className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_20px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl">
					<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
						<div className="max-w-3xl">
							<div className="flex flex-wrap gap-2">
								<Pill>CEO Agent Society</Pill>
	
								<Pill>Multi-agent orchestration</Pill>
							</div>
							<h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
								A simple agent system for business and startup planning.
							</h1>
							<p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
								The CEO Agent sits at the center. Specialist agents do the analysis, return structured findings, and the CEO merges everything into one decision.
							</p>
						</div>

						<div className="grid gap-3 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-50">
							<div className="font-semibold uppercase tracking-[0.25em] text-cyan-200/80">Controller</div>
							<div>CEO Agent owns task routing, conflict resolution, and final synthesis.</div>
						</div>
					</div>
				</header>

				<section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
					<SectionCard title="Try the council">
						<p className="text-sm leading-7 text-white/70">
							Enter an idea and run the council. The page simulates how the CEO Agent delegates work and combines the outputs.
						</p>
						<div className="mt-5 space-y-3">
							<label className="block text-sm font-medium text-white/80" htmlFor="idea">
								Business idea
							</label>
							<textarea
								id="idea"
								value={idea}
								onChange={(event) => setIdea(event.target.value)}
								rows={4}
								className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
								placeholder="Example: I want to build an buJsiness planing and startup"
							/>
						</div>
						<div className="mt-4 flex flex-wrap gap-3">
							<button
								type="button"
								onClick={handleRunCouncil}
								className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
							>
								Run CEO Council
							</button>
							<button
								type="button"
								onClick={() => setIdea("I want to build an AI startup")}
								className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-white/80 transition hover:border-white/25 hover:bg-white/5"
							>
								Reset example
							</button>
						</div>
					</SectionCard>

					<SectionCard title="CEO summary">
						<div className="space-y-4">
							<div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
								<div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">CEO decision</div>
								<p className="mt-2 text-sm leading-7 text-white/85">{council.ceo}</p>
							</div>
							<div className="grid gap-3 sm:grid-cols-2">
								<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
									<div className="text-xs uppercase tracking-[0.2em] text-white/45">Communication</div>
									<p className="mt-2 text-sm leading-6 text-white/75">Only the CEO Agent talks to specialist agents. Specialists do not coordinate directly.</p>
								</div>
								<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
									<div className="text-xs uppercase tracking-[0.2em] text-white/45">Data flow</div>
									<p className="mt-2 text-sm leading-6 text-white/75">Input, assumptions, agent outputs, and final synthesis move through one shared state object.</p>
								</div>
							</div>
						</div>
					</SectionCard>
				</section>

				<section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
					{agentRoster.map((agent) => (
						<article key={agent.name} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
							<div className={`h-1.5 w-20 rounded-full bg-gradient-to-r ${agent.accent}`} />
							<div className="mt-4 flex items-center justify-between gap-3">
								<h3 className="text-base font-semibold text-white">{agent.name}</h3>
								<span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/50">
									{agent.role}
								</span>
							</div>
							<p className="mt-3 text-sm leading-6 text-white/70">{agent.summary}</p>
						</article>
					))}
				</section>

				<section className="grid gap-8 xl:grid-cols-2">
					<SectionCard title="How data flows between agents">
						<div className="space-y-3">
							{workflowSteps.map((step, index) => (
								<div key={step} className="flex gap-4 rounded-2xl border border-white/10 bg-black/15 p-4">
									<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white/80">
										{index + 1}
									</div>
									<p className="text-sm leading-6 text-white/75">{step}</p>
								</div>
							))}
						</div>
					</SectionCard>

					<SectionCard title="Example workflow: I want to build an AI startup">
						<div className="space-y-4">
							<WorkflowBlock title="Market Research Agent" items={council.market} tone="emerald" />
							<WorkflowBlock title="Product Manager Agent" items={council.product} tone="amber" />
							<WorkflowBlock title="Financial Analyst Agent" items={council.finance} tone="violet" />
							<WorkflowBlock title="Marketing Agent" items={council.marketing} tone="rose" />
							<WorkflowBlock title="Investor Agent" items={council.investor} tone="slate" />
						</div>
					</SectionCard>
			</section>

			<section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
				<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<div>
						<h2 className="text-lg font-semibold text-white">How the CEO Agent controls everything</h2>
						<p className="mt-2 max-w-3xl text-sm leading-7 text-white/70">
							The CEO Agent decides which specialist to call, whether tasks run in parallel, how to merge conflicting answers, and when enough information exists to move forward.
						</p>
					</div>
					<div className="text-sm text-white/60">Current input: {submittedIdea}</div>
				</div>
			</section>
		</div>
	</main>
	);
}

function WorkflowBlock({ title, items, tone }) {
	const toneClasses =
		tone === "emerald"
			? "border-emerald-400/20 bg-emerald-400/10 text-emerald-50"
			: tone === "amber"
				? "border-amber-400/20 bg-amber-400/10 text-amber-50"
				: tone === "violet"
					? "border-violet-400/20 bg-violet-400/10 text-violet-50"
					: tone === "rose"
						? "border-rose-400/20 bg-rose-400/10 text-rose-50"
						: "border-slate-400/20 bg-slate-400/10 text-slate-50";

	return (
		<div className={`rounded-2xl border p-4 ${toneClasses}`}>
			<div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">{title}</div>
			<ul className="mt-3 space-y-2 text-sm leading-6 text-white/85">
				{items.map((item) => (
					<li key={item} className="flex gap-3">
						<span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80" />
						<span>{item}</span>
					</li>
				))}
			</ul>
		</div>
	);
}