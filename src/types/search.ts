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
}

export type SearchMode = "items" | "favorites";

export interface OpenedItemEntry {
	data: SearchItemData;
	image: string | null;
}
