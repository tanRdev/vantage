# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-19

### Added
- Initial release of Vantage CLI
- Bundle size analysis with deep module-level breakdown
- Runtime performance metrics via LHCI integration
- Web Vitals tracking (LCP, INP, CLS, FCP, TTFB)
- Interactive dashboard with D3.js visualizations
- YAML-based configuration system
- GitHub Actions workflow integration
- GitHub PR comments and status checks
- Performance threshold enforcement with pass/warn/fail states
- SQLite storage for historical metrics tracking
- `init` command for project scaffolding
- `check` command for running all performance checks
- `bundle` command for bundle analysis only
- `dashboard` command for launching visualization UI
- `github` command for CI/CD GitHub operations
- Comprehensive documentation and examples

### Features
- **Bundle Analysis**
  - Next.js build output parsing
  - Chunk-level size tracking
  - Module-level dependency graphs
  - Treemap visualization of bundle composition
  - Delta comparison against previous builds

- **Runtime Metrics**
  - Lighthouse CI integration
  - Core Web Vitals measurement
  - Custom threshold configuration
  - Browser-based instrumentation code generation

- **CI/CD Integration**
  - GitHub Actions workflow template
  - Automated PR comments with performance results
  - Commit status checks for performance gates
  - Artifact upload for historical tracking

- **Dashboard**
  - Interactive bundle explorer
  - Runtime metrics trends
  - Performance threshold editor (planned)
  - Historical comparison views

### Dependencies
- oclif ^4.0.0 (CLI framework)
- octokit ^4.0.0 (GitHub API)
- @lhci/cli ^0.13.0 (Lighthouse CI)
- web-vitals ^4.0.0 (Core Web Vitals)
- better-sqlite3 ^11.0.0 (Storage)
- d3 ^7.9.0 (Visualizations)
- winston ^3.11.0 (Logging)
- zod ^3.22.0 (Validation)

### Documentation
- README with installation and usage instructions
- CI/CD setup guide
- Example Next.js application
- Configuration reference

## [Unreleased]

### Planned
- Turbopack support
- React (CRA + Vite) support
- Vue 3 (Vite) support
- SvelteKit support
- GitLab CI integration
- Bitbucket Pipelines integration
- Dashboard config editor via UI
- Visual regression tests with Playwright
