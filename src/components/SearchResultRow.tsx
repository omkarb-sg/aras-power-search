import { forwardRef, useState } from "react";
import type { SearchItemData } from "../types/search";

interface SearchResultRowProps {
	item: SearchItemData;
	index: number;
	isPinned?: boolean;
	isHighlighted?: boolean;
	onExport?: (item: SearchItemData) => void;
	/** False once the quick-export extension has been probed for and not found. */
	isExportReady?: boolean;
	onExportHelp?: () => void;
}

// forwardRef rather than React 19's ref-as-a-prop: preact/compat strips `ref`
// out of props, which would silently leave the FLIP animation with no nodes.
export const SearchResultRow = forwardRef<HTMLDivElement, SearchResultRowProps>(function SearchResultRow(
	{ item, index, isPinned, isHighlighted, onExport, isExportReady = true, onExportHelp },
	ref,
) {
	const [copied, setCopied] = useState<"name" | "id" | null>(null);

	const displayImage =
		item.image || (item.favoriteId ? "../images/favoriteon.svg" : `https://picsum.photos/seed/${item.itemConfigId || index}/50/50`);

	function copyField(text: string, field: "name" | "id", e: React.MouseEvent) {
		e.stopPropagation();
		navigator.clipboard.writeText(text);
		setCopied(field);
		setTimeout(() => setCopied(null), 1400);
	}

	return (
		<div className={`search-item${isHighlighted ? " highlighted" : ""}`} ref={ref}>
			<div className="flex-row jcc aic">
				<img src={displayImage} alt={item.name} />
				<div className="flex-col">
					<span
						className="copy-field"
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
						className="copy-field fw-normal"
						onClick={(e) => copyField(item.itemId, "id", e)}
					>
						{item.itemId}
						{copied === "id" && <span className="copy-popover">Copied!</span>}
					</span>
				</div>
			</div>
			<span className="search-item-leader" />
			<div className="flex-row aic search-item-actions">
				{onExport && isExportReady && (
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
				{onExport && !isExportReady && (
					<button
						className="export-warn-btn"
						title="Quick Export unavailable — the quick-export extension wasn't found. Click for setup steps."
						aria-label="Quick Export unavailable — show setup steps"
						onClick={(e) => { e.stopPropagation(); onExportHelp?.(); }}
					>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
							<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
							<line x1="12" y1="9" x2="12" y2="13" />
							<line x1="12" y1="17" x2="12.01" y2="17" />
						</svg>
					</button>
				)}
				{isPinned && <span className="pin-icon" title="Pinned">📌</span>}
				<span>{index + 1}</span>
			</div>
		</div>
	);
});
