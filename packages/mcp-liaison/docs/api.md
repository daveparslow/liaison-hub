# API Reference

## Classes

### LiaisonServer

Main server class for managing task delegation and tracking.

#### Constructor

```typescript
constructor(config?: LiaisonConfig)
```

**Parameters:**
- `config` (optional): Configuration object

**Example:**
```typescript
const server = new LiaisonServer({
  maxConcurrentTasks: 10,
  taskTimeoutMs: 300000,
});
```

#### Methods

##### `run(): Promise<void>`

Start the server with stdio transport.

**Returns:** Promise that resolves when server is running

**Throws:** Error if server fails to start

**Example:**
```typescript
await server.run();
```

---

##### `stop(): Promise<void>`

Stop the server and cleanup resources.

**Returns:** Promise that resolves when server is stopped

**Example:**
```typescript
await server.stop();
```

---

##### `getStats(): ServerStats`

Get current server statistics.

**Returns:** ServerStats object

**Example:**
```typescript
const stats = server.getStats();
console.log(stats.totalTasks);
```

---

##### `getTask(taskId: string): TaskState | undefined`

Get a specific task by ID.

**Parameters:**
- `taskId`: The task ID

**Returns:** TaskState or undefined if not found

**Example:**
```typescript
const task = server.getTask("task-123");
if (task) {
  console.log(task.status);
}
```

---

##### `clearTasks(): void`

Clear all tasks (primarily for testing).

**Example:**
```typescript
server.clearTasks();
```

---

## Interfaces

### LiaisonConfig

Configuration options for the server.

```typescript
interface LiaisonConfig {
  maxConcurrentTasks?: number;
  taskTimeoutMs?: number;
  maxTaskDescriptionLength?: number;
  maxContextLength?: number;
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `maxConcurrentTasks` | number | 10 | Maximum number of concurrent tasks |
| `taskTimeoutMs` | number | 300000 | Task timeout in milliseconds (5 min) |
| `maxTaskDescriptionLength` | number | 5000 | Max task description length |
| `maxContextLength` | number | 50000 | Max context length |

---

### TaskState

Represents the current state of a task.

```typescript
interface TaskState {
  id: string;
  task: string;
  context?: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: string;
  error?: string;
  progress?: number;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique task identifier |
| `task` | string | Task description |
| `context` | string? | Optional context |
| `status` | TaskStatus | Current task status |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last update timestamp |
| `startedAt` | Date? | When task started |
| `completedAt` | Date? | When task completed/failed |
| `result` | string? | Success result |
| `error` | string? | Error message if failed |
| `progress` | number? | Progress percentage (0-100) |

---

### ServerStats

Server statistics object.

```typescript
interface ServerStats {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  failedTasks: number;
  cancelledTasks: number;
}
```

---

## Enums

### TaskStatus

Task status enumeration.

```typescript
enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}
```

**Values:**

| Value | Description |
|-------|-------------|
| `PENDING` | Task is queued for execution |
| `IN_PROGRESS` | Task is currently running |
| `COMPLETED` | Task finished successfully |
| `FAILED` | Task encountered an error |
| `CANCELLED` | Task was cancelled |

---

## Functions

### log

Structured logging utility.

```typescript
function log(
  level: "info" | "warn" | "error",
  message: string,
  data?: unknown
): void
```

**Parameters:**
- `level`: Log level
- `message`: Log message
- `data` (optional): Additional structured data

**Example:**
```typescript
log("info", "Task completed", { taskId: "123" });
log("error", "Task failed", { error: "Timeout" });
```

---

## MCP Tool Schemas

### delegate

```typescript
{
  task: z.string()
    .min(1, "Task description cannot be empty")
    .max(5000, "Task description too long"),
  context: z.string()
    .max(50000, "Context too long")
    .optional()
}
```

### check_status

```typescript
{
  taskId: z.string()
    .min(1, "Task ID cannot be empty")
}
```

### list_tasks

```typescript
{
  status: z.enum([
    "pending",
    "in_progress",
    "completed",
    "failed",
    "cancelled"
  ]).optional(),
  limit: z.number()
    .int()
    .positive()
    .max(100)
    .default(10)
}
```

### cancel_task

```typescript
{
  taskId: z.string()
    .min(1, "Task ID cannot be empty")
}
```

---

## Error Handling

All tool handlers return error objects on failure:

```typescript
{
  error: string;      // Error type/category
  message: string;    // Human-readable error message
  [key: string]: any; // Additional context
}
```

**Example Error Response:**
```json
{
  "error": "Failed to delegate task",
  "message": "Maximum concurrent tasks reached",
  "maxConcurrentTasks": 10,
  "currentActiveTasks": 10
}
```

---

## Type Guards

### Checking Task Status

```typescript
function isCompleted(task: TaskState): boolean {
  return task.status === TaskStatus.COMPLETED;
}

function isFailed(task: TaskState): boolean {
  return task.status === TaskStatus.FAILED;
}

function isActive(task: TaskState): boolean {
  return task.status === TaskStatus.PENDING || 
         task.status === TaskStatus.IN_PROGRESS;
}
```

---

## Constants

```typescript
const DEFAULT_CONFIG: Required<LiaisonConfig> = {
  maxConcurrentTasks: 10,
  taskTimeoutMs: 300000,
  maxTaskDescriptionLength: 5000,
  maxContextLength: 50000,
};
```
