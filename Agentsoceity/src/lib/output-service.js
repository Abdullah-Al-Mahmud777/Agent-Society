/**
 * Output Service - Handles JSON and PDF export for agent configurations
 */

/**
 * Format agent configuration for export
 */
export function formatAgentForExport(agent) {
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

/**
 * Export single agent as JSON
 */
export function exportAgentAsJson(agent, filename = null) {
	const formatted = formatAgentForExport(agent);
	const json = JSON.stringify(formatted, null, 2);
	const file = new Blob([json], { type: "application/json" });
	const url = URL.createObjectURL(file);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename || `${agent.name.replace(/\s+/g, "-")}-config.json`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Export all agents as JSON
 */
export function exportAllAgentsAsJson(agents, filename = "agents-export.json") {
	const formatted = agents.map(formatAgentForExport);
	const json = JSON.stringify(
		{
			exportDate: typeof window !== 'undefined' ? new Date().toISOString() : new Date(0).toISOString(),
			totalAgents: formatted.length,
			agents: formatted,
		},
		null,
		2
	);
	const file = new Blob([json], { type: "application/json" });
	const url = URL.createObjectURL(file);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Export agents as CSV
 */
export function exportAgentsAsCSV(agents, filename = "agents-export.csv") {
	const headers = ["Name", "Role", "Icon", "Color", "AI Provider", "Model", "Temperature", "Enabled", "Description"];
	const rows = agents.map((agent) => [
		agent.name,
		agent.role,
		agent.icon,
		agent.color,
		agent.aiProvider,
		agent.model,
		agent.temperature,
		agent.isEnabled ? "Yes" : "No",
		agent.description,
	]);

	const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

	const file = new Blob([csv], { type: "text/csv" });
	const url = URL.createObjectURL(file);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Convert content to HTML for PDF rendering
 */
export function contentToHtml(content, agent = null) {
	const agentHeader = agent
		? `
    <div style="margin-bottom: 30px; border-bottom: 3px solid ${agent.color}; padding-bottom: 15px;">
      <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
        <div style="font-size: 32px;">${agent.icon}</div>
        <div>
          <h1 style="margin: 0; font-size: 28px; color: #1a1a1a;">${agent.name}</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #666; font-weight: 600;">${agent.role}</p>
        </div>
      </div>
    </div>
  `
		: "";

	const contentHtml = content
		.replace(/^### (.*?)$/gm, '<h3 style="font-size: 16px; margin-top: 20px; margin-bottom: 10px; color: #1a1a1a; font-weight: bold;">$1</h3>')
		.replace(/^## (.*?)$/gm, '<h2 style="font-size: 20px; margin-top: 25px; margin-bottom: 15px; color: #1a1a1a; font-weight: bold;">$1</h2>')
		.replace(/^# (.*?)$/gm, '<h1 style="font-size: 24px; margin-top: 30px; margin-bottom: 20px; color: #1a1a1a; font-weight: bold;">$1</h1>')
		.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold;">$1</strong>')
		.replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>')
		.replace(/\n\n/g, '</p><p style="margin-top: 12px;">')
		.replace(/\n- (.*?)(?=\n|$)/g, '<li style="margin-left: 20px; margin-top: 5px;">$1</li>')
		.replace(/(<li.*?<\/li>(?:\s*<li.*?<\/li>)*)/s, '<ul style="margin-top: 10px;">$1</ul>');

	return `${agentHeader}<div style="line-height: 1.6; color: #333;">${contentHtml}</div>`;
}

/**
 * Format agent card for PDF
 */
export function formatAgentCardForPDF(agent) {
	const isEnabled = agent.isEnabled ? "✓ Enabled" : "✗ Disabled";
	return `
    <div style="page-break-inside: avoid; margin-bottom: 20px; border: 1px solid #ddd; border-left: 4px solid ${agent.color}; padding: 15px; border-radius: 4px; background-color: #f9f9f9;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="font-size: 24px;">${agent.icon}</div>
          <div>
            <h3 style="margin: 0; font-size: 18px; color: #1a1a1a; font-weight: bold;">${agent.name}</h3>
            <p style="margin: 3px 0 0 0; font-size: 13px; color: #666;">${agent.role}</p>
          </div>
        </div>
        <span style="font-size: 11px; background-color: ${agent.color}22; color: ${agent.color}; padding: 4px 8px; border-radius: 3px; font-weight: 600;">${isEnabled}</span>
      </div>
      <p style="margin: 8px 0; font-size: 12px; color: #555; line-height: 1.5;">${agent.description}</p>
      <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; font-size: 11px;">
        <span style="background-color: #e8e8e8; padding: 3px 8px; border-radius: 3px; color: #555;">${agent.aiProvider}</span>
        <span style="background-color: #e8e8e8; padding: 3px 8px; border-radius: 3px; color: #555;">${agent.model}</span>
        <span style="background-color: #e8e8e8; padding: 3px 8px; border-radius: 3px; color: #555;">Temp: ${agent.temperature}</span>
      </div>
      ${agent.systemPrompt ? `<div style="margin-top: 12px; padding: 10px; background-color: #f0f0f0; border-radius: 3px; font-size: 11px; color: #333; font-family: monospace;"><strong>System Prompt:</strong><br/>${escapeHtml(agent.systemPrompt.substring(0, 200))}...</div>` : ""}
    </div>
  `;
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text) {
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

/**
 * Build complete PDF content
 */
export function buildPdfContent(agents, customContent = "") {
	const agentCards = agents.map((agent) => formatAgentCardForPDF(agent)).join("");

	const customContentHtml = customContent
		? `
    <div style="margin-top: 40px; page-break-before: always;">
      <h2 style="font-size: 24px; color: #1a1a1a; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">Custom Notes</h2>
      ${contentToHtml(customContent)}
    </div>
  `
		: "";

	return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
          background-color: #fff;
        }
        .page-break { page-break-after: always; }
        .title { font-size: 32px; font-weight: bold; color: #1a1a1a; margin-bottom: 5px; }
        .subtitle { font-size: 14px; color: #666; margin-bottom: 30px; }
        .summary { background-color: #f0f7ff; border-left: 4px solid #0066cc; padding: 15px; margin-bottom: 30px; border-radius: 4px; }
        .section-title { font-size: 20px; font-weight: bold; color: #1a1a1a; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="title">Agent Configuration Export</div>
		<div class="subtitle">Generated on ${typeof window !== 'undefined' ? new Date().toLocaleString() : 'Export'}</div>
      
      <div class="summary">
        <strong>Total Agents:</strong> ${agents.length}<br/>
        <strong>Enabled:</strong> ${agents.filter((a) => a.isEnabled).length}<br/>
        <strong>Disabled:</strong> ${agents.filter((a) => !a.isEnabled).length}
      </div>

      <div class="section-title">Agent Configurations</div>
      ${agentCards}
      
      ${customContentHtml}
    </body>
    </html>
  `;
}
