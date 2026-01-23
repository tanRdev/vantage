// Storage layer for dashboard
import Database from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const VALID_RUNTIME_METRICS = new Set([
  "lcp",
  "inp",
  "cls",
  "fcp",
  "ttfb",
  "score",
] as const);

type ValidRuntimeMetric = "lcp" | "inp" | "cls" | "fcp" | "ttfb" | "score";

function validateMetricColumn(
  metric: string,
): asserts metric is ValidRuntimeMetric {
  if (!VALID_RUNTIME_METRICS.has(metric as ValidRuntimeMetric)) {
    throw new Error(
      `Invalid metric: "${metric}". Must be one of: lcp, inp, cls, fcp, ttfb, score`,
    );
  }
}

export interface RuntimeMetricRecord {
  id: number;
  timestamp: number;
  branch: string;
  commit?: string;
  lcp?: number;
  inp?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
  score?: number;
  status: "pass" | "warn" | "fail";
}

export interface BundleMetricRecord {
  id: number;
  timestamp: number;
  branch: string;
  commit?: string;
  chunkName: string;
  oldSize?: number;
  newSize: number;
  delta: number;
  status: "pass" | "warn" | "fail";
}

export interface CheckRecord {
  id: number;
  timestamp: number;
  branch: string;
  commit?: string;
  checkType: "runtime" | "bundle" | "full";
  status: "pass" | "warn" | "fail";
  duration: number;
}

class DashboardStorage {
  private db: Database.Database;

  constructor() {
    const storageDir = path.join(os.homedir(), ".vantage");
    const dbPath = path.join(storageDir, "metrics.db");

    if (!fs.existsSync(dbPath)) {
      // Return a mock storage for development when no DB exists
      console.warn("Vantage database not found. Using mock data.");
      this.db = this.createMockDb();
      return;
    }

    this.db = new Database(dbPath, { readonly: true });
    this.db.pragma("journal_mode = WAL");
  }

  private createMockDb(): Database.Database {
    // Create an in-memory database with mock data
    const mockDb = new Database(":memory:");

    // Create tables
    mockDb.exec(`
      CREATE TABLE IF NOT EXISTS runtime_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        branch TEXT NOT NULL,
        "commit" TEXT,
        lcp REAL,
        inp REAL,
        cls REAL,
        fcp REAL,
        ttfb REAL,
        score REAL,
        status TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS bundle_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        branch TEXT NOT NULL,
        "commit" TEXT,
        chunkName TEXT NOT NULL,
        oldSize REAL,
        newSize REAL NOT NULL,
        delta REAL NOT NULL,
        status TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS check_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        branch TEXT NOT NULL,
        "commit" TEXT,
        checkType TEXT NOT NULL,
        status TEXT NOT NULL,
        duration REAL NOT NULL
      );
    `);

    // Insert mock data
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    // Mock runtime metrics
    const runtimeStmt = mockDb.prepare(`
      INSERT INTO runtime_metrics (timestamp, branch, lcp, inp, cls, fcp, ttfb, score, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < 30; i++) {
      const timestamp = now - i * day;
      runtimeStmt.run(
        timestamp,
        "main",
        1.2 + Math.random() * 0.5, // lcp
        35 + Math.random() * 20, // inp
        0.02 + Math.random() * 0.05, // cls
        0.8 + Math.random() * 0.3, // fcp
        100 + Math.random() * 100, // ttfb
        85 + Math.random() * 15, // score
        Math.random() > 0.2 ? "pass" : "warn",
      );
    }

    // Mock bundle metrics
    const bundleStmt = mockDb.prepare(`
      INSERT INTO bundle_metrics (timestamp, branch, chunkName, newSize, delta, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const chunks = [
      "main.js",
      "vendor.js",
      "app.js",
      "dashboard.js",
      "checkout.js",
    ];
    for (let i = 0; i < 50; i++) {
      const timestamp = now - i * day;
      chunks.forEach((chunk) => {
        const newSize = 50 + Math.random() * 150;
        bundleStmt.run(
          timestamp,
          "main",
          chunk,
          Math.round(newSize),
          Math.round((Math.random() - 0.5) * 20),
          Math.random() > 0.2 ? "pass" : "warn",
        );
      });
    }

    return mockDb;
  }

  getRuntimeHistory(
    branch?: string,
    limit: number = 50,
  ): RuntimeMetricRecord[] {
    let query = "SELECT * FROM runtime_metrics";
    const params: (string | number)[] = [];

    if (branch) {
      query += " WHERE branch = ?";
      params.push(branch);
    }

    query += " ORDER BY timestamp DESC LIMIT ?";
    params.push(limit);

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as RuntimeMetricRecord[];
  }

  getBundleHistory(branch?: string, limit: number = 50): BundleMetricRecord[] {
    let query = "SELECT * FROM bundle_metrics";
    const params: (string | number)[] = [];

    if (branch) {
      query += " WHERE branch = ?";
      params.push(branch);
    }

    query += " ORDER BY timestamp DESC LIMIT ?";
    params.push(limit);

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as BundleMetricRecord[];
  }

  getBundlesByBuildId(buildId: number): BundleMetricRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM bundle_metrics
      WHERE id = ?
    `);
    return stmt.all(buildId) as BundleMetricRecord[];
  }

  getBundlesByTimestamp(timestamp: number): BundleMetricRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM bundle_metrics
      WHERE timestamp = ?
    `);
    return stmt.all(timestamp) as BundleMetricRecord[];
  }

