export interface Chunk {
  id: string;
  name: string;
  size: number;
  files: string[];
  modules?: string[];
  moduleSizes?: Record<string, number>;
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
