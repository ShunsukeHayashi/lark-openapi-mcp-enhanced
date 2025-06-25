# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript-based MCP (Model Context Protocol) tool that provides comprehensive access to Feishu/Lark OpenAPI for AI assistant integration. The project supports both English and Chinese, with auto-generated tools from OpenAPI specifications.

**npm Package**: `@larksuiteoapi/lark-mcp` (Beta v0.3.1)  
**Repository**: Official Feishu/Lark OpenAPI MCP implementation  
**Node.js**: Requires Node.js >=16.20.0

## Project-Specific Guidelines

### Code Conventions
- Bilingual support (English/Chinese) is mandatory - maintain documentation in both languages
- Use single quotes for strings (enforced by Prettier)
- Line width: 120 characters maximum
- TypeScript strict mode enabled - always handle null/undefined cases
- Use Zod for all schema validation
- Comments in test files use Chinese (bilingual project convention)
- **CRITICAL**: When fixing TypeScript compilation errors, avoid calling `this` methods before `super()` in constructors
- **CRITICAL**: All specialist agent files in `src/agents/specialists/` must be properly implemented or disabled to prevent build failures

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

### Linting and Type Checking
```bash
# Run TypeScript compiler to check types
yarn build

# Format code with Prettier
yarn format

# Run a specific test
yarn test tests/mcp-tool/lark-mcp-tool.test.ts
```

### Docker Commands
```bash
# Build Docker images
yarn docker:build                    # Production build
./scripts/docker-build.sh production # Production build (explicit)
./scripts/docker-build.sh development # Development build

# Run in STDIO mode with Docker
yarn docker:stdio

# Run in SSE mode with Docker  
yarn docker:sse

# Using docker-compose with profiles
docker-compose --profile production up lark-mcp-sse    # Production SSE mode
docker-compose --profile production up lark-mcp-stdio  # Production STDIO mode
docker-compose --profile development up lark-mcp-sse-dev  # Development SSE mode
docker-compose --profile genesis up lark-genesis       # Genesis CLI mode

# Manual Docker commands
docker run -it --rm --env-file .env lark-mcp:latest
docker run -p 3000:3000 --env-file .env lark-mcp:latest node dist/cli.js mcp --mode sse --host 0.0.0.0

# Development with volume mounts
docker run -it --rm -v $(pwd):/app -p 3000:3000 lark-mcp:latest-development
```

### Docker Architecture
- **Multi-stage Build**: Separate stages for dependencies, builder, production, and development
- **Production Images**: Optimized with only production dependencies (~272MB Alpine-based)
- **Development Images**: Include full source code with volume mounts for hot reload
- **Security**: Non-root user execution, proper signal handling with dumb-init
- **Health Checks**: Built-in container monitoring for SSE services
- **Profiles**: Separate docker-compose profiles for production/development/genesis

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
- `src/agents/` - Agent system for conversational AI with NLP
- `src/storage/` - Conversation and data persistence
- `src/utils/` - Shared utilities (HTTP client, rate limiting, version)
- `tests/` - Jest test suite mirroring source structure
- `prompt-management/` - Systematic prompt management and versioning system
- `docs/` - Comprehensive documentation organized by topics

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
- **NOTE**: Full test suite may timeout (>2min) - run specific tests when possible
- Agent system tests pass with 100% success rate (8/8 test scenarios)

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

## Known Issues and Workarounds

- **TypeScript Compilation**: Some specialist agent files in `src/agents/specialists/` have been disabled (.ts.disabled) due to compilation errors
- **Test Suite**: Full test runs may timeout - prefer running specific test files
- **Agent System**: Currently only base-specialist is functional; other specialists need implementation

## Docker Development Workflow

### Production vs Development Builds
- **Production**: Optimized multi-stage build with minimal dependencies
- **Development**: Includes volume mounts for hot reload and full source access

### Enhanced Docker Scripts
```bash
# Build specific targets
./scripts/docker-build.sh production   # Optimized production image
./scripts/docker-build.sh development  # Development image with sources

# Run with target specification
./scripts/docker-run.sh --mode sse --target development --port 3000
./scripts/docker-run.sh --mode stdio --target production --tools preset.light

# Docker Compose profiles
docker-compose --profile production up    # Production services
docker-compose --profile development up   # Development services  
docker-compose --profile genesis up       # Genesis CLI tools
```

## Extended Systems

### Agent System (`src/agents/`)
The project includes a comprehensive AI-enhanced multi-agent framework:
- **Multi-Agent Orchestration**: Coordinator and specialist agents with intelligent task distribution
- **AI Integration**: Google Gemini-powered task analysis, workflow optimization, and error recovery
- **Specialist Agents**: Domain-specific agents for Base, IM, Docs, and Calendar operations
- **Intelligent Coordination**: AI-powered task decomposition, agent assignment, and quality monitoring
- **Real-time Monitoring**: Predictive analytics and adaptive workflow management
- **Natural Language Processing**: Advanced chat interactions with context management
- **Multi-language Support**: EN/ZH/JP with cultural context awareness

#### AI-Enhanced Features
- **Task Complexity Analysis**: AI determines optimal task breakdown and execution strategy
- **Agent Assignment Optimization**: Load balancing with efficiency scoring and capability matching
- **Predictive Monitoring**: Quality forecasting and risk assessment with adjustment recommendations
- **Intelligent Error Recovery**: AI-generated recovery strategies with success probability estimation
- **Smart Content Generation**: Context-aware summaries, explanations, and documentation

### YouTube Integration
Located in various system directories, includes:
- CRM system for YouTube channel management
- Automation for video lifecycle management
- Analytics and reporting integration
- Comment and engagement tracking

### Sales and Pipe Cutting Systems
Specialized business logic implementations:
- Pipe cutting management system with complex calculations
- Sales target tracking and achievement monitoring
- Integration with Lark Base for data persistence
- Automated reporting and notifications

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