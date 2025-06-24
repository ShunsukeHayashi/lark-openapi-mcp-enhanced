# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript-based MCP (Model Context Protocol) tool that provides comprehensive access to Feishu/Lark OpenAPI for AI assistant integration. The project supports both English and Chinese, with auto-generated tools from OpenAPI specifications.

**npm Package**: `@larksuiteoapi/lark-mcp` (Beta v0.3.1)  
**Repository**: Official Feishu/Lark OpenAPI MCP implementation  
**Node.js**: Requires Node.js >=16.20.0

## Key Commands

### Development
```bash
# Install dependencies
yarn install

# Build the project
yarn build

# Run in development mode
yarn dev

# Run tests
yarn test
yarn test:watch      # Watch mode
yarn test:coverage   # With coverage report

# Format code
yarn format

# Run specific test file
yarn test path/to/test.spec.ts

# Clean build artifacts
rm -rf dist/
```

### Bot/Agent Development
```bash
# Deploy Lark workspace bot
yarn bot:deploy

# Run bot in development mode
yarn bot:dev

# Test chat agent
yarn test:agent
```

### Running the MCP Server
```bash
# Standard I/O mode (for AI tool integration)
yarn build && node dist/cli.js mcp --mode stdio --app-id YOUR_APP_ID --app-secret YOUR_APP_SECRET

# SSE mode (HTTP server)
yarn build && node dist/cli.js mcp --mode sse --app-id YOUR_APP_ID --app-secret YOUR_APP_SECRET --port 3000

# Using npx (without global installation)
npx -y @larksuiteoapi/lark-mcp mcp --mode stdio --app-id YOUR_APP_ID --app-secret YOUR_APP_SECRET

# With environment variables
export APP_ID=your_app_id
export APP_SECRET=your_app_secret
yarn build && node dist/cli.js mcp --mode stdio

# Using configuration file
yarn build && node dist/cli.js mcp --mode stdio -c config.json

# Rate limiting configuration
yarn build && node dist/cli.js mcp --mode stdio --rate-limit-requests 100 --rate-limit-writes 20

# Disable rate limiting (not recommended for production)
yarn build && node dist/cli.js mcp --mode stdio --disable-rate-limit
```

## Architecture Overview

### Directory Structure
- `src/cli.ts` - CLI entry point using Commander.js
- `src/mcp-server/` - MCP server implementations (stdio and SSE modes)
- `src/mcp-tool/` - Tool system with auto-generated API bindings
  - `tools/en/` and `tools/zh/` - Language-specific tool definitions
  - `gen-tools/` - Auto-generated tools from OpenAPI specs
  - `builtin-tools/` - Custom-implemented tools
  - `document-tool/` - Documentation recall feature
- `src/genesis/` - Genesis system for Lark Base application generation
- `src/utils/` - Shared utilities (HTTP client, rate limiting, version)
- `tests/` - Jest test suite mirroring source structure
- `prompt-management/` - Systematic prompt management and versioning system

### Tool System Architecture

1. **Auto-generated Tools**: Located in `gen-tools/zod/`, these are generated from Feishu/Lark OpenAPI specifications. Each tool follows the naming pattern `{module}.v{version}.{resource}.{action}`.

2. **Custom Tools**: Located in `builtin-tools/`, these implement custom logic using the `McpTool` interface with a `customHandler` function.

3. **Tool Organization**:
   - Tools are grouped by API module (im, calendar, docs, etc.)
   - Each module file exports an array of tools and a type union of tool names
   - Tools support both tenant and user access tokens

4. **Tool Presets**: Predefined collections available via `--tools` parameter:
   - `preset.light`: Minimal set for basic operations (10 tools)
   - `preset.default`: Balanced set for common use cases (19 tools)
   - `preset.im.default`: IM/chat-focused tools (5 tools)
   - `preset.base.default`: Bitable base operations (7 tools)
   - `preset.base.batch`: Bitable with batch operations (7 tools)
   - `preset.doc.default`: Document and wiki tools (6 tools)
   - `preset.task.default`: Task management tools (4 tools)
   - `preset.calendar.default`: Calendar event tools (5 tools)

### Genesis System Architecture

The Genesis system (`src/genesis/`) is an AI-powered Lark Base application generator that creates complete business applications from natural language requirements:

1. **Core Components**:
   - `GenesisPromptEngine`: Multi-level prompt management with progressive disclosure
   - `StructuredDataExtractor`: Extracts structured data from unstructured input
   - `LarkBaseBuilder`: Builds complete Lark Base applications with tables, fields, views, and automations

2. **Key Features**:
   - Progressive generation with step-by-step user approval
   - Template-based system design (CRM, Project Management, HR, etc.)
   - Multi-language support (English, Chinese, Japanese)
   - Error recovery and rollback capabilities
   - Performance optimization with caching

3. **Integration Flow**:
   - Parse natural language requirements → Extract structured specifications → Generate Base schema → Build via Lark API

### Authentication Modes
- **Tenant Token**: App-level authentication via `appId` and `appSecret`
- **User Token**: User-level authentication via `userAccessToken`
- **Token Mode Configuration**: Filter tools by authentication type

### Configuration Priority
1. Command-line arguments (highest priority)
2. Configuration file (JSON format via `-c` flag)
3. Environment variables
4. Default values

## Testing Conventions

