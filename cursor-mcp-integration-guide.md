# 🚀 Cursor MCP Integration Guide - Lark MCP Tool

This guide will help you integrate the Lark MCP Tool with Cursor for seamless AI-assisted development with Lark APIs.

## 📋 Prerequisites

- Cursor IDE installed
- Node.js 18+ installed
- Lark Developer Account
- Lark App credentials configured

## ⚡ Quick Setup (3 minutes)

### 1. Verify Installation
```bash
# Navigate to the project directory
cd /Users/shunsukehayashi/Dev/lark/lark-openapi-mcp

# Verify the CLI is working
node dist/cli.js --help
```

### 2. Configure Cursor MCP Settings

Open Cursor and go to **Settings** → **Extensions** → **MCP (Model Context Protocol)**

Add the following configuration:

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
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 3. Alternative Configuration Options

#### Option A: Using Environment Variables
```json
{
  "mcpServers": {
    "lark": {
      "command": "node",
      "args": [
        "/Users/shunsukehayashi/Dev/lark/lark-openapi-mcp/dist/cli.js",
        "mcp",
        "--app-id",
        "cli_a8d2fdb1f1f8d02d",
        "--app-secret",
        "V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ",
        "--domain",
        "https://open.larksuite.com",
        "--mode",
        "stdio"
      ]
    }
  }
}
```

#### Option B: Using Custom Configuration
```json
{
  "mcpServers": {
    "lark": {
      "command": "node",
      "args": [
        "/Users/shunsukehayashi/Dev/lark/lark-openapi-mcp/dist/cli.js",
        "mcp",
        "--config",
        "/Users/shunsukehayashi/Dev/lark/lark-openapi-mcp/config.json",
        "--mode",
        "stdio",
        "--tools",
        "bitable,docx,im"
      ]
    }
  }
}
```

## 🎯 Available Tools in Cursor

Once configured, you'll have access to these Lark tools directly in Cursor:

### Base (Database) Operations
- `bitable_v1_app_create` - Create Base applications
- `bitable_v1_appTable_create` - Create tables
- `bitable_v1_appTableField_list` - List fields
- `bitable_v1_appTable_list` - List tables
- `bitable_v1_appTableRecord_create` - Create records
- `bitable_v1_appTableRecord_search` - Search records
- `bitable_v1_appTableRecord_update` - Update records

### Document Operations
- `docx_v1_document_rawContent` - Get document content
- `docx_builtin_search` - Search documents
- `docx_builtin_import` - Import documents

### IM (Messaging) Operations
- `im_v1_chat_create` - Create group chats
- `im_v1_chat_list` - List chats
- `im_v1_chatMembers_get` - Get chat members
- `im_v1_message_create` - Send messages
- `im_v1_message_list` - Get message history

### Other Operations
- `contact_v3_user_batchGetId` - Get user IDs
- `drive_v1_permissionMember_create` - Manage permissions
- `wiki_v1_node_search` - Search Wiki
- `wiki_v2_space_getNode` - Get Wiki node info

## 🚀 Usage Examples in Cursor

### 1. Create a Base Application
```bash
# In Cursor's AI chat or command palette:
"Create a new Lark Base application called 'Project Management'"
```

### 2. Create a Table
```bash
# In Cursor's AI chat:
"Create a table called 'Tasks' in the Base app with fields for title, description, status, and assignee"
```

### 3. Search Documents
```bash
# In Cursor's AI chat:
"Search for documents containing 'project requirements'"
```

### 4. Send Messages
```bash
# In Cursor's AI chat:
"Send a message to the team chat about the new project setup"
```

## 🔧 Advanced Configuration

### Tool Filtering
You can limit which tools are available:

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
        "stdio",
        "--tools",
        "bitable,docx"
      ]
    }
  }
}
```

### Language Settings
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
        "stdio",
        "--language",
        "zh"
      ]
    }
  }
}
```

