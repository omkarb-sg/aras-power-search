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

	const closeOverlayAfterAction = () => {
		setIsActive(false);
		resetScope();
	};

	const performSearch = (nextQuery: string, nextScope = scope) => {
		setQuery(nextQuery);
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

	const resultActions = {
		activateSearchGrid: (item: SearchItemData) => {
			if (item.itemTypeName !== "ItemType") {
				addOpenedItem(item);
			}
			closeOverlayAfterAction();
			openSearchGrid(topWindow, item);
		},
		openItemForm: (item: SearchItemData) => {
			addOpenedItem(item);
			closeOverlayAfterAction();
			openItemForm(topWindow, item);
		},
		createItem: (item: SearchItemData) => {
			closeOverlayAfterAction();
			addItemForm(topWindow, item);
		},
		whereUsed: (item: SearchItemData) => {
			addOpenedItem(item);
			closeOverlayAfterAction();
			openWhereUsed(topWindow, item);
		},
		drillToItemType: (item: SearchItemData) => {
			addOpenedItem(item);
			const nextScope = setItemTypeScope(
				item.name,
				item.label_plural || item.name,
				item.image,
			);
			setScope(nextScope);
			performSearch("", nextScope);
		},
	};

	useGlobalShortcuts({
		topWindow,
		isActive,
		results,
		actions: {
			openOverlay,
			onEscape,
			clearCache: () => clearCacheAndNotify(topWindow),
			activateSearchGrid: resultActions.activateSearchGrid,
			openItemForm: resultActions.openItemForm,
			createItem: resultActions.createItem,
			whereUsed: resultActions.whereUsed,
			drillToItemType: resultActions.drillToItemType,
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
				<SearchResultsList
					items={results}
					onPrimaryAction={resultActions.openItemForm}
					onSearchGrid={resultActions.activateSearchGrid}
					onWhereUsed={resultActions.whereUsed}
					onDrillToItemType={resultActions.drillToItemType}
					onCreateItem={resultActions.createItem}
				/>
			</SearchPanel>
		</SearchOverlay>
	);
}
