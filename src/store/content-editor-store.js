import { create } from "zustand";

// Hydration-safe store without localStorage persistence
export const useContentEditorStore = create((set, get) => ({
	// Content state
	contentEditorOpen: false,
	contentText: "",
	contentHistory: [],
	contentHistoryIndex: -1,

	// Actions
	openContentEditor: () => set({ contentEditorOpen: true }),
	closeContentEditor: () => set({ contentEditorOpen: false }),

	// Content management
	setContentText: (text) => {
		const current = get();
		const newHistory = current.contentHistory.slice(0, current.contentHistoryIndex + 1);
		newHistory.push(current.contentText);

		set({
			contentText: text,
			contentHistory: newHistory,
			contentHistoryIndex: newHistory.length - 1,
		});
	},

	// Undo/Redo
	undo: () => {
		const current = get();
		if (current.contentHistoryIndex > 0) {
			const newIndex = current.contentHistoryIndex - 1;
			set({
				contentHistoryIndex: newIndex,
				contentText: current.contentHistory[newIndex],
			});
		}
	},

	redo: () => {
		const current = get();
		if (current.contentHistoryIndex < current.contentHistory.length - 1) {
			const newIndex = current.contentHistoryIndex + 1;
			set({
				contentHistoryIndex: newIndex,
				contentText: current.contentHistory[newIndex],
			});
		}
	},

	// Clear content
	clearContent: () =>
		set({
			contentText: "",
			contentHistory: [],
			contentHistoryIndex: -1,
		}),

	// Get content
	getContent: () => get().contentText,

	// Insert template
	insertTemplate: (template) => {
		const current = get().contentText;
		get().setContentText(current + "\n" + template);
	},
}));