### Token Mode Configuration
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
        "stdio",
        "--token-mode",
        "user"
      ]
    }
  }
}
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Command not found" Error
```bash
# Verify the path is correct
ls -la /Users/shunsukehayashi/Dev/lark/lark-openapi-mcp/dist/cli.js

# Make sure the file exists and is executable
chmod +x /Users/shunsukehayashi/Dev/lark/lark-openapi-mcp/dist/cli.js
```

#### 2. "Authentication failed" Error
```bash
# Check your configuration file
cat /Users/shunsukehayashi/Dev/lark/lark-openapi-mcp/config-larksuite-corrected.json

# Verify your Lark app credentials in the Lark Developer Console
```

#### 3. "Connection refused" Error
```bash
# Test the MCP server manually
node /Users/shunsukehayashi/Dev/lark/lark-openapi-mcp/dist/cli.js mcp --config /Users/shunsukehayashi/Dev/lark/lark-openapi-mcp/config-larksuite-corrected.json --mode stdio
```

#### 4. Tools not appearing
```bash
# Check if the server is responding
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node /Users/shunsukehayashi/Dev/lark/lark-openapi-mcp/dist/cli.js mcp --config /Users/shunsukehayashi/Dev/lark/lark-openapi-mcp/config-larksuite-corrected.json --mode stdio
```

### Debug Mode
Enable debug logging in Cursor:

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
      ],
      "env": {
        "NODE_ENV": "development",
        "DEBUG": "*"
      }
    }
  }
}
```

## 📚 Integration Examples

### 1. Project Setup Workflow
```bash
# In Cursor AI chat:
"Set up a new project by:
1. Creating a Base app called 'Project Tracker'
2. Creating a table called 'Tasks' with fields for title, description, status, priority, and assignee
3. Creating a table called 'Team Members' with fields for name, email, role, and department
4. Setting up the relationship between Tasks and Team Members"
```

### 2. Document Management
```bash
# In Cursor AI chat:
"Help me manage project documentation:
1. Search for existing documents about 'API documentation'
2. Create a new document with the project requirements
3. Share the document with the development team"
```

### 3. Team Communication
```bash
# In Cursor AI chat:
"Set up team communication:
1. Create a group chat for the development team
2. Send an initial message about the project kickoff
3. Add team members to the chat"
```

## 🔄 Restarting the MCP Server

If you need to restart the MCP server:

1. **In Cursor**: Go to Settings → Extensions → MCP → Restart
2. **Manually**: Kill any running processes and restart Cursor
3. **Command Line**: 
```bash
pkill -f "node.*cli.js"
```

## 📊 Verification

To verify the integration is working:

1. **Check Cursor's MCP Status**: Look for "lark" in the MCP servers list
2. **Test Tool Availability**: Try asking Cursor to "list available Lark tools"
3. **Test Basic Operation**: Ask Cursor to "create a test Base application"

## 🎉 Success Indicators

You'll know the integration is working when:

- ✅ Cursor shows "lark" in the MCP servers list
- ✅ You can ask Cursor to perform Lark operations
- ✅ Cursor responds with actual Lark API results
- ✅ No error messages in Cursor's console

## 📞 Support

If you encounter issues:

1. **Check the logs**: Look at Cursor's developer console
2. **Verify configuration**: Ensure all paths and credentials are correct
3. **Test manually**: Try running the CLI outside of Cursor
4. **Check documentation**: Review the main README.md for more details

---

## 🚀 Ready to Use!

Once configured, you can use natural language in Cursor to:

- Create and manage Lark Base databases
- Search and create documents
- Send messages and manage team communication
- Automate workflows with AI assistance

**Example commands in Cursor:**
- "Create a project management Base with tasks and team tables"
- "Search for documents about API documentation"
- "Send a message to the team about the new feature"
- "Set up a new group chat for the development team"

---

**Status**: ✅ **READY FOR CURSOR INTEGRATION** 🚀

**Last Updated**: December 2024  
**Version**: 2.0.0 