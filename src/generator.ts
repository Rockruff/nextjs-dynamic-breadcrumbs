import fs from "fs";
import path from "path";
import process from "process";
import url from "url";

import chokidar from "chokidar";

class Utils {
  static walkFiles(dir: string, callback: (name: string) => void) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const name = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.walkFiles(name, callback);
      } else if (entry.isFile()) {
        callback(name);
      }
    }
  }

  static readFile(name: string): string {
    return fs.readFileSync(name, { encoding: "utf-8" });
  }

  static writeFile(name: string, content: string | string[]) {
    const parent = path.dirname(name);
    if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
    if (Array.isArray(content)) content = content.join("\n");
    fs.writeFileSync(name, content);
  }

  static removeFile(name: string, root: string) {
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

  private static packageRoot() {
    const __filename = url.fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    return path.resolve(__dirname, "..");
  }

  static readTemplate(name: string) {
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
  private baseDir: string;
  private outDir: string;

  constructor(baseDir: string) {
    this.baseDir = path.resolve(baseDir);
    this.outDir = path.join(this.baseDir, `@${ParallelRouteName}`);
  }

  private handlePage(srcFile: string, event: "add" | "unlink") {
    const srcFileRel = path.relative(this.baseDir, srcFile);
    const targetFile = path.join(this.outDir, srcFileRel);
    if (event === "unlink") {
      Utils.removeFile(targetFile, this.outDir);
      return;
    }
    const content = Utils.readTemplate(PageFileName + FileExtension);
    Utils.writeFile(targetFile, content);
  }

  private handleBreadCrumb(srcFile: string, event: "add" | "unlink") {
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

  private handleFile(file: string, event: "add" | "unlink") {
    if (file.startsWith(this.outDir)) return;
    const name = path.basename(file);
    if (name === PageFileName + FileExtension) this.handlePage(file, event);
    else if (name === BreadCrumbFileName + FileExtension) this.handleBreadCrumb(file, event);
  }

  clean() {
    console.log(`Cleaning up existing items in ${this.outDir}`);
    fs.rmSync(this.outDir, { recursive: true, force: true });
    const gitIgnore = path.join(this.outDir, ".gitignore");
    Utils.writeFile(gitIgnore, "*");
    const defaultPage = path.join(this.outDir, DefaultFileName + FileExtension);
    const content = Utils.readTemplate(PageFileName + FileExtension);
    Utils.writeFile(defaultPage, content);
  }

  start() {
    console.log(`Generating breadcrumb files from ${this.baseDir}`);

    const watcher = chokidar.watch(this.baseDir, {
      ignored: ["node_modules", ".next", ".git"],
      persistent: process.env.NODE_ENV === "development",
    });

    watcher.on("add", (file) => this.handleFile(file, "add"));
    watcher.on("unlink", (file) => this.handleFile(file, "unlink"));
  }
}
