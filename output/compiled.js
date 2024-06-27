const jq_throttle = function (delay, no_trailing, callback, debounce_mode) {
    var timeout_id, last_exec = 0;
    if (typeof no_trailing !== 'boolean') {
        debounce_mode = callback;
        callback = no_trailing;
        no_trailing = undefined;
    }
    function wrapper() {
        return new Promise((res, rej) => {
                var that = this,
                elapsed = +new Date() - last_exec, args = arguments;
                function exec() {
                last_exec = +new Date();
                return callback.apply(that, args);
            };
            function clear() {
                timeout_id = undefined;
            };
            if (debounce_mode && !timeout_id) {
                return res(exec());
            }
            timeout_id && clearTimeout(timeout_id);
            if (debounce_mode === undefined && elapsed > delay) {
                return res(exec());
            } else if (no_trailing !== true) {
                timeout_id = setTimeout(debounce_mode ? clear : () => {res(exec())}, debounce_mode === undefined ? delay - elapsed : delay);
            }
        })
    };
    return wrapper;
};

const debounce = function (delay, at_begin, callback) {
    console.assert(callback !== null, "Callback is null");
    return jq_throttle(delay, callback, at_begin !== false);
};
function getUrlFromFileId(aras, fileId) {
    let file = aras.IomInnovator.newItem("File", "get");
    file.setAttribute("id", fileId);
    file = file.apply();
    if (file.isError()) return null;
    return aras.vault.vault.makeFileDownloadUrl(aras.getFileURLEx(file.node));
}

