#!/bin/bash

# Lark MCP Tool Runner
# This script runs the MCP tool with your Lark app credentials

# Load environment variables if .env exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Method 1: Run with config file
echo "Starting Lark MCP Tool..."
node dist/cli.js mcp --config config.json

# Alternative methods:

# Method 2: Run with command line arguments
# node dist/cli.js mcp \
#   --app-id "cli_a8d2fdb1f1f8d02d" \
#   --app-secret "V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ" \
#   --mode stdio \
#   --language en

# Method 3: Run with environment variables
# export APP_ID="cli_a8d2fdb1f1f8d02d"
# export APP_SECRET="V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ"
# node dist/cli.js mcp --mode stdio