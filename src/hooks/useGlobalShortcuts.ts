import { useEffect, useRef } from "react";
import type { SearchItemData } from "../types/search";

interface GlobalShortcutActions {
	openOverlay: () => void;
	onEscape: () => void;
	clearCache: () => void;
	activateSearchGrid: (item: SearchItemData) => void;
	openItemForm: (item: SearchItemData) => void;
	createItem: (item: SearchItemData) => void;
	whereUsed: (item: SearchItemData) => void;
	drillToItemType: (item: SearchItemData) => void;
}

interface UseGlobalShortcutsParams {
	topWindow: Window;
	isActive: boolean;
	results: SearchItemData[];
	actions: GlobalShortcutActions;
}

const isDigitShortcut = (keyCode: number) => keyCode >= 49 && keyCode <= 57;

export const useGlobalShortcuts = ({
	topWindow,
	isActive,
	results,
	actions,
}: UseGlobalShortcutsParams) => {
	const stateRef = useRef({ isActive, results, actions });

	useEffect(() => {
		stateRef.current = { isActive, results, actions };
	}, [isActive, results, actions]);

	useEffect(() => {
		const attachedDocs = new WeakSet<Document>();
		const iframeLoadHandlers = new WeakMap<HTMLIFrameElement, EventListener>();

		const handleKeyDown = (event: KeyboardEvent) => {
			const current = stateRef.current;

			if (event.keyCode === 75 && event.ctrlKey && !event.altKey && !event.shiftKey) {
				event.preventDefault();
				current.actions.openOverlay();
				return;
			}

			if (event.keyCode === 75 && event.ctrlKey && !event.altKey && event.shiftKey) {
				event.preventDefault();
				current.actions.clearCache();
				return;
			}

			if (!current.isActive || !isDigitShortcut(event.keyCode)) {
				if (current.isActive && event.key === "Escape") {
					event.preventDefault();
					current.actions.onEscape();
				}
				return;
			}

			const index = event.keyCode - 49;
			const item = current.results[index];
			if (!item) return;

			if (event.ctrlKey && event.altKey && !event.shiftKey) {
				event.preventDefault();
				current.actions.activateSearchGrid(item);
				return;
			}

			if (event.ctrlKey && !event.altKey && !event.shiftKey) {
				event.preventDefault();
				current.actions.openItemForm(item);
				return;
			}

			if (
				event.ctrlKey &&
				event.altKey &&
				event.shiftKey &&
				item.itemTypeName === "ItemType"
			) {
				event.preventDefault();
				current.actions.createItem(item);
				return;
			}

			if (!event.ctrlKey && event.altKey && event.shiftKey) {
				event.preventDefault();
				current.actions.whereUsed(item);
				return;
			}

			if (!event.ctrlKey && event.altKey && !event.shiftKey && item.itemTypeName === "ItemType") {
				event.preventDefault();
				current.actions.drillToItemType(item);
			}
		};

		const attachDocument = (doc: Document) => {
			if (attachedDocs.has(doc)) return;
			doc.addEventListener("keydown", handleKeyDown);
			attachedDocs.add(doc);
		};

		const attachIframe = (iframe: HTMLIFrameElement) => {
			const attach = () => {
				if (iframe.contentWindow?.document) {
					attachDocument(iframe.contentWindow.document);
				}
			};

			attach();
			const loadHandler: EventListener = () => attach();
			iframe.addEventListener("load", loadHandler);
			iframeLoadHandlers.set(iframe, loadHandler);
		};

		const topDoc = topWindow.document;
		attachDocument(topDoc);
		Array.from(topDoc.querySelectorAll("iframe")).forEach((iframeNode) => {
			attachIframe(iframeNode as HTMLIFrameElement);
		});

		const observer = new MutationObserver((mutationList) => {
			for (const mutation of mutationList) {
				if (mutation.type !== "childList") continue;

				mutation.addedNodes.forEach((node) => {
					if (node instanceof HTMLIFrameElement) {
						attachIframe(node);
					}
				});
			}
		});

		if (topDoc.body) {
			observer.observe(topDoc.body, { childList: true, subtree: true });
		}

		return () => {
			observer.disconnect();
			topDoc.removeEventListener("keydown", handleKeyDown);
			Array.from(topDoc.querySelectorAll("iframe")).forEach((iframeNode) => {
				const iframe = iframeNode as HTMLIFrameElement;
				const loadHandler = iframeLoadHandlers.get(iframe);
				if (loadHandler) {
					iframe.removeEventListener("load", loadHandler);
				}
				iframe.contentWindow?.document.removeEventListener("keydown", handleKeyDown);
			});
		};
	}, [topWindow]);
};
