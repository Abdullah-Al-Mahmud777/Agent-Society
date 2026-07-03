"use client";

import { useContentEditorStore } from "@/store/content-editor-store";

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

export default function ContentEditor() {
	const { contentEditorOpen, contentText, setContentText, closeContentEditor, undo, redo, clearContent, insertTemplate } = useContentEditorStore();

	// Only render modal when editor is open, suppress hydration warning for conditional rendering
	if (!contentEditorOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<div className="h-[90vh] w-[90vw] max-w-5xl flex flex-col rounded-3xl border border-white/10 bg-slate-950 shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
					<div>
						<h2 className="text-xl font-semibold text-white">Content Editor</h2>
						<p className="mt-1 text-sm text-white/60">Customize your export content with Markdown support</p>
					</div>
					<button
						onClick={closeContentEditor}
						className="rounded-lg border border-white/10 p-2 text-white/70 transition hover:bg-white/5"
						aria-label="Close"
					>
						<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Toolbar */}
				<div className="border-b border-white/10 bg-white/5 p-4">
					<div className="mb-3 flex flex-wrap gap-2">
						{/* Action buttons */}
						<button
							onClick={undo}
							className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10"
						>
							↶ Undo
						</button>
						<button
							onClick={redo}
							className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10"
						>
							↷ Redo
						</button>
						<div className="h-6 border-l border-white/10" />
						<button
							onClick={clearContent}
							className="flex items-center gap-2 rounded-lg border border-rose-400/30 px-3 py-2 text-sm text-rose-200 transition hover:bg-rose-400/10"
						>
							Clear
						</button>
					</div>

					{/* Templates */}
					<details className="mb-3">
						<summary className="cursor-pointer text-sm font-medium text-white/60 transition hover:text-white">
							Insert Templates ▼
						</summary>
						<div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
							{Object.entries(TEMPLATES).map(([category, items]) => (
								<div key={category} className="space-y-1">
									<p className="text-xs font-semibold uppercase text-white/40">{category}</p>
									{Object.entries(items).map(([key, value]) => (
										<button
											key={key}
											onClick={() => insertTemplate(value)}
											className="block w-full truncate rounded border border-white/10 px-2 py-1 text-left text-xs text-white/70 transition hover:bg-white/10"
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
						<summary className="cursor-pointer text-xs text-white/50 transition hover:text-white/70">
							Markdown Format Guide
						</summary>
						<div className="mt-2 grid grid-cols-2 gap-2 text-xs text-white/60">
							<div>
								<code className="rounded bg-black/30 px-1 font-mono text-white/80"># Heading 1</code>
							</div>
							<div>
								<code className="rounded bg-black/30 px-1 font-mono text-white/80">## Heading 2</code>
							</div>
							<div>
								<code className="rounded bg-black/30 px-1 font-mono text-white/80">**bold**</code>
							</div>
							<div>
								<code className="rounded bg-black/30 px-1 font-mono text-white/80">*italic*</code>
							</div>
							<div>
								<code className="rounded bg-black/30 px-1 font-mono text-white/80">- List item</code>
							</div>
							<div>
								<code className="rounded bg-black/30 px-1 font-mono text-white/80">[link](url)</code>
							</div>
						</div>
					</details>
				</div>

				{/* Editor area */}
				<div className="flex flex-1 overflow-hidden">
					{/* Textarea */}
					<textarea
						value={contentText}
						onChange={(e) => setContentText(e.target.value)}
						className="flex-1 resize-none border-r border-white/10 bg-slate-950 p-4 font-mono text-sm text-white outline-none"
						placeholder="Write your content here... Supports Markdown formatting.&#10;&#10;Use # for headers, ** for bold, * for italic, and - for lists."
						spellCheck="false"
					/>

					{/* Preview */}
					<div className="w-1/3 overflow-auto border-l border-white/10 bg-white/5 p-4">
						<div className="prose prose-invert text-sm">
							<h3 className="text-xs font-semibold uppercase tracking-widest text-white/50">Preview</h3>
							<div className="mt-4 space-y-3">
								{contentText
									.split("\n\n")
									.filter(Boolean)
									.map((paragraph, idx) => {
										if (paragraph.startsWith("# ")) {
											return (
												<h1 key={idx} className="text-xl font-bold text-white">
													{paragraph.replace(/^# /, "")}
												</h1>
											);
										}
										if (paragraph.startsWith("## ")) {
											return (
												<h2 key={idx} className="text-lg font-bold text-white">
													{paragraph.replace(/^## /, "")}
												</h2>
											);
										}
										if (paragraph.startsWith("### ")) {
											return (
												<h3 key={idx} className="text-base font-bold text-white">
													{paragraph.replace(/^### /, "")}
												</h3>
											);
										}
										if (paragraph.startsWith("- ")) {
											return (
												<ul key={idx} className="list-inside list-disc space-y-1 text-white/80">
													{paragraph.split("\n").map((item, itemIdx) => (
														<li key={itemIdx}>{item.replace(/^- /, "")}</li>
													))}
												</ul>
											);
										}
										return (
											<p key={idx} className="text-white/80 leading-relaxed">
												{paragraph}
											</p>
										);
									})}
								{!contentText && <p className="text-white/40">No content yet...</p>}
							</div>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between border-t border-white/10 bg-white/5 px-6 py-4">
					<div className="text-xs text-white/50">{contentText.length} characters</div>
					<button
						onClick={closeContentEditor}
						className="rounded-lg bg-cyan-600 px-6 py-2 font-medium text-white transition hover:bg-cyan-700"
					>
						Done
					</button>
				</div>
			</div>
		</div>
	);
}
