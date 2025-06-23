#!/bin/bash

# CMS-SFA Agent Runner Script
# Creates comprehensive CMS and SFA systems using Lark MCP tools

set -e

echo "🚀 CMS-SFA Agent for Lark Base System Creation"
echo "================================================"

# Check if OpenAI API key is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY environment variable not set"
    echo "Please set your OpenAI API key:"
    echo "export OPENAI_API_KEY='your-api-key-here'"
    exit 1
fi

# Check if Python dependencies are installed
echo "🔍 Checking Python dependencies..."
if [ -f "../.env" ]; then
    echo "🔐 Loading environment variables from ../.env"
    set -o allexport
    source ../.env
    set +o allexport
fi

python3 -c "import openai, requests, agents" 2>/dev/null || {
    echo "❌ Required Python packages not found"
    echo "Installing dependencies..."
    pip3 install openai-agents openai requests
}

# Check if Lark MCP is built
if [ ! -d "dist" ]; then
    echo "🔨 Building Lark MCP..."
    yarn build
fi

## Start Lark MCP server in background
echo "🔧 Starting Lark MCP server..."
node dist/cli.js mcp --config config.json &
MCP_PID=$!

# Wait for MCP server to start
echo "⏳ Waiting for MCP server to start..."
sleep 5

# Non-fatal check for MCP server
if kill -0 $MCP_PID 2>/dev/null; then
    echo "✅ MCP server started (PID: $MCP_PID)"
else
    echo "⚠️ MCP server failed to start; continuing anyway"
fi

echo "🤖 Running CMS-SFA Agent..."
	# Run the CMS-SFA agent (Agents SDK version)
	echo "🤖 Running CMS-SFA Agent with Agents SDK..."
	python3 openai-agents-lark-sfa.py

# Stop MCP server
echo "🛑 Stopping MCP server..."
kill $MCP_PID 2>/dev/null || true

echo "✅ CMS-SFA Agent execution completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Use the generated prompts in Claude Desktop"
echo "2. Execute the MCP commands step by step"
echo "3. Verify system functionality"
echo "4. Add custom fields and workflows as needed" 