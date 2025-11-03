# Contributing to MCP Liaison

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow

## Getting Started

1. **Fork the repository**
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/liaison-hub.git
   cd liaison-hub
   ```
3. **Install dependencies:**
   ```bash
   pnpm install
   ```
4. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Building

```bash
pnpm build
```

### Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm vitest run --coverage
```

### Linting

```bash
pnpm lint
```

### Type Checking

```bash
pnpm check-types
```

## Project Structure

```
packages/mcp-liaison/
├── src/
│   ├── index.ts              # Main server implementation
│   └── __tests__/
│       └── liaison.test.ts   # Test suite
├── docs/                     # Documentation
├── dist/                     # Build output (git-ignored)
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Always provide explicit types for public APIs
- Avoid `any` - use `unknown` instead
- Use interfaces for object types
- Use enums for fixed sets of values

### Naming Conventions

- `PascalCase` for classes, interfaces, enums, type aliases
- `camelCase` for variables, functions, methods
- `UPPER_SNAKE_CASE` for constants
- `kebab-case` for file names

### Comments

- Use JSDoc for all public APIs
- Include `@param`, `@returns`, `@throws` where applicable
- Write clear, concise comments
- Explain "why", not "what"

### Error Handling

- Always handle errors gracefully
- Log errors with structured data
- Return user-friendly error messages
- Never expose internal implementation details in errors

## Testing

### Test Requirements

- Minimum 80% code coverage
- Test both success and failure paths
- Test edge cases
- Use descriptive test names

### Test Structure

```typescript
describe("Feature", () => {
  describe("Specific functionality", () => {
    it("should behave correctly", () => {
      // Arrange
      const input = ...;
      
      // Act
      const result = ...;
      
      // Assert
      expect(result).toBe(...);
    });
  });
});
```

### Mocking

Use Vitest mocking utilities:

```typescript
import { vi } from "vitest";

const mockFn = vi.fn();
const spy = vi.spyOn(console, "error");
```

## Commit Guidelines

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or tooling changes

**Examples:**
```
feat(server): add task cancellation support
fix(validation): correct max length validation
docs(readme): update usage examples
test(server): add tests for concurrent task limits
```

## Pull Request Process

1. **Update documentation** if you change APIs
2. **Add tests** for new functionality
3. **Ensure all tests pass:** `pnpm test`
4. **Run linter:** `pnpm lint`
5. **Update CHANGELOG.md** with your changes
6. **Create pull request** with clear description

### PR Title Format

Use the same format as commit messages:

```
feat(server): add task prioritization
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Manual testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

## Areas for Contribution

### High Priority

- [ ] Actual sub-agent implementation
- [ ] Streaming progress updates
- [ ] Persistent task storage
- [ ] Task retry logic
- [ ] Better timeout handling

### Medium Priority

- [ ] Task prioritization
- [ ] Resource limits per task
- [ ] Task dependencies
- [ ] Metrics and monitoring
- [ ] Rate limiting

### Low Priority

- [ ] Web UI for task management
- [ ] Task templates
- [ ] Plugin system
- [ ] Advanced scheduling

## Questions or Issues?

- Open an issue for bugs
- Start a discussion for feature requests
- Ask questions in discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
