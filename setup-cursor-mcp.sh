#!/bin/bash

# 🚀 Cursor MCP Setup Script for Lark MCP Tool
# This script helps you set up the Lark MCP Tool with Cursor

set -e

echo "🚀 Setting up Lark MCP Tool for Cursor..."
echo "=========================================="

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📍 Project directory: $SCRIPT_DIR"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if the CLI exists
CLI_PATH="$SCRIPT_DIR/dist/cli.js"
if [ ! -f "$CLI_PATH" ]; then
    echo "❌ CLI not found at $CLI_PATH"
    echo "🔨 Building the project..."
    cd "$SCRIPT_DIR"
    yarn build
fi

echo "✅ CLI found at: $CLI_PATH"

# Test the CLI
echo "🧪 Testing CLI..."
node "$CLI_PATH" --help > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ CLI is working correctly"
else
    echo "❌ CLI test failed"
    exit 1
fi

# Check configuration files
CONFIG_FILE="$SCRIPT_DIR/config-larksuite-corrected.json"
if [ -f "$CONFIG_FILE" ]; then
    echo "✅ Configuration file found: $CONFIG_FILE"
else
    echo "❌ Configuration file not found: $CONFIG_FILE"
    echo "Please ensure you have the correct configuration file."
    exit 1
fi

# Test MCP server
echo "🧪 Testing MCP server..."
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test-client", "version": "1.0.0"}}}' | node "$CLI_PATH" mcp --config "$CONFIG_FILE" --mode stdio > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ MCP server test successful"
else
    echo "❌ MCP server test failed"
    exit 1
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Cursor Configuration:"
echo "========================"
echo ""
echo "Add this to your Cursor MCP settings:"
echo ""
echo "{"
echo "  \"mcpServers\": {"
echo "    \"lark\": {"
echo "      \"command\": \"node\","
echo "      \"args\": ["
echo "        \"$CLI_PATH\","
echo "        \"mcp\","
echo "        \"--config\","
echo "        \"$CONFIG_FILE\","
echo "        \"--mode\","
echo "        \"stdio\""
echo "      ]"
echo "    }"
echo "  }"
echo "}"
echo ""
echo "📝 Steps to complete setup:"
echo "1. Open Cursor"
echo "2. Go to Settings → Extensions → MCP (Model Context Protocol)"
echo "3. Add the configuration above"
echo "4. Restart Cursor"
echo "5. Test by asking: 'Create a test Lark Base application'"
echo ""
echo "📚 For more information, see: cursor-mcp-integration-guide.md"
echo ""
echo "🚀 Ready to use Lark MCP Tool with Cursor!" 