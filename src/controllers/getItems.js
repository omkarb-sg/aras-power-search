export const getAllItems = (itemTypeName, defaultImage, cache) => {

    const items = aras.IomInnovator.applyAML(`
    <AML>
        <Item
            type="${itemTypeName}"
            action="get"
            select="config_id,id,name,keyed_name,open_icon,label_plural"
            serverEvents="0"
        >
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
            name: item.getProperty("name") || item.getProperty("keyed_name"),
            description: item.getProperty("config_id"),
            itemId: item.getProperty("id"),
            itemConfigId: item.getProperty("config_id"),
            label_plural: item.getProperty("label_plural"),
            itemTypeId: item.getProperty("itemtype"),
            itemTypeName,
            imageFileId
        });
    }

    return result;
}
