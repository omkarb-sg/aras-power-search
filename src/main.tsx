import { createRoot } from "react-dom/client";
import { PowerSearchApp } from "./PowerSearchApp";
import powerSearchCss from "./styles/power-search.css?inline";

const STYLE_ID = "__aras_power_search_styles";
const MOUNT_ID = "__aras_power_search_root";

const ensureStyles = (doc: Document) => {
	if (doc.getElementById(STYLE_ID)) return;
	const styleElement = doc.createElement("style");
	styleElement.id = STYLE_ID;
	styleElement.textContent = powerSearchCss;
	doc.head.appendChild(styleElement);
};

const ensureMount = (doc: Document) => {
	const existing = doc.getElementById(MOUNT_ID);
	if (existing) return existing;

	const mountNode = doc.createElement("div");
	mountNode.id = MOUNT_ID;
	doc.body.appendChild(mountNode);
	return mountNode;
};

const start = () => {
	if (!window.aras) return;
	if (!window.top || window.top !== window) return;

	const topWindow = window.top;
	ensureStyles(topWindow.document);
	const mountNode = ensureMount(topWindow.document);
	createRoot(mountNode).render(<PowerSearchApp topWindow={topWindow} />);
};

start();
