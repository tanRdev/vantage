import { describe, it, expect } from 'vitest'
import { validateLimit, validateBranch, validateQueryParams } from './validation'

describe('validateLimit', () => {
  it('should return default value when limit is null', () => {
    const result = validateLimit(null)
    expect(result.valid).toBe(true)
    expect(result.value).toBe(30)
  })

  it('should return custom default value when provided', () => {
    const result = validateLimit(null, 50)
    expect(result.valid).toBe(true)
    expect(result.value).toBe(50)
  })

  it('should accept valid limit values', () => {
    const result = validateLimit('100')
    expect(result.valid).toBe(true)
    expect(result.value).toBe(100)
  })

  it('should accept minimum limit value (1)', () => {
    const result = validateLimit('1')
    expect(result.valid).toBe(true)
    expect(result.value).toBe(1)
  })

  it('should accept maximum limit value (1000)', () => {
    const result = validateLimit('1000')
    expect(result.valid).toBe(true)
    expect(result.value).toBe(1000)
  })

  it('should reject limit below minimum', () => {
    const result = validateLimit('0')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('must be at least 1')
  })

  it('should reject negative limit values', () => {
    const result = validateLimit('-5')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('must be at least 1')
  })

  it('should reject limit above maximum', () => {
    const result = validateLimit('1001')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('must not exceed 1000')
  })

  it('should reject non-numeric limit values', () => {
    const result = validateLimit('abc')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('must be a number')
  })

  it('should handle limit with trailing special characters by parsing leading digits', () => {
    const result = validateLimit('10@#')
    expect(result.valid).toBe(true)
    expect(result.value).toBe(10)
  })

  it('should handle decimal numbers by truncating', () => {
    const result = validateLimit('10.5')
    expect(result.valid).toBe(true)
    expect(result.value).toBe(10)
  })
})

describe('validateBranch', () => {
  it('should return undefined when branch is null', () => {
    const result = validateBranch(null)
    expect(result.valid).toBe(true)
    expect(result.value).toBeUndefined()
  })

  it('should accept valid branch names with alphanumeric characters', () => {
    const result = validateBranch('main')
    expect(result.valid).toBe(true)
    expect(result.value).toBe('main')
  })

  it('should accept branch names with hyphens', () => {
    const result = validateBranch('feature-branch')
    expect(result.valid).toBe(true)
    expect(result.value).toBe('feature-branch')
  })

  it('should accept branch names with underscores', () => {
    const result = validateBranch('feature_branch')
    expect(result.valid).toBe(true)
    expect(result.value).toBe('feature_branch')
  })

  it('should accept branch names with mixed alphanumeric and allowed special chars', () => {
    const result = validateBranch('feature-123_test')
    expect(result.valid).toBe(true)
    expect(result.value).toBe('feature-123_test')
  })

  it('should reject branch names with spaces', () => {
    const result = validateBranch('feature branch')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('only alphanumeric characters, underscores, and hyphens are allowed')
  })

  it('should reject branch names with slashes', () => {
    const result = validateBranch('feature/branch')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('only alphanumeric characters, underscores, and hyphens are allowed')
  })

  it('should reject branch names with dots', () => {
    const result = validateBranch('feature.branch')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('only alphanumeric characters, underscores, and hyphens are allowed')
  })

  it('should reject branch names with special characters', () => {
    const result = validateBranch('feature@branch')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('only alphanumeric characters, underscores, and hyphens are allowed')
  })

  it('should reject SQL injection attempts', () => {
    const result = validateBranch("main'; DROP TABLE runs; --")
    expect(result.valid).toBe(false)
    expect(result.error).toContain('only alphanumeric characters, underscores, and hyphens are allowed')
  })

  it('should reject path traversal attempts', () => {
    const result = validateBranch('../../../etc/passwd')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('only alphanumeric characters, underscores, and hyphens are allowed')
  })
})

describe('validateQueryParams', () => {
  it('should validate both branch and limit parameters', () => {
    const params = new URLSearchParams('branch=main&limit=50')
    const result = validateQueryParams(params)
    expect(result.valid).toBe(true)
    expect(result.value?.branch).toBe('main')
    expect(result.value?.limit).toBe(50)
  })

  it('should use defaults when parameters are missing', () => {
    const params = new URLSearchParams('')
    const result = validateQueryParams(params)
    expect(result.valid).toBe(true)
    expect(result.value?.branch).toBeUndefined()
    expect(result.value?.limit).toBe(30)
  })

  it('should use custom default limit when provided', () => {
    const params = new URLSearchParams('')
    const result = validateQueryParams(params, 50)
    expect(result.valid).toBe(true)
    expect(result.value?.limit).toBe(50)
  })

  it('should return error when branch is invalid', () => {
    const params = new URLSearchParams('branch=invalid/branch&limit=50')
    const result = validateQueryParams(params)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('only alphanumeric characters, underscores, and hyphens are allowed')
  })

  it('should return error when limit is invalid', () => {
    const params = new URLSearchParams('branch=main&limit=2000')
    const result = validateQueryParams(params)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('must not exceed 1000')
  })

  it('should return error when limit is not a number', () => {
    const params = new URLSearchParams('branch=main&limit=abc')
    const result = validateQueryParams(params)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('must be a number')
  })

  it('should handle only branch parameter', () => {
    const params = new URLSearchParams('branch=develop')
    const result = validateQueryParams(params)
    expect(result.valid).toBe(true)
    expect(result.value?.branch).toBe('develop')
    expect(result.value?.limit).toBe(30)
  })

  it('should handle only limit parameter', () => {
    const params = new URLSearchParams('limit=100')
    const result = validateQueryParams(params)
    expect(result.valid).toBe(true)
    expect(result.value?.branch).toBeUndefined()
    expect(result.value?.limit).toBe(100)
  })
})
