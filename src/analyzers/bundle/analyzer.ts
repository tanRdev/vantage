import type { TreemapNode } from "./treemap.js";
import Reporter from "../../core/reporter.js";

export interface BundleAnalysis {
  totalSize: number;
  chunkCount: number;
  totalModules: number;
  duplicateModules: number;
  deadCodeModules: number;
  largestModules: ModuleInfo[];
  modules: ModuleInfo[];
}

export interface BundleDiff {
  addedChunks: Chunk[];
  removedChunks: Chunk[];
  modifiedChunks: Array<{
    chunk: Chunk;
    oldSize: number;
    newSize: number;
    sizeDelta: number;
  }>;
  totalSizeChange: number;
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

export class BundleAnalyzer {
  analyzeChunks(chunks: Chunk[]): BundleAnalysis {
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const totalModules = this.countTotalModules(chunks);

    const modules = this.extractModuleInfo(chunks);
    const { duplicateCount, modulesWithDuplicates } = this.findDuplicateModules(modules);
    const deadCode = this.findDeadCode(modulesWithDuplicates, chunks);
    const largestModules = modulesWithDuplicates
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    return {
      totalSize,
      chunkCount: chunks.length,
      totalModules,
      duplicateModules: duplicateCount,
      deadCodeModules: deadCode.length,
      largestModules,
      modules: modulesWithDuplicates,
    };
  }

  generateTreemapData(chunks: Chunk[]): TreemapNode {
    const children = chunks.map(chunk => ({
      name: chunk.name,
      value: chunk.size,
      children: chunk.files.map((file) => ({
        name: file,
        value: 0,
      })),
    }));

    return {
      name: "Bundle",
      value: children.reduce((sum: number, c) => sum + (c.value || 0), 0),
      children,
    } as TreemapNode;
  }

  compareBundles(currentChunks: Chunk[], previousChunks: Chunk[]): BundleDiff {
    const previousIds = new Set(previousChunks.map(c => c.id));
    const currentIds = new Set(currentChunks.map(c => c.id));

    const addedChunks = currentChunks.filter(c => !previousIds.has(c.id));
    const removedChunks = previousChunks.filter(c => !currentIds.has(c.id));

    const modifiedChunks = currentChunks
      .filter(current => {
        const previous = previousChunks.find(p => p.id === current.id);
        return previous && previous.size !== current.size;
      })
      .map(current => {
        const previous = previousChunks.find(p => p.id === current.id)!;
        return {
          chunk: current,
          oldSize: previous.size,
          newSize: current.size,
          sizeDelta: current.size - previous.size,
        };
      });

    const totalSizeChange = currentChunks.reduce((sum, c) => sum + c.size, 0)
      - previousChunks.reduce((sum, c) => sum + c.size, 0);

    return {
      addedChunks,
      removedChunks,
      modifiedChunks,
      totalSizeChange,
    };
  }

  checkBudget(chunks: Chunk[], budgets: Array<{ path: string; max: string }>): Array<{
    path: string;
    currentSize: number;
    maxSize: number;
    exceeds: boolean;
  }> {
    return budgets.map(budget => {
      let regex: RegExp;
      try {
        regex = new RegExp(budget.path);
      } catch {
        Reporter.error(`Invalid regex pattern in budget: ${budget.path}`);
        return {
          path: budget.path,
          currentSize: 0,
          maxSize: this.parseSize(budget.max),
          exceeds: false,
        };
      }

      const matchingChunks = chunks.filter(
        chunk => chunk.name.match(regex)
      );

      if (matchingChunks.length === 0) {
        return {
          path: budget.path,
          currentSize: 0,
          maxSize: this.parseSize(budget.max),
          exceeds: false,
        };
      }

      const totalSize = matchingChunks.reduce((sum, c) => sum + c.size, 0);

      return {
        path: budget.path,
        currentSize: totalSize,
        maxSize: this.parseSize(budget.max),
        exceeds: totalSize > this.parseSize(budget.max),
      };
    });
  }

  private countTotalModules(chunks: Chunk[]): number {
    const uniqueModules = new Set<string>();

    for (const chunk of chunks) {
      if (chunk.modules) {
        for (const module of chunk.modules) {
          uniqueModules.add(module);
        }
      }
    }

    return uniqueModules.size;
  }

  private extractModuleInfo(chunks: Chunk[]): ModuleInfo[] {
    const modules: ModuleInfo[] = [];

    for (const chunk of chunks) {
      if (chunk.modules) {
        for (const moduleName of chunk.modules) {
          modules.push({
            name: moduleName,
            size: Math.round(chunk.size / chunk.modules.length),
            path: chunk.name,
            dependencies: [],
            isDuplicate: false,
            isDeadCode: false,
          });
        }
      }
    }

    return modules;
  }

  private findDuplicateModules(modules: ModuleInfo[]): { duplicateCount: number; modulesWithDuplicates: ModuleInfo[] } {
    const nameCount = new Map<string, number>();
    const duplicateNames = new Set<string>();

    for (const module of modules) {
      const count = (nameCount.get(module.name) || 0) + 1;
      nameCount.set(module.name, count);
      if (count > 1) {
        duplicateNames.add(module.name);
      }
    }

    // Mark all instances of duplicate modules
    const modulesWithDuplicates = modules.map(module => ({
      ...module,
      isDuplicate: duplicateNames.has(module.name),
    }));

    return {
      duplicateCount: duplicateNames.size,
      modulesWithDuplicates,
    };
  }

  private findDeadCode(modules: ModuleInfo[], chunks: Chunk[]): ModuleInfo[] {
    const entryChunkNames = new Set(
      chunks
        .filter(c => c.name.includes("pages/") || c.name.includes("main") || c.name.startsWith("_"))
        .flatMap(c => c.modules || [])
    );

    const modulesInMultipleChunks = new Set<string>();
    const moduleCount = new Map<string, number>();

    for (const module of modules) {
      const count = (moduleCount.get(module.name) || 0) + 1;
      moduleCount.set(module.name, count);
      if (count > 1) {
        modulesInMultipleChunks.add(module.name);
      }
    }

    return modules
      .filter(m => !entryChunkNames.has(m.name) && !modulesInMultipleChunks.has(m.name))
      .map(module => ({ ...module, isDeadCode: true }));
  }

  private parseSize(sizeStr: string): number {
    if (!sizeStr) return 0;

    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(kb|mb|gb)?$/i);
    if (!match) {
      Reporter.warn(`Invalid size format: ${sizeStr}`);
      return 0;
    }

    const value = parseFloat(match[1]);
    if (isNaN(value)) return 0;

    const unit = (match[2] || "b").toLowerCase();
    const multipliers: Record<string, number> = {
      b: 1,
      kb: 1024,
      mb: 1024 * 1024,
      gb: 1024 * 1024 * 1024,
    };

    const result = value * multipliers[unit];
    return Math.round(result);
  }
}
