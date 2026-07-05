"use client";

import { useState } from "react";
import { useContentEditorStore } from "@/store/content-editor-store";
import { exportAgentAsJson, exportAllAgentsAsJson, exportAgentsAsCSV, buildPdfContent } from "@/lib/output-service";

export default function ExportDialog({ agents, onClose, isOpen }) {
	const [exportFormat, setExportFormat] = useState("json-all");
	const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id);
	const [isPDFGenerating, setIsPDFGenerating] = useState(false);
	const contentText = useContentEditorStore((state) => state.getContent());
	const openContentEditor = useContentEditorStore((state) => state.openContentEditor);

	// Only render dialog when open, suppress hydration warning for conditional rendering
	if (!isOpen) return null;

	const handleExport = async () => {
		try {
			if (exportFormat === "json-single") {
				const agent = agents.find((a) => a.id === selectedAgentId);
				if (agent) {
					exportAgentAsJson(agent);
				}
			} else if (exportFormat === "json-all") {
				exportAllAgentsAsJson(agents);
			} else if (exportFormat === "csv") {
				exportAgentsAsCSV(agents);
			} else if (exportFormat === "pdf") {
				setIsPDFGenerating(true);
				await generatePDF();
			}
		} catch (error) {
			console.error("Export error:", error);
			alert("Export failed: " + error.message);
		}
	};

	const generatePDF = async () => {
		try {
			const htmlContent = buildPdfContent(agents, contentText);

			// Create a new window for printing
			const printWindow = window.open("", "_blank");
			printWindow.document.write(htmlContent);
			printWindow.document.close();

			// Wait for content to load then print
			printWindow.onload = () => {
				printWindow.print();
			};
		} catch (error) {
			console.error("PDF generation error:", error);
			alert("PDF generation failed: " + error.message);
		} finally {
			setIsPDFGenerating(false);
		}
	};

	return (
		<div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl border border-white/10 bg-slate-950 shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-white/10 px-6 py-4 sticky top-0 bg-slate-950">
					<div>
						<h2 className="text-xl font-semibold text-white">Export Agents</h2>
						<p className="mt-1 text-sm text-white/60">Choose format and options</p>
					</div>
					<button
						onClick={onClose}
						className="rounded-lg border border-white/10 p-2 text-white/70 transition hover:bg-white/5"
						aria-label="Close"
					>
						<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Content */}
				<div className="space-y-6 p-6">
					{/* Format selection */}
					<div>
						<label className="mb-3 block text-sm font-semibold text-white">Export Format</label>
						<div className="space-y-2">
							{[
								{ id: "json-single", label: "Single Agent (JSON)", description: "Export only the selected agent configuration" },
								{ id: "json-all", label: "All Agents (JSON)", description: "Export all agents as a single JSON file" },
								{ id: "csv", label: "All Agents (CSV)", description: "Export all agents in spreadsheet format" },
								{ id: "pdf", label: "Professional PDF Report", description: "Generate a formatted PDF with all agents and custom content" },
							].map((option) => (
								<label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 p-3 transition has-[:checked]:border-cyan-400/50 has-[:checked]:bg-cyan-400/10">
									<input
										type="radio"
										name="format"
										value={option.id}
										checked={exportFormat === option.id}
										onChange={(e) => setExportFormat(e.target.value)}
										className="mt-1"
									/>
									<div>
										<div className="font-medium text-white">{option.label}</div>
										<div className="text-sm text-white/60">{option.description}</div>
									</div>
								</label>
							))}
						</div>
					</div>

					{/* Agent selection - for single export */}
					{exportFormat === "json-single" && (
						<div>
							<label className="mb-3 block text-sm font-semibold text-white">Select Agent</label>
							<select
								value={selectedAgentId}
								onChange={(e) => setSelectedAgentId(e.target.value)}
								className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-2 text-white outline-none transition focus:border-cyan-400"
							>
								{agents.map((agent) => (
									<option key={agent.id} value={agent.id}>
										{agent.icon} {agent.name} • {agent.role}
									</option>
								))}
							</select>
						</div>
					)}

					{/* Summary */}
					<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
						<div className="text-sm text-white/70">
							<div className="mb-2 font-semibold text-white">Export Summary</div>
							<div className="space-y-1">
								<div>• Total Agents: <span className="font-medium text-white">{agents.length}</span></div>
								<div>• Enabled: <span className="font-medium text-white">{agents.filter((a) => a.isEnabled).length}</span></div>
								<div>• Disabled: <span className="font-medium text-white">{agents.filter((a) => !a.isEnabled).length}</span></div>
								{(exportFormat === "pdf" || exportFormat === "json-all") && (
									<div className="mt-2 pt-2 border-t border-white/10">
										<div>• Format: <span className="font-medium text-white">{exportFormat === "pdf" ? "Professional PDF" : "JSON"}</span></div>
										{exportFormat === "pdf" && contentText && (
											<div>• Custom Content: <span className="font-medium text-white">Included ({contentText.length} chars)</span></div>
										)}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Content editor option - for PDF */}
					{exportFormat === "pdf" && (
						<button
							onClick={openContentEditor}
							className="flex w-full items-center justify-between rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-left transition hover:border-cyan-400/50 hover:bg-cyan-400/15"
						>
							<div>
								<div className="font-medium text-white">
									{contentText ? "✓ Custom Content Added" : "Add Custom Content"}
								</div>
								<div className="text-sm text-white/70">
									{contentText ? `${contentText.length} characters` : "Add notes, findings, or recommendations to your PDF"}
								</div>
							</div>
							<svg className="h-5 w-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
							</svg>
						</button>
					)}
				</div>

				{/* Footer */}
				<div className="flex gap-3 border-t border-white/10 bg-white/5 px-6 py-4 sticky bottom-0">
					<button
						onClick={onClose}
						className="flex-1 rounded-lg border border-white/10 px-4 py-2 font-medium text-white/70 transition hover:bg-white/10"
					>
						Cancel
					</button>
					<button
						onClick={handleExport}
						disabled={isPDFGenerating}
						className="flex-1 rounded-lg bg-cyan-600 px-4 py-2 font-medium text-white transition hover:bg-cyan-700 disabled:opacity-50"
					>
						{isPDFGenerating ? "Generating PDF..." : "Export"}
					</button>
				</div>
			</div>
		</div>
	);
}
