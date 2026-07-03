import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/export/pdf
 * Generate PDF from agent data
 */
export async function POST(request) {
	try {
		const { agents, customContent, filename } = await request.json();

		if (!agents || !Array.isArray(agents)) {
			return NextResponse.json({ error: "Invalid agents data" }, { status: 400 });
		}

		// Build HTML content for PDF
		const htmlContent = buildPdfHtml(agents, customContent);

		// Return HTML that can be printed to PDF
		return new NextResponse(htmlContent, {
			status: 200,
			headers: {
				"Content-Type": "text/html; charset=utf-8",
				"Content-Disposition": `attachment; filename="${filename || "agents-export.html"}"`,
			},
		});
	} catch (error) {
		console.error("PDF export error:", error);
		return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
	}
}

/**
 * Build HTML for PDF rendering
 */
function buildPdfHtml(agents, customContent = "") {
	const summary = {
		total: agents.length,
		enabled: agents.filter((a) => a.isEnabled).length,
		disabled: agents.filter((a) => !a.isEnabled).length,
	};

	const agentCardsHtml = agents
		.map((agent) => {
			const enabled = agent.isEnabled ? "✓ Enabled" : "✗ Disabled";
			return `
      <div style="page-break-inside: avoid; margin-bottom: 20px; border: 1px solid #ddd; border-left: 4px solid ${agent.color}; padding: 15px; border-radius: 4px; background-color: #f9f9f9;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 24px;">${agent.icon}</div>
            <div>
              <h3 style="margin: 0; font-size: 18px; color: #1a1a1a; font-weight: bold;">${escapeHtml(agent.name)}</h3>
              <p style="margin: 3px 0 0 0; font-size: 13px; color: #666;">${escapeHtml(agent.role)}</p>
            </div>
          </div>
          <span style="font-size: 11px; background-color: ${agent.color}22; color: ${agent.color}; padding: 4px 8px; border-radius: 3px; font-weight: 600;">${enabled}</span>
        </div>
        <p style="margin: 8px 0; font-size: 12px; color: #555; line-height: 1.5;">${escapeHtml(agent.description)}</p>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; font-size: 11px;">
          <span style="background-color: #e8e8e8; padding: 3px 8px; border-radius: 3px; color: #555;">${escapeHtml(agent.aiProvider)}</span>
          <span style="background-color: #e8e8e8; padding: 3px 8px; border-radius: 3px; color: #555;">${escapeHtml(agent.model)}</span>
          <span style="background-color: #e8e8e8; padding: 3px 8px; border-radius: 3px; color: #555;">Temp: ${agent.temperature}</span>
        </div>
        ${
			agent.systemPrompt
				? `<div style="margin-top: 12px; padding: 10px; background-color: #f0f0f0; border-radius: 3px; font-size: 11px; color: #333; font-family: monospace;"><strong>System Prompt:</strong><br/>${escapeHtml(agent.systemPrompt.substring(0, 200))}...</div>`
				: ""
		}
      </div>
    `;
		})
		.join("");

	const customContentHtml = customContent
		? `
    <div style="margin-top: 40px; page-break-before: always;">
      <h2 style="font-size: 24px; color: #1a1a1a; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">Custom Notes</h2>
      ${markdownToHtml(customContent)}
    </div>
  `
		: "";

	return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Agent Configuration Export</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #fff;
        }
        
        .container {
          max-width: 8.5in;
          margin: 0 auto;
          padding: 20px;
        }
        
        .header {
          margin-bottom: 30px;
          border-bottom: 3px solid #0066cc;
          padding-bottom: 15px;
        }
        
        .title {
          font-size: 32px;
          font-weight: bold;
          color: #1a1a1a;
          margin-bottom: 5px;
        }
        
        .subtitle {
          font-size: 14px;
          color: #666;
        }
        
        .summary {
          background-color: #f0f7ff;
          border-left: 4px solid #0066cc;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .summary p {
          margin: 5px 0;
        }
        
        .section-title {
          font-size: 20px;
          font-weight: bold;
          color: #1a1a1a;
          margin-top: 30px;
          margin-bottom: 15px;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 10px;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .container {
            margin: 0;
            padding: 0.5in;
            max-width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title">Agent Configuration Export</div>
          <div class="subtitle">Generated on ${new Date().toLocaleString()}</div>
        </div>
        
        <div class="summary">
          <p><strong>Total Agents:</strong> ${summary.total}</p>
          <p><strong>Enabled:</strong> ${summary.enabled}</p>
          <p><strong>Disabled:</strong> ${summary.disabled}</p>
        </div>

        <div class="section-title">Agent Configurations</div>
        ${agentCardsHtml}
        
        ${customContentHtml}
      </div>
    </body>
    </html>
  `;
}

/**
 * Convert Markdown to HTML
 */
function markdownToHtml(markdown) {
	let html = escapeHtml(markdown);

	// Headers
	html = html.replace(/^### (.*?)$/gm, "<h3 style=\"font-size: 16px; margin-top: 15px; margin-bottom: 10px; color: #1a1a1a; font-weight: bold;\">$1</h3>");
	html = html.replace(/^## (.*?)$/gm, "<h2 style=\"font-size: 18px; margin-top: 20px; margin-bottom: 12px; color: #1a1a1a; font-weight: bold;\">$1</h2>");
	html = html.replace(/^# (.*?)$/gm, "<h1 style=\"font-size: 22px; margin-top: 25px; margin-bottom: 15px; color: #1a1a1a; font-weight: bold;\">$1</h1>");

	// Formatting
	html = html.replace(/\*\*(.*?)\*\*/g, "<strong style=\"font-weight: bold;\">$1</strong>");
	html = html.replace(/\*(.*?)\*/g, "<em style=\"font-style: italic;\">$1</em>");

	// Code
	html = html.replace(/`([^`]+)`/g, "<code style=\"background-color: #f0f0f0; padding: 2px 4px; border-radius: 3px; font-family: monospace;\">$1</code>");

	// Links
	html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, "<a href=\"$2\" style=\"color: #0066cc; text-decoration: none;\">$1</a>");

	// Lists
	html = html.replace(/^\n- (.*?)(?=\n|$)/gm, "\n<li style=\"margin-left: 20px;\">$1</li>");
	html = html.replace(/(<li[^>]*>.*?<\/li>)/s, "<ul style=\"margin: 10px 0;\">$1</ul>");

	// Paragraphs
	html = html.replace(/\n\n/g, "</p><p style=\"margin-top: 10px;\">");
	html = "<p>" + html + "</p>";

	return html;
}

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
	return String(text).replace(/[&<>"']/g, (m) => map[m]);
}
