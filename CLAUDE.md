# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript-based MCP (Model Context Protocol) tool that provides comprehensive access to Feishu/Lark OpenAPI for AI assistant integration. The project supports both English and Chinese, with auto-generated tools from OpenAPI specifications.

**npm Package**: `@larksuiteoapi/lark-mcp` (Beta v0.4.0)  
**Repository**: Official Feishu/Lark OpenAPI MCP implementation  
**Node.js**: Requires Node.js >=16.20.0

### Core Features
- **Complete Feishu/Lark API Toolkit**: Encapsulates almost all Feishu/Lark API interfaces including message management, group management, document operations, calendar events, Bitable, and other core functional areas
- **Genesis AI System**: Create complete Lark Base applications from natural language requirements with AI-powered generation
  - Analyze requirements and suggest optimal data structures
  - Generate tables, fields, views, and automation rules
  - Create ER diagrams and documentation
  - Optimize existing bases with AI recommendations
- **Dual Authentication Support**: App Access Token and User Access Token authentication
- **Flexible Communication Protocols**: STDIO mode (for Trae/Cursor/Claude) and SSE mode (HTTP-based)
- **Smart Prompts**: MCP prompts for common Genesis workflows
- **Developer Documentation Retrieval**: MCP tool for quickly finding relevant Feishu/Lark development documentation

### Key Technologies
- **TypeScript** ^5.0.0 with strict mode
- **Node.js** >=16.20.0
- **Feishu/Lark Node SDK** ^1.47.0 for API integration
- **MCP SDK** ^1.11.0 for Model Context Protocol
- **Commander.js** ^13.1.0 for CLI
- **Axios** ^1.8.4 for HTTP requests
- **Express** ^5.1.0 for SSE mode server
- **Jest** ^29.7.0 with ts-jest for testing
- **Prettier** ^3.5.3 for code formatting
- **Discord.js** ^14.16.3 for Discord integration

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

# Test agent with tools
yarn test:agent-tools
```

### Discord Integration
```bash
# Setup Discord integration
yarn discord:setup

# Sync with Discord
yarn discord:sync

# Run Discord webhook
yarn discord:webhook

# Development mode for Discord
yarn discord:dev
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

## Prerequisites

### Installing Node.js

This project requires Node.js >=16.20.0. Installation methods:

#### macOS:
```bash
# Using Homebrew (Recommended)
brew install node

# Or download from nodejs.org
# Verify installation:
node -v
npm -v
```

#### Windows:
- Download the installer from [nodejs.org](https://nodejs.org/)
- Run the Windows installer (.msi file)
- Follow the installation wizard
- Verify in command prompt: `node -v` and `npm -v`

#### Linux:
```bash
# Using NodeSource repository (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Installing the MCP Tool

```bash
# Global installation (recommended)
npm install -g @larksuiteoapi/lark-mcp

# Or use npx without installation
npx -y @larksuiteoapi/lark-mcp mcp --help
```

## Environment Setup

### 1. Create `.env` file for local development:
```bash
# Feishu/Lark App Credentials
APP_ID=your_app_id_here
APP_SECRET=your_app_secret_here

# Optional: User Access Token (for user-level operations)
USER_ACCESS_TOKEN=your_user_access_token_here

# Optional: Server Configuration
PORT=3000
HOST=localhost

# Optional: Lark Configuration
LARK_DOMAIN=https://open.feishu.cn  # or https://open.larksuite.com
LARK_LANGUAGE=zh                    # or en
LARK_TOKEN_MODE=auto                # auto, tenant, or user
```

### 2. Configuration file format (`config.json`):
```json
{
  "appId": "your_app_id",
  "appSecret": "your_app_secret",
  "userAccessToken": "optional_user_token",
  "rateLimiting": {
    "enabled": true,
    "rateLimits": {
      "default": { "capacity": 100, "tokensPerInterval": 50, "intervalMs": 60000 }
    }
  }
}
```

### 3. Obtaining Credentials:
1. Go to [Feishu Open Platform](https://open.feishu.cn/) or [Lark Developer](https://open.larksuite.com/)
2. Create or select your app
3. Find App ID and App Secret in the app credentials section
4. Configure required permissions (see Required Permissions section)
5. For user tokens, implement OAuth flow or use temporary tokens for testing

### 4. Quick Integration with AI Tools (Trae/Cursor/Claude):
```json
{
  "mcpServers": {
    "lark-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@larksuiteoapi/lark-mcp",
        "mcp",
        "-a",
        "<your_app_id>",
        "-s",
        "<your_app_secret>"
      ]
    }
  }
}
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
- **Security**: Non-root user execution (UID 1001), proper signal handling with dumb-init
- **Health Checks**: Built-in container monitoring for SSE services (wget-based)
- **Profiles**: Separate docker-compose profiles for production/development/genesis
- **Platform Support**: Multi-platform images (linux/amd64, linux/arm64)

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
   - `preset.genesis.default`: Genesis AI-powered tools (13 tools)
   - `preset.complete.all`: All available tools (50+ tools)

   > **Note**: A complete list of all supported tools and their inclusion in each preset can be found in [docs/tools-en.md](./docs/tools-en.md). The detailed preset matrix showing which tools are included in each preset is available in the README.md file.

