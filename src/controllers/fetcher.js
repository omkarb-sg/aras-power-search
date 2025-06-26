import { getAllItems } from "./getItems";
import { state } from "./state";
import Fuse from "fuse.js";

const stripExtQuery = (query)=>{ 
	return query.trimStart().replace(/^\/+/, "")
}
export const fetcher = async (e, searchOverlayContent) => {
	const searchPattern = e.target.value.trim();
	if (
		!localStorage.getItem(`_${state.itemTypeName}_aras_power_search_cache`)
	) {
		const _items = getAllItems(
			state.itemTypeName,
			state.defaultImage,
			searchOverlayContent.cache,
		);

		localStorage.setItem(
			`_${state.itemTypeName}_aras_power_search_cache`,
			JSON.stringify(_items),
		);
	}
	const items =
		JSON.parse(
			localStorage.getItem(
				`_${state.itemTypeName}_aras_power_search_cache`,
			),
		) || [];
	const modeExtended = searchPattern.trimStart().startsWith("/");

	const fuseOptions = {
		// isCaseSensitive: e.target.value.trim().toLowerCase() != e.target.value.trim(),
		// includeScore: false,
		// shouldSort: true,
		// includeMatches: false,
		// findAllMatches: false,
		// minMatchCharLength: 1,
		// location: 0,
		// threshold: 0.6,
		// distance: 100,
		useExtendedSearch: modeExtended,
		// ignoreLocation: false,
		// ignoreFieldNorm: false,
		// fieldNormWeight: 1,
		keys: ["itemTypeName", "itemConfigId", "name"],
	};

	const fuse = new Fuse(items, fuseOptions);
	const searched = fuse.search(stripExtQuery(searchPattern));
	searchOverlayContent.handlesearchItemsData(
		searched.map((element) => element.item).slice(0, 9),
	);
};
