import type { RuntimeThresholds } from "./config.js";

export interface BuildData {
  id: number;
  commit_sha: string;
  branch: string;
  timestamp: number;
  total_bundle_size: number;
  lcp?: number;
  inp?: number;
  cls?: number;
}

export interface RouteData {
  id: number;
  build_id: number;
  path: string;
  lcp?: number;
  inp?: number;
  cls?: number;
  score?: number;
}

export interface BundleData {
  id: number;
  build_id: number;
  chunk_name: string;
  size: number;
  module_count: number;
}

class Storage {
  private builds: Map<number, BuildData> = new Map();
  private routes: Map<number, RouteData[]> = new Map();
  private bundles: Map<number, BundleData[]> = new Map();
  private nextId: number = 1;

  saveBuild(data: Omit<BuildData, "id">): number {
    const id = this.nextId++;
    this.builds.set(id, { ...data, id });
    return id;
  }

  saveRoute(data: Omit<RouteData, "id">): number {
    const id = this.nextId++;
    if (!this.routes.has(data.build_id)) {
      this.routes.set(data.build_id, []);
    }
    this.routes.get(data.build_id)!.push({ ...data, id });
    return id;
  }

  saveBundle(data: Omit<BundleData, "id">): number {
    const id = this.nextId++;
    if (!this.bundles.has(data.build_id)) {
      this.bundles.set(data.build_id, []);
    }
    this.bundles.get(data.build_id)!.push({ ...data, id });
    return id;
  }

  getLatestBuild(limit: number = 1): BuildData[] {
    return Array.from(this.builds.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  getBuildBySha(commitSha: string): BuildData | undefined {
    return Array.from(this.builds.values()).find(
      b => b.commit_sha === commitSha
    );
  }

  getRoutesByBuildId(buildId: number): RouteData[] {
    return this.routes.get(buildId) || [];
  }

  getBundlesByBuildId(buildId: number): BundleData[] {
    return this.bundles.get(buildId) || [];
  }

  getBuildHistory(limit: number = 30): BuildData[] {
    return Array.from(this.builds.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
}

export default Storage;
