# Liaison Hub

Liaison — a primary MCP server (with a bundled VS Code extension) for delegating long-running jobs to sub-agents, streaming check-ins, and handing off prompt-in → summary-out context.

## Setup

```bash
# Clone and install
git clone https://github.com/YOUR_USERNAME/liaison-hub.git
cd liaison-hub
corepack enable
pnpm install
```

## Commands

```bash
pnpm run build         # Build all packages
pnpm run compile       # Compile extensions
pnpm run watch         # Watch mode
pnpm run lint          # Lint code
pnpm run check-types   # Type check
pnpm run format        # Format code
```

## Stack

- **Turborepo** - Build orchestration
- **pnpm** - Package management
- **TypeScript** - Type safety
- **ESLint** - Linting
- **Prettier** - Formatting

## License

MIT — see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Status

🚧 **Early Development** - This project is in active development. APIs and structure may change.
