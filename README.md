# Liaison Hub

Liaison — a primary MCP server (with a bundled VS Code extension) for delegating long-running jobs to sub-agents, streaming check-ins, and handing off prompt-in → summary-out context.

## Prerequisites

### Node.js (via nvm)

This project requires Node.js 18 or higher. We recommend using nvm to manage Node versions.

**Windows:**
```powershell
# Install nvm-windows (requires admin privileges)
winget install CoreyButler.NVMforWindows

# Restart your terminal, then install Node 20:
nvm install 20.19.0
nvm use 20.19.0

# Or use the helper script to read from .nvmrc:
.\use-node.ps1
```

**macOS/Linux:**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart your terminal, then:
nvm install
nvm use
```

The project includes a `.nvmrc` file. macOS/Linux users can run `nvm use` to switch to the correct Node version automatically.

## Setup

```bash
# Clone and install
git clone https://github.com/daveparslow/liaison-hub.git
cd liaison-hub
nvm use          # Use Node version from .nvmrc
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
