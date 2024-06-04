const fetch = async (e, searchOverlayContent) => {
    debugger;
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
    const items = await getItems(state.itemTypeName, qry, e.target.value.trim(), 9, state.defaultImage, searchOverlayContent.cache);
    searchOverlayContent.handlesearchItemsData(items);
}

// TODO check for sg_searchable to find property names
const getItems = debounce(
    80,
    false,
    (itemTypeName, qryString, originalQryString, maxRecords, defaultImage, cache) => {
    // TODO select properties
    const searchableProperties = [
        "name",
        "keyed_name",
        "id"
    ];
    console.log(originalQryString);
    const items = aras.IomInnovator.applyAML(`
    <AML>
        <Item type="${itemTypeName}" action="get" maxRecords="${maxRecords}" select="id,name,keyed_name,open_icon,label_plural">
            <OR>
                ${(searchableProperties.map(searchableProperty => {
                    return `<${searchableProperty} condition="like">${qryString}</${searchableProperty}>`
                })).join("\n")}
            </OR>
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

        // Set default image
        if (!image) {
            image = defaultImage;
        }
        
        result.push({
            image,
            name: item.getProperty("keyed_name"),
            description: item.getAttribute("id"),
            item,
            itemTypeName,
            imageFileId
        });
    }

    result.sort((a, b) => {
        if (originalQryString.length === 0) return 0;
        if (a.name.toLowerCase().startsWith(originalQryString[0].toLowerCase()) && !b.name.toLowerCase().startsWith(originalQryString.toLowerCase())) {
            return -1;
        }
        return 0;
    });
    
    return result.slice(0, maxRecords);
})

