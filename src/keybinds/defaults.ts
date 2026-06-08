/** Modifier-only combo — used for digit-based shortcuts (1–9 is implicit, not configurable) */
export interface ModifierCombo {
	ctrl: boolean;
	alt: boolean;
	shift: boolean;
}

/** Full keybind — modifier + specific key (event.key value) */
export interface Keybind extends ModifierCombo {
	key: string;
}

export interface KeybindsConfig {
	// Full keybinds (specific key + modifiers)
	openOverlay: Keybind;
	clearCache: Keybind;
	showHelp: Keybind;
	pinItem: Keybind; // hold this key, then press a digit
	toggleFavorites: Keybind;

	// Modifier-only combos (digit 1–9 is always the action key, readonly in UI)
	openItemForm: ModifierCombo;
	activateSearchGrid: ModifierCombo;
	createItem: ModifierCombo;
	whereUsed: ModifierCombo;
	drillToItemType: ModifierCombo;
}

export const KEYBIND_LABELS: Record<keyof KeybindsConfig, string> = {
	openOverlay: "Launch aras-power-search",
	clearCache: "Clear aras-power-cache",
	showHelp: "Show help (hold)",
	pinItem: "Pin / unpin item (hold)",
	toggleFavorites: "Toggle favorites mode",
	openItemForm: "Open item form",
	activateSearchGrid: "Launch Search Grid",
	createItem: "Create item",
	whereUsed: "Item Where Used",
	drillToItemType: "Further search items",
};

export const DEFAULT_KEYBINDS: KeybindsConfig = {
	openOverlay: { ctrl: true, alt: false, shift: false, key: "k" },
	clearCache: { ctrl: true, alt: false, shift: true, key: "k" },
	showHelp: { ctrl: true, alt: false, shift: false, key: "/" },
	pinItem: { ctrl: true, alt: false, shift: false, key: "d" },
	toggleFavorites: { ctrl: true, alt: false, shift: false, key: "`" },
	openItemForm: { ctrl: true, alt: false, shift: false },
	activateSearchGrid: { ctrl: true, alt: true, shift: false },
	createItem: { ctrl: true, alt: true, shift: true },
	whereUsed: { ctrl: false, alt: true, shift: true },
	drillToItemType: { ctrl: false, alt: true, shift: false },
};

export const KEYBINDS_STORAGE_KEY = "_aras_power_search_keybinds";
