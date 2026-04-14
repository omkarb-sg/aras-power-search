import type { Ref } from "react";
import type { SearchItemData } from "../types/search";

interface SearchResultRowProps {
	item: SearchItemData;
	index: number;
	ref: Ref<HTMLDivElement>;
	isPinned?: boolean;
}

export function SearchResultRow({ item, index, ref, isPinned }: SearchResultRowProps) {
	const displayImage =
		item.image || `https://picsum.photos/seed/${item.itemConfigId || index}/50/50`;

	return (
		<div className="search-item" ref={ref}>
			<div className="flex-row jcc aic">
				<img src={displayImage} alt={item.name} />
				<div className="flex-col">
					<span>{item.name}</span>
					<span className="fw-normal">{item.description}</span>
				</div>
			</div>
			<div className="flex-row aic">
				{isPinned && <span className="pin-icon" title="Pinned">📌</span>}
				<span>{index + 1}</span>
			</div>
		</div>
	);
}
