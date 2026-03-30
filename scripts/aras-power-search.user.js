// ==UserScript==
// @name        Aras power search (Main)
// @namespace   aras-power-tools
// @match       *://*/*
// @grant       none
// @version     1.1
// @author      Omkar BHALE, Tushar KUNTAWAR
// @description Best searching experience in aras, yet
// ==/UserScript==

setTimeout(() => {
	if (!window.aras) return;

	fetch("https://raw.githubusercontent.com/omkarb-sg/aras-power-search/main/output/compiled.js")
		.then((response) => response.text())
		.then((source) => {
			// Keep script execution in page context for Aras globals access.
			(0, eval)(source);
		})
		.catch((error) => console.log(error));
}, 1000);
