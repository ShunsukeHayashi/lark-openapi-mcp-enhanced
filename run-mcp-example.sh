#!/bin/bash

# Example script to run the Lark MCP tool
# Replace YOUR_APP_ID and YOUR_APP_SECRET with your actual credentials

# Option 1: Run with command line arguments
node dist/cli.js mcp \
  --app-id "YOUR_APP_ID" \
  --app-secret "YOUR_APP_SECRET" \
  --mode stdio \
  --language en \
  --domain "https://open.feishu.cn"

# Option 2: Run with environment variables
# export APP_ID="YOUR_APP_ID"
# export APP_SECRET="YOUR_APP_SECRET"
# node dist/cli.js mcp --mode stdio

# Option 3: Run with config file
# Create a config.json file with your credentials:
# {
#   "appId": "YOUR_APP_ID",
#   "appSecret": "YOUR_APP_SECRET",
#   "language": "en",
#   "domain": "https://open.feishu.cn"
# }
# Then run:
# node dist/cli.js mcp --config config.json --mode stdio