"use client";

import { PROVIDER_LABELS, SPEAKING_STYLE_LABELS } from "@/lib/agent-builder-schema";
import { PROVIDER_INFO } from "@/lib/provider-catalog";

/**
 * Static, high-fidelity workflow preview for the agent draft.
 * Nodes are fixed (no drag/drop) but click through to Configure/Playground.
 */

const NODE = { strokeDefault: "stroke-[var(--app-border)]" };

function clip(value, max) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function Edge({ d }) {
  return (
    <g>
      <path
        d={d}
        fill="none"
        style={{ stroke: "var(--app-border-strong)" }}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d={d}
        fill="none"
        style={{ stroke: "var(--app-accent)" }}
        strokeWidth={2}
        strokeLinecap="round"
        className="wf-edge-flow"
      />
    </g>
  );
}

function Port({ x, y }) {
  return (
    <g>
      <circle cx={x} cy={y} r={7} style={{ fill: "var(--studio-dot)" }} />
      <circle
        cx={x}
        cy={y}
        r={3.5}
        style={{ fill: "var(--app-accent)", stroke: "var(--app-bg-elevated)" }}
        strokeWidth={1.5}
      />
    </g>
  );
}

function Node({
  x,
  y,
  w,
  h,
  icon,
  title,
  meta,
  meta2,
  core = false,
  hint = "Configure",
  onClick,
}) {
  return (
    <g
      className="wf-node"
      transform={`translate(${x} ${y})`}
      role="button"
      tabIndex={0}
      aria-label={`${title} node. ${hint}.`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
    >
      <rect
        className={`wf-node-card ${NODE.strokeDefault}`}
        width={w}
        height={h}
        rx={14}
        style={{ fill: "var(--app-surface)" }}
        strokeWidth={1}
      />
      {core && (
        <rect
          width={w}
          height={h}
          rx={14}
          style={{ fill: "var(--app-surface-hover)", stroke: "var(--app-border-strong)" }}
          strokeWidth={1.5}
        />
      )}
      <rect
        x={14}
        y={14}
        width={30}
        height={30}
        rx={9}
        style={{
          fill: "var(--app-accent)",
          fillOpacity: core ? 0.1 : 0.06,
          stroke: "var(--app-accent)",
          strokeOpacity: core ? 0.4 : 0.25,
        }}
        strokeWidth={1}
      />
      <text
        x={29}
        y={35}
        textAnchor="middle"
        fontSize={15}
        className="fill-[var(--app-text)]"
      >
        {icon}
      </text>
      <text
        x={56}
        y={core ? 34 : 30}
        fontSize={core ? 14.5 : 13}
        fontWeight={600}
        letterSpacing="0.01em"
        className="fill-[var(--app-text)]"
      >
        {title}
      </text>
      {meta && (
        <text
          x={14}
          y={core ? 66 : 58}
          fontSize={11}
          className="fill-[var(--app-muted)]"
        >
          {meta}
        </text>
      )}
      {meta2 && (
        <text
          x={14}
          y={core ? 86 : 76}
          fontSize={11}
          className="fill-[var(--app-faint)]"
        >
          {meta2}
        </text>
      )}
      <text
        x={w - 14}
        y={h - 12}
        textAnchor="end"
        fontSize={10}
        fontWeight={600}
        letterSpacing="0.14em"
        className="wf-node-hint fill-[var(--app-accent)]"
      >
        {hint.toUpperCase()} →
      </text>
    </g>
  );
}

export default function WorkflowCanvas({ agent, onOpen }) {
  const info = PROVIDER_INFO[agent.aiProvider];
  const providerLabel = PROVIDER_LABELS[agent.aiProvider] || agent.aiProvider;
  const capabilities = Array.isArray(agent.capabilities) ? agent.capabilities : [];
  const coreValues = Array.isArray(agent.coreValues) ? agent.coreValues : [];

  const openConfigure = () => onOpen?.("configure");
  const openPlayground = () => onOpen?.("playground");

  const toolMeta =
    capabilities.length > 0
      ? clip(capabilities.slice(0, 2).join(" · "), 30)
      : "No tools added yet";

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)]">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--app-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="wf-ping absolute inset-0 rounded-full bg-[var(--app-accent)]" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-[var(--app-accent)]" />
          </span>
          <h2 className="text-sm font-semibold tracking-tight">Workflow canvas</h2>
        </div>
        <p className="text-[11px] text-[var(--app-faint)]">
          Preview · click a node to edit it
        </p>
      </header>

      <div className="wf-canvas relative px-3 py-4 sm:px-5">
        <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-1.5">
          {["LLM Input", "Tools", "Actions"].map((label) => (
            <span
              key={label}
              className="rounded-full border border-[var(--app-accent)]/25 bg-[var(--studio-chip-bg)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--app-accent)] backdrop-blur"
            >
              {label}
            </span>
          ))}
        </div>

        <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <svg
          viewBox="0 0 820 540"
          className="h-auto w-full min-w-[620px]"
          role="img"
          aria-label="Agent workflow preview: system prompt, input and context feed the LLM core, which routes to tools, actions and output"
        >
          {/* edges */}
          <Edge d="M224 90 C 264 90, 262 226, 300 226" />
          <Edge d="M224 262 C 264 262, 262 262, 300 262" />
          <Edge d="M224 434 C 264 434, 262 298, 300 298" />
          <Edge d="M520 226 C 558 226, 556 134, 596 134" />
          <Edge d="M520 262 C 558 262, 558 282, 596 282" />
          <Edge d="M520 298 C 562 298, 558 404, 596 404" />
          <Edge d="M694 180 L 694 236" />
          <Edge d="M694 328 C 694 368, 650 452, 596 452" />

          {/* nodes */}
          <Node
            x={28}
            y={48}
            w={196}
            h={84}
            icon="🧩"
            title="System Prompt"
            meta={clip(agent.systemPrompt, 26) || "No prompt yet"}
            onClick={openConfigure}
          />
          <Node
            x={28}
            y={220}
            w={196}
            h={84}
            icon="💬"
            title="LLM Input"
            meta="Playground message"
            meta2={agent.isEnabled ? "Accepting input" : "Paused"}
            hint="Test"
            onClick={openPlayground}
          />
          <Node
            x={28}
            y={392}
            w={196}
            h={84}
            icon="🗄️"
            title="Context"
            meta={`${capabilities.length} capabilities · ${coreValues.length} values`}
            meta2={clip(agent.expertise, 26) || "General knowledge"}
            onClick={openConfigure}
          />
          <Node
            x={300}
            y={196}
            w={220}
            h={132}
            icon={info?.icon || "✨"}
            title="LLM Core"
            meta={`${providerLabel} · ${clip(agent.model, 20)}`}
            meta2={`temp ${Number(agent.temperature).toFixed(2)} · ${agent.maxTokens} tok`}
            core
            onClick={openConfigure}
          />
          <Node
            x={596}
            y={88}
            w={196}
            h={92}
            icon="🔧"
            title="Tools"
            meta={toolMeta}
            meta2={`${capabilities.length} linked`}
            onClick={openConfigure}
          />
          <Node
            x={596}
            y={236}
            w={196}
            h={92}
            icon="⚡"
            title="Actions"
            meta={`${SPEAKING_STYLE_LABELS[agent.speakingStyle] || agent.speakingStyle} reply`}
            meta2={agent.isEnabled ? "Enabled" : "Disabled"}
            onClick={openConfigure}
          />
          <Node
            x={596}
            y={384}
            w={196}
            h={92}
            icon="🎯"
            title="Output"
            meta="Reply → society chat"
            meta2={`max ${agent.maxTokens} tokens`}
            hint="Test"
            onClick={openPlayground}
          />

          {/* ports */}
          <Port x={224} y={90} />
          <Port x={224} y={262} />
          <Port x={224} y={434} />
          <Port x={300} y={226} />
          <Port x={300} y={262} />
          <Port x={300} y={298} />
          <Port x={520} y={226} />
          <Port x={520} y={262} />
          <Port x={520} y={298} />
          <Port x={596} y={134} />
          <Port x={694} y={180} />
          <Port x={694} y={236} />
          <Port x={596} y={282} />
          <Port x={694} y={328} />
          <Port x={596} y={404} />
          <Port x={596} y={452} />
        </svg>
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--app-border)] px-4 py-3 text-[11px] text-[var(--app-faint)]">
        <span>
          Static preview — node editing happens in the Configure tab.
        </span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-[var(--app-accent)]" />
            data flow
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--app-accent)]" />
            port
          </span>
        </span>
      </footer>
    </section>
  );
}
