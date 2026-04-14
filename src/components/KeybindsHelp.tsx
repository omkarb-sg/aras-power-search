const KEYBINDS = [
	{ keys: "Ctrl+K", description: "Launch aras-power-search" },
	{ keys: "Alt+<number>", description: "Further search items" },
	{ keys: "Ctrl+Alt+<number>", description: "Launch Search Grid" },
	{ keys: "Ctrl+<number>", description: "Open form of item" },
	{ keys: "Ctrl+Shift+K", description: "Clear aras-power-cache" },
	{ keys: "Ctrl+Alt+Shift+<number>", description: "Create item" },
	{ keys: "Alt+Shift+<number>", description: "Item Where Used" },
	{ keys: "Ctrl+D + <number>", description: "Pin / unpin item" },
	{ keys: "Ctrl+/", description: "Show this help (hold)" },
	{ keys: "Escape", description: "Close / go back" },
];

export function KeybindsHelp() {
	return (
		<div className="search-overlay-content keybinds-help">
			<h2 className="keybinds-help-title">Keyboard Shortcuts</h2>
			<table className="keybinds-table">
				<tbody>
					{KEYBINDS.map(({ keys, description }) => (
						<tr key={keys}>
							<td><kbd>{keys}</kbd></td>
							<td>{description}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
