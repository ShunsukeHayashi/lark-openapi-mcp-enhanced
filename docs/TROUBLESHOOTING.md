# Troubleshooting Guide - Lark OpenAPI MCP Enhanced

This guide helps you diagnose and resolve common issues with the Lark OpenAPI MCP Enhanced tool.

## Quick Diagnostics

### 🔍 Health Check Commands
```bash
# Check Node.js version (must be ≥16.20.0)
node --version

# Verify package installation
npm list -g @larksuiteoapi/lark-mcp

# Test basic connectivity
curl -I https://open.larksuite.com/open-apis/auth/v3/app_access_token/internal

# Test MCP server startup
npx @larksuiteoapi/lark-mcp@0.4.0 mcp --mode stdio --help
```

## Common Issues by Category

### 🔐 Authentication Issues

#### Issue: "Invalid app_id" or "Invalid app_secret"
**Symptoms**:
```
Error: {"code":99991663,"msg":"invalid app_id"}
Error: {"code":99991664,"msg":"invalid app_secret"}
```

**Solutions**:
1. **Verify credentials format**:
   ```bash
   # APP_ID should start with 'cli_'
   echo $APP_ID  # Should output: cli_xxxxxxxxxx
   
   # APP_SECRET should be alphanumeric
   echo $APP_SECRET | wc -c  # Should be ~32 characters
   ```

2. **Check for hidden characters**:
   ```bash
   # Remove any hidden characters
   export APP_ID=$(echo "cli_your_app_id" | tr -d '\r\n\t ')
   export APP_SECRET=$(echo "your_app_secret" | tr -d '\r\n\t ')
   ```

