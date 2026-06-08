import { useMemo, useState } from "react";
import {
	addItemForm,
	clearCacheAndNotify,
	openFavoriteSearch,
	openItemForm,
	openSearchGrid,
	openWhereUsed,
} from "./aras/adapters";
import { KeybindsHelp } from "./components/KeybindsHelp";
import { SearchOverlay } from "./components/SearchOverlay";
import { SearchPanel } from "./components/SearchPanel";
import { SearchResultsList } from "./components/SearchResultsList";
import { SettingsPanel } from "./components/SettingsPanel";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";
import type { KeybindsConfig } from "./keybinds/defaults";
import { loadKeybinds, saveKeybinds } from "./keybinds/storage";
import { fetchFavorites, searchFavorites } from "./search/favorites";
import { searchItems } from "./search/fetcher";
import {
	createInitialScope,
	pushOpenedItem,
	resetToRootScope,
	setItemTypeScope,
	trimOpenedItems,
} from "./state/powerSearchStore";
import type { OpenedItemEntry, SearchItemData, SearchMode } from "./types/search";

interface PowerSearchAppProps {
	topWindow: Window;
}

export function PowerSearchApp({ topWindow }: PowerSearchAppProps) {
	const [scope, setScope] = useState(createInitialScope);
	const [isActive, setIsActive] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchItemData[]>([]);
	const [openedItems, setOpenedItems] = useState<OpenedItemEntry[]>([]);
	const [imageCache, setImageCache] = useState<Record<string, string>>({});
	const [isHelpActive, setIsHelpActive] = useState(false);
	const [isSettingsActive, setIsSettingsActive] = useState(false);
	const [keybinds, setKeybinds] = useState<KeybindsConfig>(() =>
		loadKeybinds(topWindow.localStorage),
	);
	const [pinnedItems, setPinnedItems] = useState<SearchItemData[]>(() => {
		try {
			const raw = topWindow.localStorage.getItem("_aras_power_search_pinned");
			return raw ? (JSON.parse(raw) as SearchItemData[]) : [];
		} catch {
			return [];
		}
	});

	const [searchMode, setSearchMode] = useState<SearchMode>("items");
	const [favorites, setFavorites] = useState<SearchItemData[]>([]);

	const recentItems = useMemo(
		() => trimOpenedItems(openedItems).map((entry) => entry.data).reverse(),
		[openedItems],
	);

	const pinnedItemIds = useMemo(
		() => new Set(pinnedItems.map((p) => p.itemConfigId)),
		[pinnedItems],
	);

	const togglePin = (item: SearchItemData) => {
		setPinnedItems((prev) => {
			const exists = prev.some((p) => p.itemConfigId === item.itemConfigId);
			const next = exists
				? prev.filter((p) => p.itemConfigId !== item.itemConfigId)
				: [...prev, item];
			topWindow.localStorage.setItem("_aras_power_search_pinned", JSON.stringify(next));
			return next;
		});
	};

	const resetScope = () => {
		setScope(resetToRootScope());
		setQuery("");
		setResults(recentItems);
	};

	const closeOverlay = () => {
		setIsActive(false);
		setSearchMode("items");
		resetScope();
	};

	const performSearch = (nextQuery: string, nextScope = scope) => {
		setQuery(nextQuery);

		// TODO(recent-items): Fuse.js returns [] for an empty string query, so clearing
		// the search box currently leaves the results blank. Fall back to recentItems
		// when the query is empty so the panel stays populated:
		//   if (!nextQuery) { setResults(recentItems); return; }
		// Also consider passing an `isShowingRecent` flag through to SearchResultsList
		// so it can render a subtle "Recent" section label above the rows.

		const aras = topWindow.aras;
		if (!aras) return;
		const fuseResults = searchItems({
			aras,
			storage: topWindow.localStorage,
			query: nextQuery,
			itemTypeName: nextScope.itemTypeName,
			defaultImage: nextScope.defaultImage,
			imageCache,
		});

		const scopedPinned = pinnedItems.filter(
			(p) => p.itemTypeName === nextScope.itemTypeName,
		);
		const fuseIds = new Set(fuseResults.map((r) => r.itemConfigId));
		const dedupedPinned = scopedPinned.filter((p) => !fuseIds.has(p.itemConfigId));
		const nextResults = [...dedupedPinned, ...fuseResults].slice(0, 9);
		setResults(nextResults);

		const cacheUpdates: Record<string, string> = {};
		nextResults.forEach((result) => {
			if (result.imageFileId && result.image) {
				cacheUpdates[result.imageFileId] = result.image;
			}
		});
		if (Object.keys(cacheUpdates).length > 0) {
			setImageCache((previous) => ({
				...previous,
				...cacheUpdates,
			}));
		}
	};

	const openOverlay = () => {
		if (isActive) return;
		setOpenedItems((previous) => trimOpenedItems(previous));
		setResults(recentItems);
		setIsActive(true);
	};

	const addOpenedItem = (item: SearchItemData) => {
		setOpenedItems((previous) =>
			pushOpenedItem(previous, {
				data: item,
				image: item.image,
			}),
		);
	};

	const loadFavorites = (): SearchItemData[] => {
		const aras = topWindow.aras;
		if (!aras) return [];
		if (favorites.length > 0) return favorites;
		const fetched = fetchFavorites(aras);
		setFavorites(fetched);
		return fetched;
	};

	const toggleFavoritesMode = () => {
		if (!isActive) {
			// Open overlay directly into favorites mode
			setOpenedItems((prev) => trimOpenedItems(prev));
			setIsActive(true);
			setSearchMode("favorites");
			setQuery("");
			const favs = loadFavorites();
			setResults(favs.slice(0, 9));
			return;
		}
		if (searchMode === "favorites") {
			// Switch back to items mode
			setSearchMode("items");
			setQuery("");
			setResults(recentItems);
		} else {
			// Switch to favorites mode
			setSearchMode("favorites");
			setQuery("");
			const favs = loadFavorites();
			setResults(favs.slice(0, 9));
		}
	};

	const performFavoritesSearch = (nextQuery: string) => {
		setQuery(nextQuery);
		const favs = favorites.length > 0 ? favorites : loadFavorites();
		setResults(searchFavorites(favs, nextQuery));
	};

	const onEscape = () => {
		if (isSettingsActive) {
			setIsSettingsActive(false);
			return;
		}
		if (isHelpActive) {
			setIsHelpActive(false);
			return;
		}
		if (query !== "") {
			if (searchMode === "favorites") {
				performFavoritesSearch("");
			} else {
				performSearch("");
			}
			return;
		}
		if (searchMode === "favorites") {
			// Switch back to items mode
			setSearchMode("items");
			setResults(recentItems);
			return;
		}
		if (scope.itemTypeName !== "ItemType") {
			resetScope();
			return;
		}
		closeOverlay();
	};

	useGlobalShortcuts({
		topWindow,
		isActive,
		isSettingsActive,
		results,
		keybinds,
		actions: {
			openOverlay,
			onEscape,
			clearCache: () => clearCacheAndNotify(topWindow),
			toggleFavorites: toggleFavoritesMode,
			activateSearchGrid: (item) => {
				if (item.favoriteId) {
					openFavoriteSearch(topWindow, item);
					setQuery("");
					setIsActive(false);
					setSearchMode("items");
					return;
				}
				if (item.itemTypeName !== "ItemType") {
					addOpenedItem(item);
				}
				setQuery("");
				setIsActive(false);
				resetScope();
				openSearchGrid(topWindow, item);
			},
			openItemForm: (item) => {
				if (item.favoriteId) {
					openFavoriteSearch(topWindow, item);
					setQuery("");
					setIsActive(false);
					setSearchMode("items");
					return;
				}
				addOpenedItem(item);
				setQuery("");
				setIsActive(false);
				resetScope();
				openItemForm(topWindow, item);
			},
			createItem: (item) => {
				setQuery("");
				setIsActive(false);
				resetScope();
				addItemForm(topWindow, item);
			},
			whereUsed: (item) => {
				addOpenedItem(item);
				setQuery("");
				setIsActive(false);
				resetScope();
				openWhereUsed(topWindow, item);
			},
			drillToItemType: (item) => {
				addOpenedItem(item);
				const nextScope = setItemTypeScope(
					item.name,
					item.label_plural || item.name,
					item.image,
				);
				setScope(nextScope);
				performSearch("", nextScope);
			},
			togglePin,
			showHelp: () => setIsHelpActive(true),
			hideHelp: () => setIsHelpActive(false),
		},
	});

	if (!isActive) {
		return <SearchOverlay isActive={false} />;
	}

	if (isSettingsActive) {
		return (
			<SearchOverlay isActive={true}>
				<SettingsPanel
					keybinds={keybinds}
					onSave={(config) => {
						saveKeybinds(topWindow.localStorage, config);
						setKeybinds(config);
						setIsSettingsActive(false);
					}}
					onClose={() => setIsSettingsActive(false)}
				/>
			</SearchOverlay>
		);
	}

	if (isHelpActive) {
		return (
			<SearchOverlay isActive={true}>
				<KeybindsHelp keybinds={keybinds} />
			</SearchOverlay>
		);
	}

	const isFavMode = searchMode === "favorites";

	return (
		<SearchOverlay isActive={isActive}>
			<SearchPanel
				title={isFavMode ? "Favorites" : scope.title}
				placeholder={isFavMode ? "Search Favorites" : scope.placeholder}
				query={query}
				onQueryChange={isFavMode ? performFavoritesSearch : performSearch}
				onSettingsClick={() => setIsSettingsActive(true)}
			>
				<SearchResultsList items={results} pinnedItemIds={pinnedItemIds} />
			</SearchPanel>
		</SearchOverlay>
	);
}
