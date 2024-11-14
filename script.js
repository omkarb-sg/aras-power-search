/**
 * @param {Element} doc
 * @param {SearchOverlayContent} searchOverlayContent
 */
const listenShortcut = (doc, searchOverlayContent) => {
    const handleshortcut = (e) => {
        if (e.keyCode === 75
            && e.ctrlKey
            && !e.altKey
            && !e.shiftKey
        ) {

            e.preventDefault();
            if (searchOverlayContent.isActive) return;
            state.openedItems = state.openedItems.slice(-9);
            searchOverlayContent.handlesearchItemsData(state.openedItems.map(x => x.data).reverse());
            searchOverlayContent.activate();
        }
        else if (e.keyCode === 75
            && e.ctrlKey
            && !e.altKey
            && e.shiftKey
        ) {
            e.preventDefault();
            Object.entries(localStorage)
                .filter(([key, _]) => key.endsWith("_aras_power_search_cache") || key.endsWith("_aras_power_search_timestamp"))
                .forEach(([key, _]) => localStorage.removeItem(key));
            top.aras.AlertSuccess("Cleared aras-power-search cache")
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
    styles.innerHTML = `
    .overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        backdrop-filter: blur(0px) ;
        transition: backdrop-filter 0.2s linear ;
        z-index: 1000;

        --primary-color: #ddd;
        --secondary-color: #ccc;
        --border-color: #777;
        --primary-text: #333;
        --secondary-text: #444;
    }
    
    .search-overlay-content {
        position: absolute;
        top: 10vh;
        left: 50%;
        min-width: 60vw;
        transform: translateX(-50%);
        background-color: var(--primary-color);
        padding: 20px;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        color: var(--primary-text);
    }
    
    .search-input {
        width: -webkit-fill-available;
        margin: auto;
        display: block;
        padding: 10px 20px;
        font-family: sans-serif;
        font-size: 1.3rem;
        outline: none;
        background-color: var(--secondary-color);
        border: 1px solid var(--border-color);
        color: var(--primary-text);
    }
    .search-input::placeholder {
        color: var(--secondary-text);
    }
    
    .searchResults {
        margin-top: 15px;
    }
    
    .search-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;
        font-size: 1.2rem;
        padding: 5px 15px 5px 5px;
        margin-bottom: -1px;
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
    }
    /**
    * power-border start
    */
    .card {
      padding: 1rem;
      position: relative;
      border-radius: 10px;
    }
    @property --angle {
      syntax: "<angle>";
      initial-value: 0deg;
      inherits: false;
    }

    .card::after,
    .card::before {
      content: "";
      position: absolute;
      background-image: conic-gradient(from var(--angle), orange, transparent, blue, transparent, orange);

      height: 100%;
      width: 100%;
      top: 50%;
      left: 50%;
      translate: -50% -50%;
      z-index: -1;
      padding: 3px;
      border-radius: 10px;
      animation: 3s spin linear infinite;
    }

    .card::before {
      filter: blur(5px);
      opacity: 30%;
    }

    @keyframes spin {
      from {
        --angle: 0deg;
      }
      to {
        --angle: 360deg;
      }
    }

    /**
    * power-border end
    */

    ` ;
    top.document.head.appendChild(styles);
}
const aras_time_from_js_time = (timestamp) => {
    let date = new Date(timestamp);
    let isoString = date.toISOString(); // "2024-06-27T14:31:36.000Z"

    // Removing milliseconds and the 'Z' character (if needed)
    isoString = isoString.split('.')[0];
}
const refresh_cache_bak = () => {
    console.log("Cleared aras-power-search cache");
    top.aras.AlertSuccess("refresh_cache");
    const itemTypesToUpdate = Object.entries(localStorage)
        .filter(([key, _]) => key.endsWith("_aras_power_search_cache"))
        .map(([key, _]) => key.slice(1, -("_aras_power_search_cache".length)));
    for (let itemTypeName of itemTypesToUpdate) {
        const modified_on_time = Number.parseInt(localStorage.getItem(`_${itemTypeName}_aras_power_search_timestamp`));
        const aras_time = aras_time_from_js_time(modified_on_time);
        const raw_result = aras.IomInnovator.applyAML(`
    <AML>
        <Item type="${itemTypeName}" 
              action="get" 
              select"config_id">
            <modified_on condition="ge">${aras_time}</modified_on>
        </Item>
    </AML>`);
        const results = [];
        for (let i = 0; i < raw_result.getItemCount(); i++) {
            results.push({
                config_id: raw_result.getProperty("config_id"),
                id: raw_result.getProperty("id")
            });
        }
        const cached_items = JSON.parse(localStorage.getItem(`_${itemTypeName}_aras_power_search_cache`));
        debugger;
        for (let i = 0; i < results.length; i++) {
            for (let j = 0; j < cached_items.length; j++) {
                if (results[i].config_id == cached_items[j].config_id) {
                    console.assert(
                        typeof (cached_items[j].id) === "string"
                        && typeof (results[i].id === "string"),
                        "Major fault",
                    )
                    cached_items[j].id = results[i].id;
                }
            }
        }

        localStorage.setItem(`_${itemTypeName}_aras_power_search_cache`, JSON.stringify(cached_items),);

    }

};


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
    const refresh_cache = () => {
        const itemTypes = Object.entries(localStorage)
            .filter(([key, _]) => key.endsWith("_aras_power_search_cache"))
            .map(([key, _]) => key.slice(1).slice(0, -("_aras_power_search_cache").length));
        for (let itemTypeName of itemTypes) {
            const items = getAllItems(itemTypeName, state.defaultImage, searchOverlayContent.cache);
            localStorage.setItem(`_${itemTypeName}_aras_power_search_cache`, JSON.stringify(items));
        }
        aras.AlertSuccess("Cache Refreshed")
    }
    // setInterval(refresh_cache, 30_000);
}
start();
