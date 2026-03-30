import type { SearchItemData } from "../types/search";

interface SearchResultRowProps {
	item: SearchItemData;
	index: number;
}

export function SearchResultRow({ item, index }: SearchResultRowProps) {
	const displayImage =
		item.image || `https://picsum.photos/seed/${item.itemConfigId || index}/50/50`;

	return (
		<div className="search-item">
			<div className="flex-row jcc aic">
				<img src={displayImage} alt={item.name} />
				<div className="flex-col">
					<span>{item.name}</span>
					<span className="fw-normal">{item.description}</span>
				</div>
			</div>
			<div>{index + 1}</div>
		</div>
	);
}
