# Lark MCP Tool

[![npm version](https://img.shields.io/npm/v/@larksuiteoapi/lark-mcp.svg)](https://www.npmjs.com/package/@larksuiteoapi/lark-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@larksuiteoapi/lark-mcp.svg)](https://nodejs.org/)

The official Model Context Protocol (MCP) tool for Lark/Feishu, enabling AI assistants to interact with Lark's comprehensive API ecosystem.

## 🚀 Key Features

### 1. **Complete Lark API Coverage**
- **200+ API Operations**: Full access to Lark/Feishu platform capabilities
- **All Core Modules**: IM, Docs, Base/Bitable, Calendar, Wiki, Tasks, Approvals, HR
- **Dual Authentication**: App-level and user-level access tokens

### 2. **Genesis AI System** 🆕
Create complete business applications with AI-powered generation:
- **Pre-built Templates**: CRM, Project Management, HR, Inventory, and more
- **Natural Language to Base**: Describe your needs, get a complete application
- **Smart Optimization**: AI recommendations for existing bases
- **Views & Automation**: Auto-generate dashboards, workflows, and reports

### 3. **MCP Integration**
- **Tool Presets**: Light, default, and specialized tool collections
- **Guided Prompts**: Step-by-step assistance for complex operations
- **Resources**: Templates, examples, and API documentation

## 📦 Installation

```bash
# Global installation
npm install -g @larksuiteoapi/lark-mcp

# Or use directly with npx
npx @larksuiteoapi/lark-mcp
```

## 🔧 Quick Start

### 1. Set Up Credentials

Create a Lark/Feishu app and get your credentials:
- Visit [Lark Open Platform](https://open.larksuite.com/) or [Feishu Open Platform](https://open.feishu.cn/)
- Create an app and note the App ID and App Secret

### 2. Configure MCP

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "lark-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@larksuiteoapi/lark-mcp",
        "mcp",
        "--mode", "stdio",
        "--app-id", "YOUR_APP_ID",
        "--app-secret", "YOUR_APP_SECRET"
      ]
    }
  }
}
```

### 3. Use in AI Assistant

Once configured, your AI assistant can:

```typescript
// Create a CRM system from template
await genesis.builtin.create_base({
  baseName: "Sales CRM",
  options: {
    template: "crm",
    useRealAPI: true
  }
});

// Send a message
await im.v1.message.create({
  receive_id: "chat_id",
  msg_type: "text",
  content: JSON.stringify({ text: "Hello from AI!" })
});

// Create a calendar event
await calendar.v4.calendarEvent.create({
  summary: "Team Meeting",
  start_time: "2024-01-15T14:00:00Z",
  end_time: "2024-01-15T15:00:00Z"
});
```

## 🎯 Genesis Templates

### Available Templates

| Template | ID | Description |
|----------|-----|-------------|
| 🏆 **CRM** | `crm` | Customer relationship management with pipeline tracking |
| 📊 **Project Management** | `project_management` | Tasks, milestones, and team collaboration |
| 🏢 **HR Management** | `hr_management` | Employee records, leave, and performance |
| 📦 **Inventory** | `inventory_management` | Stock control and supplier management |
| 🎉 **Event Planning** | `event_planning` | Event organization and resource coordination |
| 🐛 **Bug Tracking** | `bug_tracking` | Issue tracking for software teams |

### Creating from Template

```typescript
// List available templates
await genesis.builtin.list_templates({
  category: "all",
  includeDetails: true
});

// Create a complete CRM system
await genesis.builtin.create_base({
  baseName: "My Sales CRM",
  requirements: "B2B sales pipeline management",
  options: {
    template: "crm",
    language: "en",
    useRealAPI: true
  }
});
```

### Template Features

Each template includes:
- ✅ Pre-configured tables with relationships
- 📊 Multiple view types (Grid, Kanban, Calendar, Gantt)
- 📈 Interactive dashboards with KPIs
- 🤖 Automation workflows
- 🌍 Multi-language support (EN/ZH/JA)

## 🛠️ Tool Presets

### Light Preset (10 tools)
Basic operations for simple integrations:
```bash
--tools preset.light
```

### Default Preset (19 tools)
Balanced set for common use cases:
```bash
--tools preset.default
```

### Genesis Preset (20+ tools)
Full Genesis AI system with base creation:
```bash
--tools preset.genesis.default
```

### Complete Preset (50+ tools)
All available tools including advanced operations:
```bash
--tools preset.complete.all
```

## 📚 MCP Prompts

Use these prompts for guided assistance:

- `genesis_templates` - Browse and create from templates
- `genesis_create_base` - Create custom applications
- `genesis_create_view_dashboard` - Design views and dashboards
- `complete_user_management` - Manage users and permissions
- `complete_approval_workflow` - Design approval processes
- `complete_genesis_create` - Comprehensive app creation

## 🔌 Integration Examples

### With Claude Desktop

```json
{
  "mcpServers": {
    "lark-mcp-genesis": {
      "command": "npx",
      "args": [
        "-y",
        "@larksuiteoapi/lark-mcp",
        "mcp",
        "--mode", "stdio",
        "--app-id", "YOUR_APP_ID",
        "--app-secret", "YOUR_APP_SECRET",
        "--tools", "preset.genesis.default"
      ]
    }
  }
}
```

### With Other AI Tools

```bash
# Cursor/Windsurf
npx @larksuiteoapi/lark-mcp mcp --mode stdio --config config.json

# HTTP Server Mode
npx @larksuiteoapi/lark-mcp mcp --mode sse --port 3000
```

## 🐳 Docker Support

```bash
# Build Docker image
docker build -t lark-mcp .

# Run with Docker
docker run -it --rm \
  -e APP_ID=your_app_id \
  -e APP_SECRET=your_app_secret \
  lark-mcp
```

## 📖 Documentation

- [Tool List](./docs/tools-en.md) - Complete list of available tools
- [Genesis Templates](./docs/genesis-templates.md) - Template documentation
- [API Reference](https://open.larksuite.com/document) - Official Lark API docs
- [MCP Specification](https://modelcontextprotocol.io/) - MCP protocol details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on [Lark Open Platform](https://open.larksuite.com/)
- Implements [Model Context Protocol](https://modelcontextprotocol.io/)
- Powered by [@larksuiteoapi/node-sdk](https://www.npmjs.com/package/@larksuiteoapi/node-sdk)

---

**Note**: This tool is in active development. Features and APIs may change. Please report issues on [GitHub](https://github.com/larksuite/lark-openapi-mcp).