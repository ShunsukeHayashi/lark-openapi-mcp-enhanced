#!/bin/bash

# Docker build script for Lark OpenAPI MCP
set -e

echo "🐳 Building Lark OpenAPI MCP Docker image..."

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
IMAGE_NAME="lark-mcp"
TAG="${1:-$VERSION}"
TARGET="${2:-production}"

echo "📦 Building image: $IMAGE_NAME:$TAG (target: $TARGET)"

# Validate target
if [[ "$TARGET" != "production" && "$TARGET" != "development" ]]; then
    echo "❌ Error: Invalid target '$TARGET'. Use 'production' or 'development'"
    exit 1
fi

# Build the image
docker build \
  --target "$TARGET" \
  --tag "$IMAGE_NAME:$TAG-$TARGET" \
  --tag "$IMAGE_NAME:latest-$TARGET" \
  --build-arg VERSION="$VERSION" \
  --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
  --build-arg VCS_REF="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" \
  .

# If building production, also tag as latest
if [[ "$TARGET" == "production" ]]; then
    docker tag "$IMAGE_NAME:$TAG-production" "$IMAGE_NAME:$TAG"
    docker tag "$IMAGE_NAME:latest-production" "$IMAGE_NAME:latest"
fi

echo "✅ Build completed successfully!"
echo "🏷️  Tagged as: $IMAGE_NAME:$TAG-$TARGET"
echo "🏷️  Tagged as: $IMAGE_NAME:latest-$TARGET"

if [[ "$TARGET" == "production" ]]; then
    echo "🏷️  Also tagged as: $IMAGE_NAME:$TAG"
    echo "🏷️  Also tagged as: $IMAGE_NAME:latest"
fi

# Show image info
echo ""
echo "📊 Image information:"
docker images "$IMAGE_NAME" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

echo ""
echo "🚀 Run examples:"
echo "  # Production STDIO mode:"
echo "  docker run -it --rm $IMAGE_NAME:$TAG"
echo ""
echo "  # Production SSE mode:"
echo "  docker run -p 3000:3000 -e APP_ID=your_app_id -e APP_SECRET=your_secret $IMAGE_NAME:$TAG node dist/cli.js mcp --mode sse --host 0.0.0.0"
echo ""
echo "  # Development mode:"
echo "  docker run -it --rm -v \$(pwd):/app -p 3000:3000 $IMAGE_NAME:$TAG-development"
echo ""
echo "  # With docker-compose:"
echo "  docker-compose --profile $TARGET up"