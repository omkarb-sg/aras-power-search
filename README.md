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
// @name        Aras power search
// @namespace   aras-power-tools
// @match       *://*/*
// @grant       none
// @version     1.0
// @author      Omkar BHALE, Tushar KUNTAWAR
// @description Best searching expirience in aras, yet
// @require     https://cdn.jsdelivr.net/npm/fuse.js@7.0.0
// ==/UserScript==

if (window.aras){
    fetch('https://raw.githubusercontent.com/omkarb-sg/aras-power-search/main/output/compiled.js')
        .then(response => response.text())
        .then(eval)
        .catch(error => console.log(error));
}
```
