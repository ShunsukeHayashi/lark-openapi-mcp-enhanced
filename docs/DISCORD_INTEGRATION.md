# Discord-Lark Integration Guide

This guide covers setting up and using the Discord-Lark integration for member management, real-time notifications, and CRM functionality.

## 📋 Table of Contents
- [Overview](#overview)
- [Setup Requirements](#setup-requirements)
- [Environment Configuration](#environment-configuration)
- [Installation](#installation)
- [Available Commands](#available-commands)
- [Integration Features](#integration-features)
- [Troubleshooting](#troubleshooting)

## 🔎 Overview

The Discord-Lark integration provides:
- **Member Synchronization**: Sync Discord server members with Lark Base for CRM
- **Real-time Notifications**: Forward Discord events to Lark chats
- **Webhook Server**: Handle Discord events via webhooks
- **Bot Commands**: Interactive Discord bot with Lark integration
- **Development Tools**: Complete development environment for testing

## 🔧 Setup Requirements

### Discord Requirements
1. **Discord Bot**: Create a bot application in Discord Developer Portal
2. **Bot Permissions**: 
   - View Channels
   - Send Messages
   - Read Message History
   - View Server Members
3. **Server Access**: Bot must be invited to your Discord server

### Lark Requirements
1. **Lark App**: Create an app in Lark Developer Console
2. **Permissions**:
   - `im:message` - Send notifications
   - `bitable:app` - Access Lark Base for CRM
   - `contact:user.base:readonly` - Read user information
3. **Base Setup** (Optional): Create a Lark Base for Discord member CRM

## ⚙️ Environment Configuration

Create a `.env` file with the following variables:

```bash
# Lark Configuration
APP_ID=cli_your_app_id
APP_SECRET=your_app_secret
LARK_DOMAIN=https://open.larksuite.com

# Discord Configuration  
DISCORD_TOKEN=your_discord_bot_token
DISCORD_GUILD_ID=your_discord_server_id
DISCORD_WEBHOOK_SECRET=optional_webhook_secret

# Integration Settings
LARK_NOTIFICATION_CHAT_ID=oc_your_chat_id
LARK_CRM_BASE_TOKEN=your_base_token
LARK_CRM_TABLE_ID=your_table_id
DISCORD_WEBHOOK_PORT=3002
```

### Getting Discord Credentials

1. **Create Discord Application**:
   - Go to https://discord.com/developers/applications
   - Click "New Application"
   - Go to "Bot" section
   - Copy the token

2. **Get Guild ID**:
   - Enable Developer Mode in Discord
   - Right-click your server → "Copy ID"

3. **Invite Bot to Server**:
   - Go to OAuth2 → URL Generator
   - Select "bot" scope
   - Select required permissions
   - Use generated URL to invite bot

## 📦 Installation

```bash
# Install Discord integration dependencies
yarn install

# Verify discord.js is installed
yarn list discord.js
```

## 🚀 Available Commands

### Setup Commands

```bash
# Setup Discord integration
yarn discord:setup

# Sync Discord members with Lark Base
yarn discord:sync

# Start webhook server for Discord events
yarn discord:webhook

# Start development server (bot + webhook)
yarn discord:dev
```

### Bot Commands (in Discord)

```
!lark ping       # Test connection
!lark status     # Show server status
!lark sync       # Trigger member sync
```

## 🔗 Integration Features

### 1. Member Synchronization

Syncs Discord server members to Lark Base with the following data:
- Discord ID and username
- Display name and avatar
- Join date and roles
- Status and activity
- Regular sync timestamps

```bash
# Run manual sync
yarn discord:sync
```

**Lark Base Schema**:
- Discord ID (text)
- Username (text) 
- Display Name (text)
- Avatar URL (text)
- Joined At (datetime)
- Roles (text)
- Status (text)
- Created At (datetime)
- Last Sync (datetime)

### 2. Real-time Notifications

Forwards Discord events to Lark chat:
- New messages in monitored channels
- Member joins/leaves
- New channel creation
- Custom events via webhooks

### 3. Webhook Server

HTTP server that receives Discord webhooks and processes events:
- **Endpoint**: `http://your-server:3002/webhook/discord`
- **Authentication**: Optional webhook secret verification
- **Health Check**: `http://your-server:3002/health`
- **Test Endpoint**: `http://your-server:3002/test/notification`

### 4. Development Mode

Complete development environment with:
- Live Discord bot connection
- Real-time event logging
- Interactive command testing
- Webhook server for testing

```bash
# Start development environment
yarn discord:dev
```

## 🧪 Testing

### Test Discord Bot Connection
```bash
# 1. Setup integration
yarn discord:setup

# 2. Check bot status in Discord
# Bot should appear online in your server

# 3. Test bot command
# In Discord: !lark ping
```

### Test Member Sync
```bash
# 1. Configure Lark Base (optional)
export LARK_CRM_BASE_TOKEN=your_base_token
export LARK_CRM_TABLE_ID=your_table_id

# 2. Run sync
yarn discord:sync

# 3. Check Lark Base for synced members
```

### Test Webhook Server
```bash
# 1. Start webhook server
yarn discord:webhook

# 2. Test health endpoint
curl http://localhost:3002/health

# 3. Test notification
curl -X POST http://localhost:3002/test/notification
```

## 🔍 Troubleshooting

### Common Issues

#### Bot Not Responding
- ✅ Check `DISCORD_TOKEN` is correct
- ✅ Verify bot has required permissions
- ✅ Ensure bot is online in Discord server
- ✅ Check bot has access to channels

#### Lark Notifications Not Working
- ✅ Verify `APP_ID` and `APP_SECRET`
- ✅ Check `LARK_NOTIFICATION_CHAT_ID` is correct
- ✅ Ensure Lark app has `im:message` permission
- ✅ Verify bot is in the target chat

#### Member Sync Failing
- ✅ Check Discord bot has member read permissions
- ✅ Verify `DISCORD_GUILD_ID` is correct
- ✅ Ensure Lark Base permissions are configured
- ✅ Check Base token and table ID

#### Webhook Server Issues
- ✅ Verify port 3002 is available
- ✅ Check firewall settings for external access
- ✅ Ensure webhook URL is correctly configured
- ✅ Verify webhook secret if using authentication

### Debug Commands

```bash
# Check Discord connection
node -e "
const { Client } = require('discord.js');
const client = new Client({ intents: ['Guilds'] });
client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('✅ Discord connection successful'))
  .catch(err => console.error('❌ Discord connection failed:', err));
"

# Test Lark API connection
node -e "
const { LarkClient } = require('@larksuiteoapi/node-sdk');
const client = new LarkClient({ appId: process.env.APP_ID, appSecret: process.env.APP_SECRET });
client.auth.appAccessToken.internal()
  .then(() => console.log('✅ Lark connection successful'))
  .catch(err => console.error('❌ Lark connection failed:', err));
"
```

### Logging

Enable detailed logging:
```bash
# Enable debug logging
export DEBUG=discord:*,lark:*
export NODE_ENV=development

# Run with verbose output
yarn discord:dev
```

## 📊 Monitoring

### Server Health
- Monitor webhook server uptime
- Check Discord bot connection status
- Verify Lark API connectivity
- Track sync operation success rates

### Performance Metrics
- Member sync execution time
- Webhook response times
- Message delivery rates
- Error rates and patterns

### Alerts
- Discord bot disconnections
- Lark API errors
- Webhook server downtime
- Sync operation failures

## 🔒 Security Best Practices

### Token Management
- Store tokens in environment variables only
- Use strong webhook secrets
- Rotate tokens regularly
- Monitor for token leaks

### Access Control
- Use minimal required permissions
- Restrict webhook endpoints
- Implement rate limiting
- Monitor API usage

### Data Privacy
- Respect Discord Terms of Service
- Handle member data according to privacy laws
- Implement data retention policies
- Secure data transmission

This integration provides a comprehensive bridge between Discord communities and Lark workspace collaboration! 🚀