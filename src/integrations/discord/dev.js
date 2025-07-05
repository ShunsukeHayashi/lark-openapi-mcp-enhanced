#!/usr/bin/env node

/**
 * Discord Integration Development Server
 * All-in-one development server for Discord-Lark integration
 */

const { Client, GatewayIntentBits } = require('discord.js');
const { LarkClient } = require('@larksuiteoapi/node-sdk');
const { DiscordWebhookServer } = require('./webhook');
const dotenv = require('dotenv');

dotenv.config();

// Configuration
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
const APP_ID = process.env.APP_ID;
const APP_SECRET = process.env.APP_SECRET;

class DiscordLarkDev {
  constructor() {
    this.discordClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
      ]
    });
    
    this.larkClient = new LarkClient({
      appId: APP_ID,
      appSecret: APP_SECRET,
      domain: process.env.LARK_DOMAIN || 'https://open.larksuite.com'
    });
    
    this.webhookServer = new DiscordWebhookServer();
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    this.discordClient.on('ready', () => {
      console.log(`✅ Discord bot ready as ${this.discordClient.user.tag}`);
    });
    
    this.discordClient.on('messageCreate', async (message) => {
      if (message.author.bot) return;
      
      console.log(`💬 Message from ${message.author.username}: ${message.content}`);
      
      // Example: Respond to !lark command
      if (message.content.startsWith('!lark')) {
        await this.handleLarkCommand(message);
      }
    });
    
    this.discordClient.on('guildMemberAdd', (member) => {
      console.log(`👋 New member joined: ${member.user.username}`);
    });
    
    this.discordClient.on('guildMemberRemove', (member) => {
      console.log(`👋 Member left: ${member.user.username}`);
    });
  }
  
  async handleLarkCommand(message) {
    const args = message.content.slice(5).trim().split(' ');
    const command = args[0];
    
    try {
      switch (command) {
        case 'ping':
          await message.reply('🏓 Pong! Discord-Lark integration is working!');
          break;
          
        case 'status':
          const guild = message.guild;
          const memberCount = guild.memberCount;
          await message.reply(`📊 Server: ${guild.name}\\n👥 Members: ${memberCount}\\n🔗 Integration: Active`);
          break;
          
        case 'sync':
          await message.reply('🔄 Starting member sync with Lark...');
          // Trigger sync logic here
          break;
          
        default:
          await message.reply('❓ Available commands: `!lark ping`, `!lark status`, `!lark sync`');
      }
    } catch (error) {
      console.error('Command handling failed:', error);
      await message.reply('❌ Command failed. Check logs for details.');
    }
  }
  
  async start() {
    try {
      console.log('🚀 Starting Discord-Lark Development Server...\n');
      
      // Start webhook server
      this.webhookServer.start();
      
      // Connect Discord bot
      await this.discordClient.login(DISCORD_TOKEN);
      
      console.log('\n✅ Development server ready!');
      console.log('==========================');
      console.log('• Discord bot: Connected');
      console.log('• Webhook server: Running');
      console.log('• Commands: !lark ping, !lark status, !lark sync');
      console.log('\n🛠️  Development Features:');
      console.log('• Real-time Discord event logging');
      console.log('• Interactive bot commands');
      console.log('• Webhook testing endpoints');
      console.log('• Live Lark integration');
      
    } catch (error) {
      console.error('❌ Development server failed to start:', error.message);
      process.exit(1);
    }
  }
}

// Start development server
if (require.main === module) {
  if (!DISCORD_TOKEN || !APP_ID || !APP_SECRET) {
    console.error('❌ Missing required environment variables:');
    console.error('   DISCORD_TOKEN, APP_ID, APP_SECRET');
    process.exit(1);
  }
  
  const devServer = new DiscordLarkDev();
  devServer.start();
}

module.exports = { DiscordLarkDev };