  getCheckHistory(branch?: string, limit: number = 50): CheckRecord[] {
    let query = "SELECT * FROM check_records";
    const params: (string | number)[] = [];

    if (branch) {
      query += " WHERE branch = ?";
      params.push(branch);
    }

    query += " ORDER BY timestamp DESC LIMIT ?";
    params.push(limit);

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as CheckRecord[];
  }

  getRuntimeTrend(
    branch: string,
    metric: ValidRuntimeMetric,
    limit: number = 30,
  ): Array<{ timestamp: number; value: number }> {
    validateMetricColumn(metric);

    const stmt = this.db.prepare(`
      SELECT timestamp, ${metric} as value FROM runtime_metrics
      WHERE branch = ? AND ${metric} IS NOT NULL
      ORDER BY timestamp ASC LIMIT ?
    `);

    return stmt.all(branch, limit) as Array<{
      timestamp: number;
      value: number;
    }>;
  }

  getBundleTrend(
    branch: string,
    chunkName: string,
    limit: number = 30,
  ): Array<{ timestamp: number; value: number }> {
    const stmt = this.db.prepare(`
      SELECT timestamp, new_size as value FROM bundle_metrics
      WHERE branch = ? AND chunk_name = ? AND new_size IS NOT NULL
      ORDER BY timestamp ASC LIMIT ?
    `);

    return stmt.all(branch, chunkName, limit) as Array<{
      timestamp: number;
      value: number;
    }>;
  }

  getAllBundleTrends(
    branch: string,
    limit: number = 30,
  ): Array<{ chunkName: string; timestamp: number; value: number }> {
    const stmt = this.db.prepare(`
      SELECT chunk_name, timestamp, new_size as value FROM bundle_metrics
      WHERE branch = ? AND new_size IS NOT NULL
      ORDER BY timestamp DESC LIMIT ?
    `);

    const rows = stmt.all(branch, limit) as Array<{
      chunk_name: string;
      timestamp: number;
      value: number;
    }>;
    return rows.map((row) => ({
      chunkName: row.chunk_name,
      timestamp: row.timestamp,
      value: row.value,
    }));
  }

  getBranches(): string[] {
    const stmt = this.db.prepare(`
      SELECT DISTINCT branch FROM runtime_metrics
      UNION
      SELECT DISTINCT branch FROM bundle_metrics
      ORDER BY branch
    `);

    const rows = stmt.all() as Array<{ branch: string }>;
    return rows.map((r) => r.branch);
  }

  getStats(): {
    runtimeMetricsCount: number;
    bundleMetricsCount: number;
    checkRecordsCount: number;
    branches: string[];
  } {
    const runtimeCount = this.db
      .prepare("SELECT COUNT(*) as count FROM runtime_metrics")
      .get() as { count: number };
    const bundleCount = this.db
      .prepare("SELECT COUNT(*) as count FROM bundle_metrics")
      .get() as { count: number };
    const checksCount = this.db
      .prepare("SELECT COUNT(*) as count FROM check_records")
      .get() as { count: number };

    return {
      runtimeMetricsCount: runtimeCount.count,
      bundleMetricsCount: bundleCount.count,
      checkRecordsCount: checksCount.count,
      branches: this.getBranches(),
    };
  }

  close(): void {
    this.db.close();
  }
}

let storageInstance: DashboardStorage | null = null;

export function getDashboardStorage(): DashboardStorage {
  if (!storageInstance) {
    storageInstance = new DashboardStorage();
  }
  return storageInstance;
}
