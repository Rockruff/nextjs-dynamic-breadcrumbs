import fs from "fs";
import path from "path";
import url from "url";

export function walkFiles(dir: string, callback: (name: string) => void) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const name = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(name, callback);
    } else if (entry.isFile()) {
      callback(name);
    }
  }
}

export function readFile(name: string): string {
  return fs.readFileSync(name, { encoding: "utf-8" });
}

export function writeFile(name: string, content: string | string[]) {
  const parent = path.dirname(name);
  if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
  if (content instanceof Array) content = content.join("\n");
  fs.writeFileSync(name, content);
}

export function removeFile(name: string, root: string) {
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

export function readTemplate(name: string) {
  const scriptFile = url.fileURLToPath(import.meta.url);
  const scriptDir = path.dirname(scriptFile);
  const templateFile = path.resolve(scriptDir, "templates", name);
  return readFile(templateFile);
}
