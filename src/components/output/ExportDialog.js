"use client";

import { useState } from "react";
import { FileJson, FileSpreadsheet, FileText, Check } from "lucide-react";
import { useContentEditorStore } from "@/store/content-editor-store";
import { exportAgentAsJson, exportAllAgentsAsJson, exportAgentsAsCSV, buildPdfContent } from "@/lib/output-service";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";

const FORMATS = [
	{ id: "json-single", label: "Single agent (JSON)", description: "Export only the selected agent configuration", icon: FileJson },
	{ id: "json-all", label: "All agents (JSON)", description: "Export all agents as a single JSON file", icon: FileJson },
	{ id: "csv", label: "All agents (CSV)", description: "Export all agents in spreadsheet format", icon: FileSpreadsheet },
	{ id: "pdf", label: "Professional PDF report", description: "Generate a formatted PDF with all agents and custom content", icon: FileText },
];

export default function ExportDialog({ agents, onClose, isOpen }) {
	const [exportFormat, setExportFormat] = useState("json-all");
	const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id);
	const [isPDFGenerating, setIsPDFGenerating] = useState(false);
	const contentText = useContentEditorStore((state) => state.getContent());
	const openContentEditor = useContentEditorStore((state) => state.openContentEditor);

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
			const printWindow = window.open("", "_blank");
			printWindow.document.write(htmlContent);
			printWindow.document.close();
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

	const footer = (
		<div className="flex gap-3">
			<Button variant="secondary" className="flex-1" onClick={onClose}>
				Cancel
			</Button>
			<Button variant="primary" className="flex-1" onClick={handleExport} loading={isPDFGenerating}>
				{isPDFGenerating ? "Generating PDF…" : "Export"}
			</Button>
		</div>
	);

	return (
		<Modal open={isOpen} onClose={onClose} title="Export agents" size="md" footer={footer}>
			<div className="space-y-6 p-6">
				{/* Format selection */}
				<div>
					<label className="mb-3 block text-sm font-semibold text-ink">Export format</label>
					<div className="space-y-2">
						{FORMATS.map((option) => {
							const Icon = option.icon;
							return (
								<label
									key={option.id}
									className="flex cursor-pointer items-start gap-3 rounded-2xl border border-glass-border p-3 transition has-[:checked]:border-brand-cyan/50 has-[:checked]:bg-brand-cyan/10"
								>
									<input
										type="radio"
										name="format"
										value={option.id}
										checked={exportFormat === option.id}
										onChange={(e) => setExportFormat(e.target.value)}
										className="mt-1 accent-brand-cyan"
									/>
									<Icon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
									<div>
										<div className="font-medium text-ink">{option.label}</div>
										<div className="text-sm text-ink-subtle">{option.description}</div>
									</div>
								</label>
							);
						})}
					</div>
				</div>

				{/* Agent selection - for single export */}
				{exportFormat === "json-single" && (
					<div>
						<label className="mb-3 block text-sm font-semibold text-ink">Select agent</label>
						<Select value={selectedAgentId} onChange={(e) => setSelectedAgentId(e.target.value)}>
							{agents.map((agent) => (
								<option key={agent.id} value={agent.id}>
									{agent.icon} {agent.name} • {agent.role}
								</option>
							))}
						</Select>
					</div>
				)}

				{/* Summary */}
				<div className="rounded-card border border-glass-border bg-glass p-4">
					<div className="mb-2 font-semibold text-ink">Export summary</div>
					<div className="space-y-1 text-sm text-ink-muted">
						<div>Total agents: <span className="font-medium text-ink">{agents.length}</span></div>
						<div>Enabled: <span className="font-medium text-ink">{agents.filter((a) => a.isEnabled).length}</span></div>
						<div>Disabled: <span className="font-medium text-ink">{agents.filter((a) => !a.isEnabled).length}</span></div>
						{(exportFormat === "pdf" || exportFormat === "json-all") && (
							<div className="mt-2 border-t border-glass-border pt-2">
								<div>Format: <span className="font-medium text-ink">{exportFormat === "pdf" ? "Professional PDF" : "JSON"}</span></div>
								{exportFormat === "pdf" && contentText && (
									<div>Custom content: <span className="font-medium text-ink">Included ({contentText.length} chars)</span></div>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Content editor option - for PDF */}
				{exportFormat === "pdf" && (
					<button
						onClick={openContentEditor}
						className="flex w-full items-center justify-between rounded-card border border-brand-cyan/30 bg-brand-cyan/10 px-4 py-3 text-left transition hover:border-brand-cyan/50 hover:bg-brand-cyan/15"
					>
						<div>
							<div className="flex items-center gap-2 font-medium text-ink">
								{contentText && <Check className="h-4 w-4 text-emerald-300" />}
								{contentText ? "Custom content added" : "Add custom content"}
							</div>
							<div className="text-sm text-ink-muted">
								{contentText ? `${contentText.length} characters` : "Add notes, findings, or recommendations to your PDF"}
							</div>
						</div>
					</button>
				)}
			</div>
		</Modal>
	);
}
