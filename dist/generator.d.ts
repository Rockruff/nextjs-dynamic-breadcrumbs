export default class BreadcrumbGenerator {
  private baseDir;
  private outDir;
  constructor(baseDir: string);
  private handlePage;
  private handleBreadCrumb;
  private handleFile;
  clean(): void;
  start(): void;
}
