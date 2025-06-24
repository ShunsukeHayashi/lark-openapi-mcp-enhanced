# 🚀 Cursor MCP Quick Reference - Lark MCP Tool

## ⚡ Quick Setup

### 1. Run Setup Script
```bash
cd /Users/shunsukehayashi/Dev/lark/lark-openapi-mcp
./setup-cursor-mcp.sh
```

### 2. Add to Cursor MCP Settings
**Settings** → **Extensions** → **MCP (Model Context Protocol)**

```json
{
  "mcpServers": {
    "lark": {
      "command": "node",
      "args": [
        "/Users/shunsukehayashi/Dev/lark/lark-openapi-mcp/dist/cli.js",
        "mcp",
        "--config",
        "/Users/shunsukehayashi/Dev/lark/lark-openapi-mcp/config-larksuite-corrected.json",
        "--mode",
        "stdio"
      ]
    }
  }
}
```

## 🎯 Quick Commands in Cursor

### Base Operations
- `"Create a Base app called 'Project Tracker'"`
- `"Create a table called 'Tasks' with title, description, status fields"`
- `"Add a record to the Tasks table"`

### Document Operations
- `"Search for documents about 'API documentation'"`
- `"Create a new document with project requirements"`
- `"Get the content of document ID 'doc_123'"`

### Messaging Operations
- `"Create a group chat for the development team"`
- `"Send a message to the team about the new feature"`
- `"List all group chats I'm in"`

### Team Management
- `"Get user information for email@example.com"`
- `"Add permissions for user to document"`
- `"Search Wiki for 'project setup'"`

## 🔧 Troubleshooting

### Common Issues
1. **"Command not found"** → Check if CLI path is correct
2. **"Authentication failed"** → Verify Lark app credentials
3. **"Connection refused"** → Restart Cursor and MCP server
4. **Tools not appearing** → Check MCP server status

### Quick Fixes
```bash
# Test CLI manually
node /Users/shunsukehayashi/Dev/lark/lark-openapi-mcp/dist/cli.js --help

# Test MCP server
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node /Users/shunsukehayashi/Dev/lark/lark-openapi-mcp/dist/cli.js mcp --config /Users/shunsukehayashi/Dev/lark/lark-openapi-mcp/config-larksuite-corrected.json --mode stdio

# Restart MCP server
pkill -f "node.*cli.js"
```

## 📊 Available Tools (19 total)

### Base (7 tools)
- `bitable_v1_app_create`
- `bitable_v1_appTable_create`
- `bitable_v1_appTableField_list`
- `bitable_v1_appTable_list`
- `bitable_v1_appTableRecord_create`
- `bitable_v1_appTableRecord_search`
- `bitable_v1_appTableRecord_update`

### Documents (3 tools)
- `docx_v1_document_rawContent`
- `docx_builtin_search`
- `docx_builtin_import`

### IM (5 tools)
- `im_v1_chat_create`
- `im_v1_chat_list`
- `im_v1_chatMembers_get`
- `im_v1_message_create`
- `im_v1_message_list`

### Other (4 tools)
- `contact_v3_user_batchGetId`
- `drive_v1_permissionMember_create`
- `wiki_v1_node_search`
- `wiki_v2_space_getNode`

## 🎉 Success Indicators

- ✅ Cursor shows "lark" in MCP servers list
- ✅ Can ask Cursor to perform Lark operations
- ✅ Cursor responds with actual Lark API results
- ✅ No error messages in console

## 📞 Support

- **Documentation**: `cursor-mcp-integration-guide.md`
- **Setup Script**: `./setup-cursor-mcp.sh`
- **Main Guide**: `README.md`

---

**Status**: ✅ **READY FOR CURSOR** 🚀 