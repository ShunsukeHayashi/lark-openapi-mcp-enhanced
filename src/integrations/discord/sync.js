#!/usr/bin/env node

/**
 * Discord-Lark Member Sync
 * Synchronizes Discord server members with Lark Base for CRM purposes
 */

const { Client, GatewayIntentBits } = require('discord.js');
const { LarkClient } = require('@larksuiteoapi/node-sdk');
const dotenv = require('dotenv');

dotenv.config();

// Configuration
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
const APP_ID = process.env.APP_ID;
const APP_SECRET = process.env.APP_SECRET;
const LARK_BASE_TOKEN = process.env.LARK_CRM_BASE_TOKEN;
const LARK_TABLE_ID = process.env.LARK_CRM_TABLE_ID;

class DiscordLarkSync {
  constructor() {
    this.discordClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
      ]
    });
    
    this.larkClient = new LarkClient({
      appId: APP_ID,
      appSecret: APP_SECRET,
      domain: process.env.LARK_DOMAIN || 'https://open.larksuite.com'
    });
  }

  async syncMembers() {
    try {
      console.log('🔄 Starting Discord-Lark member synchronization...\n');
      
      // Connect to Discord
      await this.discordClient.login(DISCORD_TOKEN);
      console.log(`✅ Connected to Discord as ${this.discordClient.user.tag}`);
      
      // Fetch guild and members
      const guild = await this.discordClient.guilds.fetch(DISCORD_GUILD_ID);
      console.log(`🏰 Guild: ${guild.name}`);
      
      const members = await guild.members.fetch();
      console.log(`👥 Found ${members.size} members`);
      
      // Process members in batches
      const memberData = [];
      for (const [id, member] of members) {
        if (member.user.bot) continue; // Skip bots
        
        memberData.push({
          discord_id: member.user.id,
          username: member.user.username,
          display_name: member.displayName,
          avatar_url: member.user.displayAvatarURL(),
          joined_at: member.joinedAt?.toISOString(),
          roles: member.roles.cache.map(role => role.name).join(', '),
          status: member.presence?.status || 'offline',
          created_at: member.user.createdAt.toISOString()
        });
      }
      
      console.log(`📊 Processed ${memberData.length} non-bot members`);
      
      // Sync with Lark Base (if configured)
      if (LARK_BASE_TOKEN && LARK_TABLE_ID) {
        await this.syncToLarkBase(memberData);
      } else {
        console.log('⚠️  Lark Base not configured - displaying data only');
        console.table(memberData.slice(0, 5)); // Show first 5 members
      }
      
      await this.discordClient.destroy();
      console.log('\n✅ Synchronization completed!');
      
    } catch (error) {
      console.error('❌ Sync failed:', error.message);
      process.exit(1);
    }
  }
  
  async syncToLarkBase(memberData) {
    try {
      console.log('📝 Syncing to Lark Base...');
      
      // Create records in Lark Base
      const records = memberData.map(member => ({
        fields: {
          'Discord ID': member.discord_id,
          'Username': member.username,
          'Display Name': member.display_name,
          'Avatar URL': member.avatar_url,
          'Joined At': member.joined_at,
          'Roles': member.roles,
          'Status': member.status,
          'Created At': member.created_at,
          'Last Sync': new Date().toISOString()
        }
      }));
      
      // Batch create records (500 max per batch)
      const batchSize = 500;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        await this.larkClient.bitable.appTableRecord.batchCreate({
          app_token: LARK_BASE_TOKEN,
          table_id: LARK_TABLE_ID,
          records: batch
        });
        
        console.log(`✅ Synced batch ${Math.floor(i / batchSize) + 1} (${batch.length} records)`);
      }
      
    } catch (error) {
      console.error('❌ Lark Base sync failed:', error.message);
      throw error;
    }
  }
}

// Run synchronization
if (require.main === module) {
  const sync = new DiscordLarkSync();
  sync.syncMembers();
}

module.exports = { DiscordLarkSync };