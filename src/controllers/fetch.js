const fetcher = async (e, searchOverlayContent) => {
    if (e.target.value.trim() === "") {
        searchOverlayContent.handlesearchItemsData([]);
        return;
    }
    let qry;
    if (e.target.value.trim === "*") {
        qry = "";
    }
    else {
        qry = '%' + e.target.value.trim().replaceAll(/\s+/g, "%") + '%';
    }
    if(!localStorage.getItem("_"+state.itemTypeName+"_cache")){
        const _items = await getItems(state.itemTypeName, qry, e.target.value.trim(), 9999999999, state.defaultImage, searchOverlayContent.cache);

        localStorage.setItem("_"+state.itemTypeName+"_cache", JSON.stringify(_items));
    }
    const items = JSON.parse( localStorage.getItem("_"+state.itemTypeName+"_cache")) || [];
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
        keys: [
                "itemTypeName",
                "id",
                "name",
        ]
};

    const fuse = new Fuse(items, fuseOptions);
    const searchPattern = e.target.value.trim();
    const searched = fuse.search(searchPattern)
    searchOverlayContent.handlesearchItemsData(searched.map((element)=>element.item).slice(0,9));
}

// TODO check for sg_searchable to find property names
const getItems = debounce(
    80,
    false,
    (itemTypeName, qryString, originalQryString, maxRecords, defaultImage, cache) => {

    const items = aras.IomInnovator.applyAML(`
    <AML>
        <Item type="${itemTypeName}" action="get" select="id,name,keyed_name,open_icon,label_plural">
        </Item>
    </AML>
    `);

    const result = [];
    for (let i = 0; i < items.getItemCount(); i++) {
        const item = items.getItemByIndex(i);

        let image = null;
        let imageFileId = null;
        if (item.getProperty("open_icon") && item.getPropertyAttribute("open_icon", "is_null") !== "1") {
            if (item.getProperty("open_icon").includes("vault:")) {
                imageFileId = item.getProperty("open_icon").split("=")[1];
                image = cache.images[imageFileId] || getUrlFromFileId(aras, imageFileId);
            } else {
                image = item.getProperty("open_icon");
            }
        }

        if (!image) {
            image = defaultImage;
        }
        
        result.push({
            image,
            name: item.getProperty("keyed_name"),
            description: item.getAttribute("id"),
            itemId: item.getAttribute("id"),
            label_plural :item.getProperty("label_plural"),
            // item,
            itemTypeName,
            imageFileId
        });
    }
    
    return result;
})
