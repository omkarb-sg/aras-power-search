import { useState } from "react";
import type { Ref } from "react";
import type { SearchItemData } from "../types/search";

interface SearchResultRowProps {
	item: SearchItemData;
	index: number;
	ref: Ref<HTMLDivElement>;
	isPinned?: boolean;
}

export function SearchResultRow({ item, index, ref, isPinned }: SearchResultRowProps) {
	const [copied, setCopied] = useState<"name" | "id" | null>(null);

	const displayImage =
		item.image || `https://picsum.photos/seed/${item.itemConfigId || index}/50/50`;

	function copyField(text: string, field: "name" | "id", e: React.MouseEvent) {
		e.stopPropagation();
		navigator.clipboard.writeText(text);
		setCopied(field);
		setTimeout(() => setCopied(null), 1400);
	}

	return (
		<div className="search-item" ref={ref}>
			<div className="flex-row jcc aic">
				<img src={displayImage} alt={item.name} />
				<div className="flex-col">
					<span
						className="copy-field"
						onClick={(e) => copyField(item.name, "name", e)}
					>
						{item.name}
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
