# Lark App Feature Configuration Guide

## Essential Features for MCP Integration Tool

### 1. Bot Feature (REQUIRED) ✅

Enable the **Bot** feature for core MCP functionality.

#### Bot Configuration Steps:

1. **Enable Bot Feature**
   - Click on "Bot" to enable it
   - This allows the MCP tool to interact with Lark's messaging system

2. **Configure Bot Events** (In Development Configuration)
   - Message events:
     - `im.message.receive_v1` - Receive messages
     - `im.chat.member.bot.added_v1` - Bot added to chat
     - `im.chat.member.bot.deleted_v1` - Bot removed from chat
   
3. **Set Bot Permissions**
   - `im:message` - Send and receive messages
   - `im:chat` - Access chat information
   - `im:resource` - Access message resources
   - `contact:user` - Read user information

4. **Bot Commands** (Optional)
   - Add slash commands if you want users to interact with the bot directly
   - Example: `/mcp help`, `/mcp status`

### 2. Optional Features

#### Web App (Optional)
Enable only if you plan to:
- Create a configuration dashboard
- Build a monitoring interface
- Provide a web-based tool management UI

#### Docs Add-on (Optional)
Enable if you want to:
- Add custom actions to Lark Docs
- Integrate document processing workflows
- Provide quick actions within documents

#### Base Extensions (Optional)
Enable if you need to:
- Automate Bitable workflows
- Create custom views for data
- Integrate with Lark's database features

## After Enabling Features

### Next Steps in Development Configuration:

1. **Events & Callbacks**
   - Configure event subscription URL (if using bot events)
   - Set up webhook endpoints for real-time updates

2. **Permissions & Scopes**
   Navigate to "Permissions & Scopes" and enable:
   
   **Core Permissions:**
   - `app:bot` - Bot capabilities
   - `im:message` - Messaging
   - `im:chat` - Chat management
   - `contact:user` - User information
   
   **Additional Permissions (based on your needs):**
   - `calendar:calendar` - Calendar access
   - `docs:doc` - Document access
   - `drive:drive` - Drive file access
   - `task:task` - Task management
   - `sheets:spreadsheet` - Spreadsheet access

3. **OAuth Configuration** (if using user tokens)
   - Add redirect URLs
   - Configure OAuth scopes

## Testing Your Configuration

1. **Get Credentials**
   ```bash
   # Your app credentials will be available in Basic Info
   APP_ID=cli_xxxxxxxxxxxxx
   APP_SECRET=xxxxxxxxxxxxxxxxxxxxxx
   ```

2. **Test Bot Functionality**
   ```bash
   # Run MCP with bot-enabled app
   node dist/cli.js mcp \
     --app-id "$APP_ID" \
     --app-secret "$APP_SECRET" \
     --tools "im" \
     --mode stdio
   ```

3. **Verify Permissions**
   - Try sending a message using the MCP tool
   - Test accessing different APIs based on enabled permissions

## Important Notes

- Start with minimal features (just Bot) and add more as needed
- Each feature may require additional configuration in the Development Configuration section
- Monitor API usage and errors in the Operations & Monitoring section
- Remember to publish your app after configuration for changes to take effect