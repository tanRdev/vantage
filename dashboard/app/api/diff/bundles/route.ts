import { NextRequest, NextResponse } from "next/server";
import { getDashboardStorage } from "@/lib/storage";
import type { BundleDiff } from "@/types/bundle";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const buildAId = searchParams.get("buildA");
    const buildBId = searchParams.get("buildB");

    if (!buildAId || !buildBId) {
      return NextResponse.json(
        { success: false, error: "Missing buildA or buildB parameter" },
        { status: 400 },
      );
    }

    const buildA = parseInt(buildAId, 10);
    const buildB = parseInt(buildBId, 10);

    const storage = getDashboardStorage();
    const bundlesA = storage.getBundlesByTimestamp(buildA);
    const bundlesB = storage.getBundlesByTimestamp(buildB);

    if (bundlesA.length === 0 || bundlesB.length === 0) {
      return NextResponse.json(
        { success: false, error: "No bundles found for one or both builds" },
        { status: 404 },
      );
    }

    const previousChunks = bundlesA.map((bundle) => ({
      id: bundle.chunkName,
      name: bundle.chunkName,
      size: bundle.oldSize ?? bundle.newSize,
      files: [bundle.chunkName],
    }));

    const currentChunks = bundlesB.map((bundle) => ({
      id: bundle.chunkName,
      name: bundle.chunkName,
      size: bundle.newSize,
      files: [bundle.chunkName],
    }));

    const previousIds = new Set(previousChunks.map((c) => c.id));
    const currentIds = new Set(currentChunks.map((c) => c.id));

    const addedChunks = currentChunks.filter((c) => !previousIds.has(c.id));
    const removedChunks = previousChunks.filter((c) => !currentIds.has(c.id));

    const modifiedChunks = currentChunks
      .filter((current) => {
        const previous = previousChunks.find((p) => p.id === current.id);
        return previous && previous.size !== current.size;
      })
      .map((current) => {
        const previous = previousChunks.find((p) => p.id === current.id)!;
        return {
          chunk: current,
          oldSize: previous.size,
          newSize: current.size,
          sizeDelta: current.size - previous.size,
        };
      });

    const totalSizeChange =
      currentChunks.reduce((sum, c) => sum + c.size, 0) -
      previousChunks.reduce((sum, c) => sum + c.size, 0);

    const diff: BundleDiff = {
      addedChunks,
      removedChunks,
      modifiedChunks,
      totalSizeChange,
    };

    return NextResponse.json({ success: true, data: diff });
  } catch (error) {
    console.error("Error computing bundle diff:", error);
    return NextResponse.json(
      { success: false, error: "Failed to compute bundle diff" },
      { status: 500 },
    );
  }
}