### Genesis System Architecture

The Genesis system (`src/genesis/`) is an AI-powered Lark Base application generator that creates complete business applications from natural language requirements:

1. **Core Components**:
   - `GenesisPromptEngine`: Multi-level prompt management with progressive disclosure
   - `StructuredDataExtractor`: Extracts structured data from unstructured input
   - `LarkBaseBuilder`: Builds complete Lark Base applications with tables, fields, and views

2. **Key Features**:
   - Progressive generation with step-by-step user approval
   - Template-based system design (CRM, Project Management, HR, etc.)
   - Multi-language support (English, Chinese, Japanese)
   - Error recovery and rollback capabilities
   - Performance optimization with caching
   - Pre-built templates: CRM, Project Management, HR Management, Inventory, Event Planning, Bug Tracking

3. **Integration Flow**:
   - Parse natural language requirements → Extract structured specifications → Generate Base schema → Build via Lark API

4. **Genesis Tools Available**:
   - `genesis.builtin.create_base` - Create a complete Lark Base from requirements
   - `genesis.builtin.list_templates` - Browse available templates with details
   - `genesis.builtin.analyze_requirements` - Analyze and structure natural language requirements
   - `genesis.builtin.suggest_fields` - AI-powered field suggestions based on data patterns
   - `genesis.builtin.generate_views` - Create optimized views for different use cases
   - `genesis.builtin.create_view` - Create custom views (Grid, Kanban, Calendar, Gallery, Gantt, Form)
   - `genesis.builtin.create_dashboard` - Design interactive dashboards with AI
   - `genesis.builtin.create_automation` - Design workflow automations
   - `genesis.builtin.create_filter_view` - Create spreadsheet filter views
   - `genesis.builtin.optimize_base` - Analyze and optimize existing Base structure
   - `genesis.builtin.generate_automation` - Create automation rules and workflows
   - `genesis.builtin.export_schema` - Export Base schema for documentation/backup

5. **MCP Integration**:
   - MCP prompts: `genesis_templates`, `complete_genesis_create`, `genesis_create_base`, `genesis_migrate_excel`, `genesis_template_crm`, `genesis_optimize_base`, `genesis_ai_features`
   - MCP resource: `genesis_template_examples` with template details

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
- Coverage reports: text and lcov formats (uploaded to Codecov)
- Path alias: `@/` maps to `src/`
- **NOTE**: Full test suite may timeout (>2min) - run specific tests when possible
- Agent system tests pass with 100% success rate (8/8 test scenarios)

### Quick Testing Scripts
```bash
# Quick release readiness test
./scripts/quick-test.sh

# Test release process (dry run)
./scripts/test-release.sh

# Run specific test suite
yarn test path/to/specific.test.ts
```

## CI/CD Pipeline

### GitHub Actions Workflows
- **CI Pipeline** (`.github/workflows/ci.yml`):
  - Tests on Node.js 16.x, 18.x, and 20.x
  - TypeScript compilation check
  - Code formatting validation (Prettier)
  - Docker image build verification
  - Coverage reporting to Codecov
  
