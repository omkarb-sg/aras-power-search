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

// TODO(cross-scope-search): Add a crossScopeSearch() export alongside searchItems.
// When the user types a query prefixed with '@' (e.g. "@bearing"), PowerSearchApp
// should call this instead of searchItems. Implementation outline:
//   1. Iterate all localStorage keys, collect those matching /_aras_power_search_cache$/.
//   2. Parse each cached value (JSON array of SearchItemData[]).
//   3. Concatenate all arrays into one pool and run a single Fuse instance over it,
//      using the same keys ("itemTypeName", "itemConfigId", "name").
//   4. Return the top N results (e.g. 9), preserving the itemTypeName field so the
//      UI can group or label rows by type.
//   Note: only cached types are searched — no extra network requests. Types the user
//   has never visited won't appear, which is acceptable behaviour for a first pass.

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
		keys: ["itemTypeName", "itemConfigId", "name", "label_plural"],
	});
	const searched = fuse.search(stripExtQuery(query));
	return searched.map((element) => element.item).slice(0, 9);
};
