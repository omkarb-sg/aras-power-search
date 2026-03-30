import { keepUniqueOrdered } from "../utils";
import type { OpenedItemEntry } from "../types/search";

export interface PowerSearchScope {
	itemTypeName: string;
	title: string;
	placeholder: string;
	defaultImage: string;
}

export const ROOT_SCOPE: PowerSearchScope = {
	itemTypeName: "ItemType",
	title: "ItemTypes",
	placeholder: "Search ItemType",
	defaultImage: "../images/ItemType.svg",
};

export const createInitialScope = (): PowerSearchScope => ({
	...ROOT_SCOPE,
});

export const resetToRootScope = (): PowerSearchScope => ({
	...ROOT_SCOPE,
});

export const setItemTypeScope = (
	name: string,
	labelPlural: string,
	defaultImage: string | null,
): PowerSearchScope => ({
	itemTypeName: name,
	title: labelPlural,
	placeholder: `Search ${labelPlural}`,
	defaultImage: defaultImage || "../images/DefaultItemType.svg",
});

export const trimOpenedItems = (openedItems: OpenedItemEntry[]) =>
	openedItems.slice(-9);

export const pushOpenedItem = (
	openedItems: OpenedItemEntry[],
	openedItem: OpenedItemEntry,
) =>
	keepUniqueOrdered([...openedItems, openedItem], (item) =>
		JSON.stringify(item.data, Object.keys(item.data).sort()),
	).slice(-9);
