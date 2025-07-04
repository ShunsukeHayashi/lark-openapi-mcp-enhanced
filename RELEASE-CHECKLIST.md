# Release Checklist for Lark MCP Tool v0.4.0

## Pre-Release Tasks

### 1. Code Preparation
- [x] All TypeScript compilation errors fixed
- [x] All tests passing
- [x] Genesis templates implemented and tested
- [x] Complete function tools integrated
- [x] MCP prompts and resources updated
- [ ] Version bump in package.json (0.3.1 → 0.4.0)
- [ ] Update CHANGELOG.md

### 2. Documentation
- [x] README updated with Genesis features
- [x] Genesis templates documentation created
- [x] Tool list documentation updated
- [ ] API documentation for new features
- [ ] Migration guide from v0.3.x to v0.4.0

### 3. Testing
- [x] Unit tests for Genesis tools
- [x] Integration tests for MCP server
- [ ] Manual testing with Claude Desktop
- [ ] Test all template creations
- [ ] Test Docker builds

### 4. Build Verification
```bash
# Clean build
rm -rf dist/
yarn build

# Test CLI
node dist/cli.js mcp --help

# Test with npx
npx . mcp --mode stdio --tools preset.genesis.default
```

## Release Process

### 1. Version Update
```bash
# Update version in package.json
# Current: 0.3.1 → New: 0.4.0
```

### 2. Changelog
Add to CHANGELOG.md:
```markdown
## [0.4.0] - 2024-01-XX

### Added
- Genesis AI System for creating Lark Base applications
- Pre-built templates: CRM, Project Management, HR Management
- Additional templates: Inventory, Event Planning, Bug Tracking
- Template listing and management tools
- Complete function tools covering all Lark APIs
- New MCP prompts for Genesis workflows
- Template resources and examples

### Enhanced
- Tool organization with new presets
- Documentation with Genesis guides
- Error handling and recovery
- TypeScript type safety

### Fixed
- Constructor pattern in specialist agents
- MCP server return types
- Resource registration
```

### 3. Git Tag
```bash
git add .
git commit -m "Release v0.4.0: Genesis AI System and Templates"
git tag -a v0.4.0 -m "Release version 0.4.0 with Genesis AI System"
git push origin main
git push origin v0.4.0
```

### 4. NPM Publish
```bash
# Login to npm
npm login

# Publish with public access
npm publish --access public

# Verify publication
npm view @larksuiteoapi/lark-mcp
```

### 5. GitHub Release
Create release on GitHub with:
- Tag: v0.4.0
- Title: "v0.4.0: Genesis AI System and Templates"
- Description: Copy from CHANGELOG.md
- Attach:
  - Source code (zip)
  - Source code (tar.gz)

## Post-Release Tasks

### 1. Announcements
- [ ] Update project README on GitHub
- [ ] Post on relevant forums/communities
- [ ] Update documentation site
- [ ] Notify existing users

### 2. Docker Images
```bash
# Build and tag Docker images
docker build -t larksuite/lark-mcp:0.4.0 .
docker tag larksuite/lark-mcp:0.4.0 larksuite/lark-mcp:latest

# Push to registry
docker push larksuite/lark-mcp:0.4.0
docker push larksuite/lark-mcp:latest
```

### 3. Verification
- [ ] Install from npm: `npm install -g @larksuiteoapi/lark-mcp@0.4.0`
- [ ] Test with Claude Desktop
- [ ] Verify Genesis templates work
- [ ] Check documentation links

### 4. Monitor
- [ ] Watch for issues on GitHub
- [ ] Monitor npm download stats
- [ ] Check for user feedback
- [ ] Plan hotfix if needed

## Feature Highlights for v0.4.0

### 🎯 Genesis AI System
- Create complete Lark Base applications from natural language
- 6 pre-built templates for common business scenarios
- AI-powered requirements analysis and optimization

### 📊 Templates Included
1. **CRM**: Sales pipeline, contacts, opportunities
2. **Project Management**: Tasks, milestones, time tracking
3. **HR Management**: Employees, leave, performance reviews
4. **Inventory Management**: Stock control, suppliers
5. **Event Planning**: Events, venues, attendees
6. **Bug Tracking**: Issues, features, releases

### 🛠️ Enhanced Tools
- 50+ complete function tools
- New tool presets for different use cases
- Improved error handling and recovery

### 📚 Better Documentation
- Comprehensive Genesis guide
- Template customization examples
- Integration tutorials

## Notes
- This is a major feature release
- Backward compatibility maintained
- No breaking changes in existing APIs
- Genesis features are opt-in via tool presets