import type { KeybindsConfig } from "../keybinds/defaults";
import { formatKeybind, formatModifierCombo } from "../keybinds/storage";

interface KeybindsHelpProps {
	keybinds: KeybindsConfig;
}

export function KeybindsHelp({ keybinds }: KeybindsHelpProps) {
	const rows = [
		{ keys: formatKeybind(keybinds.openOverlay), description: "Launch aras-power-search" },
		{ keys: formatKeybind(keybinds.toggleFavorites), description: "Toggle favorites mode" },
		{ keys: formatModifierCombo(keybinds.drillToItemType), description: "Further search items" },
		{ keys: formatModifierCombo(keybinds.activateSearchGrid), description: "Launch Search Grid" },
		{ keys: formatModifierCombo(keybinds.openItemForm), description: "Open form of item" },
		{ keys: formatKeybind(keybinds.clearCache), description: "Clear aras-power-cache" },
		{ keys: formatModifierCombo(keybinds.createItem), description: "Create item" },
		{ keys: formatModifierCombo(keybinds.whereUsed), description: "Item Where Used" },
		{
			keys: `${formatKeybind(keybinds.pinItem)} + digit`,
			description: "Pin / unpin item",
		},
		{ keys: formatKeybind(keybinds.showHelp), description: "Show this help (hold)" },
		{ keys: "Escape", description: "Close / go back" },
	];

	return (
		<div className="search-overlay-content keybinds-help">
			<h2 className="keybinds-help-title">Keyboard Shortcuts</h2>
			<table className="keybinds-table">
				<tbody>
					{rows.map(({ keys, description }) => (
						<tr key={keys}>
							<td>
								<kbd>{keys}</kbd>
							</td>
							<td>{description}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
