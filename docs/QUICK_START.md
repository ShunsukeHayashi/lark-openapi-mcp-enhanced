# Quick Start Guide - Lark OpenAPI MCP Enhanced

Get up and running with the Lark OpenAPI MCP Enhanced tool in 5 minutes.

## 🚀 Prerequisites

- **Node.js** ≥16.20.0 ([Download here](https://nodejs.org/))
- **Lark/Feishu App** with App ID and App Secret ([Create here](https://open.larksuite.com/))
- **MCP-compatible AI assistant** (Claude Desktop, VS Code, etc.)

## 📦 Installation

```bash
npm install -g @larksuiteoapi/lark-mcp@0.4.0
```

## 🔑 Setup Your Lark App

1. **Create Application**:
   - Visit [Lark Open Platform](https://open.larksuite.com/)
   - Click "Console" → "Create App"
   - Choose "Custom App"

2. **Get Credentials**:
   - Go to "Credentials & Basic Info"
   - Copy your **App ID** (starts with `cli_`)
   - Copy your **App Secret**

3. **Set Permissions**:
   - Go to "Permission Management"
   - Enable these permissions:
     - `im:message` - Send messages
     - `bitable:app` - Create bases (for Genesis)
     - `contact:user.base:readonly` - Read user info

## ⚡ Quick Configuration

### For Claude Desktop

1. **Find config file**:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. **Add configuration**:
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
           "APP_ID": "cli_your_app_id_here",
           "APP_SECRET": "your_app_secret_here"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop**

### For VS Code/Cursor

Add to your MCP configuration:
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
        "APP_ID": "cli_your_app_id_here",
        "APP_SECRET": "your_app_secret_here"
      }
    }
  ]
}
```

## 🎯 Test Your Setup

### 1. Verify Installation
```bash
npx @larksuiteoapi/lark-mcp@0.4.0 --version
```

### 2. Test Connection
```bash
export APP_ID="cli_your_app_id"
export APP_SECRET="your_app_secret"
npx @larksuiteoapi/lark-mcp@0.4.0 mcp --mode stdio --help
```

### 3. Test in AI Assistant
Ask your AI assistant:
```
"What Lark tools do you have available?"
```

You should see tools like:
- `im.v1.message.create` - Send messages
- `genesis.builtin.create_base` - Create Lark Base apps
- `bitable.v1.app.create` - Create bases

## 🌟 Try Genesis AI System

### Create Your First Base
Ask your AI assistant:
```
"Use the Genesis system to create a simple CRM base for tracking customers and deals."
```

The AI will:
1. Analyze your requirements
2. Generate a complete Lark Base structure
3. Create tables, fields, and views
4. Set up dashboards and automations

### Available Templates
- **CRM**: Customer relationship management
- **Project Management**: Task and milestone tracking
- **HR**: Employee management and reviews
- **Inventory**: Stock and supplier tracking
- **Event Planning**: Event organization
- **Bug Tracking**: Software issue management

## 🔧 Configuration Options

### Preset Collections

Choose the right tool preset for your needs:

| Preset | Tools | Best For |
|--------|-------|----------|
| `preset.light` | 10 tools | Basic messaging and documents |
| `preset.genesis.default` | 18 tools | AI-powered base creation |
| `preset.complete.all` | 55+ tools | Full Lark functionality |
| All tools (no preset) | 55+ tools | Power users |

### Example Configurations

#### Lightweight Setup (10 tools)
```json
{
  "args": [
    "mcp", "--mode", "stdio",
    "--tools", "preset.light"
  ]
}
```

#### Full Feature Set (55+ tools)
```json
{
  "args": [
    "mcp", "--mode", "stdio",
    "--tools", "preset.complete.all"
  ]
}
```

#### All Tools (default)
```json
{
  "args": [
    "mcp", "--mode", "stdio"
  ]
}
```

## 🛠️ Common Use Cases

### 1. Send Messages
```
"Send a message to the team chat saying 'Daily standup in 10 minutes'"
```

### 2. Create a Base
```
"Create a project management base with tasks, deadlines, and team assignments"
```

### 3. Search Documents
```
"Find all documents related to 'quarterly planning' in our workspace"
```

### 4. Create Calendar Events
```
"Schedule a team meeting for tomorrow at 2 PM about the product launch"
```

### 5. Manage Tasks
```
"Create a task to review the marketing proposal and assign it to John with a deadline of Friday"
```

## 🚨 Troubleshooting

### Issue: Tools not appearing
**Solution**: Check your configuration file syntax and restart your AI assistant

### Issue: Authentication errors
**Solutions**:
- Verify APP_ID starts with `cli_`
- Check APP_SECRET has no extra spaces
- Ensure app is "Online" in Lark console

### Issue: Permission denied
**Solution**: Enable required permissions in Lark Admin Console

### Issue: Rate limiting
**Solution**: Add rate limiting to your config:
```bash
--rate-limit-requests 30 --rate-limit-writes 10
```

## 📚 Next Steps

1. **Read the full guides**:
   - [Integration Guide](./INTEGRATION_GUIDE.md) - Detailed setup instructions
   - [Troubleshooting Guide](./TROUBLESHOOTING.md) - Fix common issues
   - [Genesis Templates Guide](./genesis-templates.md) - Advanced Genesis usage

2. **Explore examples**:
   - Check `examples/` folder for sample code
   - Try different Genesis templates
   - Experiment with workflow automation

3. **Join the community**:
   - [GitHub Issues](https://github.com/ShunsukeHayashi/lark-openapi-mcp-enhanced/issues) for support
   - Share your use cases and feedback

## 🎉 You're Ready!

Your Lark MCP integration is now set up. Start by asking your AI assistant to help you create your first Lark Base or send a message to your team!

---

**Need help?** Check our [Troubleshooting Guide](./TROUBLESHOOTING.md) or [create an issue](https://github.com/ShunsukeHayashi/lark-openapi-mcp-enhanced/issues).