"use client";

import { useState } from "react";
import { Download, FileOutput } from "lucide-react";
import ExportDialog from "./ExportDialog";
import ContentEditor from "./ContentEditor";
import { Button } from "@/components/ui/Button";

export default function OutputToolbar({ agents = [] }) {
	const [exportDialogOpen, setExportDialogOpen] = useState(false);

	return (
		<>
			<div className="flex flex-wrap items-center gap-3 rounded-card border border-glass-border bg-glass p-4 backdrop-blur-glass">
				<div className="flex items-center gap-2 text-ink-muted">
					<FileOutput className="h-5 w-5 text-cyan-200" />
					<span className="text-sm font-medium">Output tools</span>
				</div>

				<div className="h-6 border-l border-glass-border" />

				<Button
					variant="accent"
					size="sm"
					onClick={() => setExportDialogOpen(true)}
					disabled={agents.length === 0}
				>
					<Download className="h-4 w-4" />
					Export
				</Button>

				<div className="ml-auto text-xs text-ink-subtle">
					{agents.length > 0 ? `${agents.length} agents ready to export` : "No agents to export"}
				</div>
			</div>

			<ExportDialog agents={agents} isOpen={exportDialogOpen} onClose={() => setExportDialogOpen(false)} />
			<ContentEditor />
		</>
	);
}
