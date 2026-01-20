# Contributing to Performance Enforcer

Thank you for your interest in contributing! This document provides guidelines for contributing to Performance Enforcer.

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or bun

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/vantage.git
   cd vantage
   ```

### Install Dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

## Project Structure

```
vantage/
├── src/
│   ├── analyzers/      # Bundle and runtime analyzers
│   ├── commands/       # CLI commands
│   ├── core/           # Core functionality (config, storage, etc.)
│   ├── integrations/   # CI/CD integrations
│   ├── services/       # Business logic services
│   ├── templates/      # HTML/JS templates for reports
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── tests/              # Test files
├── dashboard/          # Next.js dashboard app
└── docs/               # Documentation
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Code Style

This project uses ESLint and Prettier for code formatting.

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Coding Conventions

- Use TypeScript for all new code
- Follow existing code style and patterns
- Use descriptive variable and function names
- Add JSDoc comments for public APIs
- Keep functions focused and small
- Prefer composition over inheritance

## Making Changes

### Branch Naming

Use descriptive branch names:

- `feat/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `docs/update-name` - Documentation updates
- `refactor/code-area` - Refactoring

### Commit Messages

Follow conventional commits:

```
type(scope): description

feat(commands): add github command for CI/CD
fix(runtime): correct LCP threshold calculation
docs(readme): update installation instructions
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Pull Requests

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Submit PR with clear description

## Adding New Features

### New Commands

1. Create command file in `src/commands/`
2. Extend `Command` from `@oclif/core`
3. Add description and flag definitions
4. Implement `run()` method
5. Add tests in `tests/unit/commands/`

Example:

```typescript
import { Command } from "@oclif/core";

export default class MyCommand extends Command {
  static description = "Command description";

  async run(): Promise<void> {
    // Implementation
  }
}
```

### New Analyzers

1. Create analyzer in appropriate `src/analyzers/` subdirectory
2. Implement analyzer class
3. Export functions/types for public API
4. Add unit tests

### New Integrations

1. Create integration file in `src/integrations/`
2. Implement integration class
3. Add configuration options to config schema
4. Document usage in `docs/`

## Testing

### Unit Tests

Write unit tests for all new functionality:

```typescript
import { describe, it, expect } from "vitest";

describe("MyFeature", () => {
  it("should do something", () => {
    // Arrange
    const input = { /* ... */ };

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe(expected);
  });
});
```

### Integration Tests

Integration tests go in `tests/integration/`.

## Release Process

Releases are managed by maintainers:

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag
4. Publish to npm

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Check existing documentation first

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
