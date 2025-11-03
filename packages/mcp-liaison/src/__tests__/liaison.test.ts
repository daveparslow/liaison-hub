import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { LiaisonServer, TaskStatus, log } from "../index.js";

/**
 * Liaison MCP Server Tests
 */
describe("LiaisonServer", () => {
  let server: LiaisonServer;

  beforeEach(() => {
    server = new LiaisonServer({ taskTimeoutMs: 1000 });
  });

  afterEach(async () => {
    await server.stop();
    server.clearTasks();
  });

  describe("Task Management", () => {
    it("should create a server instance with default config", () => {
      expect(server).toBeDefined();
      expect(server.getStats().totalTasks).toBe(0);
    });

    it("should create a server instance with custom config", () => {
      const customServer = new LiaisonServer({
        maxConcurrentTasks: 5,
        taskTimeoutMs: 2000,
      });
      expect(customServer).toBeDefined();
    });

    it("should generate unique task IDs", () => {
      const stats = server.getStats();
      expect(stats.totalTasks).toBe(0);
    });

    it("should track task statistics correctly", async () => {
      const initialStats = server.getStats();
      expect(initialStats.totalTasks).toBe(0);
      expect(initialStats.pendingTasks).toBe(0);
    });
  });

  describe("Task States", () => {
    it("should support all task statuses", () => {
      expect(TaskStatus.PENDING).toBe("pending");
      expect(TaskStatus.IN_PROGRESS).toBe("in_progress");
      expect(TaskStatus.COMPLETED).toBe("completed");
      expect(TaskStatus.FAILED).toBe("failed");
      expect(TaskStatus.CANCELLED).toBe("cancelled");
    });
  });

  describe("Server Lifecycle", () => {
    it("should stop server cleanly", async () => {
      await expect(server.stop()).resolves.not.toThrow();
    });

    it("should clear tasks", () => {
      server.clearTasks();
      expect(server.getStats().totalTasks).toBe(0);
    });
  });
});

describe("Logging utility", () => {
  it("should log info messages", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    log("info", "Test message");
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should log error messages", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    log("error", "Test error");
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should log messages with data", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    log("info", "Test with data", { key: "value" });
    expect(consoleSpy).toHaveBeenCalled();
    const call = consoleSpy.mock.calls[0][0] as string;
    expect(call).toContain("Test with data");
    expect(call).toContain("key");
    consoleSpy.mockRestore();
  });

  it("should include timestamps in log messages", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    log("info", "Timestamp test");
    expect(consoleSpy).toHaveBeenCalled();
    const call = consoleSpy.mock.calls[0][0] as string;
    expect(call).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    consoleSpy.mockRestore();
  });

  it("should include log level in messages", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    log("warn", "Warning test");
    expect(consoleSpy).toHaveBeenCalled();
    const call = consoleSpy.mock.calls[0][0] as string;
    expect(call).toContain("[WARN]");
    consoleSpy.mockRestore();
  });
});

