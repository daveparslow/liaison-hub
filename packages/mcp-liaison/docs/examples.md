# MCP Liaison Examples

## Basic Task Delegation

```typescript
// Delegate a simple task
const response = await client.callTool("delegate", {
  task: "Analyze the performance of our API endpoints"
});

console.log(response.taskId); // task-abc123...
```

## Task with Context

```typescript
// Delegate a task with additional context
const response = await client.callTool("delegate", {
  task: "Review and refactor the authentication module",
  context: `
    Current issues:
    - JWT tokens not properly validated
    - Password hashing uses outdated algorithm
    - Rate limiting not implemented
    
    Requirements:
    - Use bcrypt for password hashing
    - Implement JWT refresh tokens
    - Add rate limiting to login endpoint
  `
});
```

## Monitoring Task Progress

```typescript
// Check status periodically
const taskId = "task-abc123...";

const interval = setInterval(async () => {
  const status = await client.callTool("check_status", { taskId });
  
  console.log(`Progress: ${status.progress}%`);
  console.log(`Status: ${status.status}`);
  
  if (status.status === "completed") {
    console.log("Result:", status.result);
    clearInterval(interval);
  } else if (status.status === "failed") {
    console.error("Error:", status.error);
    clearInterval(interval);
  }
}, 2000);
```

## Listing All Active Tasks

```typescript
// Get all in-progress tasks
const response = await client.callTool("list_tasks", {
  status: "in_progress",
  limit: 50
});

console.log(`Active tasks: ${response.filtered}`);
response.tasks.forEach(task => {
  console.log(`${task.taskId}: ${task.progress}%`);
});
```

## Cancelling a Task

```typescript
// Cancel a running task
const taskId = "task-abc123...";

const response = await client.callTool("cancel_task", { taskId });

if (response.status === "cancelled") {
  console.log("Task cancelled successfully");
}
```

## Error Handling

```typescript
try {
  const response = await client.callTool("delegate", {
    task: "", // Empty task - will fail validation
  });
} catch (error) {
  console.error("Failed to delegate task:", error.message);
}

// Check status of non-existent task
const status = await client.callTool("check_status", {
  taskId: "non-existent-id"
});

if (status.error) {
  console.error("Task not found:", status.message);
}
```

## Custom Configuration

```typescript
import { LiaisonServer } from "@liaison-hub/mcp-liaison";

const server = new LiaisonServer({
  // Allow up to 20 concurrent tasks
  maxConcurrentTasks: 20,
  
  // Tasks timeout after 10 minutes
  taskTimeoutMs: 600000,
  
  // Allow longer task descriptions
  maxTaskDescriptionLength: 10000,
  
  // Allow more context
  maxContextLength: 100000,
});

await server.run();
```

## Getting Server Statistics

```typescript
import { LiaisonServer } from "@liaison-hub/mcp-liaison";

const server = new LiaisonServer();

// Get current statistics
const stats = server.getStats();

console.log(`Total tasks: ${stats.totalTasks}`);
console.log(`Pending: ${stats.pendingTasks}`);
console.log(`In progress: ${stats.inProgressTasks}`);
console.log(`Completed: ${stats.completedTasks}`);
console.log(`Failed: ${stats.failedTasks}`);
console.log(`Cancelled: ${stats.cancelledTasks}`);
```

## Programmatic Task Management

```typescript
import { LiaisonServer } from "@liaison-hub/mcp-liaison";

const server = new LiaisonServer();

// Get a specific task
const task = server.getTask("task-abc123...");
if (task) {
  console.log(`Task status: ${task.status}`);
  console.log(`Progress: ${task.progress}%`);
}

// Clear all tasks (useful for testing)
server.clearTasks();
```

## Graceful Shutdown

```typescript
import { LiaisonServer } from "@liaison-hub/mcp-liaison";

const server = new LiaisonServer();
await server.run();

// Later, when shutting down
process.on("SIGTERM", async () => {
  console.log("Shutting down...");
  await server.stop();
  console.log("Server stopped gracefully");
  process.exit(0);
});
```

## Batch Task Delegation

```typescript
// Delegate multiple tasks at once
const tasks = [
  { task: "Analyze module A" },
  { task: "Analyze module B" },
  { task: "Analyze module C" },
];

const taskIds = await Promise.all(
  tasks.map(t => client.callTool("delegate", t))
);

console.log(`Delegated ${taskIds.length} tasks`);

// Monitor all tasks
const results = await Promise.all(
  taskIds.map(async ({ taskId }) => {
    let status;
    do {
      await new Promise(resolve => setTimeout(resolve, 1000));
      status = await client.callTool("check_status", { taskId });
    } while (status.status === "pending" || status.status === "in_progress");
    return status;
  })
);

console.log("All tasks completed:", results);
```

## Task Queue Pattern

```typescript
class TaskQueue {
  private maxConcurrent = 5;
  private pending: Array<() => Promise<void>> = [];
  private active = 0;

  async add(task: string, context?: string) {
    return new Promise((resolve, reject) => {
      this.pending.push(async () => {
        try {
          this.active++;
          const result = await client.callTool("delegate", { task, context });
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.active--;
          this.processNext();
        }
      });
      this.processNext();
    });
  }

  private processNext() {
    if (this.active < this.maxConcurrent && this.pending.length > 0) {
      const next = this.pending.shift();
      next?.();
    }
  }
}

const queue = new TaskQueue();
queue.add("Task 1");
queue.add("Task 2");
// Tasks will be processed respecting concurrency limit
```
