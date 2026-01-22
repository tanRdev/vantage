import winston from "winston";
import * as fs from "fs";
import * as path from "path";

const logDir = path.join(process.cwd(), ".vantage");

export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

/**
 * Ensures the log directory exists, creating it if necessary.
 * Throws an error with a user-friendly message if creation fails.
 */
function ensureLogDirectory(): void {
  if (fs.existsSync(logDir)) {
    return;
  }

  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch (error) {
    const cause = error instanceof Error ? error.cause || error.message : String(error);
    throw new Error(
      `Failed to create .vantage directory for logging at ${logDir}. ` +
        `Please check permissions or specify a different location.\n` +
        `Underlying error: ${cause}`
    );
  }
}

/**
 * Checks if file transports can be created by verifying directory access.
 * Returns false if the directory cannot be created or accessed.
 */
function canUseFileTransports(): boolean {
  try {
    ensureLogDirectory();
    return true;
  } catch {
    return false;
  }
}

class Logger {
  private logger: winston.Logger;

  constructor() {
    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
    ];

    // Only add file transports if the directory can be created/accessed
    if (canUseFileTransports()) {
      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, "error.log"),
          level: "error",
        }),
        new winston.transports.File({
          filename: path.join(logDir, "combined.log"),
        })
      );
    }

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
      ),
      transports,
    });
  }

  error(message: string, meta?: object): void {
    this.logger.error(message, meta);
  }

  warn(message: string, meta?: object): void {
    this.logger.warn(message, meta);
  }

  info(message: string, meta?: object): void {
    this.logger.info(message, meta);
  }

  debug(message: string, meta?: object): void {
    this.logger.debug(message, meta);
  }
}

const logger = new Logger();

export default logger;
