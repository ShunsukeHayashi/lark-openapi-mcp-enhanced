#!/bin/bash

# Start a specific Lark MCP bundle
# Usage: ./start-bundle.sh <bundle-name>

BUNDLE=$1
BASE_DIR=$(dirname "$0")
PROJECT_ROOT=$(dirname "$BASE_DIR")

if [ -z "$BUNDLE" ]; then
    echo "Usage: ./start-bundle.sh <bundle-name>" >&2
    echo "Available bundles:" >&2
    echo "  - base     : Base and Table operations" >&2
    echo "  - docs     : Document, Wiki, and Drive" >&2
    echo "  - collab   : IM, Calendar, Tasks" >&2
    echo "  - admin    : Admin and HR tools" >&2
    echo "  - genesis  : AI-powered tools" >&2
    exit 1
fi

CONFIG_FILE="$BASE_DIR/$BUNDLE/config.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Bundle '$BUNDLE' not found" >&2
    exit 1
fi

# Check if environment variables are set
if [ -z "$APP_ID" ] || [ -z "$APP_SECRET" ]; then
    echo "Error: Please set APP_ID and APP_SECRET environment variables" >&2
    echo "Example:" >&2
    echo "  export APP_ID=your_app_id" >&2
    echo "  export APP_SECRET=your_app_secret" >&2
    exit 1
fi

# Create temporary config with substituted values
TEMP_CONFIG="/tmp/lark-mcp-$BUNDLE-config.json"
envsubst < "$CONFIG_FILE" > "$TEMP_CONFIG"

# Redirect echo to stderr to avoid interfering with JSON-RPC
echo "Starting Lark MCP bundle: $BUNDLE" >&2
echo "Description: $(jq -r '.description' "$CONFIG_FILE")" >&2

# Start the MCP server
cd "$PROJECT_ROOT"
node dist/cli.js mcp --mode stdio --config "$TEMP_CONFIG"