# Usage Guide

This guide covers common usage patterns for Performance Enforcer.

## Installation

```bash
npm install -g performance-enforcer
```

Or use npx without installing:

```bash
npx performance-enforcer <command>
```

## Commands

### init

Initialize Performance Enforcer in your project.

```bash
performance-enforcer init
```

This creates a `.performance-enforcer.yml` configuration file in your project root.

### check

Run all configured performance checks.

```bash
performance-enforcer check
```

This command:
- Analyzes bundle sizes
- Runs Lighthouse CI for runtime metrics
- Checks results against configured thresholds
- Exits with non-zero code if thresholds are exceeded

### bundle

Run bundle analysis only.

```bash
performance-enforcer bundle
```

### dashboard

Launch the interactive dashboard.

```bash
performance-enforcer dashboard
```

The dashboard opens in your browser at `http://localhost:3000`.

### github

GitHub integration commands for CI/CD.

```bash
performance-enforcer github --post-comment
performance-enforcer github --set-status
```

## Configuration

Create a `.performance-enforcer.yml` in your project root:

```yaml
framework: nextjs

runtime:
  enabled: true
  lcp: 2500
  inp: 200
  cls: 0.1
  fcp: 1800
  ttfb: 800
  score: 90

bundle:
  budgets:
    - path: "app/**/*.js"
      maxSize: 200000
    - path: "pages/**/*.js"
      maxSize: 150000
```

## CI/CD Integration

### GitHub Actions

Add to `.github/workflows/performance.yml`:

```yaml
- name: Run performance checks
  run: npx performance-enforcer check
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

- name: Post results to PR
  if: github.event_name == 'pull_request'
  run: npx performance-enforcer github --post-comment
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    GITHUB_REPOSITORY: ${{ github.repository }}
    GITHUB_PR_NUMBER: ${{ github.event.pull_request.number }}
```

### GitLab CI

```yaml
performance:
  script:
    - npx performance-enforcer check
  artifacts:
    paths:
      - .performance-enforcer/
```

## Common Workflows

### Local Development

1. Install globally: `npm install -g performance-enforcer`
2. Initialize in project: `performance-enforcer init`
3. Configure thresholds in `.performance-enforcer.yml`
4. Run checks: `performance-enforcer check`

### Pre-commit Hook

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
npx performance-enforcer bundle || exit 1
```

### Pre-push Hook

Add to `.husky/pre-push`:

```bash
#!/bin/sh
npx performance-enforcer check || exit 1
```

## Exit Codes

- `0` - All checks passed
- `1` - One or more checks failed

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub token for API access |
| `GITHUB_REPOSITORY` | Repository name (owner/repo) |
| `GITHUB_PR_NUMBER` | Pull request number |
| `GITHUB_SHA` | Commit SHA |
| `PERFORMANCE_ENFORCER_CONFIG` | Path to config file |
