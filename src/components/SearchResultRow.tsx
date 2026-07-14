import { useState } from "react";
import type { Ref } from "react";
import type { SearchItemData } from "../types/search";

interface SearchResultRowProps {
	item: SearchItemData;
	index: number;
	ref: Ref<HTMLDivElement>;
	isPinned?: boolean;
	isHighlighted?: boolean;
}

export function SearchResultRow({ item, index, ref, isPinned, isHighlighted }: SearchResultRowProps) {
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
			<div className="flex-row aic">
				{isPinned && <span className="pin-icon" title="Pinned">📌</span>}
				<span>{index + 1}</span>
			</div>
		</div>
	);
}
