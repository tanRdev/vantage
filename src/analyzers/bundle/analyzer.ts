import type { Chunk, ModuleInfo } from "./nextjs.js";

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

export class BundleAnalyzer {
  analyzeChunks(chunks: Chunk[]): BundleAnalysis {
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const totalModules = this.countTotalModules(chunks);

    const modules = this.extractModuleInfo(chunks);
    const duplicates = this.findDuplicateModules(modules);
    const deadCode = this.findDeadCode(modules, chunks);
    const largestModules = modules
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    return {
      totalSize,
      chunkCount: chunks.length,
      totalModules,
      duplicateModules: duplicates.length,
      deadCodeModules: deadCode.length,
      largestModules,
      modules,
    };
  }

  compareBundles(
    current: Chunk[],
    previous: Chunk[]
  ): BundleDiff {
    const currentMap = new Map(current.map(c => [c.id, c]));
    const previousMap = new Map(previous.map(c => [c.id, c]));

    const added = current.filter(
      c => !previousMap.has(c.id)
    );

    const removed = previous.filter(
      c => !currentMap.has(c.id)
    );

    const modified: BundleDiff["modifiedChunks"] = [];

    for (const currentChunk of current) {
      const previousChunk = previousMap.get(currentChunk.id);

      if (previousChunk && previousChunk.size !== currentChunk.size) {
        modified.push({
          chunk: currentChunk,
          oldSize: previousChunk.size,
          newSize: currentChunk.size,
          sizeDelta: currentChunk.size - previousChunk.size,
        });
      }
    }

    const totalSizeChange = current.reduce((sum, c) => sum + c.size, 0) -
      previous.reduce((sum, c) => sum + c.size, 0);

    return {
      addedChunks: added,
      removedChunks: removed,
      modifiedChunks: modified,
      totalSizeChange,
    };
  }

  generateTreemapData(chunks: Chunk[]): any {
    const children = chunks.map(chunk => ({
      name: chunk.name,
      value: chunk.size,
      children: chunk.files.map(file => ({
        name: file,
        value: 0,
      })),
    }));

    return {
      name: "Bundle",
      value: children.reduce((sum, c) => sum + c.value, 0),
      children,
    };
  }

  checkBudget(chunks: Chunk[], budgets: Array<{ path: string; max: string }>): Array<{
    path: string;
    currentSize: number;
    maxSize: number;
    exceeds: boolean;
  }> {
    return budgets.map(budget => {
      const matchingChunks = chunks.filter(
        chunk => chunk.name.match(budget.path)
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
    let count = 0;

    for (const chunk of chunks) {
      if (chunk.modules) {
        count += chunk.modules.length;
      }
    }

    return count;
  }

  private extractModuleInfo(chunks: Chunk[]): ModuleInfo[] {
    const modules: ModuleInfo[] = [];

    for (const chunk of chunks) {
      if (chunk.modules) {
        for (const moduleName of chunk.modules) {
          modules.push({
            name: moduleName,
            size: Math.round(chunk.size / (chunk.modules.length || 1)),
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

  private findDuplicateModules(modules: ModuleInfo[]): ModuleInfo[] {
    const nameCount = new Map<string, number>();

    for (const module of modules) {
      const count = nameCount.get(module.name) || 0;
      nameCount.set(module.name, count + 1);
    }

    return modules
      .filter(module => (nameCount.get(module.name) || 0) > 1)
      .map(module => ({ ...module, isDuplicate: true }));
  }

  private findDeadCode(modules: ModuleInfo[], chunks: Chunk[]): ModuleInfo[] {
    const referencedModules = new Set<string>();

    for (const chunk of chunks) {
      if (chunk.modules) {
        for (const moduleName of chunk.modules) {
          referencedModules.add(moduleName);
        }
      }
    }

    return modules
      .filter(module => !referencedModules.has(module.name))
      .map(module => ({ ...module, isDeadCode: true }));
  }

  private parseSize(sizeStr: string): number {
    const value = parseInt(sizeStr.replace(/[^\d]/g, ""));

    if (sizeStr.endsWith("kb")) {
      return value * 1024;
    }

    if (sizeStr.endsWith("mb")) {
      return value * 1024 * 1024;
    }

    return value;
  }
}
