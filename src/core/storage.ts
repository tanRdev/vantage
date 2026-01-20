import Database from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

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

export class Storage {
  private db: Database.Database;
  private dbPath: string;

  constructor(storagePath?: string) {
    const storageDir = storagePath || path.join(os.homedir(), ".performance-enforcer");

    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    this.dbPath = path.join(storageDir, "metrics.db");
    this.db = new Database(this.dbPath);

    this.db.pragma("journal_mode = WAL");
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS runtime_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        branch TEXT NOT NULL DEFAULT 'main',
        commit TEXT,
        lcp REAL,
        inp REAL,
        cls REAL,
        fcp REAL,
        ttfb REAL,
        score REAL,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bundle_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        branch TEXT NOT NULL DEFAULT 'main',
        commit TEXT,
        chunk_name TEXT NOT NULL,
        old_size REAL,
        new_size REAL NOT NULL,
        delta REAL NOT NULL,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS check_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        branch TEXT NOT NULL DEFAULT 'main',
        commit TEXT,
        check_type TEXT NOT NULL,
        status TEXT NOT NULL,
        duration INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_runtime_timestamp ON runtime_metrics(timestamp);
      CREATE INDEX IF NOT EXISTS idx_runtime_branch ON runtime_metrics(branch);
      CREATE INDEX IF NOT EXISTS idx_bundle_timestamp ON bundle_metrics(timestamp);
      CREATE INDEX IF NOT EXISTS idx_bundle_branch ON bundle_metrics(branch);
      CREATE INDEX IF NOT EXISTS idx_checks_timestamp ON check_records(timestamp);
      CREATE INDEX IF NOT EXISTS idx_checks_branch ON check_records(branch);
    `);
  }

  saveRuntimeMetrics(
    metrics: Omit<RuntimeMetricRecord, "id">[]
  ): void {
    const stmt = this.db.prepare(`
      INSERT INTO runtime_metrics (timestamp, branch, commit, lcp, inp, cls, fcp, ttfb, score, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((records: Omit<RuntimeMetricRecord, "id">[]) => {
      for (const record of records) {
        stmt.run(
          record.timestamp,
          record.branch,
          record.commit || null,
          record.lcp || null,
          record.inp || null,
          record.cls || null,
          record.fcp || null,
          record.ttfb || null,
          record.score || null,
          record.status
        );
      }
    });

    insertMany(metrics);
  }

  saveBundleMetrics(
    metrics: Omit<BundleMetricRecord, "id">[]
  ): void {
    const stmt = this.db.prepare(`
      INSERT INTO bundle_metrics (timestamp, branch, commit, chunk_name, old_size, new_size, delta, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((records: Omit<BundleMetricRecord, "id">[]) => {
      for (const record of records) {
        stmt.run(
          record.timestamp,
          record.branch,
          record.commit || null,
          record.chunkName,
          record.oldSize || null,
          record.newSize,
          record.delta,
          record.status
        );
      }
    });

    insertMany(metrics);
  }

  saveCheckRecord(
    record: Omit<CheckRecord, "id">
  ): void {
    const stmt = this.db.prepare(`
      INSERT INTO check_records (timestamp, branch, commit, check_type, status, duration)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      record.timestamp,
      record.branch,
      record.commit || null,
      record.checkType,
      record.status,
      record.duration
    );
  }

  getRuntimeHistory(
    branch?: string,
    limit: number = 50
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

  getBundleHistory(
    branch?: string,
    limit: number = 50
  ): BundleMetricRecord[] {
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

  getCheckHistory(
    branch?: string,
    limit: number = 50
  ): CheckRecord[] {
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

  getPreviousRuntimeMetrics(
    branch: string,
    chunkName?: string
  ): RuntimeMetricRecord | null {
    let query = "SELECT * FROM runtime_metrics WHERE branch = ?";
    const params: (string | number)[] = [branch];

    if (chunkName) {
      query += " AND chunk_name = ?";
      params.push(chunkName);
    }

    query += " ORDER BY timestamp DESC LIMIT 1";

    const stmt = this.db.prepare(query);
    return stmt.get(...params) as RuntimeMetricRecord | null;
  }

  getPreviousBundleMetrics(
    branch: string,
    chunkName: string
  ): BundleMetricRecord | null {
    const stmt = this.db.prepare(`
      SELECT * FROM bundle_metrics
      WHERE branch = ? AND chunk_name = ?
      ORDER BY timestamp DESC LIMIT 1
    `);

    return stmt.get(branch, chunkName) as BundleMetricRecord | null;
  }

  getRuntimeTrend(
    branch: string,
    metric: keyof Pick<RuntimeMetricRecord, "lcp" | "inp" | "cls" | "fcp" | "ttfb" | "score">,
    limit: number = 30
  ): Array<{ timestamp: number; value: number }> {
    const stmt = this.db.prepare(`
      SELECT timestamp, ${metric} as value FROM runtime_metrics
      WHERE branch = ? AND ${metric} IS NOT NULL
      ORDER BY timestamp ASC LIMIT ?
    `);

    return stmt.all(branch, limit) as Array<{ timestamp: number; value: number }>;
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

  deleteOldRecords(beforeTimestamp: number): void {
    const deleteRuntime = this.db.prepare("DELETE FROM runtime_metrics WHERE timestamp < ?");
    const deleteBundle = this.db.prepare("DELETE FROM bundle_metrics WHERE timestamp < ?");
    const deleteChecks = this.db.prepare("DELETE FROM check_records WHERE timestamp < ?");

    const transaction = this.db.transaction(() => {
      deleteRuntime.run(beforeTimestamp);
      deleteBundle.run(beforeTimestamp);
      deleteChecks.run(beforeTimestamp);
    });

    transaction();
  }

  clear(): void {
    this.db.exec("DELETE FROM runtime_metrics");
    this.db.exec("DELETE FROM bundle_metrics");
    this.db.exec("DELETE FROM check_records");
  }

  close(): void {
    this.db.close();
  }

  getStats(): {
    runtimeMetricsCount: number;
    bundleMetricsCount: number;
    checkRecordsCount: number;
    branches: string[];
  } {
    const runtimeCount = this.db.prepare("SELECT COUNT(*) as count FROM runtime_metrics").get() as { count: number };
    const bundleCount = this.db.prepare("SELECT COUNT(*) as count FROM bundle_metrics").get() as { count: number };
    const checksCount = this.db.prepare("SELECT COUNT(*) as count FROM check_records").get() as { count: number };

    return {
      runtimeMetricsCount: runtimeCount.count,
      bundleMetricsCount: bundleCount.count,
      checkRecordsCount: checksCount.count,
      branches: this.getBranches(),
    };
  }
}

let storageInstance: Storage | null = null;

export function getStorage(storagePath?: string): Storage {
  if (!storageInstance) {
    storageInstance = new Storage(storagePath);
  }
  return storageInstance;
}

export function closeStorage(): void {
  if (storageInstance) {
    storageInstance.close();
    storageInstance = null;
  }
}
