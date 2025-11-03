# Liaison Hub

# MCP Liaison

An **MCP (Model Context Protocol)** server for managing distributed, asynchronous workloads.

## Features

- **Task Delegation**: Queue and execute long-running tasks  
- **Smart Tracking**: Persistent state, auto-recovery, and progress  
- **Built-In Limits**: Configurable concurrency and timeouts  
- **Type-Safe**: Full TypeScript with Zod schemas  

For more details, see the dedicated package at [packages/mcp-liaison](./packages/mcp-liaison).

## Quick Start

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Test
pnpm test

# Lint
pnpm lint
```

## Project Structure

```
liaison-hub/
├── packages/
│   └── mcp-liaison/          # Main MCP server package
│       ├── src/
│       │   ├── index.ts      # Server implementation
│       │   └── __tests__/    # Test suite
│       ├── docs/             # Documentation
│       └── README.md         # Package README
├── package.json              # Root workspace config
├── turbo.json               # Turbo build config
└── pnpm-workspace.yaml      # PNPM workspace config
```

## Development

This project uses:
- **pnpm** - Fast, disk-efficient package manager
- **Turbo** - High-performance build system
- **TypeScript** - Type-safe development
- **Vitest** - Fast unit testing
- **ESLint** - Code quality

## License

MIT

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
