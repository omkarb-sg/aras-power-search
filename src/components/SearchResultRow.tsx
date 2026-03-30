import type { MouseEvent } from "react";
import type { SearchItemData } from "../types/search";

interface SearchResultRowProps {
	item: SearchItemData;
	index: number;
	onPrimaryAction: (item: SearchItemData) => void;
	onSearchGrid: (item: SearchItemData) => void;
	onWhereUsed: (item: SearchItemData) => void;
	onDrillToItemType: (item: SearchItemData) => void;
	onCreateItem: (item: SearchItemData) => void;
}

export function SearchResultRow({
	item,
	index,
	onPrimaryAction,
	onSearchGrid,
	onWhereUsed,
	onDrillToItemType,
	onCreateItem,
}: SearchResultRowProps) {
	const displayImage =
		item.image || `https://picsum.photos/seed/${item.itemConfigId || index}/50/50`;
	const isItemType = item.itemTypeName === "ItemType";

	const handleInlineAction =
		(callback: (entry: SearchItemData) => void) => (event: MouseEvent<HTMLButtonElement>) => {
			event.stopPropagation();
			callback(item);
		};

	return (
		<div className="search-item" onClick={() => onPrimaryAction(item)}>
			<div className="flex-row jcc aic">
				<img src={displayImage} alt={item.name} />
				<div className="flex-col">
					<span>{item.name}</span>
					<span className="fw-normal">{item.description}</span>
				</div>
			</div>
			<div className="search-item-meta">
				<div className="search-item-actions">
					<button
						type="button"
						className="search-item-action"
						title="Open search grid"
						onClick={handleInlineAction(onSearchGrid)}
					>
						Grid
					</button>
					<button
						type="button"
						className="search-item-action"
						title="Open where used"
						onClick={handleInlineAction(onWhereUsed)}
					>
						Where used
					</button>
					{isItemType ? (
						<>
							<button
								type="button"
								className="search-item-action"
								title="Drill into item type"
								onClick={handleInlineAction(onDrillToItemType)}
							>
								Drill
							</button>
							<button
								type="button"
								className="search-item-action"
								title="Create item"
								onClick={handleInlineAction(onCreateItem)}
							>
								Create
							</button>
						</>
					) : null}
				</div>
				<div className="search-item-index">{index + 1}</div>
			</div>
		</div>
	);
}