- **Release Pipeline** (`.github/workflows/release.yml`):
  - Automated npm publishing
  - Multi-platform Docker images (linux/amd64, linux/arm64)
  - GitHub release creation with changelog
  - Triggered by version tags (v*)

### Release Process
```bash
# Automated release script with validation
./scripts/release.sh

# Manual release steps
npm version patch/minor/major
git push --follow-tags
# GitHub Actions will handle the rest
```

## Error Handling

The project uses a centralized error handler in `src/mcp-tool/utils/handler.ts`:
- API errors are wrapped in a standardized response format
- Missing credentials cause process exit with code 1
- Validation errors throw standard Error objects
- Comprehensive error code guide in `docs/ERROR_CODES_GUIDE.md`

### Error Code Categories
- **AUTH_XXX**: Authentication errors (401, 403)
- **RATE_XXX**: Rate limiting errors (429)
- **PERM_XXX**: Permission errors (403)
- **VALID_XXX**: Validation errors (400)
- **NET_XXX**: Network errors (timeout, connection)

## Security Features

The project implements comprehensive security measures:

### Token Security
- **Encryption**: AES-256-GCM encryption for sensitive tokens
- **Secure Storage**: Encrypted token storage with configurable encryption keys
- **Token Rotation**: Support for automatic token refresh

### Input Validation
- **XSS Protection**: Input sanitization for all user inputs
- **SQL Injection Prevention**: Parameterized queries and input validation
- **Path Traversal Protection**: Secure file path handling

### Security Monitoring
- **Audit Logging**: Real-time activity monitoring
- **Anomaly Detection**: Unusual activity pattern detection
- **Security Events**: Logged security events with alerts

### Compliance
- **GDPR Compliant**: Data privacy controls
- **ISO 27001 Standards**: Security best practices
- **SOC 2 Validation**: Compliance validation tools

See `docs/SECURITY_GUIDE.md` for detailed security implementation.

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

## Genesis System Usage

### Genesis in MCP Mode

When using with Claude Desktop or other AI tools:

```bash
# Enable Genesis tools
lark-mcp mcp -a <your_app_id> -s <your_app_secret> -t preset.genesis.default

# Or use with npx
npx -y @larksuiteoapi/lark-mcp mcp -a <your_app_id> -s <your_app_secret> -t preset.genesis.default
```

### Genesis CLI Usage

The Genesis system also provides a standalone CLI for generating Lark Base applications:

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

### Genesis Usage Examples

#### Create a Task Management System
```
Use genesis.builtin.create_base to create a task management system with:
- Task tracking with priority levels (Low, Medium, High, Urgent)
- Team member assignment
- Due date tracking
- Project categorization
- Progress status (To Do, In Progress, Review, Done)
```

#### Create Views and Dashboards
```
Use genesis.builtin.create_view to create a Kanban view for the Tasks table:
- Group by Status field
- Sort by Priority (descending) then Due Date (ascending)
- Hide completed tasks older than 30 days
```

**Note**: Genesis tools currently operate in simulation mode for planning and prototyping. For actual implementation, use the corresponding Lark APIs.

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
- The project is currently in Beta stage (v0.4.0) - features and APIs may change
- Bilingual support is core to the project - maintain both English and Chinese documentation
- Tool documentation is auto-generated in `docs/tools-en.md` and `docs/tools-zh.md`
- **Rate limiting is enabled by default** to protect against API quota exhaustion
- Prompts follow semantic versioning and must include metadata headers
- **Genesis System**: Currently operates in simulation mode for planning/prototyping without actual API calls
- **Developer Documentation**: Use the built-in documentation retrieval tool for finding Feishu/Lark API docs
- Docker support with multi-stage builds for production and development environments
- Official documentation available at [Feishu MCP](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/mcp_integration/mcp_introduction)

## Debugging Tips

### Enable Verbose Logging
```bash
# Genesis CLI with verbose output
yarn build && node dist/genesis/cli/genesis-cli.js generate -r requirements.md -v

# Set NODE_ENV for debug logs
NODE_ENV=development yarn dev

# MCP server with debug output
DEBUG=* yarn build && node dist/cli.js mcp --mode stdio
```

