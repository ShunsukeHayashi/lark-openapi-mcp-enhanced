#!/bin/bash

# Release script for Lark MCP Tool
# Usage: ./scripts/release.sh

set -e

echo "🚀 Lark MCP Tool Release Script"
echo "==============================="

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Error: You must be on the main branch to release"
    echo "Current branch: $CURRENT_BRANCH"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: You have uncommitted changes"
    git status --short
    exit 1
fi

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
echo "📦 Version: $VERSION"

# Confirm release
echo ""
echo "This will:"
echo "1. Build the project"
echo "2. Create git tag v$VERSION"
echo "3. Push to GitHub"
echo "4. Publish to npm"
echo ""
read -p "Continue with release v$VERSION? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Release cancelled"
    exit 1
fi

# Clean and build
echo ""
echo "🔨 Building project..."
rm -rf dist/
yarn build

# Run tests
echo ""
echo "🧪 Running tests..."
yarn test

# Create git tag
echo ""
echo "🏷️  Creating git tag..."
git tag -a "v$VERSION" -m "Release version $VERSION"

# Push to GitHub
echo ""
echo "📤 Pushing to GitHub..."
git push origin main
git push origin "v$VERSION"

# Publish to npm
echo ""
echo "📦 Publishing to npm..."
npm publish --access public

# Success
echo ""
echo "✅ Release v$VERSION completed successfully!"
echo ""
echo "Next steps:"
echo "1. Create GitHub release at: https://github.com/larksuite/lark-openapi-mcp/releases/new"
echo "2. Update documentation if needed"
echo "3. Announce the release"
echo ""
echo "NPM package: https://www.npmjs.com/package/@larksuiteoapi/lark-mcp"
echo "Git tag: v$VERSION"