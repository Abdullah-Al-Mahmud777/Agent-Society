/**
 * Advanced Output Utilities
 * Handles format conversion and advanced export features
 */

/**
 * Convert content to various formats
 */
export const formatConverters = {
	/**
	 * Convert to plain text
	 */
	toPlainText: (content) => {
		return content
			.replace(/^### (.*?)$/gm, "$1")
			.replace(/^## (.*?)$/gm, "$1")
			.replace(/^# (.*?)$/gm, "$1")
			.replace(/\*\*(.*?)\*\*/g, "$1")
			.replace(/\*(.*?)\*/g, "$1")
			.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
			.replace(/`([^`]+)`/g, "$1")
			.trim();
	},

	/**
	 * Convert to HTML
	 */
	toHtml: (content) => {
		let html = escapeHtml(content);

		// Headers
		html = html.replace(/^### (.*?)$/gm, "<h3>$1</h3>");
		html = html.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
		html = html.replace(/^# (.*?)$/gm, "<h1>$1</h1>");

		// Formatting
		html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
		html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
		html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

		// Links
		html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>');

		// Lists
		html = html.replace(/^- (.*?)$/gm, "<li>$1</li>");
		html = html.replace(/(<li>.*?<\/li>)/s, "<ul>$1</ul>");

		// Paragraphs
		html = html.replace(/\n\n+/g, "</p><p>");
		html = `<p>${html}</p>`;

		return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
    h1 { font-size: 24px; margin-top: 20px; }
    h2 { font-size: 20px; margin-top: 15px; }
    h3 { font-size: 16px; margin-top: 10px; }
    code { background: #f0f0f0; padding: 2px 4px; border-radius: 3px; }
    ul { margin: 10px 0; padding-left: 20px; }
  </style>
</head>
<body>
${html}
</body>
</html>`;
	},

	/**
	 * Convert to Markdown
	 */
	toMarkdown: (content) => {
		// Already in markdown format, just ensure proper formatting
		return content.replace(/\n{3,}/g, "\n\n");
	},
};

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
	const map = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#039;",
	};
	return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Generate metadata for exports
 */
export function generateMetadata() {
	return {
		exportDate: new Date().toISOString(),
		exportTime: new Date().toLocaleString(), // Client-side only
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
	};
}

/**
 * Create a structured JSON export with metadata
 */
export function createStructuredJsonExport(agents, customContent = null) {
	return {
		metadata: generateMetadata(),
		summary: {
			totalAgents: agents.length,
			enabledCount: agents.filter((a) => a.isEnabled).length,
			disabledCount: agents.filter((a) => !a.isEnabled).length,
		},
		agents: agents.map((agent) => ({
			id: agent.id,
			name: agent.name,
			role: agent.role,
			description: agent.description,
			icon: agent.icon,
			color: agent.color,
			isEnabled: agent.isEnabled,
			aiProvider: agent.aiProvider,
			model: agent.model,
			temperature: agent.temperature,
			systemPrompt: agent.systemPrompt,
			exampleInput: agent.exampleInput,
			exampleOutput: agent.exampleOutput,
		})),
		...(customContent && { customContent }),
	};
}

/**
 * Generate XML export
 */
export function generateXmlExport(agents) {
	let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
	xml += '<agents>\n';
	xml += `  <metadata>\n`;
	xml += `    <exportDate>${new Date().toISOString()}</exportDate>\n`;
	xml += `    <totalCount>${agents.length}</totalCount>\n`;
	xml += `  </metadata>\n`;
	xml += `  <agentList>\n`;

	agents.forEach((agent) => {
		xml += `    <agent id="${escapeXml(agent.id)}">\n`;
		xml += `      <name>${escapeXml(agent.name)}</name>\n`;
		xml += `      <role>${escapeXml(agent.role)}</role>\n`;
		xml += `      <description>${escapeXml(agent.description)}</description>\n`;
		xml += `      <aiProvider>${escapeXml(agent.aiProvider)}</aiProvider>\n`;
		xml += `      <model>${escapeXml(agent.model)}</model>\n`;
		xml += `      <temperature>${agent.temperature}</temperature>\n`;
		xml += `      <isEnabled>${agent.isEnabled}</isEnabled>\n`;
		xml += `    </agent>\n`;
	});

	xml += `  </agentList>\n`;
	xml += `</agents>\n`;

	return xml;
}

/**
 * Escape XML special characters
 */
function escapeXml(str) {
	const map = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&apos;",
	};
	return String(str).replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Download file helper
 */
export function downloadFile(content, filename, mimeType = "application/octet-stream") {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Create agent comparison data
 */
export function createAgentComparison(agents) {
	const comparison = {
		byProvider: {},
		byModel: {},
		byTemperature: {},
		enabledVsDisabled: {
			enabled: agents.filter((a) => a.isEnabled).length,
			disabled: agents.filter((a) => !a.isEnabled).length,
		},
	};

	agents.forEach((agent) => {
		// Group by provider
		if (!comparison.byProvider[agent.aiProvider]) {
			comparison.byProvider[agent.aiProvider] = [];
		}
		comparison.byProvider[agent.aiProvider].push(agent.name);

		// Group by model
		if (!comparison.byModel[agent.model]) {
			comparison.byModel[agent.model] = [];
		}
		comparison.byModel[agent.model].push(agent.name);

		// Group by temperature range
		const tempRange = agent.temperature < 0.5 ? "low" : agent.temperature < 1 ? "medium" : "high";
		if (!comparison.byTemperature[tempRange]) {
			comparison.byTemperature[tempRange] = [];
		}
		comparison.byTemperature[tempRange].push(agent.name);
	});

	return comparison;
}

/**
 * Create a comprehensive report
 */
export function generateComprehensiveReport(agents, customContent = "") {
	const comparison = createAgentComparison(agents);
	const report = {
		title: "Agent Configuration Report",
		generatedAt: new Date().toLocaleString(), // Client-side only
		summary: {
			totalAgents: agents.length,
			enabled: comparison.enabledVsDisabled.enabled,
			disabled: comparison.enabledVsDisabled.disabled,
		},
		agents,
		analysis: {
			providerDistribution: comparison.byProvider,
			modelDistribution: comparison.byModel,
			temperatureDistribution: comparison.byTemperature,
		},
		customContent,
	};

	return report;
}
