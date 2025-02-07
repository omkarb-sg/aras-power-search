/**
 * @type {Object} 
 * @prop {String} itemTypeName
 * @prop {SearchOverlayContent} searchOverlayContent
 * @prop {Function} reset
 * @prop {Function} setItemTypeName
 * @prop {String} defaultImage
 * @prop {Element[]} attachedIframes
 * @prop {SearchItem[]} openedItems
 */
export const state = {
	itemTypeName: "ItemType",
	searchOverlayContent: null,
	reset: function() {
		this.itemTypeName = "ItemType";
		this.defaultImage = "../images/ItemType.svg";
		this.searchOverlayContent.elements.title.textContent = "ItemTypes";
		this.searchOverlayContent.elements.input.value = "";
		this.searchOverlayContent.elements.input.placeholder = `Search ItemType`;
		this.openedItems = this.openedItems.slice(-9)
		this.searchOverlayContent.handlesearchItemsData(this.openedItems.map(s => s.data).reverse());
	}
	,
	setItemTypeName: function(name, label_plural, defaultImage) {
		this.itemTypeName = name;
		this.defaultImage = defaultImage || "../images/DefaultItemType.svg";
		this.searchOverlayContent.elements.title.textContent = label_plural;
		this.searchOverlayContent.elements.input.value = "";
		this.searchOverlayContent.elements.input.placeholder = `Search ${label_plural}`;
		this.searchOverlayContent.handlesearchItemsData([]);
	},
	defaultImage: null,
	attachedIframes: [],
	openedItems: [],
}