### Common Debugging Workflows
1. **API Request Failures**: Check rate limiting metrics first
2. **Authentication Issues**: Verify token mode matches your credentials
3. **Tool Not Found**: Use `--tools preset.complete.all` to ensure all tools loaded
4. **Genesis Failures**: Enable verbose mode to see AI reasoning steps

### Debug Logger Interface
The project uses a custom logger with levels:
- `trace`: Very detailed debugging info
- `debug`: General debugging messages  
- `info`: Information messages
- `warn`: Warning messages
- `error`: Error messages

## Known Issues and Workarounds

- **Test Suite**: Full test runs may timeout (>2min) - prefer running specific test files
- **Test Path Aliases**: Some tests fail due to TypeScript path alias configuration issues
- **Code Formatting**: Multiple files need formatting updates (run `yarn format` to fix)
- **Genesis Simulation Mode**: Genesis tools currently operate in simulation mode for safety during beta
- **File Operations**: Upload/download file APIs not yet available in MCP tools

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

## Package Distribution

The npm package includes only essential files:
- `dist/` - Compiled JavaScript and type definitions
- `docs/` - User documentation
- `README.md`, `README_ZH.md` - Package documentation
- `CHANGELOG.md` - Version history
- `LICENSE` - MIT license

Excluded from npm package:
- Source code (`src/`)
- Tests (`tests/`)
- Development configurations
- Scripts and examples

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

## Common Issues and Solutions

### Authentication Errors
**Problem**: "Invalid app_id or app_secret" error  
**Solution**: 
- Verify credentials are correctly set in environment variables or config file
- Check for trailing spaces or special characters in credentials
- Ensure the app is not in a suspended state on Feishu/Lark platform

### Rate Limiting Issues
**Problem**: "Rate limit exceeded" errors during heavy usage  
**Solution**:
- Use the built-in rate limiting feature (enabled by default)
- Adjust rate limits based on your app's quota: `--rate-limit-requests 30`
- Implement request batching for bulk operations
- Monitor rate limit metrics using `client.getRateLimitMetrics()`

### Permission Denied Errors
**Problem**: API returns 403 or permission-related errors  
**Solution**:
- Check Required Permissions section for needed scopes
- Verify permissions are granted in Feishu/Lark admin console
- For user-level operations, ensure user token has necessary permissions
- Some operations require admin approval in the workspace

### Tool Not Found
**Problem**: Specific tool not available or "Tool not found" error  
**Solution**:
- Check if using correct tool name format: `module.v{version}.resource.action`
- Verify tool is included in selected preset or custom tool list
- For custom tools, ensure they're properly exported in the module index
- Use `--tools preset.default` for a balanced set of commonly used tools

### Network Connectivity Issues
**Problem**: Connection timeouts or network errors  
**Solution**:
- Check firewall settings for outbound HTTPS connections
- Verify proxy settings if behind corporate firewall
- Use the HTTP instance configuration for custom timeout values
- Implement retry logic for transient failures

### Genesis System Failures
**Problem**: Genesis fails to generate Lark Base applications  
**Solution**:
- Ensure requirements are clear and well-structured
- Use templates for complex applications: `-t crm`
- Enable verbose logging: `-v` flag for debugging
- Check API quota for Base creation operations
- Verify Base creation permissions are granted

## Related Links

- **GitHub Repository**: [larksuite/lark-openapi-mcp](https://github.com/larksuite/lark-openapi-mcp)
- **npm Package**: [@larksuiteoapi/lark-mcp](https://www.npmjs.com/package/@larksuiteoapi/lark-mcp)
- **Docker Hub**: [larksuite/lark-mcp](https://hub.docker.com/r/larksuite/lark-mcp)
- **MCP Protocol**: [Model Context Protocol Documentation](https://modelcontextprotocol.io/docs)
- **Official Documentation**: [Feishu MCP Integration Guide](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/mcp_integration/mcp_introduction)
- **Feishu Open Platform**: [open.feishu.cn](https://open.feishu.cn/)
- **Lark International Platform**: [open.larksuite.com](https://open.larksuite.com/)