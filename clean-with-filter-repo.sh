#!/bin/bash

# Clean git history using git filter-repo
# This is the recommended modern approach for removing large files

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         Git History Cleanup with filter-repo              ║"
echo "║              Removing venv/ directory                     ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if git filter-repo is installed
check_filter_repo() {
    if ! command -v git-filter-repo &> /dev/null; then
        echo -e "${YELLOW}git-filter-repo not found. Installing...${NC}"
        
        # Try to install git-filter-repo
        if command -v pip3 &> /dev/null; then
            pip3 install git-filter-repo
        elif command -v brew &> /dev/null; then
            brew install git-filter-repo
        else
            echo -e "${RED}❌ Cannot install git-filter-repo automatically${NC}"
            echo "Please install it manually:"
            echo "  pip3 install git-filter-repo"
            echo "  OR"
            echo "  brew install git-filter-repo"
            exit 1
        fi
    fi
}

# Backup current state
backup_repo() {
    echo -e "${YELLOW}Creating backup...${NC}"
    
    # Create backup directory
    BACKUP_DIR="../lark-mcp-backup-$(date +%Y%m%d-%H%M%S)"
    cp -r . "$BACKUP_DIR"
    
    echo -e "${GREEN}✓ Backup created at: $BACKUP_DIR${NC}"
}

# Clean history with git filter-repo
clean_history() {
    echo -e "${YELLOW}Cleaning git history...${NC}"
    
    # Remove venv directory from all history
    git filter-repo --path venv --invert-paths --force
    
    # Remove any release archives that are too large
    git filter-repo --path-glob 'releases/*.tar.gz' --invert-paths --force
    git filter-repo --path-glob 'releases/*.zip' --invert-paths --force
    
    echo -e "${GREEN}✓ Git history cleaned${NC}"
}

# Show new repository size
show_repo_size() {
    echo -e "${CYAN}New repository size:${NC}"
    du -sh .git
    
    # Show largest files remaining
    echo -e "\n${CYAN}Largest files in history:${NC}"
    git rev-list --objects --all | \
        git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
        sed -n 's/^blob //p' | \
        sort --numeric-sort --key=2 -r | \
        head -10 | \
        cut -d' ' -f1,3- | \
        while read hash size path; do
            echo -e "${size}\t${path}"
        done | \
        numfmt --field=1 --to=iec
}

# Re-add remote and push
push_cleaned_branch() {
    echo -e "\n${YELLOW}Re-adding remote and pushing...${NC}"
    
    # Re-add origin (filter-repo removes remotes for safety)
    git remote add origin https://github.com/ShunsukeHayashi/agi-way-copilot-legacy.git
    
    # Push the cleaned branch
    echo -e "${CYAN}Pushing cleaned branch...${NC}"
    git push -u origin refactor/architecture-v2 --force
    
    echo -e "${GREEN}✓ Branch pushed successfully${NC}"
}

# Create PR
create_pr() {
    echo -e "\n${YELLOW}Creating Pull Request...${NC}"
    
    gh pr create \
        --title "feat: Release v0.6.0 - Enterprise AI Orchestration Platform" \
        --body-file PR_BODY.md \
        --base main \
        --head refactor/architecture-v2 \
        --assignee @me
    
    echo -e "${GREEN}✓ Pull Request created${NC}"
}

# Main execution
main() {
    echo -e "${YELLOW}This will permanently rewrite git history!${NC}"
    echo -e "${YELLOW}A backup will be created first.${NC}"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Aborted${NC}"
        exit 1
    fi
    
    # Execute steps
    check_filter_repo
    backup_repo
    clean_history
    show_repo_size
    push_cleaned_branch
    create_pr
    
    echo -e "\n${GREEN}✅ Git history cleaned and PR created successfully!${NC}"
    echo -e "${CYAN}Your repository is now ready for production deployment.${NC}"
}

# Run main function
main