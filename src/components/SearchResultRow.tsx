import { forwardRef, useState } from "react";
import type { ModifierAction } from "../keybinds/storage";
import type { SearchItemData } from "../types/search";

interface SearchResultRowProps {
	item: SearchItemData;
	index: number;
	isPinned?: boolean;
	isHighlighted?: boolean;
	onActivate: (item: SearchItemData) => void;
	modifierAction?: ModifierAction | null;
	onExport?: (item: SearchItemData) => void;
}

// forwardRef rather than React 19's ref-as-a-prop: preact/compat strips `ref`
// out of props, which would silently leave the FLIP animation with no nodes.
export const SearchResultRow = forwardRef<HTMLDivElement, SearchResultRowProps>(function SearchResultRow(
	{ item, index, isPinned, isHighlighted, onActivate, modifierAction, onExport },
	ref,
) {
	const [copied, setCopied] = useState<"name" | "id" | null>(null);

	// Every producer of SearchItemData already substitutes a local icon when the
	// item has none (parseItem falls back to the scope's defaultImage, getOpenTabs
	// to DefaultItemType.svg), so this last resort is only reached if a future
	// scope supplies an empty defaultImage. Keep it local: the previous fallback
	// fetched a random photo from picsum.photos, an outbound request to the public
	// internet from inside a customer's Innovator instance.
	const displayImage =
		item.image ||
		(item.favoriteId ? "../images/favoriteon.svg" : "../images/DefaultItemType.svg");

	function copyField(text: string, field: "name" | "id", e: React.MouseEvent) {
		e.stopPropagation();
		navigator.clipboard.writeText(text);
		setCopied(field);
		setTimeout(() => setCopied(null), 1400);
	}

	return (
		<div
			className={`search-item${isHighlighted ? " highlighted" : ""}`}
			ref={ref}
			id={`aps-result-${index}`}
			role="option"
			aria-selected={!!isHighlighted}
			onClick={() => onActivate(item)}
		>
			<div className="flex-row jcc aic">
				<img src={displayImage} alt={item.name} />
				<div className="flex-col">
					<span
						className="copy-field"
						title="Copy name"
						onClick={(e) => copyField(item.name, "name", e)}
					>
						{item.name}
						{item.label_plural && item.label_plural !== item.name && (
							<span className="fav-type-tag">{item.label_plural}</span>
						)}
						{item.favoriteId && item.description && (
							<span className="fav-type-tag">{item.description}</span>
						)}
						{copied === "name" && <span className="copy-popover">Copied!</span>}
					</span>
					<span
						className="copy-field fw-normal item-id"
						title="Copy id"
						onClick={(e) => copyField(item.itemId, "id", e)}
					>
						{item.itemId}
						<svg
							className="copy-glyph"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							xmlns="http://www.w3.org/2000/svg"
						>
							<rect x="9" y="9" width="11" height="11" rx="2" />
							<path d="M5 15V5a2 2 0 0 1 2-2h10" />
						</svg>
						{copied === "id" && <span className="copy-popover">Copied!</span>}
					</span>
				</div>
			</div>
			<span className="search-item-leader" />
			<div className="flex-row aic search-item-actions">
				{onExport && (
					<button
						className="export-btn"
						title="Quick Export"
						onClick={(e) => { e.stopPropagation(); onExport(item); }}
					>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="7 10 12 15 17 10" />
							<line x1="12" y1="15" x2="12" y2="3" />
						</svg>
					</button>
				)}
				{isPinned && <span className="pin-icon" title="Pinned">📌</span>}
				{modifierAction && (
					<span
						className={`modifier-hint${
							modifierAction.itemTypeOnly && item.itemTypeName !== "ItemType"
								? " unavailable"
								: ""
						}`}
					>
						{modifierAction.itemTypeOnly && item.itemTypeName !== "ItemType"
							? "ItemTypes only"
							: modifierAction.label}
					</span>
				)}
				{/* Only the first nine rows have a digit accelerator; the rest are
				    reached with the arrow keys, so numbering them would lie. */}
				{index < 9 ? <span>{index + 1}</span> : <span className="row-no-digit" />}
			</div>
		</div>
	);
});