const state = {
    itemTypeName: "ItemType",
    searchOverlayContent: null,
    reset: null,
    setItemTypeName: null,
    defaultImage: null,
    attachedIframes: [],
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
class SearchItem {
    constructor(name, description, image, index, data) {
        this.elements = {};
        this.data = data; // Straight from what fetch() returns
        this.index = index;
        this.createDom(image, name, description, index);
    }

    createDom(image, name, description, index) {
        this.remove();

        this.elements.root = top.document.createElement("div");
        this.elements.root.classList.add("search-item");
        
        const content = top.document.createElement("div");
        content.classList.add("flex-row", "jcc", "aic");
        this.elements.image = top.document.createElement("img");
        // this.elements.image.src = image || "";
        this.elements.image.src = image || `https://picsum.photos/seed/${Date.now()}/50/50`;
        const nameDescriptionContainer = top.document.createElement("div");
        nameDescriptionContainer.classList.add("flex-col");
        this.elements.name = top.document.createElement("span");
        this.elements.name.textContent = name;
        this.elements.description = top.document.createElement("span");
        this.elements.description.classList.add("fw-normal");
        this.elements.description.textContent = description;
        nameDescriptionContainer.appendChild(this.elements.name);
        nameDescriptionContainer.appendChild(this.elements.description);
        content.appendChild(this.elements.image);
        content.appendChild(nameDescriptionContainer);

        this.elements.index = top.document.createElement("div");
        this.elements.index.textContent = index;

        this.elements.root.appendChild(content);
        this.elements.root.appendChild(this.elements.index);
    }

    // get name() {
    //     return this.elements.name.textContent;
    // }

    // set name(name) {
    //     this.elements.name.textContent = name;
    // }

    // get description() {
    //     return this.elements.description.textContent;
    // }

    // set description(description) {
    //     this.elements.description.textContent = description;
    // }

    remove() {
        if (this.elements.root) {
            this.elements.root.remove();
        }
        this.elements = {};
    }
    
    getRoot() {
        if (!this.elements.root) {
            throw new Error("Call to get root but root doesn't exist");
        }
        return this.elements.root;
    }
}

class SearchResults {
    /**
     *  ```js
     *  searchItemsData = {
     *      image,
     *      name,
     *      description
     *  }
     *  ```
     * 
     * The array is used as reference
     */
    constructor(searchItemsData, searchOverlayContent) {
        console.assert(searchItemsData instanceof Array, "searchItems be an array");
        this.searchOverlayContent = searchOverlayContent;
        this.elements = {};
        this.searchItems = [];
        this.setSearchResults(searchItemsData);
        this.associatedShortcuts = {
            "keydown": [
                // ...handlers
            ]
        };
    }
    
    setSearchResults(searchItemsData) {
        this.remove();
        this.elements.root = top.document.createElement("div");
        this.elements.root.classList.add("searchResults");
        searchItemsData.forEach((searchItemData, i) => {
            this.searchItems[i] = new SearchItem(searchItemData.name, searchItemData.description, searchItemData.image, i+1, searchItemData);
            this.elements.root.appendChild(this.searchItems[i].getRoot());
        });

        this.setKeyboardShortcuts(true);
    }

    remove() {
        this.setKeyboardShortcuts(false);
        if (this.elements.root) {
            this.elements.root.remove();
        }
        this.elements = {};
        this.searchItems = [];
    }

    setKeyboardShortcuts(toSet) {
        if (!toSet) {
            for (const event in this.associatedShortcuts) {
                this.associatedShortcuts[event].forEach(handler => {
                    top.document.removeEventListener(event, handler);
                })
            }
            return;
        }

        this.searchItems.forEach(searchItem => {
            const shortcutHandlerOpen = (e) => {
                if ((e.keyCode === 48 + searchItem.index)
                    && e.ctrlKey
                    && e.altKey
                    && !e.shiftKey
                    && searchItem.data.itemTypeName === "ItemType") {
                    // Open SearchGrid

                    e.preventDefault();
                    this.searchOverlayContent.elements.input.value = "";
                    this.searchOverlayContent.deactivate();
                    arasTabs.openSearch(searchItem.data.itemId);
                }
                else if (
                    (e.keyCode === 48 + searchItem.index)
                    && e.ctrlKey
                    && !e.altKey
                    && !e.shiftKey
                ) {
                    // Open item
                    const item = aras.IomInnovator.newItem(searchItem.data.name, "add");
                    this.searchOverlayContent.elements.input.value = "";
                    this.searchOverlayContent.deactivate();
                    aras.uiShowItemEx(item.node);
                }
                else if ((e.keyCode === 48 + searchItem.index) && e.ctrlKey && !e.altKey && !e.shiftKey) {
                    e.preventDefault();
                    this.searchOverlayContent.elements.input.value = "";
                    this.searchOverlayContent.deactivate();
                    aras.uiShowItem(searchItem.data.itemTypeName, searchItem.data.itemId);
                }
                else if (
                    (e.keyCode === 48 + searchItem.index) 
                    && e.ctrlKey
                    && e.altKey
                    && e.shiftKey
                    && searchItem.data.itemTypeName === "ItemType"
                ) {
                    // Add item
                    const item = aras.IomInnovator.newItem(searchItem.data.name, "add");
                    this.searchOverlayContent.elements.input.value = "";
                    this.searchOverlayContent.deactivate();
                    aras.uiShowItemEx(item.node);
                }
            }
            const shortcutHandlerChangeSearch = searchItem.data.itemTypeName === "ItemType" ? (e) => {
                if ((e.keyCode === 48 + searchItem.index)
                    && e.altKey
                    && !e.ctrlKey
                    && !e.shiftKey
                ) {
                    // Search Items
                    e.preventDefault();
                    this.searchOverlayContent.elements.input.value = "";
                    state.setItemTypeName(searchItem.data.name, searchItem.data.label_plural || searchItem.data.name, searchItem.elements.image.src);
                }
            } : null;
            this.associatedShortcuts["keydown"].push(shortcutHandlerOpen);
            top.document.addEventListener("keydown", shortcutHandlerOpen);
            if (shortcutHandlerChangeSearch) {
                this.associatedShortcuts["keydown"].push(shortcutHandlerChangeSearch);
                top.document.addEventListener("keydown", shortcutHandlerChangeSearch);
            }
        })
    }

    getSearchItem(index) {
        console.assert(index < this.searchItems.length, "Requesting search item out of bounds");
        return this.searchItems[index];
    }

    getRoot() {
        if (!this.elements.root) {
            throw new Error("Call to get root but root doesn't exist");
        }
        return this.elements.root;
    }
}

class SearchOverlayContent {
    constructor(title, inputPlaceholder, searchOverlay) {
        this.elements = {};
        this.events = {
            "input": [],
            "keydown": []
        }
        this.searchOverlay = searchOverlay;

        this.createDom(title, inputPlaceholder);
        searchOverlay.appendChild(this.getRoot());
        this.applyKeyEvents();
        this.isActive = false;

        this.cache = {
            images: {
                // "fileId": "imageUrl"
            }
        };
        state.searchOverlayContent = this;
        state.reset();
    }
    
    createDom(title, inputPlaceholder) {
        this.remove();

        this.elements.root = top.document.createElement("div");
        this.elements.root.classList.add("search-overlay-content");

        this.elements.title = top.document.createElement("h2");
        this.elements.title.classList.add("m-05");
        this.elements.title.textContent = title;
        
        this.elements.input = top.document.createElement("input");
        this.elements.input.classList.add("search-input");
        this.elements.input.type = "text";
        this.elements.input.placeholder = inputPlaceholder;
        this.elements.input.spellCheck = false;

        this.elements.searchResults = new SearchResults([], this);
        
        this.elements.root.appendChild(this.elements.title);
        this.elements.root.appendChild(this.elements.input);
        this.elements.root.appendChild(this.elements.searchResults.getRoot());
    }

    applyKeyEvents() {
        this.events["keydown"].push({
            handler: (e) => {
                if (e.key === "Escape") {
                    if (this.elements.input.value !== "") {
                        this.elements.input.value = "";
                        return;
                    }
                    if (state.itemTypeName !== "ItemType") {
                        state.reset();
                        return;
                    }
                    this.searchOverlay.style.display = 'none';
                    this.deactivate();
                }
            },
            originalHandler: (e) => {} // Only needed when perma removing handler, not required
        })
    }
    
    remove() {
        if (this.elements.root) {
            this.elements.root.remove();
        }
        this.elements = {};
    }

    on(event, handler, ...args) {
        if (!this.events[event]) {
            console.assert(`Event ${event} is not supported`);
        }
        this.events[event].push({
            handler: async (e) => {
                await handler(e, ...args);
            },
            originalHandler: handler
        });
    }
    off(event, handler) {
        if (!this.events[event]) {
            console.assert(`Event ${event} is not supported`);
        }
        
        this.events[event] = this.events[event].filter(existingEvent => existingEvent.originalHandler !== handler);
    }
    
    // To be called from outside when search items are fetched
    handlesearchItemsData(searchItemsData) {
        searchItemsData.forEach(searchItemData => {
            if (!searchItemData.imageFileId || this.cache["images"][searchItemData.imageFileId]) return;
            this.cache["images"][searchItemData.imageFileId] = searchItemData.image;
        });
        this.elements.searchResults.setSearchResults(searchItemsData);
        this.elements.root.appendChild(this.elements.searchResults.getRoot());
    }
    
    activate() {
        console.assert(this.elements.root !== null, "Root is null when content is activated");
        this.searchOverlay.style.display = "block";
        this.elements.input.focus();

        for (const event of this.events["input"]) {
            this.elements.input.addEventListener("input", event.handler);
        }
        for (const event of this.events["keydown"]) {
            top.document.addEventListener("keydown", event.handler);
        }
        this.isActive = true;
    }

    deactivate() {
        this.searchOverlay.style.display = "none";
        for (const handler of this.events["input"]) {
            this.elements.input.removeEventListener("input", handler);
        }
        for (const handler of this.events["keydown"]) {
            top.document.removeEventListener("keydown", handler);
        }
        state.reset();
        this.isActive = false;
    }
    
    getRoot() {
        if (!this.elements.root) {
            throw new Error("Call to get root but root doesn't exist");
        }
        return this.elements.root;
    }
}
const getAllItems = (itemTypeName, defaultImage, cache) => {

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
            name: item.getProperty("name") || item.getProperty("keyed_name"),
            description: item.getAttribute("id"),
            itemId: item.getAttribute("id"),
            label_plural :item.getProperty("label_plural"),
            // item,
            itemTypeName,
            imageFileId
        });
    }
    
    return result;
}

