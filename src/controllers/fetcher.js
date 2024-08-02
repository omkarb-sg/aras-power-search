const fetcher = async (e, searchOverlayContent) => {
	if (aras_power_get(`_${state.itemTypeName}_aras_power_search_cache_${_aras_power_globals.key_prefix}`)) {
		const _items = getAllItems(
			state.itemTypeName,
			state.defaultImage,
			searchOverlayContent.cache
		);
		aras_power_set(`_${state.itemTypeName}_aras_power_search_cache_${_aras_power_globals.key_prefix}`, _items);
		/// localStorage.setItem(``, JSON.stringify(_items));

	}
	const items = aras_power_get(`_${state.itemTypeName}_aras_power_search_cache_${_aras_power_globals.key_prefix}`)
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
		// useExtendedSearch: false,
		// ignoreLocation: false,
		// ignoreFieldNorm: false,
		// fieldNormWeight: 1,
		keys: ["itemTypeName", "itemId", "name"],
	};

	const fuse = new Fuse(items, fuseOptions);
	const searchPattern = e.target.value.trim();
	const searched = fuse.search(searchPattern);
	searchOverlayContent.handlesearchItemsData(searched.map((element) => element.item).slice(0, 9));
};
