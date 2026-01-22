export interface ValidationResult<T> {
  valid: boolean
  value?: T
  error?: string
}

export interface QueryParams {
  branch?: string
  limit: number
}

const BRANCH_PATTERN = /^[a-zA-Z0-9_-]+$/
const MIN_LIMIT = 1
const MAX_LIMIT = 1000
const DEFAULT_LIMIT = 30

export function validateLimit(limitParam: string | null, defaultValue: number = DEFAULT_LIMIT): ValidationResult<number> {
  if (!limitParam) {
    return { valid: true, value: defaultValue }
  }

  const parsed = parseInt(limitParam, 10)

  if (isNaN(parsed)) {
    return {
      valid: false,
      error: 'Invalid limit parameter: must be a number'
    }
  }

  if (parsed < MIN_LIMIT) {
    return {
      valid: false,
      error: `Invalid limit parameter: must be at least ${MIN_LIMIT}`
    }
  }

  if (parsed > MAX_LIMIT) {
    return {
      valid: false,
      error: `Invalid limit parameter: must not exceed ${MAX_LIMIT}`
    }
  }

  return { valid: true, value: parsed }
}

export function validateBranch(branchParam: string | null): ValidationResult<string | undefined> {
  if (!branchParam) {
    return { valid: true, value: undefined }
  }

  if (!BRANCH_PATTERN.test(branchParam)) {
    return {
      valid: false,
      error: 'Invalid branch parameter: only alphanumeric characters, underscores, and hyphens are allowed'
    }
  }

  return { valid: true, value: branchParam }
}

export function validateQueryParams(
  searchParams: URLSearchParams,
  defaultLimit: number = DEFAULT_LIMIT
): ValidationResult<QueryParams> {
  const branchResult = validateBranch(searchParams.get('branch'))
  if (!branchResult.valid) {
    return { valid: false, error: branchResult.error }
  }

  const limitResult = validateLimit(searchParams.get('limit'), defaultLimit)
  if (!limitResult.valid) {
    return { valid: false, error: limitResult.error }
  }

  return {
    valid: true,
    value: {
      branch: branchResult.value,
      limit: limitResult.value!,
    },
  }
}
