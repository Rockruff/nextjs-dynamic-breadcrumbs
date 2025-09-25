import fs from "fs";
import path from "path";
import url from "url";

import chokidar from "chokidar";

class Utils {
  static walkFiles(dir, callback) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const name = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.walkFiles(name, callback);
      } else if (entry.isFile()) {
        callback(name);
      }
    }
  }
  static readFile(name) {
    return fs.readFileSync(name, { encoding: "utf-8" });
  }
  static writeFile(name, content) {
    const parent = path.dirname(name);
    if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
    if (Array.isArray(content)) content = content.join("\n");
    fs.writeFileSync(name, content);
  }
  static removeFile(name, root) {
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
  static packageRoot() {
    const __filename = url.fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    return path.resolve(__dirname, "..");
  }
  static readTemplate(name) {
    const root = this.packageRoot();
    const templateFile = path.join(root, "templates", name);
    return this.readFile(templateFile);
  }
}
// TODO: extract these as configuration
const ParallelRouteName = "breadcrumbs";
const BreadCrumbFileName = "breadcrumb";
const FileExtension = ".tsx";
// Next.js conventions, should not be changed
const PageFileName = "page";
const LayoutFileName = "layout";
const DefaultFileName = "default";
export default class BreadcrumbGenerator {
  constructor(baseDir) {
    this.baseDir = path.resolve(baseDir);
    this.outDir = path.join(this.baseDir, `@${ParallelRouteName}`);
  }
  handlePage(srcFile, event) {
    const srcFileRel = path.relative(this.baseDir, srcFile);
    const targetFile = path.join(this.outDir, srcFileRel);
    if (event === "unlink") {
      Utils.removeFile(targetFile, this.outDir);
      return;
    }
    const content = Utils.readTemplate(PageFileName + FileExtension);
    Utils.writeFile(targetFile, content);
  }
  handleBreadCrumb(srcFile, event) {
    const srcDir = path.dirname(srcFile);
    const srcDirRel = path.relative(this.baseDir, srcDir);
    const targetDir = path.join(this.outDir, srcDirRel);
    const targetFile = path.join(targetDir, LayoutFileName + FileExtension);
    if (event === "unlink") {
      Utils.removeFile(targetFile, this.outDir);
      return;
    }
    const relImport = path.join(path.relative(targetDir, srcDir), BreadCrumbFileName);
    const content = Utils.readTemplate(LayoutFileName + FileExtension).replace(`./page`, relImport);
    Utils.writeFile(targetFile, content);
  }
  handleFile(file, event) {
    const name = path.basename(file);
    if (name === PageFileName + FileExtension) this.handlePage(file, event);
    else if (name === BreadCrumbFileName + FileExtension) this.handleBreadCrumb(file, event);
  }
  clean() {
    console.log(`Cleaning up existing items in ${this.outDir}`);
    fs.rmSync(this.outDir, { recursive: true, force: true });
  }
  start() {
    console.log(`Generating breadcrumb files from ${this.baseDir}`);
    const gitIgnore = path.join(this.outDir, ".gitignore");
    Utils.writeFile(gitIgnore, "*");
    const defaultPage = path.join(this.outDir, DefaultFileName + FileExtension);
    const content = Utils.readTemplate(PageFileName + FileExtension);
    Utils.writeFile(defaultPage, content);
    const watcher = chokidar.watch(this.baseDir, {
      ignored: (path) => path.startsWith(this.outDir),
      persistent: true,
    });
    watcher.on("add", (file) => this.handleFile(file, "add"));
    watcher.on("unlink", (file) => this.handleFile(file, "unlink"));
  }
}
