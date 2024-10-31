class SearchOverlayContent {
    constructor(title, inputPlaceholder, searchOverlay) {
        this.elements = {};
        this.events = {
            "input": [],
            "keydown": []
        }
        this.searchOverlay = searchOverlay;

        this.createDom(title, inputPlaceholder, searchOverlay);
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
    
    createDom(title, inputPlaceholder, searchOverlay) {
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

        // Dark mode
        if (state.darkMode === true) {
            searchOverlay.classList.add("dark");
        }
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
        setTimeout(() => {
            this.searchOverlay.style.backdropFilter = "blur(3px) brightness(25%)";
        }, 1);
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
        setTimeout(() => {
            this.searchOverlay.style.backdropFilter = "blur(0px) brightness(25%)";
            setTimeout(() => {
                this.searchOverlay.style.display = "none";
            }, 400)
        }, 1);
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