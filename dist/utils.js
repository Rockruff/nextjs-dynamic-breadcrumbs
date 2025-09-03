import fs from "fs";
import path from "path";
import url from "url";

export function walkFiles(dir, callback) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const name = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(name, callback);
    } else if (entry.isFile()) {
      callback(name);
    }
  }
}
export function readFile(name) {
  return fs.readFileSync(name, { encoding: "utf-8" });
}
export function writeFile(name, content) {
  const parent = path.dirname(name);
  if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
  if (content instanceof Array) content = content.join("\n");
  fs.writeFileSync(name, content);
}
export function removeFile(name, root) {
  fs.rmSync(name, { force: true });
  let current = path.dirname(name);
  while (current.startsWith(root)) {
    try {
      fs.rmdirSync(current);
      current = path.dirname(current);
    } catch {
      break; // not empty or not allowed
    }
  }
}
function packageRoot() {
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.resolve(__dirname, "..");
}
export function readTemplate(name) {
  const root = packageRoot();
  const templateFile = path.join(root, "templates", name);
  return readFile(templateFile);
}
