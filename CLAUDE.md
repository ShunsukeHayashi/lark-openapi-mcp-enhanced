# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a TypeScript-based MCP (Model Context Protocol) tool that provides comprehensive access to Feishu/Lark OpenAPI. It features AI-powered capabilities including the Genesis system for creating Lark Base applications and a multi-agent orchestration system.

**Package**: `@larksuiteoapi/lark-mcp` v0.4.0  
**Node.js**: Requires >= 16.20.0

## Common Development Commands

### Building and Running

```bash
# Build TypeScript to JavaScript
yarn build

# Run MCP server (STDIO mode for Cursor/Claude)
yarn build && node dist/cli.js mcp --mode stdio --app-id YOUR_APP_ID --app-secret YOUR_APP_SECRET

# Run MCP server (SSE mode for HTTP access)
yarn build && node dist/cli.js mcp --mode sse --app-id YOUR_APP_ID --app-secret YOUR_APP_SECRET --port 3000

# Development mode
yarn dev

# Format code
yarn format
```

### Testing

```bash
# Run all tests
yarn test

# Run specific test file
yarn test tests/mcp-tool/lark-mcp-tool.test.ts

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage

# Test agent functionality
yarn test:agent
yarn test:agent-tools
```

### Docker Operations

```bash
# Build Docker images
yarn docker:build:prod    # Production build
yarn docker:build:dev     # Development build

# Run Docker containers
yarn docker:run:prod      # Production mode
yarn docker:run:dev       # Development mode
yarn docker:stdio         # STDIO mode
yarn docker:sse           # SSE mode

# Docker Compose
yarn docker:compose:prod  # Production profile
yarn docker:compose:dev   # Development profile
yarn docker:compose:genesis # Genesis profile
```

## High-Level Architecture

### Core Components

1. **MCP Server** (`src/mcp-server/`)
   - Dual transport modes: STDIO (for AI tools) and SSE (HTTP-based)
   - Handles tool registration, request routing, and response formatting
   - Rate limiting built-in with configurable tiers

2. **Tool System** (`src/mcp-tool/`)
   - **Auto-generated tools**: From Lark/Feishu OpenAPI specs in `gen-tools/zod/`
   - **Built-in tools**: Custom implementations in `builtin-tools/`
   - **Tool presets**: Collections like `preset.default`, `preset.genesis.default`
   - Bilingual support (EN/ZH) with separate tool directories

3. **Genesis AI System** (`src/genesis/`)
   - Creates complete Lark Base applications from natural language requirements
   - 7-stage progressive generation pipeline
   - Template management and multilingual support
   - Direct Lark Base API integration

4. **Agent System** (`src/agents/`)
   - Multi-agent coordination for complex workflows
   - Specialized agents: calendar, documents, messaging, base operations
   - Conversation state management
   - Intent recognition and tool invocation

### Request Flow

```
CLI → Configuration → MCP Server Initialization → Tool Loading → Transport Setup → Request Handling
                                                                    ↓
                                                        Tool Execution (SDK/Custom Handler)
                                                                    ↓
                                                            Response Formatting
```

### Authentication

- **Tenant Token**: App-level access via `appId` and `appSecret`
- **User Token**: User-level access via `userAccessToken`
- **Auto Mode**: Automatically selects appropriate token based on operation

## Development Guidelines

### Environment Setup

Create a `.env` file:
```bash
APP_ID=your_app_id
APP_SECRET=your_app_secret
USER_ACCESS_TOKEN=optional_user_token
LARK_DOMAIN=https://open.feishu.cn
LARK_LANGUAGE=en
```

### Adding Custom Tools

1. Create tool in `src/mcp-tool/tools/{language}/builtin-tools/{module}/`
2. Implement the `McpTool` interface:
```typescript
export const myTool: McpTool = {
  project: 'module_name',
  name: 'module.builtin.action',
  accessTokens: ['tenant'], // or ['user'] or both
  description: '[Feishu/Lark] - Tool description',
  schema: {
    data: z.object({
      // Define parameters using Zod
    })
  },
  customHandler: async (client, params) => {
    // Implement logic
    return { data: result };
  }
};
```

### Code Style

- TypeScript strict mode enabled
- Use Zod for runtime validation
- Single quotes, 120-char line width (Prettier)
- Path alias: `@/` → `src/`
- Test files use Chinese comments (bilingual project)

### Rate Limiting

Default limits (per minute):
- Read operations: 200
- Write operations: 20
- Admin operations: 5
- Default: 100

Configure via CLI:
```bash
--disable-rate-limit          # Disable (not recommended)
--rate-limit-requests <n>     # Max requests per minute
--rate-limit-writes <n>       # Max write ops per minute
```

## Common Development Tasks

### Running a Single Test
```bash
yarn test tests/genesis/core/prompt-engine.test.ts
```

### Debugging Genesis System
```bash
# Enable verbose logging
yarn build && node dist/genesis/cli/genesis-cli.js generate -r requirements.md -v
```

### Testing Tool Execution
```bash
# Test specific tool with curl (SSE mode)
curl -X POST http://localhost:3000/sse \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/call","params":{"name":"im_v1_message_create","arguments":{...}}}'
```

### Checking Rate Limit Status
The MCP server logs rate limit metrics. Monitor the console output for rate limiting information.

## Tips for Development

1. **Tool Naming**: Follow pattern `{module}.v{version}.{resource}.{action}`
2. **Error Handling**: Always wrap SDK calls in try-catch blocks
3. **Testing**: Mock external dependencies, use test setup in `tests/setup.ts`
4. **Performance**: Use request batching for Genesis operations
5. **Documentation**: Update bilingual docs when adding features

## Known Issues

- Some specialist agents are disabled (`.ts.disabled` files) due to compilation errors
- Full test suite may timeout - run specific tests when possible
- Genesis system requires appropriate Lark Base permissions