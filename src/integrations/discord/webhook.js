#!/usr/bin/env node

/**
 * Discord Webhook Server
 * Handles Discord events and forwards relevant data to Lark
 */

const express = require('express');
const { LarkClient } = require('@larksuiteoapi/node-sdk');
const dotenv = require('dotenv');

dotenv.config();

// Configuration
const PORT = process.env.DISCORD_WEBHOOK_PORT || 3002;
const APP_ID = process.env.APP_ID;
const APP_SECRET = process.env.APP_SECRET;
const LARK_CHAT_ID = process.env.LARK_NOTIFICATION_CHAT_ID;
const WEBHOOK_SECRET = process.env.DISCORD_WEBHOOK_SECRET;

class DiscordWebhookServer {
  constructor() {
    this.app = express();
    this.larkClient = new LarkClient({
      appId: APP_ID,
      appSecret: APP_SECRET,
      domain: process.env.LARK_DOMAIN || 'https://open.larksuite.com'
    });
    
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Webhook verification middleware
    this.app.use('/webhook/discord', (req, res, next) => {
      if (WEBHOOK_SECRET && req.headers['x-signature'] !== WEBHOOK_SECRET) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
      next();
    });
  }
  
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
    
    // Discord webhook endpoint
    this.app.post('/webhook/discord', async (req, res) => {
      try {
        await this.handleDiscordEvent(req.body);
        res.json({ success: true });
      } catch (error) {
        console.error('Webhook processing failed:', error);
        res.status(500).json({ error: 'Processing failed' });
      }
    });
    
    // Manual test endpoint
    this.app.post('/test/notification', async (req, res) => {
      try {
        await this.sendLarkNotification('🧪 Test notification from Discord webhook server');
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }
  
  async handleDiscordEvent(event) {
    console.log('📨 Received Discord event:', event.type || 'unknown');
    
    // Handle different Discord event types
    switch (event.type) {
      case 'message':
        await this.handleMessage(event);
        break;
      case 'member_join':
        await this.handleMemberJoin(event);
        break;
      case 'member_leave':
        await this.handleMemberLeave(event);
        break;
      case 'channel_create':
        await this.handleChannelCreate(event);
        break;
      default:
        console.log('ℹ️  Unhandled event type:', event.type);
    }
  }
  
  async handleMessage(event) {
    if (event.author?.bot) return; // Ignore bot messages
    
    const notification = `💬 **Discord Message**
**Channel:** #${event.channel_name}
**Author:** ${event.author.username}
**Content:** ${event.content}
**Time:** ${new Date().toLocaleString()}`;
    
    await this.sendLarkNotification(notification);
  }
  
  async handleMemberJoin(event) {
    const notification = `👋 **New Member Joined**
**User:** ${event.member.username}
**Display Name:** ${event.member.display_name}
**Server:** ${event.guild_name}
**Time:** ${new Date().toLocaleString()}`;
    
    await this.sendLarkNotification(notification);
  }
  
  async handleMemberLeave(event) {
    const notification = `👋 **Member Left**
**User:** ${event.member.username}
**Server:** ${event.guild_name}
**Time:** ${new Date().toLocaleString()}`;
    
    await this.sendLarkNotification(notification);
  }
  
  async handleChannelCreate(event) {
    const notification = `📢 **New Channel Created**
**Channel:** #${event.channel.name}
**Type:** ${event.channel.type}
**Server:** ${event.guild_name}
**Time:** ${new Date().toLocaleString()}`;
    
    await this.sendLarkNotification(notification);
  }
  
  async sendLarkNotification(message) {
    if (!LARK_CHAT_ID) {
      console.log('📝 Notification (no chat configured):', message);
      return;
    }
    
    try {
      await this.larkClient.im.message.create({
        receive_id_type: 'chat_id',
        receive_id: LARK_CHAT_ID,
        content: {
          text: message
        }
      });
      
      console.log('✅ Notification sent to Lark');
    } catch (error) {
      console.error('❌ Failed to send Lark notification:', error.message);
      throw error;
    }
  }
  
  start() {
    this.app.listen(PORT, () => {
      console.log(`🚀 Discord webhook server started on port ${PORT}`);
      console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook/discord`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`🧪 Test endpoint: http://localhost:${PORT}/test/notification`);
      
      if (!LARK_CHAT_ID) {
        console.log('⚠️  LARK_NOTIFICATION_CHAT_ID not configured - notifications will be logged only');
      }
    });
  }
}

// Start server
if (require.main === module) {
  const server = new DiscordWebhookServer();
  server.start();
}

module.exports = { DiscordWebhookServer };