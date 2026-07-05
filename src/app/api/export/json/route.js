import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/export/json
 * Export agents as JSON
 */
export async function POST(request) {
	try {
		const { agents, customContent, exportType = "all" } = await request.json();

		if (!agents || !Array.isArray(agents)) {
			return NextResponse.json({ error: "Invalid agents data" }, { status: 400 });
		}

		let data;

		if (exportType === "all") {
			data = {
				exportDate: new Date().toISOString(),
				summary: {
					totalAgents: agents.length,
					enabledCount: agents.filter((a) => a.isEnabled).length,
					disabledCount: agents.filter((a) => !a.isEnabled).length,
				},
				agents: agents.map(formatAgent),
				...(customContent && { customContent }),
			};
		} else {
			// Individual agent
			const agentId = exportType;
			const agent = agents.find((a) => a.id === agentId);

			if (!agent) {
				return NextResponse.json({ error: "Agent not found" }, { status: 404 });
			}

			data = {
				exportDate: new Date().toISOString(),
				agent: formatAgent(agent),
				...(customContent && { customContent }),
			};
		}

		return NextResponse.json(data);
	} catch (error) {
		console.error("JSON export error:", error);
		return NextResponse.json({ error: "Export failed" }, { status: 500 });
	}
}

function formatAgent(agent) {
	return {
		id: agent.id,
		name: agent.name,
		role: agent.role,
		icon: agent.icon,
		color: agent.color,
		description: agent.description,
		isEnabled: agent.isEnabled,
		aiProvider: agent.aiProvider,
		model: agent.model,
		temperature: agent.temperature,
		systemPrompt: agent.systemPrompt,
		exampleInput: agent.exampleInput,
		exampleOutput: agent.exampleOutput,
		metadata: {
			createdAt: agent.createdAt,
			updatedAt: agent.updatedAt,
		},
	};
}
