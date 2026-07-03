"use client";

import { useState } from "react";
import ExportDialog from "./ExportDialog";
import ContentEditor from "./ContentEditor";

export default function OutputToolbar({ agents = [] }) {
	const [exportDialogOpen, setExportDialogOpen] = useState(false);

	return (
		<>
			<div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
				<div className="flex items-center gap-2">
					<svg className="h-5 w-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
					</svg>
					<span className="text-sm font-medium text-white/70">Output Tools</span>
				</div>

				<div className="h-6 border-l border-white/10" />

				<button
					onClick={() => setExportDialogOpen(true)}
					className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-white/75 transition hover:border-white/20 hover:bg-white/5"
					disabled={agents.length === 0}
				>
					<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
					</svg>
					Export
				</button>

				<div className="text-xs text-white/50 flex items-center">
					{agents.length > 0 ? `${agents.length} agents ready to export` : "No agents to export"}
				</div>
			</div>

			<ExportDialog agents={agents} isOpen={exportDialogOpen} onClose={() => setExportDialogOpen(false)} />
			<ContentEditor />
		</>
	);
}
