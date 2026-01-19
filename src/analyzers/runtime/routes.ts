import * as fs from "fs";
import * as path from "path";

export interface RouteInfo {
  path: string;
  type: "app" | "pages" | "api" | "middleware";
  isDynamic: boolean;
  segments: string[];
  parameterNames?: string[];
}

export class RouteDetector {
  private root: string;
  private routerType: "app" | "pages";

  constructor(root: string, routerType: "app" | "pages") {
    this.root = root;
    this.routerType = routerType;
  }

  detectRoutes(excludePatterns: string[] = []): RouteInfo[] {
    if (this.routerType === "app") {
      return this.detectAppRoutes(excludePatterns);
    } else {
      return this.detectPagesRoutes(excludePatterns);
    }
  }

  private detectAppRoutes(excludePatterns: string[]): RouteInfo[] {
    const appDir = path.join(this.root, "app");
    const routes: RouteInfo[] = [];

    if (!fs.existsSync(appDir)) {
      return routes;
    }

    this.scanAppDirectory(appDir, "", routes, excludePatterns);
    return routes;
  }

  private scanAppDirectory(
    dir: string,
    currentPath: string,
    routes: RouteInfo[],
    excludePatterns: string[]
  ): void {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory()) {
        const newPath = path.join(currentPath, item.name);

        if (this.shouldExclude(newPath, excludePatterns)) {
          continue;
        }

        this.scanAppDirectory(path.join(dir, item.name), newPath, routes, excludePatterns);
      } else if (item.name === "page.tsx" || item.name === "page.ts" || item.name === "page.js") {
        const routeInfo = this.parseAppRoute(currentPath);
        routes.push(routeInfo);
      }
    }
  }

  private parseAppRoute(currentPath: string): RouteInfo {
    const segments = currentPath.split(path.sep).filter(Boolean);
    const isDynamic = segments.some(s => s.startsWith("[") && s.endsWith("]"));
    const parameterNames = segments
      .filter(s => s.startsWith("[") && s.endsWith("]"))
      .map(s => s.slice(1, -1).split("...")[0]);

    const type = this.getRouteType(currentPath);

    return {
      path: this.formatRoutePath(currentPath),
      type,
      isDynamic,
      segments,
      parameterNames: parameterNames.length > 0 ? parameterNames : undefined,
    };
  }

  private getRouteType(currentPath: string): RouteInfo["type"] {
    if (currentPath.startsWith("/api/") || currentPath.startsWith("api/")) return "api";
    if (currentPath.startsWith("/middleware/") || currentPath.startsWith("middleware/")) return "middleware";
    return "app";
  }

  private detectPagesRoutes(excludePatterns: string[]): RouteInfo[] {
    const pagesDir = path.join(this.root, "pages");
    const routes: RouteInfo[] = [];

    if (!fs.existsSync(pagesDir)) {
      return routes;
    }

    this.scanPagesDirectory(pagesDir, "", routes, excludePatterns);
    return routes;
  }

  private scanPagesDirectory(
    dir: string,
    currentPath: string,
    routes: RouteInfo[],
    excludePatterns: string[]
  ): void {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory()) {
        const newPath = path.join(currentPath, item.name);

        if (this.shouldExclude(newPath, excludePatterns)) {
          continue;
        }

        this.scanPagesDirectory(path.join(dir, item.name), newPath, routes, excludePatterns);
      } else if (
        (item.name.endsWith(".tsx") || item.name.endsWith(".ts") || item.name.endsWith(".js") || item.name.endsWith(".jsx")) &&
        !item.name.startsWith("_")
      ) {
        const routeInfo = this.parsePagesRoute(currentPath, item.name);
        routes.push(routeInfo);
      }
    }
  }

  private parsePagesRoute(currentPath: string, fileName: string): RouteInfo {
    const segments = [...currentPath.split(path.sep).filter(Boolean), fileName];
    const isDynamic = segments.some(s => s.startsWith("[") && s.endsWith("]"));
    const parameterNames = segments
      .filter(s => s.startsWith("[") && s.endsWith("]"))
      .map(s => s.slice(1, -1).split("...")[0]);

    return {
      path: this.formatRoutePath(currentPath, fileName),
      type: "pages",
      isDynamic,
      segments,
      parameterNames: parameterNames.length > 0 ? parameterNames : undefined,
    };
  }

  private formatRoutePath(currentPath: string, fileName?: string): string {
    const segments = currentPath.split(path.sep).filter(Boolean);

    if (fileName) {
      const baseName = fileName.replace(/\.(tsx?|jsx?|js)$/, "");
      if (baseName !== "index") {
        segments.push(baseName);
      }
    }

    let formattedPath = "/" + segments.join("/");

    formattedPath = formattedPath
      .replace(/\[([a-zA-Z0-9_]+)\]/g, ":$1")
      .replace(/\[\.\.\.([a-zA-Z0-9_]+)\]/g, ":$1*")
      .replace(/\/index(\/|$)/g, "/")
      .replace(/\/$/, "/");

    if (formattedPath === "/") {
      return formattedPath;
    }

    return formattedPath.replace(/\/$/, "");
  }

  private shouldExclude(route: string, excludePatterns: string[]): boolean {
    return excludePatterns.some(pattern => {
      const regex = new RegExp(
        "^" + pattern.replace(/\*/g, ".*").replace(/\//g, "\\/")
      );
      return regex.test(route);
    });
  }

  getTopNRoutes(
    routes: RouteInfo[],
    n: number,
    excludeTypes: RouteInfo["type"][] = ["api", "middleware"]
  ): RouteInfo[] {
    return routes
      .filter(route => !excludeTypes.includes(route.type))
      .slice(0, n);
  }
}
