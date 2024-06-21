# Aras Power Search 🔥

# Usage

## 1. Download extension
[Chrome Violent Monkey](https://chromewebstore.google.com/detail/jinjaccalgkegednnccohejagnlnfdag)
[Edge Violent Monkey](https://microsoftedge.microsoft.com/addons/detail/violentmonkey/eeagobfjdenkkddmbclomhiblgggliao)
[Firefox Violent Monkey](https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/)
[GitHub releases](https://github.com/violentmonkey/violentmonkey/releases)

## 2. Use this script
```js
// ==UserScript==
// @name        New script
// @namespace   Violentmonkey Scripts
// @match       *://*/*
// @grant       none
// @version     1.0
// @author      -
// @description 20/6/2024, 9:12:10 pm
// @require     https://cdn.jsdelivr.net/npm/fuse.js@7.0.0
// ==/UserScript==

if (window.aras)
fetch('https://raw.githubusercontent.com/omkarb-sg/aras-power-search/main/output/compiled.js')
.then(response => response.text())
.then(eval)
.catch(error => console.log(error));
```