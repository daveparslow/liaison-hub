#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * Liaison MCP Server
 * 
 * A primary MCP server for delegating long-running jobs to sub-agents,
 * streaming check-ins, and handing off prompt-in → summary-out context.
 */

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
    
    // Error handling
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
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
      const { name, arguments: args } = request.params;

      switch (name) {
        case "delegate_task":
          return this.handleDelegateTask(args ?? {});
        case "check_status":
          return this.handleCheckStatus(args ?? {});
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async handleDelegateTask(args: Record<string, unknown>) {
    const { task, context } = args;
    
    // TODO: Implement actual task delegation
    const taskId = `task-${Date.now()}`;
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            taskId,
            status: "delegated",
            task,
            context,
            message: "Task has been delegated to a sub-agent",
          }, null, 2),
        },
      ],
    };
  }

  private async handleCheckStatus(args: Record<string, unknown>) {
    const { taskId } = args;
    
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
    console.error("Liaison MCP server running on stdio");
  }
}

const server = new LiaisonServer();
server.run().catch(console.error);
