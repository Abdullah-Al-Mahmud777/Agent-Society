"use client";

/**
 * Example Integration of Output System
 * This component demonstrates how to integrate the output system
 * into your agent application
 */

import { useState } from "react";
import OutputToolbar from "@/components/output/OutputToolbar";
import { useAgentBuilderStore } from "@/store/agent-builder-store";

export default function AgentOutputExample() {
	const agents = useAgentBuilderStore((state) => state.agents);
	const [showStats, setShowStats] = useState(false);

	return (
		<div className="space-y-4">
			{/* Output Toolbar */}
			<OutputToolbar agents={agents} />

			{/* Optional: Stats Display */}
			{showStats && (
				<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
					<div className="text-sm text-white/70">
						<h3 className="mb-3 font-semibold text-white">Export Statistics</h3>
						<div className="grid grid-cols-3 gap-4">
							<div>
								<div className="text-2xl font-bold text-cyan-400">{agents.length}</div>
								<div className="text-xs text-white/50">Total Agents</div>
							</div>
							<div>
								<div className="text-2xl font-bold text-green-400">{agents.filter((a) => a.isEnabled).length}</div>
								<div className="text-xs text-white/50">Enabled</div>
							</div>
							<div>
								<div className="text-2xl font-bold text-rose-400">{agents.filter((a) => !a.isEnabled).length}</div>
								<div className="text-xs text-white/50">Disabled</div>
							</div>
						</div>
					</div>
				</div>
			)}

			<button
				onClick={() => setShowStats(!showStats)}
				className="text-xs text-white/50 transition hover:text-white/70"
			>
				{showStats ? "Hide" : "Show"} Export Statistics
			</button>
		</div>
	);
}

/**
 * INTEGRATION CHECKLIST
 *
 * 1. Install dependencies (if needed):
 *    npm install zustand
 *
 * 2. Import the OutputToolbar component:
 *    import OutputToolbar from "@/components/output/OutputToolbar";
 *
 * 3. Add to your component:
 *    <OutputToolbar agents={yourAgentsArray} />
 *
 * 4. Ensure your agent objects have these properties:
 *    - id: string (unique identifier)
 *    - name: string
 *    - role: string
 *    - description: string
 *    - icon: string (emoji)
 *    - color: string (hex color)
 *    - isEnabled: boolean
 *    - aiProvider: string
 *    - model: string
 *    - temperature: number
 *    - systemPrompt?: string
 *    - exampleInput?: string
 *    - exampleOutput?: string
 *    - createdAt?: string (ISO date)
 *    - updatedAt?: string (ISO date)
 *
 * 5. Optional: Use the content editor store directly:
 *    import { useContentEditorStore } from "@/store/content-editor-store";
 *    const content = useContentEditorStore((state) => state.getContent());
 *
 * 6. Optional: Export programmatically:
 *    import { exportAllAgentsAsJson } from "@/lib/output-service";
 *    exportAllAgentsAsJson(agents, "my-export.json");
 */