3. **Regenerate credentials**:
   - Go to [Lark Developer Console](https://open.larksuite.com/app)
   - Navigate to your app → Credentials & Basic Info
   - Generate new App Secret

#### Issue: "Access token expired" or "Invalid token"
**Symptoms**:
```
Error: {"code":99991663,"msg":"app access token invalid"}
```

**Solutions**:
1. **Check token refresh**:
   ```bash
   # The tool automatically refreshes tokens, but you can force refresh
   rm -rf ~/.cache/lark-mcp/tokens
   ```

2. **Verify app status**:
   - Ensure app is "Online" in developer console
   - Check if app has been suspended or disabled

### 🌐 Network and Connectivity Issues

#### Issue: Connection timeouts or DNS failures
**Symptoms**:
```
Error: ECONNREFUSED
Error: ENOTFOUND open.larksuite.com
```

**Solutions**:
1. **Test direct connectivity**:
   ```bash
   # Test DNS resolution
   nslookup open.larksuite.com
   
   # Test HTTPS connectivity
   curl -v https://open.larksuite.com
   ```

2. **Configure proxy (if behind corporate firewall)**:
   ```bash
   export HTTP_PROXY=http://proxy.company.com:8080
   export HTTPS_PROXY=http://proxy.company.com:8080
   export NO_PROXY=localhost,127.0.0.1
   ```

3. **Use alternative domain**:
   ```bash
   # For China users
   --domain https://open.feishu.cn
   
   # For international users
   --domain https://open.larksuite.com
   ```

#### Issue: SSL/TLS certificate errors
**Symptoms**:
```
Error: unable to verify the first certificate
Error: self signed certificate in certificate chain
```

**Solutions**:
```bash
# Temporary workaround (not recommended for production)
export NODE_TLS_REJECT_UNAUTHORIZED=0

# Better solution: Update certificates
npm config set ca ""
npm config set registry https://registry.npmjs.org/
```

### 🔧 Configuration Issues

#### Issue: Claude Desktop not loading MCP server
**Symptoms**:
- AI assistant doesn't see Lark tools
- No error messages, tools just don't appear

**Solutions**:
1. **Verify configuration file location**:
   ```bash
   # macOS
   ls -la ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Windows
   dir "%APPDATA%\Claude\claude_desktop_config.json"
   
   # Linux
   ls -la ~/.config/Claude/claude_desktop_config.json
   ```

2. **Validate JSON syntax**:
   ```bash
   # Check for syntax errors
   python -m json.tool < claude_desktop_config.json
   
   # Or use jq
   jq . claude_desktop_config.json
   ```

3. **Test configuration manually**:
   ```bash
   # Extract and test the exact command from config
   node /path/to/dist/cli.js mcp --mode stdio --app-id YOUR_ID --app-secret YOUR_SECRET
   ```

4. **Common config mistakes**:
   ```json
   // ❌ Wrong - missing comma
   {
     "mcpServers": {
       "lark-mcp": {
         "command": "npx"
         "args": ["..."]
       }
     }
   }
   
   // ✅ Correct
   {
     "mcpServers": {
       "lark-mcp": {
         "command": "npx",
         "args": ["..."]
       }
     }
   }
   ```

#### Issue: "lark-all-tools is not activating"
**Symptoms**:
```
Error: Unknown tool preset: *
Error: Invalid tools parameter
```

**Solutions**:
```json
// ❌ Wrong - asterisk is not supported
{
  "args": [
    "mcp",
    "--mode", "stdio",
    "--tools", "*"
  ]
}

// ✅ Correct - omit --tools for all tools
{
  "args": [
    "mcp",
    "--mode", "stdio",
    "--domain", "https://open.larksuite.com"
  ]
}
```

### 🛠️ Build and Installation Issues

#### Issue: TypeScript compilation errors
**Symptoms**:
```
Error: Cannot read properties of undefined (reading 'execute')
Error: Property 'tools' does not exist on type
```

**Solutions**:
1. **Update to latest version**:
   ```bash
   npm uninstall -g @larksuiteoapi/lark-mcp
   npm install -g @larksuiteoapi/lark-mcp@latest
   ```

2. **Clear caches**:
   ```bash
   npm cache clean --force
   yarn cache clean
   rm -rf node_modules package-lock.json yarn.lock
   yarn install
   ```

3. **Rebuild from source**:
   ```bash
   git clone https://github.com/ShunsukeHayashi/lark-openapi-mcp-enhanced.git
   cd lark-openapi-mcp-enhanced
   yarn install
   yarn build
   ```

#### Issue: Permission errors during installation
**Symptoms**:
```
Error: EACCES: permission denied, mkdir '/usr/local/lib/node_modules'
```

**Solutions**:
```bash
# Option 1: Use sudo (not recommended)
sudo npm install -g @larksuiteoapi/lark-mcp

# Option 2: Change npm prefix (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Option 3: Use yarn
yarn global add @larksuiteoapi/lark-mcp

# Option 4: Use npx (no installation needed)
npx @larksuiteoapi/lark-mcp@0.4.0 mcp --help
```

### 📊 Genesis AI System Issues

#### Issue: Genesis tools not creating bases
**Symptoms**:
```
Error: Base creation failed
Error: Template not found
```

**Solutions**:
1. **Check base creation permissions**:
   ```bash
   # Verify your app has bitable:app permission
   # In Lark Admin Console → App → Permission Management
   ```

2. **Test with simulation mode**:
   ```javascript
   // Use simulation first to test templates
   genesis.builtin.create_base({
     baseName: "Test CRM",
     options: {
       useRealAPI: false,
       template: "crm"
     }
   })
   ```

3. **Verify template availability**:
   ```bash
   # List available templates
   npx @larksuiteoapi/lark-mcp@0.4.0 mcp --mode stdio
   # Then call: genesis.builtin.list_templates
   ```

#### Issue: Gemini AI integration errors
**Symptoms**:
```
Error: Gemini API key not provided
Error: AI analysis failed
```

**Solutions**:
1. **Set up Gemini API key** (optional but recommended):
   ```bash
   export GEMINI_API_KEY="your_gemini_api_key"
   ```

2. **Use without AI analysis**:
   ```javascript
   // Skip AI analysis for basic templates
   genesis.builtin.create_base({
     baseName: "Simple Base",
     options: {
       template: "crm",
       skipAIAnalysis: true
     }
   })
   ```

### 🚀 Performance Issues

#### Issue: Rate limiting errors
**Symptoms**:
```
Error: {"code":19001,"msg":"rate limited"}
Error: Too Many Requests (429)
```

**Solutions**:
1. **Enable built-in rate limiting**:
   ```bash
   npx @larksuiteoapi/lark-mcp@0.4.0 mcp --rate-limit-requests 30 --rate-limit-writes 10
   ```

2. **Use lighter tool presets**:
   ```bash
   # Instead of all tools, use specific presets
   --tools preset.light  # 10 tools
   --tools preset.im.default  # 5 tools
   ```

3. **Implement backoff strategy**:
   ```javascript
   // For custom integrations, implement exponential backoff
   const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
   await new Promise(resolve => setTimeout(resolve, delay));
   ```

#### Issue: Memory usage too high
**Symptoms**:
```
Error: JavaScript heap out of memory
Process killed due to memory limit
```

**Solutions**:
1. **Increase Node.js memory limit**:
   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

2. **Enable memory optimization**:
   ```bash
   export ENABLE_PERFORMANCE_METRICS=true
   export MEMORY_CLEANUP_INTERVAL=300000
   ```

3. **Use streaming for large operations**:
   ```bash
   # For large data operations, use batch processing
   --batch-size 100
   ```

## Advanced Diagnostics

### Enable Debug Logging
```bash
# Enable comprehensive debugging
export DEBUG="lark-mcp:*"
export NODE_ENV="development"

# Run with verbose output
npx @larksuiteoapi/lark-mcp@0.4.0 mcp --mode stdio --verbose
```

### Health Check Script
Create a diagnostic script:

```bash
#!/bin/bash
# health-check.sh

echo "🔍 Lark MCP Health Check"
echo "======================="

# Check Node.js version
echo "Node.js version: $(node --version)"

# Check package version
echo "Package version: $(npm list -g @larksuiteoapi/lark-mcp 2>/dev/null | grep @larksuiteoapi/lark-mcp || echo 'Not installed')"

# Check connectivity
echo "Testing connectivity..."
if curl -s --head https://open.larksuite.com >/dev/null; then
    echo "✅ Connectivity OK"
else
    echo "❌ Connectivity FAILED"
fi

# Check environment variables
echo "Environment variables:"
echo "APP_ID: ${APP_ID:0:10}..." 
echo "APP_SECRET: ${APP_SECRET:+SET}" 
echo "NODE_ENV: $NODE_ENV"

# Test MCP server
echo "Testing MCP server startup..."
timeout 10s npx @larksuiteoapi/lark-mcp@0.4.0 mcp --mode stdio --help >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ MCP server OK"
else
    echo "❌ MCP server FAILED"
fi
```

### Log Analysis
Check common log patterns:

```bash
# Filter for authentication errors
grep -i "invalid.*token\|auth.*fail" ~/.npm/_logs/*.log

# Filter for network errors
grep -i "econnrefused\|timeout\|dns" ~/.npm/_logs/*.log

# Filter for permission errors
grep -i "permission\|eacces\|forbidden" ~/.npm/_logs/*.log
```

## Platform-Specific Issues

### macOS Issues
```bash
# Fix permission issues
sudo chown -R $(whoami) ~/.npm

# Update Xcode command line tools
xcode-select --install

# Fix path issues
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Windows Issues
```cmd
# Fix PowerShell execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Fix encoding issues
chcp 65001

# Update npm
npm install -g npm@latest
```

### Linux Issues
```bash
# Install build tools
sudo apt-get install build-essential

# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
```

## When All Else Fails

### Complete Reset
```bash
# 1. Uninstall completely
npm uninstall -g @larksuiteoapi/lark-mcp
rm -rf ~/.npm/_cache
rm -rf ~/.cache/lark-mcp

# 2. Clear all configs
# Backup your config first!
mv claude_desktop_config.json claude_desktop_config.json.bak

# 3. Reinstall fresh
npm install -g @larksuiteoapi/lark-mcp@latest

# 4. Test with minimal config
export APP_ID="cli_your_app_id"
export APP_SECRET="your_app_secret"
npx @larksuiteoapi/lark-mcp@0.4.0 mcp --mode stdio
```

### Get Help
1. **Check existing issues**: [GitHub Issues](https://github.com/ShunsukeHayashi/lark-openapi-mcp-enhanced/issues)
2. **Create new issue** with:
   - Output of health check script
   - Full error messages
   - Configuration (with secrets redacted)
   - Environment details (OS, Node.js version, etc.)

### Emergency Workarounds
```bash
# Use simulation mode
--simulation-mode

# Use SSE mode instead of stdio
--mode sse --port 3000

# Use lighter tool preset
--tools preset.light

# Disable rate limiting (dev only)
--disable-rate-limit
```

Remember: Most issues are configuration-related. Double-check your setup before diving into complex debugging!