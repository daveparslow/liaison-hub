# Contributing to Liaison Hub

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/liaison-hub.git`
3. Install dependencies: `pnpm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## Development Workflow

### Building
```bash
pnpm build
```

### Running Tests
```bash
pnpm test
pnpm run test:coverage  # With coverage
```

### Linting
```bash
pnpm run lint
pnpm run check-types
```

### Watch Mode
```bash
pnpm run watch
```

## Code Standards

- **TypeScript**: All code must be TypeScript with strict mode enabled
- **ESLint**: No warnings allowed (`--max-warnings 0`)
- **Testing**: Add tests for new features and bug fixes
- **Commits**: Use [Conventional Commits](https://www.conventionalcommits.org/)
  - `feat:` - New feature
  - `fix:` - Bug fix
  - `docs:` - Documentation changes
  - `chore:` - Maintenance tasks
  - `refactor:` - Code refactoring
  - `test:` - Test changes

## Pull Request Process

1. **Update tests**: Ensure tests pass and add new tests if needed
2. **Update documentation**: Keep README and docs in sync
3. **Follow commit conventions**: Use conventional commit messages
4. **Wait for CI**: All checks must pass before merge
5. **Request review**: At least one approval required (for team members)
6. **Squash and merge**: Use squash merge to keep history clean

## Branch Protection

The `main` branch is protected:
- Pull requests required
- CI must pass
- Linear history enforced
- Branches auto-deleted after merge

## Questions?

Feel free to open an issue for any questions about contributing.
