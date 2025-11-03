# Task Execution Architecture Plan

## Goal
Implement real task execution where delegated tasks are executed by spawning sub-agents (AI models) with tool access.

## Current State
- ✅ Task delegation API (delegate, check_status, list_tasks, cancel_task)
- ✅ Task state machine (pending → in_progress → completed/failed)
- ✅ Simulated task processing (5-second fake work)
- ⚠️ No actual model execution

## Target Architecture

### Option 1: MCP Client Integration (Recommended)
Spawn sub-agents that are MCP clients themselves, giving them access to tools.

```typescript
// Sub-agent can connect to tool servers
const subAgent = new MCPClient({
  model: "claude-3-5-sonnet",
  tools: [
    "filesystem", // File operations
    "brave-search", // Web search
    "fetch", // HTTP requests
    // ... other MCP servers
  ]
});

const result = await subAgent.execute(task.task, task.context);
```

### Option 2: Direct LLM with Function Calling
Use OpenAI/Anthropic SDK directly with function calling.

```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const result = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  tools: [...], // Define available tools
  messages: [{ role: "user", content: task.task }]
});
```

## Implementation Plan

### Phase 1: Model Integration
1. Add model provider support (OpenAI/Anthropic)
2. Configuration for API keys (env vars)
3. Basic model execution without tools
4. Streaming support for progress updates

### Phase 2: Tool Access
1. Define tool registry (which tools are available)
2. Implement tool execution handlers
3. Connect model function calling to tools
4. Handle tool errors and retries

### Phase 3: Sub-Agent Management
1. Process/thread pool for concurrent execution
2. Resource limits (memory, CPU, timeout)
3. Sandboxing (security boundaries)
4. Clean termination and cleanup

### Phase 4: Advanced Features
1. Streaming progress updates via MCP notifications
2. Intermediate results/checkpoints
3. Task dependencies (task A must complete before B)
4. Result caching and reuse

## Technical Decisions Needed

### 1. Model Provider
- [ ] OpenAI (GPT-4, GPT-4 Turbo)
- [ ] Anthropic (Claude 3.5 Sonnet)
- [ ] Both (configurable)
- [ ] Local models (Ollama, LM Studio)

### 2. Tool Architecture
- [ ] Use existing MCP servers (spawn as child processes)
- [ ] Built-in tools (filesystem, http, etc.)
- [ ] Hybrid approach

### 3. Execution Environment
- [ ] Child processes (Node.js)
- [ ] Worker threads (shared memory)
- [ ] Docker containers (isolation)
- [ ] WebAssembly (sandboxing)

### 4. Progress Reporting
- [ ] Polling (check_status returns progress)
- [ ] MCP notifications (push updates)
- [ ] SSE/WebSocket (real-time stream)

## Next Steps

1. **Choose model provider** - Start with Anthropic (Claude) for best tool use
2. **Add configuration** - API keys, model selection, tool registry
3. **Implement basic execution** - Replace simulation with real model calls
4. **Add tool support** - Start with safe tools (read files, http get)
5. **Test and iterate** - Use real-world tasks to validate

## Files to Create/Modify

### New Files
- `src/executors/model-executor.ts` - Model execution logic
- `src/executors/tool-registry.ts` - Available tools
- `src/executors/sandbox.ts` - Execution isolation
- `src/config.ts` - Configuration management
- `.env.example` - Environment variable template

### Modified Files
- `src/index.ts` - Replace `processTask()` simulation
- `package.json` - Add model SDK dependencies
- `README.md` - Document setup and configuration
- `tsconfig.json` - Any new compiler options

## Security Considerations

1. **API Key Protection**
   - Never commit keys to repo
   - Use environment variables
   - Rotate keys regularly

2. **Tool Sandboxing**
   - Limit filesystem access (read-only, specific dirs)
   - No network access to internal resources
   - Resource limits (CPU, memory, time)

3. **Input Validation**
   - Sanitize task descriptions
   - Validate tool parameters
   - Prevent prompt injection

4. **Output Filtering**
   - Don't expose system information
   - Sanitize error messages
   - Audit tool usage

## Example Usage

```typescript
// User delegates task
const result = await liaison.delegate({
  task: "Search for recent npm packages about MCP and summarize the top 3",
  context: "Focus on packages updated in the last 3 months"
});

// Behind the scenes:
// 1. Task queued with status: pending
// 2. Sub-agent spawned with tools: [brave-search, fetch]
// 3. Agent searches npm, fetches package info
// 4. Agent summarizes results
// 5. Task completed with result
```

## Resources

- [Anthropic Claude API](https://docs.anthropic.com/claude/reference/messages_post)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [Tool Use Best Practices](https://docs.anthropic.com/claude/docs/tool-use)
