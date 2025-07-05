# Discord-Lark Integration Guide

This guide covers setting up and using the Discord-Lark integration for member management, real-time notifications, and CRM functionality.

## 📋 Table of Contents
- [Overview](#overview)
- [Setup Requirements](#setup-requirements)
- [Environment Configuration](#environment-configuration)
- [Integration Features](#integration-features)
- [Setup Instructions](#setup-instructions)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

## Overview

This integration provides a comprehensive bridge between Discord communities and Lark workspace collaboration, enabling:
- Real-time message synchronization
- Member management across platforms
- Automated notifications and alerts
- Command bot functionality
- Webhook integration
- Analytics and reporting

## Setup Requirements

### Discord Requirements
- Discord Bot Token (from Discord Developer Portal)
- Server Admin permissions
- Required OAuth2 scopes:
  - `bot`
  - `applications.commands`
- Required Bot Permissions:
  - Send Messages
  - Read Message History
  - Use Slash Commands
  - Embed Links
  - Manage Webhooks
  - View Channels

### Lark Requirements
- Lark/Feishu App credentials (App ID and App Secret)
- Required permissions:
  - `im:message` - Send messages
  - `im:chat` - Manage chats
  - `contact:user.base:readonly` - Read user information
  - `bitable:app` - For CRM features

### System Requirements
- Node.js >= 16.20.0
- `discord.js` ^14.16.3 (included in dependencies)
- Stable internet connection
- SSL certificate for webhook endpoints (production)

## Environment Configuration

Create a `.env` file with the following variables:

```bash
# Discord Configuration
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_GUILD_ID=your_discord_server_id_here
DISCORD_WEBHOOK_URL=your_discord_webhook_url_here
DISCORD_CLIENT_ID=your_discord_application_id_here

# Lark Configuration
APP_ID=your_lark_app_id_here
APP_SECRET=your_lark_app_secret_here
LARK_WEBHOOK_URL=your_lark_webhook_url_here

# Integration Settings
SYNC_INTERVAL=60000  # Message sync interval in ms
MESSAGE_QUEUE_SIZE=100  # Max messages in queue
ENABLE_MEMBER_SYNC=true
ENABLE_MESSAGE_SYNC=true
ENABLE_NOTIFICATIONS=true

# Database (Optional)
DATABASE_URL=your_database_connection_string
```

## Integration Features

### 1. Message Bridge
- **Discord → Lark**: Forward Discord messages to Lark chats
- **Lark → Discord**: Send Lark messages to Discord channels
- **Message Formatting**: Automatic conversion between platforms
- **Attachment Support**: Images, files, and embeds
- **Thread Support**: Maintain conversation context

### 2. Member Management
- **Sync Discord roles with Lark groups**
- **Automated member onboarding**
- **Permission mapping between platforms**
- **Activity tracking and analytics**

### 3. Notification System
- **Lark Base updates → Discord channels**
- **Calendar events → Discord reminders**
- **Task assignments → Discord notifications**
- **Custom alerts and triggers**

### 4. Command Bot
- **Slash commands for both platforms**
- **Query Lark data from Discord**
- **Execute Lark actions from Discord**
- **Interactive buttons and menus**

### 5. Webhook Integration
- **Real-time event streaming**
- **Bidirectional webhooks**
- **Event filtering and routing**
- **Error handling and retry logic**

## Setup Instructions

### Step 1: Discord Bot Setup

1. Visit [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the bot token
5. Configure bot permissions and intents
6. Generate OAuth2 URL and invite bot to server

### Step 2: Lark App Setup

1. Visit [Feishu Open Platform](https://open.feishu.cn/)
2. Create or select your app
3. Configure required permissions
4. Copy App ID and App Secret
5. Set up event subscriptions if needed

### Step 3: Initialize Integration

```typescript
import { DiscordLarkBridge } from './src/integrations/discord';

const bridge = new DiscordLarkBridge({
  discord: {
    token: process.env.DISCORD_BOT_TOKEN!,
    guildId: process.env.DISCORD_GUILD_ID!,
  },
  lark: {
    appId: process.env.APP_ID!,
    appSecret: process.env.APP_SECRET!,
  },
  features: {
    messageSync: true,
    memberSync: true,
    notifications: true,
    commands: true,
  }
});

await bridge.initialize();
```

## Usage Examples

### Basic Message Forwarding

```typescript
// Forward Discord message to Lark
bridge.on('discord:message', async (message) => {
  await bridge.forwardToLark(message, {
    chatId: 'oc_xxxxx',
    format: 'rich',
    includeAuthor: true,
  });
});

// Forward Lark message to Discord
bridge.on('lark:message', async (message) => {
  await bridge.forwardToDiscord(message, {
    channelId: '123456789',
    format: 'embed',
    includeReactions: true,
  });
});
```

### Slash Commands

```typescript
// Discord slash command
bridge.registerDiscordCommand({
  name: 'lark-search',
  description: 'Search Lark Base records',
  options: [
    {
      name: 'query',
      type: 'STRING',
      description: 'Search query',
      required: true,
    }
  ],
  execute: async (interaction) => {
    const query = interaction.options.getString('query');
    const results = await bridge.searchLarkBase(query);
    await interaction.reply({ embeds: [formatResults(results)] });
  }
});

// Lark command
bridge.registerLarkCommand({
  command: '/discord-info',
  description: 'Get Discord server information',
  execute: async (context) => {
    const info = await bridge.getDiscordServerInfo();
    await context.reply(formatServerInfo(info));
  }
});
```

### Member Synchronization

```typescript
// Sync Discord role to Lark group
await bridge.syncRole({
  discordRoleId: '987654321',
  larkGroupId: 'og_xxxxx',
  syncPermissions: true,
  autoUpdate: true,
});

// Bulk member sync
await bridge.syncAllMembers({
  direction: 'discord-to-lark',
  createMissing: true,
  updateExisting: true,
});
```

### Webhooks

```typescript
// Setup Discord webhook handler
bridge.setupDiscordWebhook('/webhook/discord', {
  verify: true,
  events: ['MESSAGE_CREATE', 'MEMBER_JOIN', 'MEMBER_LEAVE'],
  handler: async (event) => {
    await bridge.processDiscordEvent(event);
  }
});

// Setup Lark webhook handler
bridge.setupLarkWebhook('/webhook/lark', {
  verify: true,
  encryptKey: process.env.LARK_ENCRYPT_KEY,
  handler: async (event) => {
    await bridge.processLarkEvent(event);
  }
});
```

## API Reference

### DiscordLarkBridge Class

#### Constructor Options
```typescript
interface BridgeOptions {
  discord: {
    token: string;
    guildId: string;
    intents?: GatewayIntentBits[];
  };
  lark: {
    appId: string;
    appSecret: string;
    domain?: string;
  };
  features?: {
    messageSync?: boolean;
    memberSync?: boolean;
    notifications?: boolean;
    commands?: boolean;
  };
  database?: {
    url: string;
    poolSize?: number;
  };
}
```

#### Core Methods

- `initialize(): Promise<void>` - Initialize the bridge
- `forwardToLark(message: DiscordMessage, options?: ForwardOptions): Promise<void>`
- `forwardToDiscord(message: LarkMessage, options?: ForwardOptions): Promise<void>`
- `syncRole(options: RoleSyncOptions): Promise<void>`
- `syncAllMembers(options: MemberSyncOptions): Promise<void>`
- `registerDiscordCommand(command: SlashCommand): void`
- `registerLarkCommand(command: LarkCommand): void`
- `setupDiscordWebhook(path: string, options: WebhookOptions): void`
- `setupLarkWebhook(path: string, options: WebhookOptions): void`

#### Events

- `discord:message` - Discord message received
- `lark:message` - Lark message received
- `member:join` - Member joined (either platform)
- `member:leave` - Member left (either platform)
- `sync:complete` - Synchronization completed
- `error` - Error occurred

## Troubleshooting

### Common Issues

1. **Bot Not Responding**
   - Verify bot token is correct
   - Check bot is online in Discord
   - Ensure proper intents are configured
   - Check bot has necessary permissions

2. **Message Not Syncing**
   - Verify webhook URLs are correct
   - Check network connectivity
   - Ensure proper channel/chat IDs
   - Review permission settings

3. **Permission Errors**
   - Discord: Verify bot role is above member roles
   - Lark: Check app has required scopes
   - Ensure webhook endpoints are accessible

4. **Rate Limiting**
   - Implement exponential backoff
   - Use message queuing
   - Monitor API usage
   - Cache frequently accessed data

### Debug Mode

Enable debug logging:

```typescript
const bridge = new DiscordLarkBridge({
  // ... other options
  debug: true,
  logLevel: 'verbose',
});

// Or set environment variable
process.env.DEBUG = 'discord-lark:*';
```

### Health Check

```typescript
// Check bridge health
const health = await bridge.healthCheck();
console.log('Discord connected:', health.discord.connected);
console.log('Lark connected:', health.lark.connected);
console.log('Database connected:', health.database.connected);
console.log('Queue size:', health.queue.size);
```

## Security Best Practices

### Token Security
- Store tokens in environment variables
- Never commit tokens to version control
- Use `.env.example` for documentation
- Rotate tokens regularly
- Implement token encryption at rest

### Webhook Security
- Validate webhook signatures
- Use HTTPS endpoints only
- Implement IP whitelisting
- Add request timestamps
- Limit payload sizes

### Data Protection
- Encrypt sensitive data in transit
- Implement proper access controls
- Log security events
- Regular security audits
- GDPR compliance for EU users

### Rate Limiting
- Implement per-user rate limits
- Use distributed rate limiting for scaling
- Cache API responses when possible
- Monitor API usage
- Implement circuit breakers

### Error Handling
- Never expose internal errors to users
- Log errors with context
- Implement proper error recovery
- Use error boundaries
- Monitor error rates

## Best Practices

### Performance
- Use connection pooling
- Implement caching strategies
- Batch API requests
- Optimize database queries
- Monitor resource usage

### Scalability
- Design for horizontal scaling
- Use message queuing
- Implement load balancing
- Database sharding if needed
- Monitor performance metrics

### Maintenance
- Regular dependency updates
- Automated testing
- Continuous integration
- Documentation updates
- Monitor API changes

### User Experience
- Provide clear error messages
- Implement proper loading states
- Add retry mechanisms
- Graceful degradation
- User feedback collection

## Compliance

### Discord Terms of Service
- Respect rate limits
- No spam or abuse
- User privacy protection
- Proper bot identification
- Follow community guidelines

### Lark/Feishu Compliance
- API usage guidelines
- Data retention policies
- User consent for data processing
- Proper app permissions
- Security requirements

### Data Privacy
- Respect Discord Terms of Service
- Handle member data according to privacy laws
- Implement data retention policies
- Secure data transmission

This integration provides a comprehensive bridge between Discord communities and Lark workspace collaboration! 🚀