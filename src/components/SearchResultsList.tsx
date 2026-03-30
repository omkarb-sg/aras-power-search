import type { SearchItemData } from "../types/search";
import { SearchResultRow } from "./SearchResultRow";

interface SearchResultsListProps {
	items: SearchItemData[];
}

export function SearchResultsList({ items }: SearchResultsListProps) {
	return (
		<div className="searchResults">
			{items.map((item, index) => (
				<SearchResultRow
					key={`${item.itemTypeName}-${item.itemConfigId}-${index}`}
					item={item}
					index={index}
				/>
			))}
		</div>
	);
}
