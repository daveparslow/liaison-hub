# @liaison-hub/mcp-liaison

A Model Context Protocol (MCP) server for delegating long-running jobs to sub-agents with streaming check-ins and prompt-in → summary-out context handling.

## Features

- **Task Delegation**: Delegate long-running tasks to sub-agents
- **Status Tracking**: Check the status of delegated tasks
- **Streaming Support**: Real-time check-ins and progress updates
- **Context Handoff**: Efficient prompt-in → summary-out context management

## Installation

```bash
pnpm install @liaison-hub/mcp-liaison
```

## Usage

### As an MCP Server

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "liaison": {
      "command": "npx",
      "args": ["-y", "@liaison-hub/mcp-liaison"]
    }
  }
}
```

### Available Tools

#### `delegate`

Delegate a long-running task to a sub-agent.

**Parameters:**
- `task` (string, required): Description of the task to delegate (max 5000 chars)
- `context` (string, optional): Context and requirements for the task (max 50000 chars)

**Returns:** Task ID, status, and delegation confirmation

#### `check_status`

Check the status of a delegated task.

**Parameters:**
- `taskId` (string, required): The ID of the task to check

**Returns:** Current task status, progress, and result/error information

#### `list_tasks`

List all tasks with optional filtering.

**Parameters:**
- `status` (string, optional): Filter by status (pending, in_progress, completed, failed, cancelled)
- `limit` (number, optional): Maximum number of tasks to return (default: 10, max: 100)

**Returns:** Array of tasks with their current status

#### `cancel_task`

Cancel a pending or in-progress task.

**Parameters:**
- `taskId` (string, required): The ID of the task to cancel

**Returns:** Cancellation confirmation and updated task status

## Development

```bash
# Build
pnpm run build

# Watch mode
pnpm run watch

# Type check
pnpm run check-types

# Lint
pnpm run lint
```

## License

MIT
