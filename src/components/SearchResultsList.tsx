import type { SearchItemData } from "../types/search";
import { SearchResultRow } from "./SearchResultRow";

interface SearchResultsListProps {
	items: SearchItemData[];
	onPrimaryAction: (item: SearchItemData) => void;
	onSearchGrid: (item: SearchItemData) => void;
	onWhereUsed: (item: SearchItemData) => void;
	onDrillToItemType: (item: SearchItemData) => void;
	onCreateItem: (item: SearchItemData) => void;
}

export function SearchResultsList({
	items,
	onPrimaryAction,
	onSearchGrid,
	onWhereUsed,
	onDrillToItemType,
	onCreateItem,
}: SearchResultsListProps) {
	return (
		<div className="searchResults" role="list" aria-label="Search results">
			{items.map((item, index) => (
				<SearchResultRow
					key={`${item.itemTypeName}-${item.itemConfigId}-${index}`}
					item={item}
					index={index}
					onPrimaryAction={onPrimaryAction}
					onSearchGrid={onSearchGrid}
					onWhereUsed={onWhereUsed}
					onDrillToItemType={onDrillToItemType}
					onCreateItem={onCreateItem}
				/>
			))}
		</div>
	);
}
