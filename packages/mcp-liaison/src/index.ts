#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { randomUUID } from "crypto";

/**
 * Liaison MCP Server
 * 
 * A primary MCP server for delegating long-running jobs to sub-agents,
 * streaming check-ins, and handing off prompt-in → summary-out context.
 */

/**
 * Task status enum
 */
export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

/**
 * Task state interface
 */
export interface TaskState {
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

/**
 * Logging utility with structured output
 * @param level - Log level (info, warn, error)
 * @param message - Log message
 * @param data - Optional structured data
 */
export function log(level: "info" | "warn" | "error", message: string, data?: unknown): void {
  const timestamp = new Date().toISOString();
  const logMessage = data 
    ? `[${timestamp}] [${level.toUpperCase()}] ${message}: ${JSON.stringify(data)}`
    : `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  console.error(logMessage);
}

/**
 * Configuration options for the Liaison server
 */
export interface LiaisonConfig {
  maxConcurrentTasks?: number;
  taskTimeoutMs?: number;
  maxTaskDescriptionLength?: number;
  maxContextLength?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<LiaisonConfig> = {
  maxConcurrentTasks: 10,
  taskTimeoutMs: 300000, // 5 minutes
  maxTaskDescriptionLength: 5000,
  maxContextLength: 50000,
};

/**
 * Liaison MCP Server class
 * Manages task delegation and status tracking
 */
export class LiaisonServer {
  private server: McpServer;
  private tasks: Map<string, TaskState> = new Map();
  private config: Required<LiaisonConfig>;
  private shutdownHandlerBound: () => Promise<void>;

  /**
   * Creates a new Liaison server instance
   * @param config - Optional configuration overrides
   */
  constructor(config: LiaisonConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.server = new McpServer(
      {
        name: "liaison",
        version: "0.0.1",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
    
    // Bind shutdown handler once
    this.shutdownHandlerBound = this.handleShutdown.bind(this);
  }

  /**
   * Handle graceful shutdown
   */
  private async handleShutdown(): Promise<void> {
    log("info", "Shutting down server...");
    
    // Cancel all running tasks
    const runningTasks = Array.from(this.tasks.values())
      .filter(t => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.PENDING);
    
    if (runningTasks.length > 0) {
      log("info", `Cancelling ${runningTasks.length} running tasks`);
      for (const task of runningTasks) {
        task.status = TaskStatus.CANCELLED;
        task.updatedAt = new Date();
      }
    }
    
    await this.server.close();
    process.exit(0);
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    process.on("SIGINT", this.shutdownHandlerBound);
    process.on("SIGTERM", this.shutdownHandlerBound);
  }

  /**
   * Remove signal handlers (for testing)
   */
  private removeSignalHandlers(): void {
    process.removeListener("SIGINT", this.shutdownHandlerBound);
    process.removeListener("SIGTERM", this.shutdownHandlerBound);
  }

  /**
   * Get active task count
   */
  private getActiveTaskCount(): number {
    return Array.from(this.tasks.values())
      .filter(t => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.PENDING)
      .length;
  }

  /**
   * Generate a unique task ID
   */
  private generateTaskId(): string {
    return `task-${randomUUID()}`;
  }

  /**
   * Validate task exists
   */
  private validateTaskExists(taskId: string): TaskState {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    return task;
  }

  /**
   * Cleanup old completed/failed tasks
   * Keeps only the last 100 completed tasks to prevent memory growth
   */
  private cleanupOldTasks(): void {
    const completedTasks = Array.from(this.tasks.entries())
      .filter(([_, task]) => 
        task.status === TaskStatus.COMPLETED || 
        task.status === TaskStatus.FAILED ||
        task.status === TaskStatus.CANCELLED
      )
      .sort((a, b) => b[1].updatedAt.getTime() - a[1].updatedAt.getTime());

    // Keep only the most recent 100 completed tasks
    if (completedTasks.length > 100) {
      const toRemove = completedTasks.slice(100);
      toRemove.forEach(([id]) => {
        this.tasks.delete(id);
      });
      log("info", `Cleaned up ${toRemove.length} old tasks`);
    }
  }

  /**
   * Setup MCP tool handlers
   */
  private setupTools(): void {
    // Register delegate tool
    this.server.registerTool(
      "delegate",
      {
        description: "Delegate a long-running task to a sub-agent",
        inputSchema: z.object({
          task: z
            .string()
            .min(1, "Task description cannot be empty")
            .max(
              this.config.maxTaskDescriptionLength,
              `Task description too long (max ${this.config.maxTaskDescriptionLength} chars)`
            )
            .describe("Description of the task to delegate"),
          context: z
            .string()
            .max(
              this.config.maxContextLength,
              `Context too long (max ${this.config.maxContextLength} chars)`
            )
            .optional()
            .describe("Optional context and requirements for the task"),
        }).shape,
      },
      async (args) => {
        try {
          // Check concurrent task limit
          const activeCount = this.getActiveTaskCount();
          if (activeCount >= this.config.maxConcurrentTasks) {
            log("warn", "Max concurrent tasks reached", { 
              activeCount, 
              max: this.config.maxConcurrentTasks 
            });
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({
                    error: "Maximum concurrent tasks reached",
                    maxConcurrentTasks: this.config.maxConcurrentTasks,
                    currentActiveTasks: activeCount,
                    message: "Please wait for some tasks to complete before delegating new ones",
                  }, null, 2),
                },
              ],
            };
          }

          const taskId = this.generateTaskId();
          const now = new Date();

          const taskState: TaskState = {
            id: taskId,
            task: args.task,
            context: args.context,
            status: TaskStatus.PENDING,
            createdAt: now,
            updatedAt: now,
            progress: 0,
          };

          this.tasks.set(taskId, taskState);

          log("info", "Task delegated successfully", { 
            taskId, 
            taskLength: args.task.length,
            hasContext: !!args.context 
          });

          // Simulate async task processing
          this.processTask(taskId).catch((error: unknown) => {
            log("error", "Task processing failed", { taskId, error });
          });

          // Cleanup old tasks periodically
          this.cleanupOldTasks();

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  taskId,
                  status: taskState.status,
                  task: args.task,
                  context: args.context || null,
                  createdAt: taskState.createdAt.toISOString(),
                  message: "Task has been delegated and is pending execution",
                  estimatedTimeoutMs: this.config.taskTimeoutMs,
                }, null, 2),
              },
            ],
          };
        } catch (error) {
          log("error", "Failed to delegate task", { 
            error: error instanceof Error ? error.message : String(error) 
          });
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  error: "Failed to delegate task",
                  message: error instanceof Error ? error.message : String(error),
                }, null, 2),
              },
            ],
          };
        }
      }
    );

    // Register check_status tool
    this.server.registerTool(
      "check_status",
      {
        description: "Check the status of a delegated task",
        inputSchema: z.object({
          taskId: z
            .string()
            .min(1, "Task ID cannot be empty")
            .describe("The ID of the task to check"),
        }).shape,
      },
      async (args) => {
        try {
          log("info", "Checking task status", { taskId: args.taskId });

          const task = this.validateTaskExists(args.taskId);

          const response: Record<string, unknown> = {
            taskId: task.id,
            status: task.status,
            task: task.task,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
            progress: task.progress,
          };

          if (task.context) {
            response.context = task.context;
          }

          if (task.startedAt) {
            response.startedAt = task.startedAt.toISOString();
          }

          if (task.completedAt) {
            response.completedAt = task.completedAt.toISOString();
            response.durationMs = task.completedAt.getTime() - task.createdAt.getTime();
          }

          if (task.result) {
            response.result = task.result;
          }

          if (task.error) {
            response.error = task.error;
          }

          // Add helpful message based on status
          switch (task.status) {
            case TaskStatus.PENDING:
              response.message = "Task is pending execution";
              break;
            case TaskStatus.IN_PROGRESS:
              response.message = "Task is currently being processed";
              break;
            case TaskStatus.COMPLETED:
              response.message = "Task completed successfully";
              break;
            case TaskStatus.FAILED:
              response.message = "Task failed during execution";
              break;
            case TaskStatus.CANCELLED:
              response.message = "Task was cancelled";
              break;
          }

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(response, null, 2),
              },
            ],
          };
        } catch (error) {
          log("error", "Failed to check task status", { 
            taskId: args.taskId,
            error: error instanceof Error ? error.message : String(error) 
          });
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  error: "Failed to check task status",
                  taskId: args.taskId,
                  message: error instanceof Error ? error.message : String(error),
                }, null, 2),
              },
            ],
          };
        }
      }
    );

    // Register list_tasks tool
    this.server.registerTool(
      "list_tasks",
      {
        description: "List all tasks with optional filtering by status",
        inputSchema: z.object({
          status: z
            .enum([
              TaskStatus.PENDING,
              TaskStatus.IN_PROGRESS,
              TaskStatus.COMPLETED,
              TaskStatus.FAILED,
              TaskStatus.CANCELLED,
            ])
            .optional()
            .describe("Filter tasks by status"),
          limit: z
            .number()
            .int()
            .positive()
            .max(100)
            .optional()
            .default(10)
            .describe("Maximum number of tasks to return (default: 10, max: 100)"),
        }).shape,
      },
      async (args) => {
        try {
          log("info", "Listing tasks", { status: args.status, limit: args.limit });

          let tasks = Array.from(this.tasks.values());

          // Filter by status if provided
          if (args.status) {
            tasks = tasks.filter(t => t.status === args.status);
          }

          // Sort by most recent first
          tasks.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

          // Limit results
          tasks = tasks.slice(0, args.limit);

          const taskList = tasks.map(task => ({
            taskId: task.id,
            status: task.status,
            task: task.task.substring(0, 100) + (task.task.length > 100 ? "..." : ""),
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
            progress: task.progress,
          }));

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  total: this.tasks.size,
                  filtered: taskList.length,
                  tasks: taskList,
                }, null, 2),
              },
            ],
          };
        } catch (error) {
          log("error", "Failed to list tasks", { 
            error: error instanceof Error ? error.message : String(error) 
          });
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  error: "Failed to list tasks",
                  message: error instanceof Error ? error.message : String(error),
                }, null, 2),
              },
            ],
          };
        }
      }
    );

    // Register cancel_task tool
    this.server.registerTool(
      "cancel_task",
      {
        description: "Cancel a pending or in-progress task",
        inputSchema: z.object({
          taskId: z
            .string()
            .min(1, "Task ID cannot be empty")
            .describe("The ID of the task to cancel"),
        }).shape,
      },
      async (args) => {
        try {
          log("info", "Cancelling task", { taskId: args.taskId });

          const task = this.validateTaskExists(args.taskId);

          // Can only cancel pending or in-progress tasks
          if (task.status !== TaskStatus.PENDING && task.status !== TaskStatus.IN_PROGRESS) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({
                    error: "Cannot cancel task",
                    taskId: args.taskId,
                    status: task.status,
                    message: `Task is already ${task.status} and cannot be cancelled`,
                  }, null, 2),
                },
              ],
            };
          }

          task.status = TaskStatus.CANCELLED;
          task.updatedAt = new Date();

          log("info", "Task cancelled successfully", { taskId: args.taskId });

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  taskId: task.id,
                  status: task.status,
                  message: "Task has been cancelled",
                  updatedAt: task.updatedAt.toISOString(),
                }, null, 2),
              },
            ],
          };
        } catch (error) {
          log("error", "Failed to cancel task", { 
            taskId: args.taskId,
            error: error instanceof Error ? error.message : String(error) 
          });
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  error: "Failed to cancel task",
                  taskId: args.taskId,
                  message: error instanceof Error ? error.message : String(error),
                }, null, 2),
              },
            ],
          };
        }
      }
    );
  }

  /**
   * Simulate task processing (placeholder for actual sub-agent delegation)
   * TODO: Replace with actual sub-agent spawning and management
   */
  private async processTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return;
    }

    try {
      // Update to in-progress
      task.status = TaskStatus.IN_PROGRESS;
      task.startedAt = new Date();
      task.updatedAt = new Date();
      task.progress = 0;

      log("info", "Task processing started", { taskId });

      // Simulate work with progress updates
      const steps = 5;
      for (let i = 0; i < steps; i++) {
        // Check if task was cancelled
        const currentTask = this.tasks.get(taskId);
        if (!currentTask || currentTask.status === TaskStatus.CANCELLED) {
          log("info", "Task was cancelled during processing", { taskId });
          return;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        task.progress = Math.round(((i + 1) / steps) * 100);
        task.updatedAt = new Date();
        log("info", "Task progress update", { taskId, progress: task.progress });
      }

      // Check timeout
      const elapsed = Date.now() - task.startedAt.getTime();
      if (elapsed > this.config.taskTimeoutMs) {
        throw new Error(`Task exceeded timeout of ${this.config.taskTimeoutMs}ms`);
      }

      // Mark as completed
      task.status = TaskStatus.COMPLETED;
      task.completedAt = new Date();
      task.updatedAt = new Date();
      task.progress = 100;
      task.result = "Task completed successfully (simulated)";

      log("info", "Task completed successfully", { 
        taskId, 
        durationMs: task.completedAt.getTime() - task.createdAt.getTime() 
      });
    } catch (error) {
      task.status = TaskStatus.FAILED;
      task.completedAt = new Date();
      task.updatedAt = new Date();
      task.error = error instanceof Error ? error.message : String(error);

      log("error", "Task failed", { 
        taskId, 
        error: task.error 
      });
    }
  }

  /**
   * Start the server with stdio transport
   */
  async run(): Promise<void> {
    try {
      this.setupSignalHandlers();
      
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      log("info", "Liaison MCP server running on stdio", {
        config: {
          maxConcurrentTasks: this.config.maxConcurrentTasks,
          taskTimeoutMs: this.config.taskTimeoutMs,
        }
      });
    } catch (error) {
      log("error", "Failed to start server", error);
      throw error;
    }
  }

  /**
   * Stop the server and cleanup resources
   */
  async stop(): Promise<void> {
    log("info", "Stopping server");
    this.removeSignalHandlers();
    await this.server.close();
  }

  /**
   * Get server statistics
   */
  getStats(): {
    totalTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    failedTasks: number;
    cancelledTasks: number;
  } {
    const tasks = Array.from(this.tasks.values());
    return {
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status === TaskStatus.PENDING).length,
      inProgressTasks: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      completedTasks: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
      failedTasks: tasks.filter(t => t.status === TaskStatus.FAILED).length,
      cancelledTasks: tasks.filter(t => t.status === TaskStatus.CANCELLED).length,
    };
  }

  /**
   * Get a task by ID (for testing)
   */
  getTask(taskId: string): TaskState | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Clear all tasks (for testing)
   */
  clearTasks(): void {
    this.tasks.clear();
  }
}

// Only run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new LiaisonServer();
  server.run().catch((error) => {
    log("error", "Failed to start server", error);
    process.exit(1);
  });
}
