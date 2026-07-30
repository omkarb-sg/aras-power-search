export interface SearchItemData {
	image: string | null;
	name: string;
	description: string;
	itemId: string;
	itemConfigId: string;
	label_plural: string;
	itemTypeId: string;
	itemTypeName: string;
	imageFileId: string | null;
	/** Present when this item is a saved favorite search */
	favoriteId?: string;
	/** Present when this result points at an already-open Aras tab */
	tabId?: string;
}

export type SearchMode = "items" | "favorites" | "tabs";

export interface OpenedItemEntry {
	data: SearchItemData;
	image: string | null;
}
