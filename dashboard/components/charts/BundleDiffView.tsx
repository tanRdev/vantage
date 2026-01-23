"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonoText } from "@/components/ui/mono-text";
import { cn } from "@/lib/utils";
import type { BundleDiff } from "@/types/bundle";
import type { CheckRecord } from "@/types/api";

interface BuildOption {
  id: number;
  timestamp: number;
  commit?: string;
}

export function BundleDiffView() {
  const [builds, setBuilds] = useState<BuildOption[]>([]);
  const [buildAId, setBuildAId] = useState<number | null>(null);
  const [buildBId, setBuildBId] = useState<number | null>(null);
  const [diff, setDiff] = useState<BundleDiff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getBuilds({ limit: 20 })
      .then((res) => {
        if (res.success && res.data) {
          const buildOptions = res.data.map((build) => ({
            id: build.id,
            timestamp: build.timestamp,
            commit: build.commit,
          }));
          setBuilds(buildOptions);
          if (buildOptions.length >= 2) {
            setBuildAId(buildOptions[buildOptions.length - 2].id);
            setBuildBId(buildOptions[buildOptions.length - 1].id);
          }
        } else {
          setError(res.error || "Failed to load builds");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (buildAId === null || buildBId === null) return;

    setIsLoadingDiff(true);
    api
      .getBundleDiff(buildAId, buildBId)
      .then((res) => {
        if (res.success && res.data) {
          setDiff(res.data);
        } else {
          setError(res.error || "Failed to load diff");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoadingDiff(false));
  }, [buildAId, buildBId]);

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  if (isLoading) {
    return (
      <div
        className="h-64 flex items-center justify-center"
        data-testid="loader"
      >
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          strokeWidth={1.5}
        />
      </div>
    );
  }

  if (error && builds.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <MonoText className="text-xs">{error}</MonoText>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>BUILD COMPARISON</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                BUILD A (Baseline)
              </label>
              <select
                value={buildAId ?? ""}
                onChange={(e) => setBuildAId(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                aria-label="Build A selection"
              >
                {builds.map((build) => (
                  <option key={build.id} value={build.id}>
                    {new Date(build.timestamp).toLocaleString()} -{" "}
                    {build.commit?.slice(0, 7) ?? "N/A"}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                BUILD B (Current)
              </label>
              <select
                value={buildBId ?? ""}
                onChange={(e) => setBuildBId(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                aria-label="Build B selection"
              >
                {builds.map((build) => (
                  <option key={build.id} value={build.id}>
                    {new Date(build.timestamp).toLocaleString()} -{" "}
                    {build.commit?.slice(0, 7) ?? "N/A"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoadingDiff ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2
                className="h-6 w-6 animate-spin text-muted-foreground"
                strokeWidth={1.5}
              />
            </div>
          ) : diff ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <MonoText className="text-sm text-muted-foreground">
                  TOTAL SIZE CHANGE
                </MonoText>
                <MonoText
                  className={cn(
                    "text-lg font-bold tabular-nums",
                    diff.totalSizeChange > 0
                      ? "text-status-critical"
                      : diff.totalSizeChange < 0
                        ? "text-status-success"
                        : "text-muted-foreground",
                  )}
                >
                  {diff.totalSizeChange > 0 ? "+" : ""}
                  {formatBytes(diff.totalSizeChange)}
                </MonoText>
              </div>

              {diff.addedChunks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-status-success mb-2">
                    ADDED CHUNKS
                  </h4>
                  <div className="space-y-2">
                    {diff.addedChunks.map((chunk) => (
                      <div
                        key={chunk.id}
                        className="flex items-center justify-between p-3 rounded-md bg-status-success/10 border border-status-success/20"
                      >
                        <MonoText className="text-sm">{chunk.name}</MonoText>
                        <MonoText className="text-sm text-status-success tabular-nums">
                          +{formatBytes(chunk.size)}
                        </MonoText>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {diff.removedChunks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-status-critical mb-2">
                    REMOVED CHUNKS
                  </h4>
                  <div className="space-y-2">
                    {diff.removedChunks.map((chunk) => (
                      <div
                        key={chunk.id}
                        className="flex items-center justify-between p-3 rounded-md bg-status-critical/10 border border-status-critical/20"
                      >
                        <MonoText className="text-sm">{chunk.name}</MonoText>
                        <MonoText className="text-sm text-status-critical tabular-nums">
                          -{formatBytes(chunk.size)}
                        </MonoText>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {diff.modifiedChunks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    MODIFIED CHUNKS
                  </h4>
                  <div className="space-y-2">
                    {diff.modifiedChunks.map((mod) => (
                      <div
                        key={mod.chunk.id}
                        className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border"
                      >
                        <div className="flex-1">
                          <MonoText className="text-sm">
                            {mod.chunk.name}
                          </MonoText>
                        </div>
                        <div className="flex items-center gap-3 tabular-nums">
                          <MonoText className="text-sm text-muted-foreground line-through">
                            {formatBytes(mod.oldSize)}
                          </MonoText>
                          <MonoText className="text-sm">→</MonoText>
                          <MonoText
                            className={cn(
                              "text-sm",
                              mod.sizeDelta > 0
                                ? "text-status-critical"
                                : mod.sizeDelta < 0
                                  ? "text-status-success"
                                  : "text-muted-foreground",
                            )}
                          >
                            {formatBytes(mod.newSize)}
                          </MonoText>
                          <MonoText
                            className={cn(
                              "text-sm w-16 text-right",
                              mod.sizeDelta > 0
                                ? "text-status-critical"
                                : mod.sizeDelta < 0
                                  ? "text-status-success"
                                  : "text-muted-foreground",
                            )}
                          >
                            {mod.sizeDelta > 0 ? "+" : ""}
                            {formatBytes(mod.sizeDelta)}
                          </MonoText>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {diff.addedChunks.length === 0 &&
                diff.removedChunks.length === 0 &&
                diff.modifiedChunks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MonoText className="text-sm">
                      NO CHANGES BETWEEN BUILDS
                    </MonoText>
                  </div>
                )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
