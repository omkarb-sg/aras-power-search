// const searchOverlay = document.getElementById("searchOverlay");
const searchOverlay = document.createElement("div");
searchOverlay.classList.add("overlay");
const searchOverlayContent = new SearchOverlayContent("Search ItemTypes", "ItemTypes", searchOverlay);

const handleshortcut = (e) => {
    if (e.keyCode === 75 && e.ctrlKey) {
        e.preventDefault();
        if (searchOverlayContent.isActive) return;
        searchOverlayContent.activate();
    }
}
const listenShortcut = async () => {
    document.addEventListener("keydown", handleshortcut);
}
const attachCss = () => {
    const styles = document.createElement("style");
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
    document.head.appendChild(styles);
}
const start = () => {
    searchOverlayContent.on("input", fetch, searchOverlayContent);
    document.body.appendChild(searchOverlay);
    attachCss();
    listenShortcut();
}
start();
