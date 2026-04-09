import { useMemo, useState } from "react";
import {
	addItemForm,
	clearCacheAndNotify,
	openItemForm,
	openSearchGrid,
	openWhereUsed,
} from "./aras/adapters";
import { SearchOverlay } from "./components/SearchOverlay";
import { SearchPanel } from "./components/SearchPanel";
import { SearchResultsList } from "./components/SearchResultsList";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";
import { searchItems } from "./search/fetcher";
import {
	createInitialScope,
	pushOpenedItem,
	resetToRootScope,
	setItemTypeScope,
	trimOpenedItems,
} from "./state/powerSearchStore";
import type { OpenedItemEntry, SearchItemData } from "./types/search";

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

	const recentItems = useMemo(
		() => trimOpenedItems(openedItems).map((entry) => entry.data).reverse(),
		[openedItems],
	);

	const resetScope = () => {
		setScope(resetToRootScope());
		setQuery("");
		setResults(recentItems);
	};

	const closeOverlay = () => {
		setIsActive(false);
		resetScope();
	};

	// TODO(pinned-items): Add a `pinnedItems` state (SearchItemData[]) persisted to
	// localStorage under '_aras_power_search_pinned'. On every search, prepend pinned
	// items that match the current scope to the top of `results`, deduplicating against
	// the Fuse results so pinned items don't appear twice. A togglePin(item) action
	// should be wired to a Ctrl+D shortcut in useGlobalShortcuts — see the TODO there.

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
		const nextResults = searchItems({
			aras,
			storage: topWindow.localStorage,
			query: nextQuery,
			itemTypeName: nextScope.itemTypeName,
			defaultImage: nextScope.defaultImage,
			imageCache,
		});
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

	const onEscape = () => {
		if (query !== "") {
			performSearch("");
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
		results,
		actions: {
			openOverlay,
			onEscape,
			clearCache: () => clearCacheAndNotify(topWindow),
			activateSearchGrid: (item) => {
				if (item.itemTypeName !== "ItemType") {
					addOpenedItem(item);
				}
				setQuery("");
				setIsActive(false);
				resetScope();
				openSearchGrid(topWindow, item);
			},
			openItemForm: (item) => {
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
		},
	});

	if (!isActive) {
		return <SearchOverlay isActive={false} />;
	}

	return (
		<SearchOverlay isActive={isActive}>
			<SearchPanel
				title={scope.title}
				placeholder={scope.placeholder}
				query={query}
				onQueryChange={performSearch}
			>
				<SearchResultsList items={results} />
			</SearchPanel>
		</SearchOverlay>
	);
}
