#!/bin/bash

# Docker run script for Lark OpenAPI MCP
set -e

# Default values
MODE="stdio"
IMAGE_NAME="lark-mcp:latest"
TARGET="production"
TOOLS="preset.default"
PORT="3000"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --mode)
      MODE="$2"
      shift 2
      ;;
    --image)
      IMAGE_NAME="$2"
      shift 2
      ;;
    --target)
      TARGET="$2"
      shift 2
      ;;
    --tools)
      TOOLS="$2"
      shift 2
      ;;
    --port)
      PORT="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --mode    Transport mode (stdio|sse) [default: stdio]"
      echo "  --image   Docker image name [default: lark-mcp:latest]"
      echo "  --target  Build target (production|development) [default: production]"
      echo "  --tools   Tool preset [default: preset.default]"
      echo "  --port    Port for SSE mode [default: 3000]"
      echo "  --help    Show this help message"
      echo ""
      echo "Environment variables required:"
      echo "  APP_ID      Lark App ID"
      echo "  APP_SECRET  Lark App Secret"
      echo ""
      echo "Examples:"
      echo "  $0 --mode stdio --target production"
      echo "  $0 --mode sse --port 3000 --target development"
      echo "  docker-compose --profile production up lark-mcp-sse"
      echo "  docker-compose --profile development up lark-mcp-sse-dev"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# Validate target
if [[ "$TARGET" != "production" && "$TARGET" != "development" ]]; then
    echo "❌ Error: Invalid target '$TARGET'. Use 'production' or 'development'"
    exit 1
fi

# Set image name based on target
if [[ "$TARGET" == "development" ]]; then
    IMAGE_NAME="${IMAGE_NAME%:latest}-development:latest"
fi

# Check for required environment variables
if [[ -z "$APP_ID" ]] || [[ -z "$APP_SECRET" ]]; then
  echo "❌ Error: APP_ID and APP_SECRET environment variables are required"
  echo "💡 Set them in .env file or export them:"
  echo "   export APP_ID=your_app_id"
  echo "   export APP_SECRET=your_app_secret"
  exit 1
fi

echo "🐳 Running Lark OpenAPI MCP..."
echo "📋 Mode: $MODE"
echo "🏷️  Image: $IMAGE_NAME"
echo "🎯 Target: $TARGET"
echo "🔧 Tools: $TOOLS"

# Set container name based on mode and target
CONTAINER_NAME="lark-mcp-${MODE}-${TARGET}"

if [[ "$MODE" == "sse" ]]; then
  echo "🌐 Port: $PORT"
  echo "🔗 SSE Endpoint: http://localhost:$PORT/sse"
  
  # Development mode with volume mount
  if [[ "$TARGET" == "development" ]]; then
    docker run -it --rm \
      --name "$CONTAINER_NAME" \
      -p "$PORT:3000" \
      -v "$(pwd):/app" \
      -v /app/node_modules \
      -e NODE_ENV=development \
      -e APP_ID="$APP_ID" \
      -e APP_SECRET="$APP_SECRET" \
      -e LARK_DOMAIN="${LARK_DOMAIN:-https://open.feishu.cn}" \
      -e LARK_LANGUAGE="${LARK_LANGUAGE:-en}" \
      -e LARK_TOKEN_MODE="${LARK_TOKEN_MODE:-auto}" \
      "$IMAGE_NAME"
  else
    # Production mode
    docker run -it --rm \
      --name "$CONTAINER_NAME" \
      -p "$PORT:3000" \
      -e NODE_ENV=production \
      -e APP_ID="$APP_ID" \
      -e APP_SECRET="$APP_SECRET" \
      -e LARK_DOMAIN="${LARK_DOMAIN:-https://open.feishu.cn}" \
      -e LARK_LANGUAGE="${LARK_LANGUAGE:-en}" \
      -e LARK_TOKEN_MODE="${LARK_TOKEN_MODE:-auto}" \
      "$IMAGE_NAME" \
      node dist/cli.js mcp --mode sse --host 0.0.0.0 --port 3000 --tools "$TOOLS"
  fi
    
elif [[ "$MODE" == "stdio" ]]; then
  echo "📨 STDIO Mode - Ready for MCP protocol communication"
  
  # Development mode with volume mount
  if [[ "$TARGET" == "development" ]]; then
    docker run -it --rm \
      --name "$CONTAINER_NAME" \
      -v "$(pwd):/app" \
      -v /app/node_modules \
      -e NODE_ENV=development \
      -e APP_ID="$APP_ID" \
      -e APP_SECRET="$APP_SECRET" \
      -e LARK_DOMAIN="${LARK_DOMAIN:-https://open.feishu.cn}" \
      -e LARK_LANGUAGE="${LARK_LANGUAGE:-en}" \
      -e LARK_TOKEN_MODE="${LARK_TOKEN_MODE:-auto}" \
      "$IMAGE_NAME"
  else
    # Production mode
    docker run -it --rm \
      --name "$CONTAINER_NAME" \
      -e NODE_ENV=production \
      -e APP_ID="$APP_ID" \
      -e APP_SECRET="$APP_SECRET" \
      -e LARK_DOMAIN="${LARK_DOMAIN:-https://open.feishu.cn}" \
      -e LARK_LANGUAGE="${LARK_LANGUAGE:-en}" \
      -e LARK_TOKEN_MODE="${LARK_TOKEN_MODE:-auto}" \
      "$IMAGE_NAME" \
      node dist/cli.js mcp --mode stdio --tools "$TOOLS"
  fi
    
else
  echo "❌ Error: Invalid mode '$MODE'. Use 'stdio' or 'sse'"
  exit 1
fi