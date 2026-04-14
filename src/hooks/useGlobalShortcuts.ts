import { useEffect, useRef } from "react";
import type { KeybindsConfig } from "../keybinds/defaults";
import { matchKeybind, matchModifiers } from "../keybinds/storage";
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
	togglePin: (item: SearchItemData) => void;
	showHelp: () => void;
	hideHelp: () => void;
}

interface UseGlobalShortcutsParams {
	topWindow: Window;
	isActive: boolean;
	isSettingsActive: boolean;
	results: SearchItemData[];
	keybinds: KeybindsConfig;
	actions: GlobalShortcutActions;
}

const getDigitFromCode = (code: string): number | null => {
	// event.code gives "Digit1" through "Digit9" regardless of modifiers
	const match = code.match(/Digit([1-9])/);
	return match ? parseInt(match[1]) - 1 : null;
};

export const useGlobalShortcuts = ({
	topWindow,
	isActive,
	isSettingsActive,
	results,
	keybinds,
	actions,
}: UseGlobalShortcutsParams) => {
	const stateRef = useRef({ isActive, isSettingsActive, results, actions, keybinds });
	const pinHoldActive = useRef(false);

	useEffect(() => {
		stateRef.current = { isActive, isSettingsActive, results, actions, keybinds };
	}, [isActive, isSettingsActive, results, actions, keybinds]);

	useEffect(() => {
		const attachedDocs = new WeakSet<Document>();
		const iframeLoadHandlers = new WeakMap<HTMLIFrameElement, EventListener>();

		const handleKeyUp = (event: KeyboardEvent) => {
			const { keybinds } = stateRef.current;
			if (event.key.toLowerCase() === keybinds.pinItem.key.toLowerCase()) {
				pinHoldActive.current = false;
			}
			// Hide help when the showHelp key is released (regardless of modifier state)
			if (event.key.toLowerCase() === keybinds.showHelp.key.toLowerCase()) {
				stateRef.current.actions.hideHelp();
			}
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			const current = stateRef.current;
			const { keybinds } = current;

			// Settings: Escape closes settings (handled by onEscape in app)
			// but we still need to block other shortcuts while settings is open
			if (current.isActive && event.key === "Escape") {
				event.preventDefault();
				current.actions.onEscape();
				return;
			}

			// Show help (hold)
			if (current.isActive && matchKeybind(event, keybinds.showHelp)) {
				event.preventDefault();
				current.actions.showHelp();
				return;
			}

			// Pin hold key
			if (
				current.isActive &&
				!current.isSettingsActive &&
				matchKeybind(event, keybinds.pinItem)
			) {
				event.preventDefault();
				pinHoldActive.current = true;
				return;
			}

			// Open overlay
			if (matchKeybind(event, keybinds.openOverlay)) {
				event.preventDefault();
				current.actions.openOverlay();
				return;
			}

			// Clear cache
			if (matchKeybind(event, keybinds.clearCache)) {
				event.preventDefault();
				current.actions.clearCache();
				return;
			}

			if (!current.isActive || current.isSettingsActive) return;

			// Digit-based shortcuts (use event.code to handle Shift+digit correctly)
			const index = getDigitFromCode(event.code);
			if (index === null) return;

			const item = current.results[index];
			if (!item) return;

			// Pin: pinHold key held + digit
			if (pinHoldActive.current && matchModifiers(event, keybinds.pinItem)) {
				event.preventDefault();
				current.actions.togglePin(item);
				return;
			}

			// Create item
			if (matchModifiers(event, keybinds.createItem) && item.itemTypeName === "ItemType") {
				event.preventDefault();
				current.actions.createItem(item);
				return;
			}

			// Activate search grid
			if (matchModifiers(event, keybinds.activateSearchGrid)) {
				event.preventDefault();
				current.actions.activateSearchGrid(item);
				return;
			}

			// Where used
			if (matchModifiers(event, keybinds.whereUsed)) {
				event.preventDefault();
				current.actions.whereUsed(item);
				return;
			}

			// Open item form
			if (matchModifiers(event, keybinds.openItemForm)) {
				event.preventDefault();
				current.actions.openItemForm(item);
				return;
			}

			// Drill to item type
			if (matchModifiers(event, keybinds.drillToItemType) && item.itemTypeName === "ItemType") {
				event.preventDefault();
				current.actions.drillToItemType(item);
			}
		};

		const attachDocument = (doc: Document) => {
			if (attachedDocs.has(doc)) return;
			doc.addEventListener("keydown", handleKeyDown);
			doc.addEventListener("keyup", handleKeyUp);
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
			pinHoldActive.current = false;
			observer.disconnect();
			topDoc.removeEventListener("keydown", handleKeyDown);
			topDoc.removeEventListener("keyup", handleKeyUp);
			Array.from(topDoc.querySelectorAll("iframe")).forEach((iframeNode) => {
				const iframe = iframeNode as HTMLIFrameElement;
				const loadHandler = iframeLoadHandlers.get(iframe);
				if (loadHandler) {
					iframe.removeEventListener("load", loadHandler);
				}
				iframe.contentWindow?.document.removeEventListener("keydown", handleKeyDown);
				iframe.contentWindow?.document.removeEventListener("keyup", handleKeyUp);
			});
		};
	}, [topWindow]);
};
