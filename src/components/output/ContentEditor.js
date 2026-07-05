"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Undo2, Redo2, Trash2, X } from "lucide-react";
import { useContentEditorStore } from "@/store/content-editor-store";
import { Button } from "@/components/ui/Button";

const TEMPLATES = {
	headers: {
		title: "# Title",
		section: "## Section",
		subsection: "### Subsection",
	},
	formatting: {
		bold: "**bold text**",
		italic: "*italic text*",
		list: "- Item 1\n- Item 2\n- Item 3",
	},
	sections: {
		summary: "## Summary\n\nProvide a brief overview here...",
		findings: "## Key Findings\n\n- Finding 1\n- Finding 2\n- Finding 3",
		recommendations: "## Recommendations\n\n1. Recommendation 1\n2. Recommendation 2\n3. Recommendation 3",
		risks: "## Risks & Considerations\n\n- Risk 1\n- Risk 2",
	},
};

function renderPreview(contentText) {
	return contentText
		.split("\n\n")
		.filter(Boolean)
		.map((paragraph, idx) => {
			if (paragraph.startsWith("# ")) {
				return <h1 key={idx} className="text-xl font-bold text-ink">{paragraph.replace(/^# /, "")}</h1>;
			}
			if (paragraph.startsWith("## ")) {
				return <h2 key={idx} className="text-lg font-bold text-ink">{paragraph.replace(/^## /, "")}</h2>;
			}
			if (paragraph.startsWith("### ")) {
				return <h3 key={idx} className="text-base font-bold text-ink">{paragraph.replace(/^### /, "")}</h3>;
			}
			if (paragraph.startsWith("- ")) {
				return (
					<ul key={idx} className="list-inside list-disc space-y-1 text-ink-muted">
						{paragraph.split("\n").map((item, itemIdx) => (
							<li key={itemIdx}>{item.replace(/^- /, "")}</li>
						))}
					</ul>
				);
			}
			return <p key={idx} className="leading-relaxed text-ink-muted">{paragraph}</p>;
		});
}

export default function ContentEditor() {
	const reduce = useReducedMotion();
	const {
		contentEditorOpen,
		contentText,
		setContentText,
		closeContentEditor,
		undo,
		redo,
		clearContent,
		insertTemplate,
	} = useContentEditorStore();

	return (
		<AnimatePresence>
			{contentEditorOpen && (
				<motion.div
					className="fixed inset-0 z-[60] flex items-center justify-center p-4"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.18 }}
				>
					<div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeContentEditor} aria-hidden />
					<motion.div
						role="dialog"
						aria-modal="true"
						className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-panel border border-glass-border-strong bg-navy-800 shadow-glass-xl"
						initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
						animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
						exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }}
						transition={{ type: "spring", stiffness: 260, damping: 26 }}
					>
						{/* Header */}
						<div className="flex items-center justify-between border-b border-glass-border px-6 py-4">
							<div>
								<h2 className="text-lg font-semibold text-ink">Content editor</h2>
								<p className="mt-0.5 text-sm text-ink-subtle">Customize your export content with Markdown support</p>
							</div>
							<button
								onClick={closeContentEditor}
								className="rounded-xl border border-glass-border p-2 text-ink-subtle transition hover:bg-glass hover:text-ink"
								aria-label="Close"
							>
								<X className="h-4 w-4" />
							</button>
						</div>

						{/* Toolbar */}
						<div className="border-b border-glass-border bg-glass p-4">
							<div className="mb-3 flex flex-wrap items-center gap-2">
								<Button variant="secondary" size="sm" onClick={undo}>
									<Undo2 className="h-3.5 w-3.5" />
									Undo
								</Button>
								<Button variant="secondary" size="sm" onClick={redo}>
									<Redo2 className="h-3.5 w-3.5" />
									Redo
								</Button>
								<div className="h-6 border-l border-glass-border" />
								<Button variant="danger" size="sm" onClick={clearContent}>
									<Trash2 className="h-3.5 w-3.5" />
									Clear
								</Button>
							</div>

							{/* Templates */}
							<details className="mb-3">
								<summary className="cursor-pointer text-sm font-medium text-ink-muted transition hover:text-ink">
									Insert templates ▾
								</summary>
								<div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
									{Object.entries(TEMPLATES).map(([category, items]) => (
										<div key={category} className="space-y-1">
											<p className="text-xs font-semibold uppercase text-ink-faint">{category}</p>
											{Object.entries(items).map(([key, value]) => (
												<button
													key={key}
													onClick={() => insertTemplate(value)}
													className="block w-full truncate rounded-lg border border-glass-border px-2 py-1 text-left text-xs text-ink-muted transition hover:bg-glass"
													title={value}
												>
													{key}
												</button>
											))}
										</div>
									))}
								</div>
							</details>

							{/* Formatting help */}
							<details>
								<summary className="cursor-pointer text-xs text-ink-subtle transition hover:text-ink-muted">
									Markdown format guide
								</summary>
								<div className="mt-2 grid grid-cols-2 gap-2 text-xs text-ink-muted">
									{["# Heading 1", "## Heading 2", "**bold**", "*italic*", "- List item", "[link](url)"].map((code) => (
										<div key={code}>
											<code className="rounded bg-black/30 px-1 font-mono text-ink-muted">{code}</code>
										</div>
									))}
								</div>
							</details>
						</div>

						{/* Editor area */}
						<div className="flex min-h-0 flex-1 overflow-hidden">
							<textarea
								value={contentText}
								onChange={(e) => setContentText(e.target.value)}
								className="flex-1 resize-none border-r border-glass-border bg-navy-950 p-4 font-mono text-sm text-ink outline-none placeholder:text-ink-faint"
								placeholder="Write your content here... Supports Markdown formatting.&#10;&#10;Use # for headers, ** for bold, * for italic, and - for lists."
								spellCheck="false"
							/>

							<div className="w-1/3 overflow-auto border-l border-glass-border bg-glass p-4">
								<h3 className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">Preview</h3>
								<div className="mt-4 space-y-3 text-sm">
									{renderPreview(contentText)}
									{!contentText && <p className="text-ink-faint">No content yet...</p>}
								</div>
							</div>
						</div>

						{/* Footer */}
						<div className="flex items-center justify-between border-t border-glass-border bg-glass px-6 py-4">
							<div className="text-xs text-ink-subtle">{contentText.length} characters</div>
							<Button variant="primary" onClick={closeContentEditor}>Done</Button>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
