import Fuse from "fuse.js";
import { getItemTypeIcon } from "../controllers/getItems";
import type { SearchItemData } from "../types/search";

export function getOpenTabs(
	topWindow: Window,
	imageCache: Record<string, string> = {},
): SearchItemData[] {
	return (topWindow.arasTabs?.tabs || []).flatMap((tabId) => {
		const frame = topWindow.document.getElementById(
			tabId,
		) as HTMLIFrameElement | null;
		const tabWindow = frame?.contentWindow;
		const item = tabWindow?.thisItem;
		const itemTypeName =
			item?.getType() || tabWindow?.searchContainer?.itemTypeName;
		if (!itemTypeName) return [];

		const itemId = item?.getID() || "";
		const { image, imageFileId } = topWindow.aras
			? getItemTypeIcon(
					topWindow.aras,
					itemTypeName,
					"../images/DefaultItemType.svg",
					imageCache,
				)
			: { image: "../images/DefaultItemType.svg", imageFileId: null };
		return [
			{
				name:
					item?.getProperty("keyed_name") ||
					item?.getProperty("name") ||
					`${itemTypeName} Search`,
				description: item ? itemTypeName : "Search",
				itemId,
				itemConfigId: itemId || tabId,
				label_plural: "",
				itemTypeId: "",
				itemTypeName,
				image,
				imageFileId,
				tabId,
			},
		];
	});
}

export function searchOpenTabs(
	tabs: SearchItemData[],
	query: string,
): SearchItemData[] {
	if (!query.trim()) return tabs.slice(0, 9);
	return new Fuse(tabs, { keys: ["name", "itemTypeName"] })
		.search(query)
		.map(({ item }) => item)
		.slice(0, 9);
}
