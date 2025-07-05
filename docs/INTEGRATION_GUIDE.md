# Integration Guide - Lark OpenAPI MCP Enhanced

This comprehensive guide helps you integrate the Lark OpenAPI MCP Enhanced tool with various AI assistants and development environments.

## Table of Contents
- [Quick Start](#quick-start)
- [Claude Desktop Integration](#claude-desktop-integration)
- [VS Code/Cursor Integration](#vs-codecursor-integration)
- [Custom Integration](#custom-integration)
- [Genesis AI System](#genesis-ai-system)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Quick Start

### Prerequisites
- Node.js ≥16.20.0
- Lark/Feishu App ID and App Secret
- MCP-compatible AI assistant

### Installation
```bash
npm install -g @larksuiteoapi/lark-mcp@0.4.0
```

### Basic Configuration
```json
{
  "mcpServers": {
    "lark-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@larksuiteoapi/lark-mcp@0.4.0",
        "mcp",
        "--mode", "stdio",
        "--app-id", "YOUR_APP_ID",
        "--app-secret", "YOUR_APP_SECRET"
      ]
    }
  }
}
```

## Claude Desktop Integration

### Step 1: Locate Configuration File
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### Step 2: Configuration Options

#### Option A: All Tools (Recommended for Power Users)
```json
{
  "mcpServers": {
    "lark-all-tools": {
      "command": "node",
      "args": [
        "/path/to/lark-openapi-mcp-enhanced/dist/cli.js",
        "mcp",
        "--mode", "stdio",
        "--domain", "https://open.larksuite.com"
      ],
      "env": {
        "APP_ID": "cli_your_app_id",
        "APP_SECRET": "your_app_secret",
        "NODE_ENV": "production"
      }
    }
  }
}
```

#### Option B: Genesis AI System (Recommended for New Users)
```json
{
  "mcpServers": {
    "lark-genesis": {
      "command": "npx",
      "args": [
        "-y",
        "@larksuiteoapi/lark-mcp@0.4.0",
        "mcp",
        "--mode", "stdio",
        "--tools", "preset.genesis.default"
      ],
      "env": {
        "APP_ID": "cli_your_app_id",
        "APP_SECRET": "your_app_secret"
      }
    }
  }
}
```

#### Option C: Lightweight Setup
```json
{
  "mcpServers": {
    "lark-light": {
      "command": "npx",
      "args": [
        "-y",
        "@larksuiteoapi/lark-mcp@0.4.0",
        "mcp",
        "--mode", "stdio",
        "--tools", "preset.light"
      ],
      "env": {
        "APP_ID": "cli_your_app_id",
        "APP_SECRET": "your_app_secret"
      }
    }
  }
}
```

### Step 3: Restart Claude Desktop
After updating the configuration, restart Claude Desktop completely.

### Step 4: Verify Integration
Ask Claude: "What Lark tools do you have available?"

## VS Code/Cursor Integration

### Using Continue Extension
1. Install the Continue extension
2. Add to your `config.json`:

```json
{
  "mcpServers": [
    {
      "name": "lark-mcp",
      "command": "npx",
      "args": [
        "-y",
        "@larksuiteoapi/lark-mcp@0.4.0",
        "mcp",
        "--mode", "stdio"
      ],
      "env": {
        "APP_ID": "your_app_id",
        "APP_SECRET": "your_app_secret"
      }
    }
  ]
}
```

### Using Codeium
1. Configure Codeium settings
2. Add MCP server configuration in workspace settings

## Custom Integration

### Direct Node.js Integration
```javascript
const { LarkMcpTool } = require('@larksuiteoapi/lark-mcp');

const client = new LarkMcpTool({
  appId: 'your_app_id',
  appSecret: 'your_app_secret',
  domain: 'https://open.larksuite.com'
});

// Example: Send a message
await client.tools.im.v1.message.create({
  receive_id_type: 'chat_id',
  receive_id: 'chat_id',
  content: {
    text: 'Hello from Node.js!'
  }
});
```

### Python Integration
```python
import subprocess
import json

def call_lark_mcp(tool_name, params):
    """Call Lark MCP tool from Python"""
    cmd = [
        'npx', '-y', '@larksuiteoapi/lark-mcp@0.4.0',
        'mcp', '--mode', 'stdio'
    ]
    
    request = {
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": params
        },
        "id": 1
    }
    
    result = subprocess.run(
        cmd,
        input=json.dumps(request),
        capture_output=True,
        text=True,
        env={
            'APP_ID': 'your_app_id',
            'APP_SECRET': 'your_app_secret'
        }
    )
    
    return json.loads(result.stdout)
```

## Genesis AI System

### Getting Started with Genesis
The Genesis AI System allows you to create complete Lark Base applications from natural language.

#### Basic Genesis Usage
```bash
# Enable Genesis tools
npx @larksuiteoapi/lark-mcp@0.4.0 mcp --tools preset.genesis.default
```

#### Available Templates
- **CRM**: Customer relationship management
- **Project Management**: Task and milestone tracking
- **HR Management**: Employee and performance tracking
- **Inventory**: Stock and supplier management
- **Event Planning**: Event organization
- **Bug Tracking**: Software issue tracking

#### Example: Create CRM from Template
```javascript
// In AI assistant conversation:
"Use the genesis.builtin.create_base tool to create a CRM system with:
- Customer contact information
- Deal pipeline tracking
- Activity logging
- Sales reports"
```

#### Example: Custom Requirements
```javascript
// Natural language to Lark Base:
"Create a project management base for a software team with:
- Sprint planning capabilities
- Bug tracking integration
- Team performance metrics
- Automated status updates"
```

### Genesis Configuration Options
```json
{
  "mcpServers": {
    "lark-genesis-full": {
      "command": "npx",
      "args": [
        "-y",
        "@larksuiteoapi/lark-mcp@0.4.0",
        "mcp",
        "--mode", "stdio",
        "--tools", "preset.complete.all"
      ],
      "env": {
        "APP_ID": "cli_your_app_id",
        "APP_SECRET": "your_app_secret",
        "GEMINI_API_KEY": "your_gemini_key"
      }
    }
  }
}
```

## Troubleshooting

### Common Issues and Solutions

#### 1. "lark-all-tools is not activating"
**Cause**: Invalid tool parameters or missing environment variables

**Solution**:
```json
// Remove --tools parameter for all tools
{
  "args": [
    "mcp",
    "--mode", "stdio",
    "--domain", "https://open.larksuite.com"
    // DO NOT add --tools "*" - this is invalid
  ]
}
```

#### 2. Authentication Errors
**Symptoms**: 401/403 errors, "invalid app_id" messages

**Solutions**:
- Verify APP_ID starts with `cli_`
- Check APP_SECRET is correct (no extra spaces)
- Ensure app has required permissions in Lark Admin Console
- For international users, use `https://open.larksuite.com`

#### 3. Permission Denied Errors
**Symptoms**: "insufficient permissions" when calling APIs

**Solutions**:
```bash
# Check required permissions in Lark Admin Console:
# - im:message (for messaging)
# - bitable:app (for base operations)  
# - contact:user.base:readonly (for user info)
# - drive:drive (for file operations)
```

#### 4. Rate Limiting Issues
**Symptoms**: 429 errors, quota exceeded messages

**Solutions**:
```bash
# Enable rate limiting (recommended)
npx @larksuiteoapi/lark-mcp@0.4.0 mcp --rate-limit-requests 50

# Or use lighter tool preset
npx @larksuiteoapi/lark-mcp@0.4.0 mcp --tools preset.light
```

#### 5. Build/TypeScript Errors
**Symptoms**: Compilation failures, missing types

**Solutions**:
```bash
# Update to latest version
npm install -g @larksuiteoapi/lark-mcp@latest

# Clear cache and rebuild
npm cache clean --force
yarn install
yarn build
```

#### 6. Claude Desktop Not Loading Tools
**Symptoms**: AI assistant doesn't see Lark tools

**Solutions**:
1. **Check configuration file location**:
   ```bash
   # macOS
   ls -la ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Windows
   dir %APPDATA%\Claude\claude_desktop_config.json
   ```

2. **Validate JSON syntax**:
   ```bash
   # Use JSON validator
   cat claude_desktop_config.json | python -m json.tool
   ```

3. **Check logs** (if available):
   - Look for startup errors
   - Verify environment variables are set

4. **Test configuration manually**:
   ```bash
   # Test MCP server directly
   node /path/to/dist/cli.js mcp --mode stdio --app-id YOUR_ID --app-secret YOUR_SECRET
   ```

#### 7. Network/Proxy Issues
**Symptoms**: Connection timeouts, DNS resolution failures

**Solutions**:
```bash
# Set proxy for corporate networks
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080

# Test connectivity
curl -I https://open.larksuite.com/open-apis/auth/v3/app_access_token/internal
```

#### 8. Genesis Tools Not Working
**Symptoms**: Genesis tools show errors or don't create bases

**Solutions**:
1. **Verify Genesis prerequisites**:
   ```bash
   # Check if Gemini AI key is set (optional but recommended)
   echo $GEMINI_API_KEY
   ```

2. **Use simulation mode first**:
   ```javascript
   // Set useRealAPI: false for testing
   genesis.builtin.create_base({
     baseName: "Test Base",
     options: { useRealAPI: false, template: "crm" }
   })
   ```

3. **Check base creation permissions**:
   - Ensure `bitable:app` permission is granted
   - Verify user has space creation rights

### Debug Mode
Enable detailed logging for troubleshooting:

```bash
# Set debug environment
export DEBUG="lark-mcp:*"
export NODE_ENV="development"

# Run with verbose output
npx @larksuiteoapi/lark-mcp@0.4.0 mcp --mode stdio --verbose
```

### Performance Optimization

#### For Large Organizations
```json
{
  "env": {
    "APP_ID": "cli_your_app_id",
    "APP_SECRET": "your_app_secret",
    "MAX_CONCURRENT_TASKS": "20",
    "CACHE_SIZE": "5000",
    "CACHE_TTL": "1800000"
  }
}
```

#### For Development/Testing
```bash
# Use lightweight preset
--tools preset.light

# Disable rate limiting (dev only)
--disable-rate-limit

# Use simulation mode
--simulation-mode
```

## Best Practices

### Security
- Store credentials in environment variables, not config files
- Use user access tokens for user-specific operations
- Rotate secrets regularly
- Use least-privilege permissions

### Performance
- Choose appropriate tool presets based on use case
- Enable caching for production deployments
- Monitor rate limits and adjust concurrency
- Use batch operations when available

### Integration
- Test with simulation mode before production
- Implement proper error handling
- Log important operations for debugging
- Use type-safe tool calls when possible

### Genesis System
- Start with templates before custom requirements
- Use simulation mode to preview structures
- Validate generated schemas before creation
- Document custom templates for reuse

## Support and Resources

### Documentation
- [Genesis Templates Guide](./genesis-templates.md)
- [Tool Reference](./tools-en.md)
- [API Documentation](https://open.larksuite.com/document)

### Community
- [GitHub Issues](https://github.com/ShunsukeHayashi/lark-openapi-mcp-enhanced/issues)
- [Release Notes](../CHANGELOG.md)

### Professional Support
For enterprise integration support, please contact the development team through GitHub issues with the `enterprise` label.