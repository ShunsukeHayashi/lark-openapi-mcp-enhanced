# 🚀 Lark MCP Tool - Quick Start Guide

Get up and running with the Lark MCP Tool in under 5 minutes!

## 📋 Prerequisites

- Node.js 18+ installed
- Lark Developer Account
- Claude Desktop (for MCP integration)

## ⚡ Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd lark-openapi-mcp

# Install dependencies
yarn install

# Build the project
yarn build
```

### 2. Configure Lark App
```bash
# Copy the configuration template
cp config-new-app.json config.json

# Edit config.json with your Lark app credentials
{
  "appId": "your_app_id",
  "appSecret": "your_app_secret",
  "domain": "https://open.larksuite.com",
  "language": "en"
}
```

### 3. Set Up Claude Desktop
Add this to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "lark": {
      "command": "node",
      "args": [
        "/path/to/lark-openapi-mcp/dist/cli.js",
        "mcp",
        "--config", "config.json",
        "--mode", "stdio"
      ]
    }
  }
}
```

### 4. Test the Setup
```bash
# Test the MCP server
yarn start

# Test document creation
yarn cli document-tool.recall.search --query "test"
```

## 🎯 Common Use Cases

### Create a Document
```bash
# Using Claude Desktop
"Create a new document titled 'Project Plan'"
```

### Search Documents
```bash
# Using Claude Desktop
"Search for documents containing 'requirements'"
```

### Create a Base System
```bash
# Using the Genesis Agent
python3 test-genesis.py
```

## 🔧 Configuration Options

### Environment Variables
```bash
export LARK_APP_ID="your_app_id"
export LARK_APP_SECRET="your_app_secret"
export LARK_DOMAIN="https://open.larksuite.com"
```

### Configuration Files
- `config-larksuite-corrected.json`: Production configuration
- `config-new-app.json`: New app template
- `config-user-token.json`: User token configuration

## 🛠️ Troubleshooting

### Common Issues

#### 1. Authentication Error
```bash
# Check your app credentials
cat config.json

# Verify app permissions in Lark Developer Console
# Ensure document and base permissions are enabled
```

#### 2. MCP Connection Failed
```bash
# Check if the server is running
yarn start

# Verify Claude Desktop configuration
# Ensure the path to cli.js is correct
```

#### 3. API Rate Limits
```bash
# The tool includes built-in rate limiting
# Wait a few seconds between requests
# Check Lark API documentation for limits
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* yarn start

# Check logs
tail -f /tmp/lark-mcp.log
```

## 📚 Next Steps

### 1. Explore Features
- [Document Recall System](docs/document-recall.md)
- [Base Operations](docs/base-operations.md)
- [Prompt Management](prompt-management/README.md)

### 2. Advanced Configuration
- [Permissions Setup](permissions-setup-guide.md)
- [Error Handling](error-handling-guide.md)
- [Performance Tuning](docs/performance.md)

### 3. Development
- [API Reference](docs/api-reference.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Testing Guide](docs/testing.md)

## 🎉 Success!

You're now ready to use the Lark MCP Tool! 

### What You Can Do:
- ✅ Create and manage Lark documents
- ✅ Search and recall document content
- ✅ Create Base databases and tables
- ✅ Automate workflows with AI assistance
- ✅ Design systems with the Genesis Agent

### Quick Commands:
```bash
# Start the server
yarn start

# Run tests
yarn test

# Build for production
yarn build

# Check status
yarn status
```

## 📞 Need Help?

- 📖 [Full Documentation](README.md)
- 🐛 [Issue Tracker](https://github.com/your-repo/issues)
- 💬 [Community Support](https://github.com/your-repo/discussions)
- 📧 [Direct Support](mailto:support@example.com)

---

**Ready to build amazing things with Lark and AI! 🚀**