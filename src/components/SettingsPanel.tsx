import { useEffect, useRef, useState } from "react";
import {
	DEFAULT_KEYBINDS,
	KEYBIND_LABELS,
	type Keybind,
	type KeybindsConfig,
	type ModifierCombo,
} from "../keybinds/defaults";
import { formatKeybind, formatModifierCombo } from "../keybinds/storage";

interface SettingsPanelProps {
	keybinds: KeybindsConfig;
	onSave: (config: KeybindsConfig) => void;
	onClose: () => void;
}

type FullKeybindKey = "openOverlay" | "clearCache" | "showHelp" | "pinItem" | "toggleFavorites";
type ModifierOnlyKey = "openItemForm" | "activateSearchGrid" | "createItem" | "whereUsed" | "drillToItemType";

const FULL_KEYBIND_KEYS: FullKeybindKey[] = ["openOverlay", "clearCache", "showHelp", "pinItem", "toggleFavorites"];
const MODIFIER_ONLY_KEYS: ModifierOnlyKey[] = [
	"openItemForm",
	"activateSearchGrid",
	"createItem",
	"whereUsed",
	"drillToItemType",
];

const MODIFIER_KEY_CODES = new Set(["Control", "Alt", "Shift", "Meta", "CapsLock"]);

export function SettingsPanel({ keybinds, onSave, onClose }: SettingsPanelProps) {
	const [draft, setDraft] = useState<KeybindsConfig>(keybinds);
	const [tab, setTab] = useState<"ui" | "json">("ui");
	const [capturingKey, setCapturingKey] = useState<FullKeybindKey | null>(null);
	const [jsonText, setJsonText] = useState(() => JSON.stringify(keybinds, null, 2));
	const [jsonError, setJsonError] = useState<string | null>(null);
	const captureRef = useRef(capturingKey);

	useEffect(() => {
		captureRef.current = capturingKey;
	}, [capturingKey]);

	// Sync jsonText when switching to JSON tab
	const handleTabChange = (next: "ui" | "json") => {
		if (next === "json") {
			setJsonText(JSON.stringify(draft, null, 2));
			setJsonError(null);
		}
		setTab(next);
	};

	// Keybind capture listener
	useEffect(() => {
		if (!capturingKey) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			e.preventDefault();
			e.stopPropagation();

			if (MODIFIER_KEY_CODES.has(e.key)) return; // wait for non-modifier

			if (e.key === "Escape") {
				setCapturingKey(null);
				return;
			}

			const newKeybind: Keybind = {
				ctrl: e.ctrlKey,
				alt: e.altKey,
				shift: e.shiftKey,
				key: e.key.toLowerCase() === e.key ? e.key : e.key.toLowerCase(),
			};

			setDraft((prev) => ({
				...prev,
				[captureRef.current!]: newKeybind,
			}));
			setCapturingKey(null);
		};

		window.addEventListener("keydown", handleKeyDown, true);
		return () => window.removeEventListener("keydown", handleKeyDown, true);
	}, [capturingKey]);

	const toggleModifier = (
		action: ModifierOnlyKey,
		modifier: keyof ModifierCombo,
	) => {
		setDraft((prev) => ({
			...prev,
			[action]: {
				...prev[action],
				[modifier]: !(prev[action] as ModifierCombo)[modifier],
			},
		}));
	};

	const handleSave = () => {
		if (tab === "json") {
			try {
				const parsed = JSON.parse(jsonText) as KeybindsConfig;
				onSave({ ...DEFAULT_KEYBINDS, ...parsed });
			} catch {
				setJsonError("Invalid JSON");
				return;
			}
		} else {
			onSave(draft);
		}
	};

	const handleReset = () => {
		setDraft(DEFAULT_KEYBINDS);
		setJsonText(JSON.stringify(DEFAULT_KEYBINDS, null, 2));
		setJsonError(null);
	};

	const handleJsonChange = (value: string) => {
		setJsonText(value);
		try {
			JSON.parse(value);
			setJsonError(null);
		} catch {
			setJsonError("Invalid JSON");
		}
	};

	return (
		<div className="search-overlay-content settings-panel">
			<div className="settings-header">
				<button className="settings-back-btn" onClick={onClose} aria-label="Back to search">
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.5"
						strokeLinecap="round"
						strokeLinejoin="round"
						xmlns="http://www.w3.org/2000/svg"
					>
						<polyline points="15 18 9 12 15 6" />
					</svg>
					Back
				</button>
				<h2 className="settings-title">Settings</h2>
			</div>

			<div className="settings-tabs">
				<button
					className={`settings-tab${tab === "ui" ? " active" : ""}`}
					onClick={() => handleTabChange("ui")}
				>
					Keybinds
				</button>
				<button
					className={`settings-tab${tab === "json" ? " active" : ""}`}
					onClick={() => handleTabChange("json")}
				>
					JSON
				</button>
			</div>

			{tab === "ui" && (
				<table className="settings-table">
					<tbody>
						{FULL_KEYBIND_KEYS.map((id) => {
							const kb = draft[id] as Keybind;
							const isCapturing = capturingKey === id;
							const isPinItem = id === "pinItem";
							return (
								<tr key={id}>
									<td className="settings-table-label">
										{isPinItem ? (
											<>
												{KEYBIND_LABELS[id]}
												<span className="settings-implicit-badge">then digit</span>
											</>
										) : (
											KEYBIND_LABELS[id]
										)}
									</td>
									<td className="settings-table-control">
										<button
											className={`keybind-badge${isCapturing ? " capturing" : ""}`}
											onClick={() => setCapturingKey(isCapturing ? null : id)}
											title="Click to remap"
										>
											{isCapturing ? "Press a key…" : formatKeybind(kb)}
										</button>
									</td>
								</tr>
							);
						})}
						{MODIFIER_ONLY_KEYS.map((id) => {
							const combo = draft[id] as ModifierCombo;
							return (
								<tr key={id}>
									<td className="settings-table-label">{KEYBIND_LABELS[id]}</td>
									<td className="settings-table-control settings-modifier-row">
										{(["ctrl", "alt", "shift"] as const).map((mod) => (
											<button
												key={mod}
												className={`modifier-toggle${combo[mod] ? " active" : ""}`}
												onClick={() => toggleModifier(id, mod)}
											>
												{mod.charAt(0).toUpperCase() + mod.slice(1)}
											</button>
										))}
										<kbd>+ 1–9</kbd>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			)}

			{tab === "json" && (
				<div className="json-editor-wrap">
					<textarea
						className="json-editor"
						value={jsonText}
						onChange={(e) => handleJsonChange(e.target.value)}
						spellCheck={false}
					/>
					{jsonError && <p className="json-error">{jsonError}</p>}
				</div>
			)}

			<div className="settings-footer">
				<button className="settings-btn-reset" onClick={handleReset}>
					Reset to defaults
				</button>
				<button
					className="settings-btn-save"
					onClick={handleSave}
					disabled={tab === "json" && jsonError !== null}
				>
					Save
				</button>
			</div>
		</div>
	);
}
