#!/usr/bin/env bash
# create-bases.sh: Create CMS and SFA base applications via Lark MCP CLI

set -e

# Load environment variables if provided
if [ -f "../.env" ]; then
  set -o allexport
  source ../.env
  set +o allexport
fi

cd "$(dirname "$0")"

# Ensure MCP CLI is built
if [ ! -d "dist" ]; then
  echo "🔨 Building Lark MCP CLI..."
  yarn build
fi

echo "🚀 Creating CMS-System and SFA-System bases..."
node dist/cli.js mcp --config config.json --mode stdio << 'END_COMMANDS'
bitable.v1.app.create --name "CMS-System" --description "Content Management System"
bitable.v1.app.create --name "SFA-System" --description "Sales Force Automation System"
END_COMMANDS

echo "✅ Creation commands sent. See above for Base IDs and URLs."