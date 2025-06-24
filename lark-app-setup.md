# Lark App Setup Guide

## Creating the Custom App

### 1. Basic Information
- **Name**: MCP Integration Tool (or your preferred name)
- **Description**: Enables AI assistants to interact with Lark APIs through Model Context Protocol (MCP). Provides secure access to messaging, calendar, documents, and other Lark services.
- **Icon**: Upload a suitable icon (512x512 px recommended)

### 2. After App Creation

Once your app is created, you'll receive:
- **App ID**: A unique identifier for your app
- **App Secret**: A secret key for authentication (keep this secure!)

### 3. Required Permissions

Based on the MCP tool capabilities, you should enable these permissions:

#### Messaging (IM)
- `im:message` - Send and receive messages
- `im:chat` - Manage chats
- `im:resource` - Access message resources

#### Calendar
- `calendar:calendar` - Access calendars
- `calendar:event` - Manage events
- `calendar:acl` - Manage calendar permissions

#### Documents
- `docs:doc` - Access documents
- `sheets:spreadsheet` - Access spreadsheets
- `drive:drive` - Access drive files

#### User Information
- `contact:user` - Read user information
- `contact:department` - Read department info

#### Other Services
- `task:task` - Manage tasks
- `approval:approval` - Access approvals
- `attendance:attendance` - Access attendance data

### 4. Running the MCP Tool

After creating the app, update your configuration:

```bash
# Using command line
node dist/cli.js mcp \
  --app-id "cli_xxxxxxxxxxxxx" \
  --app-secret "xxxxxxxxxxxxxxxxxxxxxx" \
  --mode stdio

# Or create a config file
{
  "appId": "cli_xxxxxxxxxxxxx",
  "appSecret": "xxxxxxxxxxxxxxxxxxxxxx",
  "language": "en",
  "domain": "https://open.feishu.cn"
}
```

### 5. Testing the Integration

1. Run the MCP server with your credentials
2. Connect it to your AI assistant (Claude, Cursor, etc.)
3. Test basic operations like sending messages or reading calendar events

### 6. Security Notes

- Never commit your App Secret to version control
- Use environment variables for production deployments
- Regularly rotate your App Secret if possible
- Monitor API usage through Lark's developer console