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
}

export interface OpenedItemEntry {
	data: SearchItemData;
	image: string | null;
}
