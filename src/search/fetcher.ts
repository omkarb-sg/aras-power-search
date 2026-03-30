import Fuse from "fuse.js";
import { getAllItems } from "../controllers/getItems";
import type { SearchItemData } from "../types/search";

const stripExtQuery = (query: string) => query.trimStart().replace(/^\/+/, "");

const getCacheKey = (itemTypeName: string) =>
	`_${itemTypeName}_aras_power_search_cache`;

const getTimestampKey = (itemTypeName: string) =>
	`_${itemTypeName}_aras_power_search_timestamp`;

const setCache = (
	storage: Storage,
	itemTypeName: string,
	items: SearchItemData[],
) => {
	storage.setItem(getCacheKey(itemTypeName), JSON.stringify(items));
	storage.setItem(getTimestampKey(itemTypeName), String(Date.now()));
};

const getCache = (storage: Storage, itemTypeName: string): SearchItemData[] => {
	try {
		const raw = storage.getItem(getCacheKey(itemTypeName));
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? (parsed as SearchItemData[]) : [];
	} catch {
		return [];
	}
};

export const clearPowerSearchCache = (storage: Storage) => {
	const keys: string[] = [];
	for (let i = 0; i < storage.length; i++) {
		const key = storage.key(i);
		if (key) keys.push(key);
	}

	keys
		.filter(
			(key) =>
				key.endsWith("_aras_power_search_cache") ||
				key.endsWith("_aras_power_search_timestamp"),
		)
		.forEach((key) => storage.removeItem(key));
};

export const searchItems = ({
	aras,
	storage,
	query,
	itemTypeName,
	defaultImage,
	imageCache,
}: {
	aras: ArasGlobal;
	storage: Storage;
	query: string;
	itemTypeName: string;
	defaultImage: string;
	imageCache: Record<string, string>;
}): SearchItemData[] => {
	let items = getCache(storage, itemTypeName);
	if (!items.length) {
		items = getAllItems(aras, itemTypeName, defaultImage, imageCache);
		setCache(storage, itemTypeName, items);
	}

	const modeExtended = query.trimStart().startsWith("/");
	const fuse = new Fuse(items, {
		useExtendedSearch: modeExtended,
		keys: ["itemTypeName", "itemConfigId", "name"],
	});
	const searched = fuse.search(stripExtQuery(query));
	return searched.map((element) => element.item).slice(0, 9);
};
