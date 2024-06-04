const state = {
    itemTypeName: "ItemType",
    searchOverlayContent: null,
    reset: null,
    setItemTypeName: null,
    defaultImage: null,
}

state.reset = function() {
    this.itemTypeName = "ItemType",
    this.defaultImage = "../images/ItemType.svg";
    this.searchOverlayContent.elements.title.textContent = "ItemTypes";
    this.searchOverlayContent.elements.input.value = "";
    this.searchOverlayContent.elements.input.placeholder = `Search ItemType`;
    this.searchOverlayContent.handlesearchItemsData([]);
}

state.setItemTypeName = function(name, label_plural, defaultImage) {
    this.itemTypeName = name;
    this.defaultImage = defaultImage || "../images/DefaultItemType.svg";
    this.searchOverlayContent.elements.title.textContent = label_plural;
    this.searchOverlayContent.elements.input.value = "";
    this.searchOverlayContent.elements.input.placeholder = `Search ${label_plural}`;
    this.searchOverlayContent.handlesearchItemsData([]);
}