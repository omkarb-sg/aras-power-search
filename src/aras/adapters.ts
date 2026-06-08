import { clearPowerSearchCache } from "../search/fetcher";
import type { SearchItemData } from "../types/search";

export const resolveArasRuntime = (topWindow: Window) => {
	const aras = topWindow.aras;
	const arasTabs = topWindow.arasTabs;
	const dependencies = topWindow.Dependencies;

	return {
		aras,
		arasTabs,
		dependencies,
	};
};

export const openSearchGrid = (
	topWindow: Window,
	searchItemData: SearchItemData,
) => {
	const runtime = resolveArasRuntime(topWindow);
	if (!runtime.arasTabs) return;
	runtime.arasTabs.openSearch(searchItemData.itemConfigId);
};

export const openItemForm = (topWindow: Window, searchItemData: SearchItemData) => {
	const runtime = resolveArasRuntime(topWindow);
	if (!runtime.aras) return;

	const item = runtime.aras.IomInnovator.newItem(searchItemData.itemTypeName, "get");
	item.setAttribute("select", "id");
	item.setProperty("config_id", searchItemData.itemConfigId);
	runtime.aras.uiShowItem(searchItemData.itemTypeName, item.apply().getID());
};

export const addItemForm = (topWindow: Window, searchItemData: SearchItemData) => {
	const runtime = resolveArasRuntime(topWindow);
	if (!runtime.aras) return;

	const item = runtime.aras.IomInnovator.newItem(searchItemData.name, "add");
	runtime.aras.uiShowItemEx(item.node);
};

export const openWhereUsed = (topWindow: Window, searchItemData: SearchItemData) => {
	const runtime = resolveArasRuntime(topWindow);
	if (!runtime.aras || !runtime.dependencies) return;

	runtime.dependencies.view(
		searchItemData.itemTypeName,
		searchItemData.itemConfigId,
		true,
		runtime.aras,
	);
};

export const openFavoriteSearch = (
	topWindow: Window,
	item: SearchItemData,
) => {
	const runtime = resolveArasRuntime(topWindow);
	if (!runtime.arasTabs || !item.favoriteId) return;

	if (item.itemTypeId) {
		runtime.arasTabs.openSearch(item.itemTypeId, item.favoriteId);
	} else {
		// best-effort fallback when type resolution failed
		runtime.arasTabs.openSearch(item.favoriteId);
	}
};

export const clearCacheAndNotify = (topWindow: Window) => {
	clearPowerSearchCache(topWindow.localStorage);
	topWindow.aras?.AlertSuccess("Cleared aras-power-search cache");
};
