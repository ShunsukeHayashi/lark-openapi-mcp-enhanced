# Lark Base Integration Guide

## Your Base Information

**Base URL**: https://dp8rycu1269.jp.larksuite.com/base/BWjWbMakPa6yrVs8sGdjaPZgpNc
**Base ID**: `BWjWbMakPa6yrVs8sGdjaPZgpNc`
**Domain**: `dp8rycu1269.jp.larksuite.com`

## Base Integration with MCP Tool

### 1. Required Permissions for Base Access

To interact with this Base through the MCP tool, you need to add Base-related permissions:

#### Essential Base Permissions:
```
bitable:app:readonly           # Read Base apps
bitable:app                    # Manage Base apps (if you need write access)
bitable:record:readonly        # Read records
bitable:record                 # Manage records (if you need write access)
bitable:table:readonly         # Read tables
bitable:table                  # Manage tables (if you need write access)
```

### 2. Add Base Permissions to Your App

1. **Go to Developer Console:**
   ```
   https://open.feishu.cn/app/cli_a8d2e0082978902e/dev-config/permission
   ```

2. **Add Base Permissions:**
   Search for "bitable" and add the permissions above

3. **Republish the App** after adding permissions

### 3. MCP Tool Commands for Base

Once permissions are added, you can use these MCP tools:

#### Read Base Information:
```javascript
// Get Base app info
{
  "tool": "bitable.v1.app.get",
  "params": {
    "app_token": "BWjWbMakPa6yrVs8sGdjaPZgpNc"
  }
}
```

#### List Tables in Base:
```javascript
{
  "tool": "bitable.v1.table.list", 
  "params": {
    "app_token": "BWjWbMakPa6yrVs8sGdjaPZgpNc"
  }
}
```

#### Read Records from a Table:
```javascript
{
  "tool": "bitable.v1.record.list",
  "params": {
    "app_token": "BWjWbMakPa6yrVs8sGdjaPZgpNc",
    "table_id": "your_table_id"
  }
}
```

### 4. Updated Permission Set

Your **recommended permission set** should now include:

```
im:message
im:message:send_as_bot
im:chat
im:chat:readonly
im:resource
contact:user.base:readonly
contact:contact:readonly
bitable:app:readonly
bitable:record:readonly
bitable:table:readonly
```

For **full Base functionality** (read/write):
```
bitable:app
bitable:record
bitable:table
bitable:field:readonly
```

### 5. Testing Base Integration

After adding permissions and republishing:

```bash
# Test with Base tools enabled
node dist/cli.js mcp --config config.json --tools "bitable"

# Test mixed tools
node dist/cli.js mcp --config config.json --tools "im,docs,bitable"
```

### 6. Common Base Use Cases with MCP

#### Scenario 1: AI Data Analysis
- AI reads Base data
- Processes and summarizes information
- Reports back via messages

#### Scenario 2: Automated Data Entry
- AI receives input via chat
- Validates and formats data
- Adds records to Base

#### Scenario 3: Base Monitoring
- AI monitors Base for changes
- Sends notifications for important updates
- Generates reports

### 7. Base API Documentation

Check these APIs in Lark documentation for "Try it out" buttons:
- **bitable.v1.app.get** - Get Base app info
- **bitable.v1.table.list** - List tables
- **bitable.v1.record.list** - List records
- **bitable.v1.record.create** - Create records
- **bitable.v1.record.update** - Update records

### 8. Domain Configuration

Note: Your Base is on `dp8rycu1269.jp.larksuite.com` (Japan domain).
Make sure your MCP configuration matches:

```json
{
  "appId": "cli_a8d2e0082978902e",
  "appSecret": "SQkCdptYmzrNa3MIfwmN2f7V5BXR2Ghz",
  "language": "en",
  "domain": "https://open.feishu.cn",  // This should work for API calls
  "tokenMode": "auto",
  "mode": "stdio"
}
```

### 9. Next Steps

1. **Add Base permissions** to your app
2. **Republish** the app
3. **Test Base connectivity** with MCP tool
4. **Try reading** your Base data
5. **Implement** specific use cases

The Base integration will enable powerful AI-driven data management scenarios!