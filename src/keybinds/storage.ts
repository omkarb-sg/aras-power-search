import {
	DEFAULT_KEYBINDS,
	KEYBINDS_STORAGE_KEY,
	type Keybind,
	type KeybindsConfig,
	type ModifierCombo,
} from "./defaults";

export function loadKeybinds(storage: Storage): KeybindsConfig {
	try {
		const raw = storage.getItem(KEYBINDS_STORAGE_KEY);
		if (!raw) return DEFAULT_KEYBINDS;
		const parsed = JSON.parse(raw) as Partial<KeybindsConfig>;
		// Merge with defaults so missing keys fall back gracefully
		return {
			openOverlay: { ...DEFAULT_KEYBINDS.openOverlay, ...parsed.openOverlay },
			clearCache: { ...DEFAULT_KEYBINDS.clearCache, ...parsed.clearCache },
			showHelp: { ...DEFAULT_KEYBINDS.showHelp, ...parsed.showHelp },
			pinItem: { ...DEFAULT_KEYBINDS.pinItem, ...parsed.pinItem },
			toggleFavorites: { ...DEFAULT_KEYBINDS.toggleFavorites, ...parsed.toggleFavorites },
			openItemForm: { ...DEFAULT_KEYBINDS.openItemForm, ...parsed.openItemForm },
			activateSearchGrid: { ...DEFAULT_KEYBINDS.activateSearchGrid, ...parsed.activateSearchGrid },
			createItem: { ...DEFAULT_KEYBINDS.createItem, ...parsed.createItem },
			whereUsed: { ...DEFAULT_KEYBINDS.whereUsed, ...parsed.whereUsed },
			drillToItemType: { ...DEFAULT_KEYBINDS.drillToItemType, ...parsed.drillToItemType },
		};
	} catch {
		return DEFAULT_KEYBINDS;
	}
}

export function saveKeybinds(storage: Storage, config: KeybindsConfig): void {
	storage.setItem(KEYBINDS_STORAGE_KEY, JSON.stringify(config, null, 2));
}

export function formatKeybind(kb: Keybind): string {
	const parts: string[] = [];
	if (kb.ctrl) parts.push("Ctrl");
	if (kb.alt) parts.push("Alt");
	if (kb.shift) parts.push("Shift");
	parts.push(kb.key === " " ? "Space" : kb.key.toUpperCase());
	return parts.join("+");
}

export function formatModifierCombo(combo: ModifierCombo): string {
	const parts: string[] = [];
	if (combo.ctrl) parts.push("Ctrl");
	if (combo.alt) parts.push("Alt");
	if (combo.shift) parts.push("Shift");
	return parts.length > 0 ? `${parts.join("+")} + <1-9>` : "<1-9>";
}

export function matchKeybind(event: KeyboardEvent, kb: Keybind): boolean {
	return (
		event.key.toLowerCase() === kb.key.toLowerCase() &&
		event.ctrlKey === kb.ctrl &&
		event.altKey === kb.alt &&
		event.shiftKey === kb.shift
	);
}

export function matchModifiers(event: KeyboardEvent, combo: ModifierCombo): boolean {
	return (
		event.ctrlKey === combo.ctrl &&
		event.altKey === combo.alt &&
		event.shiftKey === combo.shift
	);
}