- Use Jest with TypeScript support (`ts-jest` preset)
- Mock external dependencies in `/tests/setup.ts`
- Follow the existing test structure patterns (mirror source directory)
- Exclude generated tools from coverage (CLI and generated tools excluded)
- Tests use Chinese comments (bilingual project)
- Mock Lark SDK client in test setup
- Test files: `**/tests/**/*.test.ts` pattern
- Coverage reports: text and lcov formats
- Path alias: `@/` maps to `src/`

## Error Handling

The project uses a centralized error handler in `src/mcp-tool/utils/handler.ts`:
- API errors are wrapped in a standardized response format
- Missing credentials cause process exit with code 1
- Validation errors throw standard Error objects

## Adding Custom Tools

To add a custom tool:

1. Create a new file in `src/mcp-tool/tools/{language}/builtin-tools/{module}/`
2. Define the tool using the `McpTool` interface:
```typescript
export const myTool: McpTool = {
  project: 'module_name',
  name: 'module.builtin.action',
  accessTokens: ['tenant'], // or ['user'] or both
  description: '[Feishu/Lark] - Description',
  schema: {
    data: z.object({
      // Define parameters using Zod
    })
  },
  customHandler: async (client, params) => {
    // Implement custom logic
    return { data: result };
  }
};
```
3. Export the tool in the module's index file
4. Add to the main builtin tools index

## Rate Limiting

The project includes built-in rate limiting to prevent API quota exhaustion:

### Features
- **Token Bucket Algorithm**: Configurable capacity and refill rates
- **Tiered Rate Limiting**: Different limits for read, write, admin, and default operations
- **Automatic Categorization**: Requests are automatically categorized by URL and HTTP method
- **Production Ready**: Conservative defaults based on Feishu/Lark API limits
- **Comprehensive Metrics**: Monitor rate limiting effectiveness

### Configuration
```typescript
const client = new LarkMcpTool({
  appId: 'your-app-id',
  appSecret: 'your-app-secret',
  rateLimiting: {
    enabled: true, // Default: true
    rateLimits: {
      default: { capacity: 100, tokensPerInterval: 50, intervalMs: 60000 },
      read: { capacity: 200, tokensPerInterval: 100, intervalMs: 60000 },
      write: { capacity: 20, tokensPerInterval: 10, intervalMs: 60000 },
      admin: { capacity: 5, tokensPerInterval: 2, intervalMs: 60000 }
    }
  }
});
```

### CLI Options
- `--disable-rate-limit`: Disable rate limiting (not recommended for production)
- `--rate-limit-requests <n>`: Maximum requests per minute (default: 50)
- `--rate-limit-writes <n>`: Maximum write operations per minute (default: 10)

### Monitoring
```typescript
// Get rate limiting metrics
const metrics = client.getRateLimitMetrics();

// Reset rate limiters
client.resetRateLimiters();

// Enable/disable rate limiting
client.setRateLimitEnabled(false);
```

## Genesis CLI Usage

The Genesis system provides a CLI for generating Lark Base applications:

```bash
# Generate from requirements file
yarn build && node dist/genesis/cli/genesis-cli.js generate -r requirements.md -o output.json

# Interactive mode
yarn build && node dist/genesis/cli/genesis-cli.js generate -i

# Use specific template
yarn build && node dist/genesis/cli/genesis-cli.js generate -t crm -o crm-base.json

# Enable verbose logging
yarn build && node dist/genesis/cli/genesis-cli.js generate -r requirements.md -v
```

## Prompt Management System

The project includes a sophisticated prompt management system in `prompt-management/`:

### Structure
- `prompts/categories/` - Categorized prompts (analysis, generation, planning, transformation, troubleshooting)
- `prompts/templates/` - Reusable prompt templates
- `metadata/` - Index, tags, and changelog management
- `tools/` - Python utilities for prompt generation, validation, and search
- `chains/` - Prompt chaining definitions

### Management Tools
```bash
# Search prompts by category and tags
python prompt-management/tools/search.py --category analysis --tag tech:python

# Generate new prompt from template
python prompt-management/tools/prompt-generator.py --template base --category analysis

# Validate prompt format
python prompt-management/tools/validator.py --file prompts/categories/analysis/code-review.md
```

## Important Notes

- The project uses minimal logging by design (disabled in production)
- Generated tools should not be manually edited (they're auto-generated from OpenAPI specs)
- Use the provided HTTP instance (`src/utils/http-instance.ts`) for consistency
- Follow the existing TypeScript strict mode conventions
- Code formatting uses Prettier with single quotes and 120-character line width
- The project is currently in Beta stage - features and APIs may change
- Bilingual support is core to the project - maintain both English and Chinese documentation
- Tool documentation is auto-generated in `docs/tools-en.md` and `docs/tools-zh.md`
- **Rate limiting is enabled by default** to protect against API quota exhaustion
- Prompts follow semantic versioning and must include metadata headers

## TypeScript and Module System

- Target: ES2018, Module: CommonJS
- Strict TypeScript mode is enabled
- Use Zod for schema validation in tools
- Type definitions are in `src/mcp-tool/types/`
- Generated declaration files (.d.ts) are created during build

## Required Permissions

When using this MCP tool, ensure your Feishu/Lark app has the necessary permissions:

### Essential Permissions for Basic Operations
- `im:message` - Send messages
- `im:chat` - Manage chats
- `contact:user.base:readonly` - Read user information

### For Chat Member Management
- `im:chat.members:write_only` - Add/remove chat members
- `im:chat.members:read` - View chat members
- `contact:user.id:readonly` - Convert email to user ID

### For Document/Base Operations
- `bitable:app` - Create and manage Base applications
- `drive:drive` - File operations
- `docs:doc` - Document operations