import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/export/csv
 * Export agents as CSV
 */
export async function POST(request) {
	try {
		const { agents } = await request.json();

		if (!agents || !Array.isArray(agents)) {
			return NextResponse.json({ error: "Invalid agents data" }, { status: 400 });
		}

		const csv = generateCsv(agents);

		return new NextResponse(csv, {
			status: 200,
			headers: {
				"Content-Type": "text/csv; charset=utf-8",
				"Content-Disposition": 'attachment; filename="agents-export.csv"',
			},
		});
	} catch (error) {
		console.error("CSV export error:", error);
		return NextResponse.json({ error: "Export failed" }, { status: 500 });
	}
}

/**
 * Generate CSV content
 */
function generateCsv(agents) {
	const headers = ["Name", "Role", "Icon", "AI Provider", "Model", "Temperature", "Enabled", "Description", "Created", "Updated"];

	const rows = agents.map((agent) => [
		escapeCSV(agent.name),
		escapeCSV(agent.role),
		agent.icon,
		escapeCSV(agent.aiProvider),
		escapeCSV(agent.model),
		agent.temperature,
		agent.isEnabled ? "Yes" : "No",
		escapeCSV(agent.description.substring(0, 100)),
		agent.createdAt || "",
		agent.updatedAt || "",
	]);

	const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

	return csvContent;
}

/**
 * Escape CSV special characters
 */
function escapeCSV(str) {
	return String(str).replace(/"/g, '""');
}
