import * as fs from "fs";
import * as path from "path";

export interface NextjsInfo {
  version: string;
  routerType: "app" | "pages";
  outputDir: string;
  hasTurbopack: boolean;
}

export interface BuildManifest {
  pages: Record<string, string>;
  pagesManiFest: Record<string, string>;
  buildId?: string;
}

export interface Chunk {
  id: string;
  name: string;
  size: number;
  files: string[];
  modules?: string[];
}

export interface ModuleInfo {
  name: string;
  size: number;
  path: string;
  dependencies: string[];
  isDuplicate: boolean;
  isDeadCode: boolean;
}

export class NextjsParser {
  private root: string;

  constructor(root: string) {
    this.root = root;
  }

  detectNextjs(): NextjsInfo | null {
    const packageJsonPath = path.join(this.root, "package.json");

    if (!fs.existsSync(packageJsonPath)) {
      return null;
    }

    let packageJson: any;
    try {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    } catch (error) {
      console.error(`Failed to parse package.json: ${packageJsonPath}`);
      return null;
    }
    const nextDeps = packageJson.dependencies?.next || packageJson.devDependencies?.next;

    if (!nextDeps) {
      return null;
    }

    const version = nextDeps.replace(/^[\^~>=<]/, "");

    return {
      version,
      routerType: this.detectRouterType(),
      outputDir: path.join(this.root, ".next"),
      hasTurbopack: this.detectTurbopack(),
    };
  }

  private detectRouterType(): "app" | "pages" {
    const appDir = path.join(this.root, "app");
    const pagesDir = path.join(this.root, "pages");

    if (fs.existsSync(appDir)) {
      return "app";
    }

    if (fs.existsSync(pagesDir)) {
      return "pages";
    }

    return "pages";
  }

  private detectTurbopack(): boolean {
    const turbopackPath = path.join(this.root, "turbopack");
    return fs.existsSync(turbopackPath);
  }

  parseBuildManifest(): BuildManifest | null {
    const manifestPath = path.join(this.root, ".next", "build-manifest.json");

    if (!fs.existsSync(manifestPath)) {
      return null;
    }

    try {
      const manifestContent = fs.readFileSync(manifestPath, "utf-8");
      return JSON.parse(manifestContent);
    } catch (error) {
      console.error(`Failed to parse build-manifest.json:`, error);
      return null;
    }
  }

  parsePagesManifest(): BuildManifest | null {
    const manifestPath = path.join(this.root, ".next", "server", "pages-manifest.json");

    if (!fs.existsSync(manifestPath)) {
      return null;
    }

    try {
      const manifestContent = fs.readFileSync(manifestPath, "utf-8");
      return JSON.parse(manifestContent);
    } catch (error) {
      console.error(`Failed to parse pages-manifest.json:`, error);
      return null;
    }
  }

  getRoutes(): string[] {
    const manifest = this.parseBuildManifest();

    if (!manifest) {
      return [];
    }

    const routes = new Set<string>();

    for (const route of Object.keys(manifest.pages || {})) {
      routes.add(route.replace(/\.html$/, ""));
    }

    return Array.from(routes);
  }

  getChunks(outputDir: string): Chunk[] {
    const chunks: Chunk[] = [];

    if (!fs.existsSync(outputDir)) {
      return chunks;
    }

    try {
      const files = fs.readdirSync(outputDir, { withFileTypes: true });

      for (const file of files) {
        if ((file.name.endsWith(".js") || file.name.endsWith(".mjs") || file.name.endsWith(".cjs")) && !file.name.startsWith("pages-manifest")) {
          const stats = fs.statSync(path.join(outputDir, file.name));
          chunks.push({
            id: file.name,
            name: file.name,
            size: stats.size,
            files: [file.name],
          });
        }
      }
    } catch (error) {
      console.error(`Failed to read chunks:`, error);
    }

    return chunks;
  }

  analyzeModuleDependencies(): ModuleInfo[] {
    const manifest = this.parseBuildManifest();
    const modules: ModuleInfo[] = [];

    if (!manifest) {
      return modules;
    }

    const moduleSet = new Map<string, ModuleInfo>();

    for (const [route, file] of Object.entries(manifest.pages || {})) {
      const moduleName = this.getModuleNameFromPath(file);

      if (!moduleSet.has(moduleName)) {
        moduleSet.set(moduleName, {
          name: moduleName,
          size: 0,
          path: file,
          dependencies: [],
          isDuplicate: false,
          isDeadCode: false,
        });
      }
    }

    return Array.from(moduleSet.values());
  }

  private getModuleNameFromPath(filePath: string): string {
    const parts = filePath.split(path.sep);
    return parts[parts.length - 1].replace(/\.(js|jsx|ts|tsx)$/, "");
  }
}
