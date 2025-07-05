# CLI All Tools Reference

Complete command-line reference for activating all MCP tools.

## 🚀 Quick Commands

### Activate All Tools (Wildcard)
```bash
# Basic command with all tools
yarn build && node dist/cli.js mcp --mode stdio \
  --app-id YOUR_APP_ID \
  --app-secret YOUR_APP_SECRET \
  --tools "*"
```

### Activate All Tools (Complete Preset)
```bash
# Using the complete preset
yarn build && node dist/cli.js mcp --mode stdio \
  --app-id YOUR_APP_ID \
  --app-secret YOUR_APP_SECRET \
  --tools preset.complete.all
```

### With Environment Variables
```bash
# Set environment variables first
export APP_ID=your_app_id
export APP_SECRET=your_app_secret
export LARK_TOOLS="*"

# Run with env vars
yarn build && node dist/cli.js mcp --mode stdio
```

## 📋 Complete CLI Options

```bash
node dist/cli.js mcp [options]
```

### Core Options
- `--mode <mode>` - Server mode: `stdio` or `sse` (default: `stdio`)
- `--app-id <id>` - Lark/Feishu App ID
- `--app-secret <secret>` - Lark/Feishu App Secret
- `--user-access-token <token>` - Optional user access token

### Tool Selection Options
- `--tools <tools>` - Tool selection (comma-separated or presets)
  - `"*"` - All tools
  - `preset.complete.all` - Complete preset
  - `preset.default` - Default tools
  - `tool1,tool2,tool3` - Specific tools

### Performance Options
- `--enable-cache` - Enable caching for better performance
- `--disable-rate-limit` - Disable rate limiting (not recommended)
- `--rate-limit-requests <n>` - Max requests per minute (default: 50)
- `--rate-limit-writes <n>` - Max write operations per minute (default: 10)

### Advanced Options
- `-c, --config <path>` - Configuration file path
- `--host <host>` - SSE server host (default: `localhost`)
- `--port <port>` - SSE server port (default: `3000`)
- `--language <lang>` - Tool language: `en` or `zh` (default: `en`)
- `--verbose` - Enable verbose logging

## 🎯 Usage Examples

### 1. Development Mode with All Tools
```bash
# With verbose logging
yarn build && node dist/cli.js mcp --mode stdio \
  --app-id YOUR_APP_ID \
  --app-secret YOUR_APP_SECRET \
  --tools "*" \
  --verbose \
  --enable-cache
```

### 2. Production Mode with Rate Limiting
```bash
# Higher rate limits for production
yarn build && node dist/cli.js mcp --mode stdio \
  --app-id YOUR_APP_ID \
  --app-secret YOUR_APP_SECRET \
  --tools preset.complete.all \
  --rate-limit-requests 200 \
  --rate-limit-writes 50 \
  --enable-cache
```

### 3. SSE Mode for Web Integration
```bash
# HTTP server mode
yarn build && node dist/cli.js mcp --mode sse \
  --app-id YOUR_APP_ID \
  --app-secret YOUR_APP_SECRET \
  --tools "*" \
  --host 0.0.0.0 \
  --port 3000
```

### 4. Using Configuration File
Create `all-tools-config.json`:
```json
{
  "appId": "YOUR_APP_ID",
  "appSecret": "YOUR_APP_SECRET",
  "toolsOptions": {
    "language": "en",
    "allowTools": ["*"]
  },
  "rateLimiting": {
    "enabled": true,
    "rateLimits": {
      "default": { "capacity": 200, "tokensPerInterval": 100, "intervalMs": 60000 },
      "read": { "capacity": 300, "tokensPerInterval": 150, "intervalMs": 60000 },
      "write": { "capacity": 50, "tokensPerInterval": 25, "intervalMs": 60000 }
    }
  },
  "caching": {
    "enabled": true,
    "maxSize": 1000,
    "ttl": {
      "userInfo": 3600000,
      "chatInfo": 1800000,
      "records": 300000
    }
  }
}
```

Then run:
```bash
yarn build && node dist/cli.js mcp --mode stdio -c all-tools-config.json
```

