const fs = require("fs");
const path = require("path");
const child_process = require("child_process");

// Taken from index.js
const sequence = [
    "src/vendor/fuse.cjs",
    "src/utils.js",
    "src/aras/utils.js",
    "src/controllers/state.js",
    "src/ui/SearchResults.js",
    "src/ui/SearchOverlayContent.js",
    "src/controllers/fetch.js",
    "script.js"
];

const intermediate = [`
// ==UserScript==
// @name         aras-telescope
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Gives an amazing Ctrl-K
// @match        *://*/*
// @grant        none
// @author       Omkar Bhale, tusqasi
// ==/UserScript==



function aras_telescope() {
`];

const folderName = "output";
if (!fs.existsSync(folderName))
{
    fs.mkdirSync(folderName);
} 

sequence.forEach(file => {
    const filepath = path.join(__dirname, "..", file);
    const code = fs.readFileSync(filepath, {encoding: "utf-8"});
    intermediate.push(code);
});

const outputfilepath = path.join(__dirname, "..", "output", "compiled.js")
const output = fs.createWriteStream(outputfilepath, {encoding: "utf-8"});

intermediate.push(`}

setTimeout(() => {
    if(window.aras 
       && window.arasTabs 
       && localStorage.getItem("_aras_telescope_loaded") !== "true" 
    ){
        aras_telescope();
        localStorage.setItem("_aras_telescope_loaded", "true");
        console.log("Telescope loaded");
        window.addEventListener('beforeunload', () => localStorage.setItem("_aras_telescope_loaded", ""));
    }
},2000);`)

output.write(intermediate.join("\n"));
output.write("\n");
output.close();

// Automatically copy output file
console.log("Yanking...");
child_process.exec(`clip < ${outputfilepath}`, () => {});
child_process.exec(`clip.exe < ${outputfilepath}`, () => {});
console.log("Done!!");
