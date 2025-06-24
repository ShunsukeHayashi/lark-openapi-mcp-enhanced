# 🔄 Claude Desktop Restart Guide

## 🚨 MCP Configuration Updated

**Status**: Claude Desktop configuration updated with correct Lark MCP credentials
- **App ID**: `cli_a8d2fdb1f1f8d02d` ✅
- **App Secret**: `V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ` ✅  
- **Domain**: `https://open.larksuite.com` ✅
- **MCP Server**: Built and ready ✅

## 🔄 Required Action: Restart Claude Desktop

### Step 1: Quit Claude Desktop
```bash
# Option 1: Via menu
Claude Desktop → Quit Claude Desktop

# Option 2: Via Activity Monitor
Find "Claude Desktop" → Force Quit

# Option 3: Via Terminal
pkill -f "Claude Desktop"
```

### Step 2: Restart Claude Desktop
```bash
# Start Claude Desktop
open -a "Claude Desktop"
```

### Step 3: Verify MCP Tools Available
After restart, these tools should be available:
- `lark-mcp:docx_v1_create` - Document creation
- `lark-mcp:docx_builtin_import` - Document import
- `lark-mcp:bitable_v1_*` - Base operations
- `lark-mcp:drive_v1_*` - Drive operations

## 🧪 Test Commands After Restart

### Document Creation Test
```
Use the lark-mcp tool to create a new document with title "MCP Tool Test" and content "Testing Lark MCP functionality after configuration update."
```

### Base Operations Test  
```
Use the lark-mcp tool to list available bases or create a new base called "MCP Test Base".
```

## 📊 Expected Results

### ✅ Success Indicators
- MCP tools appear in tool suggestions
- Document creation works without "Tool not found" errors
- Base operations accessible
- API calls use correct domain (open.larksuite.com)

### ❌ Troubleshooting

If tools still not available:

1. **Check Configuration**
   ```bash
   cat "/Users/shunsukehayashi/Library/Application Support/Claude/claude_desktop_config.json"
   ```

2. **Test MCP Server Manually**
   ```bash
   cd /Users/shunsukehayashi/Dev/lark/lark-openapi-mcp
   node dist/cli.js mcp --app-id cli_a8d2fdb1f1f8d02d --app-secret V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ --domain https://open.larksuite.com --mode stdio
   ```

3. **Check Claude Desktop Logs**
   - Look for MCP connection errors
   - Verify server startup messages

## 🎯 Post-Restart Capabilities

Once restarted, you'll have access to:
- **Document Creation**: Full Lark document workflow
- **Base Management**: Create and manage Lark Bases
- **Drive Operations**: File and folder management
- **Complete MCP Integration**: All Lark APIs via MCP tools

---

**⚡ Action Required: Please quit and restart Claude Desktop to load the updated MCP configuration.**