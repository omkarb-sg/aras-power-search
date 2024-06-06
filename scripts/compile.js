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

const outputfilepath = path.join(__dirname, "..", "output", "compiled.js")
const output = fs.createWriteStream(outputfilepath, {encoding: "utf-8"});
const intermediate = [];

sequence.forEach(file => {
    const filepath = path.join(__dirname, "..", file);
    const code = fs.readFileSync(filepath, {encoding: "utf-8"});
    intermediate.push(code);
});
output.write(intermediate.join("\n"));
output.write("\n");
output.close();

// Automatically copy output file
child_process.exec(`clip.exe < ${outputfilepath}`, () => {});
