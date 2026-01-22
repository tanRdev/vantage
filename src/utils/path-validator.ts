import * as path from "path";
import * as fs from "fs";

/**
 * Characters that could be used for shell command injection
 */
const DANGEROUS_CHARS = [
  ";",  // Command separator
  "&",  // Background execution / command separator
  "|",  // Pipe
  "`",  // Command substitution
  "$",  // Variable expansion
  "\n", // Newline (command separator)
  "\r", // Carriage return
  "\\", // Escape character (in some contexts)
  "<",  // Input redirection
  ">",  // Output redirection
];

/**
 * Patterns that indicate path traversal attempts
 */
const TRAVERSAL_PATTERNS = [
  /\.\.\//,  // Parent directory traversal
  /\.\.$/,   // Ends with parent directory reference
  /\/\.\./,  // Parent directory after a slash
  /\.\./,    // Any parent directory reference (catch-all)
];

/**
 * Validates a dashboard path to prevent command injection and path traversal attacks.
 *
 * Security considerations:
 * - Rejects paths with shell metacharacters that could enable command injection
 * - Rejects paths with null bytes that could bypass validation
 * - Rejects paths that escape the current working directory via traversal
 * - Rejects absolute paths (for security - dashboard must be within the project)
 * - Rejects paths with parent directory references (..) in the original input
 * - Normalizes paths before validation
 *
 * @param inputPath - The path to validate
 * @returns true if the path is safe, false otherwise
 */
export function validateDashboardPath(inputPath: string): boolean {
  // Reject empty paths
  if (!inputPath || inputPath.length === 0) {
    return false;
  }

  // Reject paths with null bytes (can be used to bypass string validation)
  if (inputPath.includes("\x00")) {
    return false;
  }

  // Check for dangerous shell characters
  for (const char of DANGEROUS_CHARS) {
    if (inputPath.includes(char)) {
      return false;
    }
  }

  // Reject absolute paths for security - dashboard should only be within project
  if (path.isAbsolute(inputPath)) {
    return false;
  }

  // Check for path traversal patterns in the ORIGINAL input (before normalization)
  // This catches attempts like "dashboard/../malicious" even if the normalized
  // result ("malicious") would be within the project directory
  for (const pattern of TRAVERSAL_PATTERNS) {
    if (pattern.test(inputPath)) {
      return false;
    }
  }

  // Normalize the path to resolve any . or .. segments
  let normalizedPath: string;
  try {
    normalizedPath = path.normalize(inputPath);
  } catch {
    return false;
  }

  // Ensure the path doesn't escape the current directory
  const resolved = path.resolve(inputPath);
  const cwd = process.cwd();

  // Check if the resolved path escapes the current working directory
  const relativeToCwd = path.relative(cwd, resolved);
  if (relativeToCwd.startsWith("..")) {
    return false;
  }

  return true;
}

/**
 * Validates a dashboard path and checks if it exists and is a valid directory.
 *
 * @param inputPath - The path to validate and check
 * @param cwd - The current working directory (defaults to process.cwd())
 * @returns The validated absolute path if valid, null otherwise
 */
export function validateAndResolveDashboardPath(
  inputPath: string,
  cwd: string = process.cwd(),
): string | null {
  if (!validateDashboardPath(inputPath)) {
    return null;
  }

  let resolvedPath: string;
  if (path.isAbsolute(inputPath)) {
    resolvedPath = path.normalize(inputPath);
  } else {
    resolvedPath = path.resolve(cwd, inputPath);
  }

  // Verify the path exists and is a directory
  try {
    const stats = fs.statSync(resolvedPath);
    if (!stats.isDirectory()) {
      return null;
    }
  } catch {
    return null;
  }

  return resolvedPath;
}
