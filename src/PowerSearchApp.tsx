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
	ROOT_SCOPE,
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
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const [isCompoundSearch, setIsCompoundSearch] = useState(false);

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

	const updateImageCache = (items: SearchItemData[]) => {
		const cacheUpdates: Record<string, string> = {};
		for (const item of items) {
			if (item.imageFileId && item.image) {
				cacheUpdates[item.imageFileId] = item.image;
			}
		}
		if (Object.keys(cacheUpdates).length > 0) {
			setImageCache((prev) => ({ ...prev, ...cacheUpdates }));
		}
	};

	const mergeWithPinned = (
		fuseResults: SearchItemData[],
		itemTypeName: string,
	): SearchItemData[] => {
		const scopedPinned = pinnedItems.filter((p) => p.itemTypeName === itemTypeName);
		const fuseIds = new Set(fuseResults.map((r) => r.itemConfigId));
		const dedupedPinned = scopedPinned.filter((p) => !fuseIds.has(p.itemConfigId));
		return [...dedupedPinned, ...fuseResults].slice(0, 9);
	};

	const performSearch = (nextQuery: string, nextScope = scope) => {
		setQuery(nextQuery);
		setHighlightedIndex(-1);

		const aras = topWindow.aras;
		if (!aras) return;

		// Compound drill-through: type/query
		// Strip leading "/" then split on first "/" — two parts means auto-drill.
		// Single "/" prefix with no second slash stays as Fuse extended search.
		const stripped = nextQuery.replace(/^\//, "");
		const slashIdx = stripped.indexOf("/");
		if (slashIdx > 0) {
			const typePart = stripped.slice(0, slashIdx);
			const itemPart = stripped.slice(slashIdx + 1);

			const typeResults = searchItems({
				aras,
				storage: topWindow.localStorage,
				query: typePart,
				itemTypeName: "ItemType",
				defaultImage: ROOT_SCOPE.defaultImage,
				imageCache,
			});

			if (typeResults.length > 0) {
				const firstType = typeResults[0];
				const drilledScope = setItemTypeScope(
					firstType.name,
					firstType.label_plural || firstType.name,
					firstType.image,
				);
				setScope(drilledScope);
				setIsCompoundSearch(true);

				const subResults = searchItems({
					aras,
					storage: topWindow.localStorage,
					query: itemPart,
					itemTypeName: drilledScope.itemTypeName,
					defaultImage: drilledScope.defaultImage,
					imageCache,
				});

				const nextResults = mergeWithPinned(subResults, drilledScope.itemTypeName);
				setResults(nextResults);
				updateImageCache(nextResults);
				return;
			}
		}

		// Normal single-scope search
		setIsCompoundSearch(false);
		const fuseResults = searchItems({
			aras,
			storage: topWindow.localStorage,
			query: nextQuery,
			itemTypeName: nextScope.itemTypeName,
			defaultImage: nextScope.defaultImage,
			imageCache,
		});

		const nextResults = mergeWithPinned(fuseResults, nextScope.itemTypeName);
		setResults(nextResults);
		updateImageCache(nextResults);
	};

	const openOverlay = () => {
		if (isActive) return;
		setOpenedItems((previous) => trimOpenedItems(previous));
		setResults(recentItems);
		setHighlightedIndex(-1);
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
		setHighlightedIndex(-1);
		if (!isActive) {
			setOpenedItems((prev) => trimOpenedItems(prev));
			setIsActive(true);
			setSearchMode("favorites");
			setQuery("");
			const favs = loadFavorites();
			setResults(favs.slice(0, 9));
			return;
		}
		if (searchMode === "favorites") {
			setSearchMode("items");
			setQuery("");
			setResults(recentItems);
		} else {
			setSearchMode("favorites");
			setQuery("");
			const favs = loadFavorites();
			setResults(favs.slice(0, 9));
		}
	};

	const performFavoritesSearch = (nextQuery: string) => {
		setQuery(nextQuery);
		setHighlightedIndex(-1);
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
		if (isCompoundSearch) {
			setIsCompoundSearch(false);
			resetScope();
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
			navigateDown: () => {
				setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
			},
			navigateUp: () => {
				setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
			},
			enterItem: () => {
				if (highlightedIndex < 0 || highlightedIndex >= results.length) return;
				const item = results[highlightedIndex];
				if (item.favoriteId) {
					openFavoriteSearch(topWindow, item);
					setQuery("");
					setIsActive(false);
					setSearchMode("items");
					return;
				}
				if (scope.itemTypeName === "ItemType") {
					if (item.itemTypeName !== "ItemType") {
						addOpenedItem(item);
					}
					setQuery("");
					setIsActive(false);
					resetScope();
					openSearchGrid(topWindow, item);
				} else {
					addOpenedItem(item);
					setQuery("");
					setIsActive(false);
					resetScope();
					openItemForm(topWindow, item);
				}
			},
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
				<SearchResultsList items={results} pinnedItemIds={pinnedItemIds} highlightedIndex={highlightedIndex} />
			</SearchPanel>
		</SearchOverlay>
	);
}
