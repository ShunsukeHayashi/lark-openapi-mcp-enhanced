#!/bin/bash

echo "Testing MCP with current permissions..."
echo "Current permissions: im:message:send_as_bot, docx:document:readonly"
echo ""

# Test 1: Document tools only
echo "=== Test 1: Document Tools ==="
timeout 5s node dist/cli.js mcp --config config.json --tools "docs" 2>&1 | head -10

echo ""
echo "=== Test 2: All Tools (will show permission errors) ==="
timeout 5s node dist/cli.js mcp --config config.json 2>&1 | head -10

echo ""
echo "=== Current Status ==="
echo "✅ Bot message sending: Available"
echo "✅ Document reading: Available"  
echo "❌ Message receiving: Missing im:message permission"
echo "❌ Chat management: Missing im:chat permission"
echo "❌ User info: Missing contact permissions"
echo "❌ Calendar: Missing calendar permissions"
echo ""
echo "To add missing permissions:"
echo "1. Go to: https://open.feishu.cn/app/cli_a8d2fdb1f1f8d02d/dev-config/permission"
echo "2. Add: im:message, im:chat, im:resource, contact:user.base:readonly"
echo "3. Republish the app"