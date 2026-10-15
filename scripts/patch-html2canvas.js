const fs = require("fs");
const path = require("path");

const targets = [
  path.join(__dirname, "../node_modules/html2canvas/dist/html2canvas.esm.js"),
  path.join(__dirname, "../node_modules/html2canvas/dist/html2canvas.js"),
];

targets.forEach((file) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, "utf8");
    const needle = 'throw new Error("Attempting to parse an unsupported color function \\"" + value.name + "\\"");';
    if (content.includes(needle)) {
      content = content.replace(needle, "return COLORS.TRANSPARENT;");
      fs.writeFileSync(file, content, "utf8");
      console.log(`[patch-html2canvas] Successfully patched ${path.basename(file)}`);
    }
  }
});
