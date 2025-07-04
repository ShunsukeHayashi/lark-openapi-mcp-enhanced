#!/bin/bash

# Script to clean git history and create PR for v0.6.0 release
# This removes large files from git history

set -e

echo "🧹 Cleaning Git History for v0.6.0 Release"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

# Backup current branch
echo -e "${YELLOW}Creating backup of current branch...${NC}"
git branch backup/refactor-architecture-v2-$(date +%Y%m%d-%H%M%S)

# Remove venv directory from entire history
echo -e "${YELLOW}Removing venv/ directory from git history...${NC}"
git filter-branch --force --index-filter \
  'git rm -r --cached --ignore-unmatch venv/' \
  --prune-empty --tag-name-filter cat -- --all

# Remove large release files from history
echo -e "${YELLOW}Removing large release files from git history...${NC}"
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch releases/*.tar.gz releases/*.zip' \
  --prune-empty --tag-name-filter cat -- --all

# Clean up refs
echo -e "${YELLOW}Cleaning up git references...${NC}"
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Show new repository size
echo -e "${GREEN}Repository cleaned! New size:${NC}"
du -sh .git

# Push to remote (force required due to history rewrite)
echo -e "${YELLOW}Pushing cleaned branch to origin...${NC}"
git push -u origin refactor/architecture-v2 --force

echo -e "${GREEN}✓ Git history cleaned successfully!${NC}"

# Create PR using GitHub CLI
echo -e "${YELLOW}Creating Pull Request...${NC}"
gh pr create \
  --title "feat: Release v0.6.0 - Enterprise AI Orchestration Platform" \
  --body-file PR_BODY.md \
  --base main \
  --head refactor/architecture-v2 \
  --assignee @me

echo -e "${GREEN}✓ Pull Request created successfully!${NC}"
echo -e "${YELLOW}Please review and merge the PR at the link above.${NC}"