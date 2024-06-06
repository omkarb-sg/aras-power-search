class SearchItem {
    constructor(name, description, image, index, data) {
        this.elements = {};
        this.data = data; // Straight from what fetch() returns
        this.index = index;
        this.createDom(image, name, description, index);
    }

    createDom(image, name, description, index) {
        this.remove();

        this.elements.root = document.createElement("div");
        this.elements.root.classList.add("search-item");
        
        const content = document.createElement("div");
        content.classList.add("flex-row", "jcc", "aic");
        this.elements.image = document.createElement("img");
        // this.elements.image.src = image || "";
        this.elements.image.src = image || `https://picsum.photos/seed/${Date.now()}/50/50`;
        const nameDescriptionContainer = document.createElement("div");
        nameDescriptionContainer.classList.add("flex-col");
        this.elements.name = document.createElement("span");
        this.elements.name.textContent = name;
        this.elements.description = document.createElement("span");
        this.elements.description.classList.add("fw-normal");
        this.elements.description.textContent = description;
        nameDescriptionContainer.appendChild(this.elements.name);
        nameDescriptionContainer.appendChild(this.elements.description);
        content.appendChild(this.elements.image);
        content.appendChild(nameDescriptionContainer);

        this.elements.index = document.createElement("div");
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
        this.elements.root = document.createElement("div");
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
                    document.removeEventListener(event, handler);
                })
            }
            return;
        }

        this.searchItems.forEach(searchItem => {
            const shortcutHandlerOpen = (e) => {
                 if ((e.keyCode === 48 + searchItem.index) && e.ctrlKey && e.altKey && searchItem.data.itemTypeName === "ItemType") {
                    e.preventDefault();
                    this.searchOverlayContent.elements.input.value = "";
                    this.searchOverlayContent.deactivate();
                    arasTabs.openSearch(searchItem.data.itemId);
                }
                else if ((e.keyCode === 48 + searchItem.index) && e.ctrlKey) {
                    e.preventDefault();
                    this.searchOverlayContent.elements.input.value = "";
                    this.searchOverlayContent.deactivate();
                    aras.uiShowItem(searchItem.data.itemTypeName, searchItem.data.itemId);
                }
            }
            const shortcutHandlerChangeSearch = searchItem.data.itemTypeName === "ItemType" ? (e) => {
                if ((e.keyCode === 48 + searchItem.index) && e.altKey) {
                    e.preventDefault();
                    this.searchOverlayContent.elements.input.value = "";
                    state.setItemTypeName(searchItem.data.name, searchItem.data.label_plural || searchItem.data.name, searchItem.elements.image.src);
                }
            } : null;
            this.associatedShortcuts["keydown"].push(shortcutHandlerOpen);
            document.addEventListener("keydown", shortcutHandlerOpen);
            if (shortcutHandlerChangeSearch) {
                this.associatedShortcuts["keydown"].push(shortcutHandlerChangeSearch);
                document.addEventListener("keydown", shortcutHandlerChangeSearch);
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
