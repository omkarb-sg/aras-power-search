import { useFlipAnimation } from "../hooks/useFlipAnimation";
import type { SearchItemData } from "../types/search";
import { SearchResultRow } from "./SearchResultRow";

interface SearchResultsListProps {
	items: SearchItemData[];
	pinnedItemIds: Set<string>;
	highlightedIndex: number;
	/** Called when a row is clicked — same behaviour as pressing Enter on it. */
	onActivate: (item: SearchItemData) => void;
	onExport?: (item: SearchItemData) => void;
	isExportReady?: boolean;
	onExportHelp?: () => void;
}

export function SearchResultsList({
	items,
	pinnedItemIds,
	highlightedIndex,
	onActivate,
	onExport,
	isExportReady,
	onExportHelp,
}: SearchResultsListProps) {
	const { getRef } = useFlipAnimation(items, (item) => item.itemId, {
		duration: 300,
		easing: "ease",
		movingStyles: { opacity: "0.6" },
	});

	return (
		<div className="searchResults" id="aps-results" role="listbox" aria-label="Search results">
			{items.map((item, index) => (
				<SearchResultRow
					key={item.itemId}
					ref={getRef<HTMLDivElement>(item.itemId)}
					item={item}
					index={index}
					isPinned={pinnedItemIds.has(item.itemConfigId)}
					isHighlighted={index === highlightedIndex}
					onActivate={onActivate}
					onExport={onExport}
					isExportReady={isExportReady}
					onExportHelp={onExportHelp}
				/>
			))}
		</div>
	);
}
