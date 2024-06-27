const fetcher = async (e, searchOverlayContent) => {
	if (!_get(`_${state.itemTypeName}_cache`)) {
		const _items = await getAllItems(
			state.itemTypeName,
			state.defaultImage,
			searchOverlayContent.cache
		);

		_set(`_${state.itemTypeName}_cache`, _items);
	}
	const items = _get(`_${state.itemTypeName}_cache`) || [];
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
