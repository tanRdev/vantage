export class VantageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VantageError";
  }
}

export class ConfigError extends VantageError {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class AnalysisError extends VantageError {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "AnalysisError";
  }
}

export class LighthouseError extends VantageError {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "LighthouseError";
  }
}

export class BundleError extends VantageError {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "BundleError";
  }
}

export class ValidationError extends VantageError {
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Error thrown when performance checks fail (e.g., budget exceeded, thresholds exceeded).
 * Contains a numeric exit code for CLI purposes.
 */
export class CheckFailedError extends VantageError {
  readonly code = 1;

  constructor(message: string) {
    super(message);
    this.name = "CheckFailedError";
  }
}
