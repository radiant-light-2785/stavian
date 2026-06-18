const fs = require('fs');

const indexHtmlPath = 'c:\\Users\\Admin\\OneDrive\\Pictures\\OD\\04 HTML\\04 Stavian\\index.html';
const fixTxtPath = 'c:\\Users\\Admin\\OneDrive\\Pictures\\OD\\04 HTML\\04 Stavian\\fix.txt';

let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const fixTxt = fs.readFileSync(fixTxtPath, 'utf8');

const startMarker = "        pageSubtitle.textContent = 'Công cụ kiểm tra vị thế và hạch toán LME.';";
const endMarker = "    function renderGenericTable(payload) {";

const startIndex = indexHtml.indexOf(startMarker);
if (startIndex === -1) {
    console.error("Could not find start marker");
    process.exit(1);
}

const endIndex = indexHtml.indexOf(endMarker, startIndex);
if (endIndex === -1) {
    console.error("Could not find end marker");
    process.exit(1);
}

// We want to replace from startMarker to the line before endMarker
// Let's replace from startIndex to endIndex

const newStartStr = "        pageSubtitle.textContent = 'Công cụ kiểm tra vị thế và hạch toán LME.';\n        if (filtersBlock) filtersBlock.style.display = 'none';\n      }\n    }\n\n";

const newContent = newStartStr + fixTxt + "\n\n" + endMarker;

const finalHtml = indexHtml.substring(0, startIndex) + newContent + indexHtml.substring(endIndex + endMarker.length);

fs.writeFileSync(indexHtmlPath, finalHtml);
console.log("Fixed index.html successfully!");
