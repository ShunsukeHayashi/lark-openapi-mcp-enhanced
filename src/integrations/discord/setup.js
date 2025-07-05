#!/usr/bin/env node

/**
 * Discord-Lark Integration Setup
 * Sets up Discord CRM integration with Lark Base
 */

const { Client, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

// Required environment variables
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
const APP_ID = process.env.APP_ID;
const APP_SECRET = process.env.APP_SECRET;

if (!DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN environment variable is required');
  process.exit(1);
}

if (!APP_ID || !APP_SECRET) {
  console.error('❌ APP_ID and APP_SECRET environment variables are required');
  process.exit(1);
}

async function setupDiscordIntegration() {
  console.log('🔧 Setting up Discord-Lark Integration...\n');
  
  // Initialize Discord client
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent
    ]
  });

  try {
    console.log('🔌 Connecting to Discord...');
    await client.login(DISCORD_TOKEN);
    
    console.log(`✅ Connected to Discord as ${client.user.tag}`);
    
    if (DISCORD_GUILD_ID) {
      const guild = await client.guilds.fetch(DISCORD_GUILD_ID);
      console.log(`🏰 Guild: ${guild.name} (${guild.memberCount} members)`);
    }
    
    console.log('\n📋 Setup Configuration:');
    console.log('====================');
    console.log(`• Discord Bot: ${client.user.tag}`);
    console.log(`• Guild ID: ${DISCORD_GUILD_ID || 'Not specified'}`);
    console.log(`• Lark App ID: ${APP_ID}`);
    console.log('• Integration Status: Ready');
    
    console.log('\n🚀 Next Steps:');
    console.log('==============');
    console.log('1. Run `yarn discord:sync` to sync Discord members with Lark');
    console.log('2. Run `yarn discord:webhook` to start webhook server');
    console.log('3. Configure Discord webhooks to point to your endpoint');
    
    await client.destroy();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Discord setup failed:', error.message);
    process.exit(1);
  }
}

setupDiscordIntegration();