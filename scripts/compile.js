const fs = require("fs");
const path = require("path");
const child_process = require("child_process");

// Taken from index.js
const sequence = [
    // "src/vendor/fuse.cjs",
    "src/utils.js",
    "src/aras/utils.js",
    "src/controllers/state.js",
    "src/ui/SearchResults.js",
    "src/ui/SearchOverlayContent.js",
    "src/controllers/fetch.js",
    "script.js"
];

const intermediate = [];
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

output.write(intermediate.join("\n"));
output.write("\n");
output.close();

// Automatically copy output file
console.log("Yanking...");
child_process.exec(`clip < ${outputfilepath}`, () => {});
child_process.exec(`clip.exe < ${outputfilepath}`, () => {});
console.log("Done!!");
