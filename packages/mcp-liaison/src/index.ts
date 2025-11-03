#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

/**
 * Liaison MCP Server
 * 
 * A primary MCP server for delegating long-running jobs to sub-agents,
 * streaming check-ins, and handing off prompt-in → summary-out context.
 */

// Zod schemas for input validation
const DelegateTaskSchema = z.object({
  task: z.string().describe("Description of the task to delegate"),
  context: z.string().optional().describe("Context and requirements for the task"),
});

const CheckStatusSchema = z.object({
  taskId: z.string().describe("The ID of the task to check"),
});

// Type-safe interfaces derived from Zod schemas
type DelegateTaskInput = z.infer<typeof DelegateTaskSchema>;
type CheckStatusInput = z.infer<typeof CheckStatusSchema>;

// Logging utility
function log(level: "info" | "error", message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const logMessage = data 
    ? `[${timestamp}] [${level.toUpperCase()}] ${message}: ${JSON.stringify(data)}`
    : `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  console.error(logMessage);
}

class LiaisonServer {
  private server: Server;

  constructor() {
    this.server = new Server(
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

    this.setupToolHandlers();
    
    // Error handling with proper logging
    this.server.onerror = (error) => log("error", "MCP Server Error", error);
    
    // Graceful shutdown
    process.on("SIGINT", async () => {
      log("info", "Shutting down server...");
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "delegate_task",
          description: "Delegate a long-running task to a sub-agent",
          inputSchema: {
            type: "object",
            properties: {
              task: {
                type: "string",
                description: "Description of the task to delegate",
              },
              context: {
                type: "string",
                description: "Context and requirements for the task",
              },
            },
            required: ["task"],
          },
        },
        {
          name: "check_status",
          description: "Check the status of a delegated task",
          inputSchema: {
            type: "object",
            properties: {
              taskId: {
                type: "string",
                description: "The ID of the task to check",
              },
            },
            required: ["taskId"],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case "delegate_task":
            return await this.handleDelegateTask(args ?? {});
          case "check_status":
            return await this.handleCheckStatus(args ?? {});
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        // Handle Zod validation errors and other errors
        if (error instanceof z.ZodError) {
          return {
            content: [
              {
                type: "text",
                text: `Validation error: ${error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`,
              },
            ],
            isError: true,
          };
        }
        
        // Handle other errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async handleDelegateTask(args: Record<string, unknown>) {
    // Validate input using Zod schema
    const parsed: DelegateTaskInput = DelegateTaskSchema.parse(args);
    const { task, context } = parsed;
    
    log("info", "Delegating task", { task, context });
    
    // TODO: Implement actual task delegation
    const taskId = `task-${Date.now()}`;
    
    log("info", "Task delegated successfully", { taskId });
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            taskId,
            status: "delegated",
            task,
            context: context || "No additional context provided",
            message: "Task has been delegated to a sub-agent",
          }, null, 2),
        },
      ],
    };
  }

  private async handleCheckStatus(args: Record<string, unknown>) {
    // Validate input using Zod schema
    const parsed: CheckStatusInput = CheckStatusSchema.parse(args);
    const { taskId } = parsed;
    
    log("info", "Checking task status", { taskId });
    
    // TODO: Implement actual status checking
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            taskId,
            status: "in_progress",
            message: "Task is currently being processed",
          }, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    log("info", "Liaison MCP server running on stdio");
  }
}

const server = new LiaisonServer();
server.run().catch((error) => {
  log("error", "Failed to start server", error);
  process.exit(1);
});
