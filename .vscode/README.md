# Liaison MCP Configuration

This directory contains MCP server configuration for the Liaison project.

## Files

### `liaison-mcp.json`
MCP server configuration for use with VS Code GitHub Copilot or other MCP clients.

## Configuration

### Main Liaison Server
The `liaison` server is the primary MCP server that handles task delegation.

**Environment Variables:**
- `ANTHROPIC_API_KEY` - Your Anthropic API key for Claude
- `BRAVE_API_KEY` - (Optional) For web search via brave-search server

**Configuration Options:**
- `LIAISON_MODEL_PROVIDER` - Model provider (`anthropic`, `openai`, or `local`)
- `LIAISON_MODEL` - Model to use (e.g., `claude-3-5-sonnet-20241022`)
- `LIAISON_MAX_CONCURRENT_TASKS` - Max parallel tasks (default: 5)
- `LIAISON_TASK_TIMEOUT_MS` - Task timeout in milliseconds (default: 300000)

### Tool Servers (for Sub-Agents)
Sub-agents spawned by liaison can access these MCP tool servers:

#### `filesystem`
- **Purpose**: File system operations (read, write, list, search)
- **Scope**: Limited to `./workspace` directory
- **Status**: Enabled by default

#### `fetch`
- **Purpose**: HTTP requests (GET, POST, etc.)
- **Security**: No authentication required
- **Status**: Enabled by default

#### `memory`
- **Purpose**: Key-value storage for persistent data
- **Status**: Enabled by default

## Setup

### 1. Set Environment Variables

Create a `.env` file in the project root:

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Build the Project

```bash
pnpm build
```

### 3. Use in VS Code

#### Option A: GitHub Copilot
1. Open VS Code settings
2. Search for "MCP"
3. Point to this `liaison-mcp.json` file

#### Option B: Manual MCP Client
```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const client = new Client({
  name: "my-client",
  version: "1.0.0"
});

// Connect to liaison server
await client.connect(/* transport */);

// Delegate a task
const result = await client.callTool("delegate", {
  task: "Search for MCP documentation and summarize it",
  context: "Focus on tool usage patterns"
});
```

## Architecture

```
┌─────────────────────────────────────────────┐
│  MCP Client (VS Code, CLI, etc.)            │
└─────────────────┬───────────────────────────┘
                  │
                  │ delegate(task)
                  ▼
┌─────────────────────────────────────────────┐
│  Liaison MCP Server                         │
│  - Queues tasks                             │
│  - Spawns sub-agents                        │
│  - Tracks progress                          │
└─────────────────┬───────────────────────────┘
                  │
                  │ Creates sub-agent with tools
                  ▼
┌─────────────────────────────────────────────┐
│  Sub-Agent (Claude + Tools)                 │
│  ┌─────────────────────────────────────┐   │
│  │  Claude 3.5 Sonnet                  │   │
│  │  with function calling              │   │
│  └──────┬──────────────────────────────┘   │
│         │                                    │
│         │ Tool calls                         │
│         ▼                                    │
│  ┌──────────────────────────────────────┐  │
│  │  MCP Tool Servers:                   │  │
│  │  - filesystem (read/write files)     │  │
│  │  - fetch (HTTP requests)             │  │
│  │  - memory (key-value storage)        │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Security Notes

1. **Filesystem Access**: Limited to `./workspace` directory
2. **API Keys**: Never commit to repo, use environment variables
3. **Tool Selection**: Enable only tools needed for your use case
4. **Timeouts**: Configure appropriate timeouts to prevent runaway tasks
5. **Sandboxing**: Future: Run sub-agents in containers

## Troubleshooting

### "Model provider not configured"
Ensure `ANTHROPIC_API_KEY` is set in your environment.

### "Tool server not found"
The tool servers are installed on-demand via `npx -y`. Ensure you have internet access.

### "Task timeout"
Increase `LIAISON_TASK_TIMEOUT_MS` for longer-running tasks.

## Next Steps

1. Implement model execution in `src/executors/`
2. Add tool registry and management
3. Implement sub-agent spawning
4. Add streaming progress updates
5. Test with real tasks