const fetcher = async (e, searchOverlayContent) => {
	if (!localStorage.getItem("_" + state.itemTypeName + "_cache")) {
		const _items = await getAllItems(
			state.itemTypeName,
			state.defaultImage,
			searchOverlayContent.cache
		);

		localStorage.setItem("_" + state.itemTypeName + "_cache", JSON.stringify(_items));
	}
	const items = JSON.parse(localStorage.getItem("_" + state.itemTypeName + "_cache")) || [];
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

const listenShortcut = (doc, searchOverlayContent) => {
    const handleshortcut = (e) => {
        if (e.keyCode === 75 && e.ctrlKey) {
            e.preventDefault();
            if (searchOverlayContent.isActive) return;
            searchOverlayContent.activate();
        }
    }
    doc.addEventListener("keydown", handleshortcut);
    doc.querySelectorAll("iframe").forEach(iframe => {
        listenShortcut(iframe.contentWindow.document, searchOverlayContent);
    });

    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.tagName === 'IFRAME') {
                        node.addEventListener('load', (e) => {
                            if (node.getAttribute('id') && state.attachedIframes.find(iframeId => iframeId === node.getAttribute('id')) != undefined) {
                                return
                            }
                            console.log('added listenting to ' + node.getAttribute('id'));
                            state.attachedIframes.push(node.getAttribute('id'));
                            listenShortcut(node.contentWindow.document, searchOverlayContent);
                        })
                    }
                });
                mutation.removedNodes.forEach(node => {
                    if (node.tagName === 'IFRAME') {
                        state.attachedIframes.splice(state.attachedIframes.findIndex(iframe => node.getAttribute('id') === iframe), 1);
                    }
                });
            }
        }
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

}
const attachCss = () => {
    const styles = top.document.createElement("style");
    styles.innerHTML = `body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
    }
    
    header {
        background-color: #333;
        color: #fff;
        padding: 10px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    button {
        background-color: #007bff;
        color: #fff;
        border: none;
        padding: 8px 16px;
        cursor: pointer;
    }
    
    .overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
    }
    
    .search-overlay-content {
        position: absolute;
        top: 10vh;
        left: 50%;
        min-width: 60vw;
        transform: translateX(-50%);
        background-color: #fff;
        padding: 20px;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    }
    
    .search-input {
        width: 90%;
        margin: auto;
        display: block;
        padding: 10px 20px;
        font-family: sans-serif;
        font-size: 1.3rem;
        outline: none;
    
    }
    
    .searchResults {
        margin-top: 10px;
    }
    
    .search-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;
        font-size: 1.2rem;
        padding: 5px 15px 5px 5px;
        /* margin-bottom: 5px; */
        cursor: pointer;
        border-radius: 5px;
    }
    .search-item:hover {
        background-color: rgba(0, 0, 0, 0.08);
    }
    
    .search-item img {
        width: 50px;
        height: 50px;
        margin-right: 10px;
    }
    
    .flex-row {
        display: flex;
        flex-direction: row;
    }
    .flex-col {
        display: flex;
        flex-direction: column;
    }
    .jcc {
        justify-content: center;
    }
    .aic {
        align-items: center;
    }
    
    .m-05 {
        margin: .5rem;
    }
    
    /* Font weights */
    .fw-normal {
        font-weight: normal;
    }`;
    top.document.head.appendChild(styles);
}
const start = () => {
    if (!window.aras) return;
    if (!window.top || window.top !== window) return;

    const searchOverlay = top.document.createElement("div");
    searchOverlay.classList.add("overlay");
    const searchOverlayContent = new SearchOverlayContent("Search ItemTypes", "ItemTypes", searchOverlay);

    searchOverlayContent.on("input", fetcher, searchOverlayContent);
    top.document.body.appendChild(searchOverlay);
    attachCss();
    listenShortcut(top.document, searchOverlayContent);
}
start();

