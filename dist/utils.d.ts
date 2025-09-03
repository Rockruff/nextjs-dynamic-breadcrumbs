export declare function walkFiles(dir: string, callback: (name: string) => void): void;
export declare function readFile(name: string): string;
export declare function writeFile(name: string, content: string | string[]): void;
export declare function removeFile(name: string, root: string): void;
export declare function readTemplate(name: string): string;
