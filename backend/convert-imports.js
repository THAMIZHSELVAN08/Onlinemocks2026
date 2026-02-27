const fs = require("fs");
const path = require("path");

function walk(dir) {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith(".ts")) {
      let content = fs.readFileSync(fullPath, "utf8");

      // module.exports =
      content = content.replace(
        /module\.exports\s*=\s*(\w+);?/g,
        "export default $1;",
      );

      // exports.something =
      content = content.replace(/exports\.(\w+)\s*=\s*/g, "export const $1 = ");

      fs.writeFileSync(fullPath, content);
      console.log("Converted:", fullPath);
    }
  });
}

walk(path.join(__dirname, "src"));