### 5. Docker Commands
```bash
# Build image
yarn docker:build

# Run with all tools
docker run -it --rm \
  -e APP_ID=YOUR_APP_ID \
  -e APP_SECRET=YOUR_APP_SECRET \
  -e LARK_TOOLS="*" \
  -e ENABLE_CACHE=true \
  lark-mcp:latest

# Docker Compose
docker-compose --profile production up lark-mcp-stdio
```

### 6. NPX Quick Start
```bash
# Without installation
npx -y @larksuiteoapi/lark-mcp@latest mcp \
  --mode stdio \
  --app-id YOUR_APP_ID \
  --app-secret YOUR_APP_SECRET \
  --tools "*"
```

## 🔧 Advanced Configurations

### Multiple Tool Presets
```bash
# Combine multiple presets
--tools "preset.base.default,preset.im.default,preset.genesis.default"
```

### Specific Tools Only
```bash
# Select specific tools
--tools "im.v1.message.create,bitable.v1.appTableRecord.search,genesis.builtin.create_base"
```

### Exclude Tools Pattern
```bash
# All tools except specific ones (using config file)
{
  "toolsOptions": {
    "allowTools": ["*"],
    "excludeTools": ["admin.*", "hr.*"]
  }
}
```

## 📊 Performance Tuning

### For High-Volume Operations
```bash
yarn build && node dist/cli.js mcp --mode stdio \
  --app-id YOUR_APP_ID \
  --app-secret YOUR_APP_SECRET \
  --tools "*" \
  --rate-limit-requests 500 \
  --rate-limit-writes 100 \
  --enable-cache \
  --verbose
```

### Memory Optimization
```bash
# Set Node.js memory limit
NODE_OPTIONS='--max-old-space-size=4096' \
yarn build && node dist/cli.js mcp --mode stdio \
  --app-id YOUR_APP_ID \
  --app-secret YOUR_APP_SECRET \
  --tools preset.complete.all
```

## 🚨 Common Issues

### 1. "Tool not found" Error
```bash
# List available tools
yarn build && node dist/cli.js mcp --list-tools

# Verify specific tool exists
yarn build && node dist/cli.js mcp --check-tool "tool.name"
```

### 2. Rate Limit Errors
```bash
# Increase limits
--rate-limit-requests 1000 --rate-limit-writes 200

# Or disable temporarily (development only)
--disable-rate-limit
```

### 3. Memory Issues
```bash
# Increase Node memory
NODE_OPTIONS='--max-old-space-size=8192' yarn build && node dist/cli.js mcp ...
```

## 📝 Environment Variables

Complete list of supported environment variables:

```bash
# Required
APP_ID=your_app_id
APP_SECRET=your_app_secret

# Optional
USER_ACCESS_TOKEN=user_token
LARK_TOOLS="*"                    # or "preset.complete.all"
LARK_LANGUAGE=en                  # or "zh"
ENABLE_CACHE=true
DISABLE_RATE_LIMIT=false
RATE_LIMIT_REQUESTS=200
RATE_LIMIT_WRITES=50
MCP_MODE=stdio                    # or "sse"
MCP_HOST=localhost
MCP_PORT=3000
NODE_ENV=production               # or "development"
DEBUG=lark-mcp:*                  # Enable debug logging
```

## 🔍 Debugging

### Enable Debug Logging
```bash
# Full debug output
DEBUG=* yarn build && node dist/cli.js mcp --mode stdio --tools "*" --verbose

# Specific debug namespaces
DEBUG=lark-mcp:tools,lark-mcp:api yarn build && node dist/cli.js mcp ...
```

### Test Tool Activation
```bash
# Run the test script
node activate-all-tools.js
```

### Check Tool Permissions
```bash
# Verify app permissions
yarn build && node dist/cli.js mcp --check-permissions --tools "*"
```

## 🎉 Success Indicators

When all tools are successfully activated, you should see:
- "Successfully loaded X tools" message
- No permission errors
- Tool execution completes without errors
- ML recommendations work properly
- Cache statistics show activity

---

For more details, see [MCP_ALL_TOOLS_ACTIVATION.md](../MCP_ALL_TOOLS_ACTIVATION.md)