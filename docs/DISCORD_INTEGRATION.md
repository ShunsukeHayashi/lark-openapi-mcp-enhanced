# Discord Integration Guide

## Overview

This document provides guidance for integrating Discord functionality with the Lark OpenAPI MCP project.

## Prerequisites

- Node.js >= 16.20.0
- Discord Bot Token (from Discord Developer Portal)
- Lark/Feishu App credentials

## Installation

The `discord.js` dependency is already included in the project:

```bash
yarn install
```

## Configuration

### 1. Discord Bot Setup

1. Visit [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the bot token

### 2. Environment Variables

Add to your `.env` file:

```bash
# Discord Configuration
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_GUILD_ID=your_discord_server_id_here
```

### 3. Bot Permissions

Ensure your Discord bot has the following permissions:
- Send Messages
- Read Message History
- Use Slash Commands
- Embed Links

## Basic Usage

### Creating a Discord Client

```typescript
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`Discord bot logged in as ${client.user?.tag}`);
});

client.login(process.env.DISCORD_BOT_TOKEN);
```

### Integration with Lark MCP

```typescript
import { LarkMcpTool } from '../src/mcp-tool/mcp-tool';
import { Client } from 'discord.js';

class DiscordLarkBridge {
  private discordClient: Client;
  private larkClient: LarkMcpTool;

  constructor() {
    this.discordClient = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
    });
    
    this.larkClient = new LarkMcpTool({
      appId: process.env.APP_ID!,
      appSecret: process.env.APP_SECRET!
    });
  }

  async initialize() {
    await this.discordClient.login(process.env.DISCORD_BOT_TOKEN);
    
    this.discordClient.on('messageCreate', async (message) => {
      if (message.author.bot) return;
      
      // Forward Discord messages to Lark
      await this.forwardToLark(message);
    });
  }

  private async forwardToLark(message: any) {
    // Implementation depends on your specific use case
    // Example: Send to Lark chat
    const result = await this.larkClient.executeTool({
      name: 'im.v1.message.create',
      arguments: {
        data: {
          receive_id: 'your_lark_chat_id',
          content: JSON.stringify({
            text: `Discord message from ${message.author.username}: ${message.content}`
          }),
          msg_type: 'text'
        }
      }
    });
  }
}
```

## Common Use Cases

### 1. Discord to Lark Message Bridge

Forward Discord messages to Lark chats for team communication.

### 2. Lark Notifications to Discord

Send Lark Base updates or calendar events to Discord channels.

### 3. Command Bot

Create Discord slash commands that interact with Lark APIs.

### 4. Webhook Integration

Set up webhooks to sync data between Discord and Lark in real-time.

## Best Practices

1. **Error Handling**: Always implement proper error handling for both Discord and Lark API calls
2. **Rate Limiting**: Respect both Discord and Lark API rate limits
3. **Security**: Store bot tokens securely and never commit them to version control
4. **Logging**: Implement comprehensive logging for debugging and monitoring
5. **User Privacy**: Ensure compliance with both Discord and Lark privacy policies

## Troubleshooting

### Common Issues

1. **Bot Not Responding**: Check if bot token is correct and bot is online
2. **Permission Errors**: Verify bot has required permissions in Discord server
3. **API Errors**: Check Lark API credentials and permissions
4. **Rate Limiting**: Implement proper rate limiting to avoid API quota exhaustion

### Debug Mode

Enable debug logging for discord.js:

```typescript
const client = new Client({
  intents: [...],
  // Enable debug mode
  debug: true
});
```

## Security Considerations

- Never expose bot tokens in client-side code
- Use environment variables for sensitive configuration
- Implement proper authentication for webhook endpoints
- Validate all incoming data from Discord before processing
- Follow Discord's Terms of Service and Community Guidelines

## Further Reading

- [Discord.js Documentation](https://discord.js.org/#/docs/discord.js/stable/general/welcome)
- [Discord Developer Portal](https://discord.com/developers/docs)
- [Lark OpenAPI Documentation](https://open.larksuite.com/document/)