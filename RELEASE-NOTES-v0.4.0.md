# Release Notes - Lark MCP Tool v0.4.0

## 🎉 Major Release: Genesis AI System

This release introduces the **Genesis AI System**, a powerful framework for creating complete Lark Base applications from natural language requirements and pre-built templates.

## ✨ New Features

### 1. Genesis AI System
- **AI-Powered Base Creation**: Describe your needs in natural language and get a complete Lark Base application
- **Smart Requirements Analysis**: Analyzes requirements to suggest optimal data structures
- **ER Diagram Generation**: Visualize database relationships with Mermaid diagrams
- **Base Optimization**: AI recommendations for improving existing bases

### 2. Pre-Built Templates
Six comprehensive templates for common business scenarios:
- **🏆 CRM**: Complete customer relationship management with pipeline tracking
- **📊 Project Management**: Tasks, milestones, and team collaboration
- **🏢 HR Management**: Employee records, leave tracking, and performance reviews
- **📦 Inventory Management**: Stock control and supplier management
- **🎉 Event Planning**: Event organization and resource coordination
- **🐛 Bug Tracking**: Software issue and feature tracking

Each template includes:
- Pre-configured tables with appropriate fields
- Multiple view types (Grid, Kanban, Calendar, Gantt)
- Interactive dashboards with charts and metrics
- Automation workflows for common processes
- Multi-language support (EN/ZH/JA)

### 3. New Genesis Tools
- `genesis.builtin.create_base` - Create bases with templates or custom requirements
- `genesis.builtin.list_templates` - Browse available templates
- `genesis.builtin.analyze_requirements` - AI-powered requirements analysis
- `genesis.builtin.create_view` - Create custom views
- `genesis.builtin.create_dashboard` - Build dashboards
- `genesis.builtin.create_automation` - Design workflows
- `genesis.builtin.create_filter_view` - Create filter views
- `genesis.builtin.optimize_base` - Optimize existing bases

### 4. Complete Function Tools
- 50+ tools covering all Lark APIs
- User management, departments, approvals
- Wiki/knowledge base operations
- Meeting room booking
- OKR management
- HR operations

### 5. New Tool Presets
- `preset.genesis.default` - Genesis features with supporting APIs (18 tools)
- `preset.complete.all` - All available tools (55 tools)

### 6. MCP Enhancements
- New prompts: `genesis_templates`, `complete_genesis_create`
- New resource: `genesis_template_examples`
- Improved error handling and recovery

## 📦 Installation

```bash
npm install -g @larksuiteoapi/lark-mcp@0.4.0
```

## 🚀 Quick Start

### Create CRM from Template
```javascript
await genesis.builtin.create_base({
  baseName: "My Sales CRM",
  options: {
    template: "crm",
    useRealAPI: true
  }
});
```

### List Available Templates
```javascript
await genesis.builtin.list_templates({
  category: "all",
  includeDetails: true
});
```

## 🔧 Configuration

Add to Claude Desktop config:
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

## 📚 Documentation
- [Genesis Templates Guide](./docs/genesis-templates.md)
- [Tool List](./docs/tools-en.md)
- [README](./README.md)

## 🐛 Bug Fixes
- Fixed constructor pattern in specialist agents
- Fixed MCP server handler return types
- Fixed TypeScript compilation issues
- Improved error handling

## 💡 Examples

See `examples/genesis-template-demo.js` for a complete demonstration of Genesis features.

## 🙏 Acknowledgments

Thanks to all contributors who helped make this release possible!

---

**Note**: Genesis features are currently in simulation mode by default. Set `useRealAPI: true` to create actual Lark Base applications.