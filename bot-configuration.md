# Bot Configuration Guide for MCP Integration Tool

## Essential Bot Settings

### 1. Enable Bot Feature
After enabling the Bot feature, you'll need to configure the following:

### 2. Required Permissions & Scopes
Navigate to **"Permissions & Scopes"** and add these essential scopes:

#### Core Messaging Scopes (REQUIRED):
- **`im:message`** - Read and send messages in private and group chats
- **`im:message:send_as_bot`** - Send messages as bot
- **`im:chat`** - Access chat information
- **`im:chat:readonly`** - Read chat information
- **`im:resource`** - Access message resources (files, images)

#### User Information Scopes (REQUIRED):
- **`contact:user.base:readonly`** - Read basic user information
- **`contact:user.email:readonly`** - Read user email (if needed)
- **`contact:user.employee_id:readonly`** - Read employee ID (if needed)

#### Additional Scopes (Based on MCP Tool Usage):
- **`calendar:calendar`** - Access calendar data
- **`calendar:calendar:readonly`** - Read calendar information
- **`docs:doc`** - Access documents
- **`drive:drive`** - Access drive files
- **`task:task`** - Manage tasks
- **`sheets:spreadsheet`** - Access spreadsheets
- **`bitable:app`** - Access Bitable

### 3. Event Subscriptions
Go to **"Events & Callbacks"** and subscribe to these events:

#### Essential Events:
- **`im.message.receive_v1`** - Receive messages sent to the bot
- **`im.chat.member.bot.added_v1`** - Bot added to a chat
- **`im.chat.member.bot.deleted_v1`** - Bot removed from a chat

#### Optional Events (based on needs):
- **`im.message.reaction.created_v1`** - Message reactions
- **`im.chat.updated_v1`** - Chat information updates
- **`contact.user.updated_v3`** - User information updates

### 4. Bot Menu Configuration (Recommended)

Enable **Custom bot menu** to provide easy access to MCP features:

#### Suggested Menu Items:
```json
{
  "menu_items": [
    {
      "name": "Help",
      "command": "/help",
      "description": "Show available MCP commands"
    },
    {
      "name": "List Tools",
      "command": "/tools",
      "description": "Show available API tools"
    },
    {
      "name": "Status",
      "command": "/status",
      "description": "Check MCP connection status"
    },
    {
      "name": "Documentation",
      "command": "/docs",
      "description": "Access API documentation"
    }
  ]
}
```

### 5. Bot Commands (Optional)
Add slash commands for direct bot interaction:

- `/mcp help` - Show help information
- `/mcp tools [filter]` - List available tools
- `/mcp status` - Check connection status
- `/mcp exec [tool] [params]` - Execute a specific tool

### 6. Message Card Callback Settings
- **For basic MCP usage**: Not required
- **If using interactive cards**: Select "Card Callback Communication"
- Configure callback URL if implementing interactive features

## Testing Your Bot Configuration

### 1. After saving all settings:
```bash
# Test with messaging tools enabled
node dist/cli.js mcp \
  --app-id "YOUR_APP_ID" \
  --app-secret "YOUR_APP_SECRET" \
  --tools "im" \
  --mode stdio
```

### 2. Test bot functionality:
- Add the bot to a test chat
- Send a message to the bot
- Verify the bot can read and send messages
- Test any configured menu items

### 3. Verify permissions:
Try using different MCP tools to ensure all required permissions are granted:
```javascript
// Example: Send a message
{
  "tool": "im.v1.message.create",
  "params": {
    "receive_id": "oc_xxxxx",
    "msg_type": "text",
    "content": "{\"text\":\"Hello from MCP!\"}"
  }
}
```

## Important Notes

1. **Approval Required**: After configuration, the app needs to be published and approved by your organization administrator
2. **Token Types**: The bot uses tenant access tokens by default, but some APIs may require user access tokens
3. **Rate Limits**: Be aware of Lark's API rate limits when using the bot
4. **Security**: Never expose your App Secret in client-side code or public repositories

## Troubleshooting

### Bot not receiving messages:
- Verify `im.message.receive_v1` event is subscribed
- Check that `im:message` scope is enabled
- Ensure bot is added to the chat

### Permission denied errors:
- Double-check all required scopes are enabled
- Verify the app has been published after adding scopes
- Check if the API requires user token instead of tenant token

### Bot menu not showing:
- Ensure "Custom bot menu" is enabled
- Menu only appears in private chats with the bot
- Try removing and re-adding the bot to refresh