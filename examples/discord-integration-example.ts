/**
 * Discord Integration Example
 * 
 * This example demonstrates how to integrate Discord with Lark OpenAPI MCP
 * Features:
 * - Discord to Lark message forwarding
 * - Lark notifications to Discord
 * - Slash commands for Lark API operations
 */

import { Client, GatewayIntentBits, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { LarkMcpTool } from '../src/mcp-tool/mcp-tool';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  discordToken: string;
  larkAppId: string;
  larkAppSecret: string;
  larkChatId?: string;
  discordChannelId?: string;
}

class DiscordLarkBridge {
  private discordClient: Client;
  private larkClient: LarkMcpTool;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    
    // Initialize Discord client
    this.discordClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
      ]
    });

    // Initialize Lark MCP client
    this.larkClient = new LarkMcpTool({
      appId: this.config.larkAppId,
      appSecret: this.config.larkAppSecret
    });
  }

  /**
   * Initialize the Discord bot and set up event listeners
   */
  async initialize(): Promise<void> {
    try {
      // Login to Discord
      await this.discordClient.login(this.config.discordToken);
      console.log('Discord bot logged in successfully');

      // Set up event listeners
      this.setupEventListeners();
      
      // Register slash commands
      await this.registerSlashCommands();
      
    } catch (error) {
      console.error('Failed to initialize Discord bot:', error);
      throw error;
    }
  }

  /**
   * Set up Discord event listeners
   */
  private setupEventListeners(): void {
    this.discordClient.once('ready', () => {
      console.log(`Discord bot is ready! Logged in as ${this.discordClient.user?.tag}`);
    });

    // Handle incoming messages
    this.discordClient.on('messageCreate', async (message) => {
      if (message.author.bot) return;
      
      // Forward Discord messages to Lark (optional)
      if (this.config.larkChatId) {
        await this.forwardDiscordMessageToLark(message);
      }
    });

    // Handle slash commands
    this.discordClient.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      
      await this.handleSlashCommand(interaction);
    });
  }

  /**
   * Register slash commands
   */
  private async registerSlashCommands(): Promise<void> {
    const commands = [
      new SlashCommandBuilder()
        .setName('lark-message')
        .setDescription('Send a message to Lark chat')
        .addStringOption(option =>
          option.setName('message')
            .setDescription('Message to send')
            .setRequired(true)
        ),
      
      new SlashCommandBuilder()
        .setName('lark-user')
        .setDescription('Get user information from Lark')
        .addStringOption(option =>
          option.setName('email')
            .setDescription('User email')
            .setRequired(true)
        ),
      
      new SlashCommandBuilder()
        .setName('lark-calendar')
        .setDescription('Create a calendar event in Lark')
        .addStringOption(option =>
          option.setName('title')
            .setDescription('Event title')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('start')
            .setDescription('Start time (ISO format)')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('end')
            .setDescription('End time (ISO format)')
            .setRequired(true)
        )
    ];

    try {
      console.log('Started refreshing application (/) commands.');
      
      // Register commands globally (takes up to 1 hour to propagate)
      await this.discordClient.application?.commands.set(commands);
      
      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error('Failed to register slash commands:', error);
    }
  }

  /**
   * Handle slash command interactions
   */
  private async handleSlashCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const { commandName } = interaction;

    try {
      switch (commandName) {
        case 'lark-message':
          await this.handleLarkMessageCommand(interaction);
          break;
        case 'lark-user':
          await this.handleLarkUserCommand(interaction);
          break;
        case 'lark-calendar':
          await this.handleLarkCalendarCommand(interaction);
          break;
        default:
          await interaction.reply('Unknown command');
      }
    } catch (error) {
      console.error(`Error handling command ${commandName}:`, error);
      await interaction.reply('An error occurred while processing your command.');
    }
  }

  /**
   * Handle /lark-message command
   */
  private async handleLarkMessageCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const message = interaction.options.getString('message')!;
    
    if (!this.config.larkChatId) {
      await interaction.reply('Lark chat ID not configured');
      return;
    }

    await interaction.deferReply();

    try {
      const result = await this.larkClient.executeTool({
        name: 'im.v1.message.create',
        arguments: {
          data: {
            receive_id: this.config.larkChatId,
            content: JSON.stringify({
              text: `Message from Discord user ${interaction.user.username}: ${message}`
            }),
            msg_type: 'text'
          }
        }
      });

      await interaction.editReply('Message sent to Lark successfully!');
    } catch (error) {
      console.error('Failed to send message to Lark:', error);
      await interaction.editReply('Failed to send message to Lark.');
    }
  }

  /**
   * Handle /lark-user command
   */
  private async handleLarkUserCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const email = interaction.options.getString('email')!;
    
    await interaction.deferReply();

    try {
      const result = await this.larkClient.executeTool({
        name: 'contact.v3.user.batch_get_id',
        arguments: {
          data: {
            emails: [email]
          }
        }
      });

      const userInfo = result.data?.user_list?.[0];
      if (userInfo) {
        await interaction.editReply(`User found: ${userInfo.user_id}`);
      } else {
        await interaction.editReply('User not found');
      }
    } catch (error) {
      console.error('Failed to get user info:', error);
      await interaction.editReply('Failed to get user information.');
    }
  }

  /**
   * Handle /lark-calendar command
   */
  private async handleLarkCalendarCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const title = interaction.options.getString('title')!;
    const start = interaction.options.getString('start')!;
    const end = interaction.options.getString('end')!;
    
    await interaction.deferReply();

    try {
      const result = await this.larkClient.executeTool({
        name: 'calendar.v4.calendar.event.create',
        arguments: {
          data: {
            calendar_id: 'primary',
            event: {
              summary: title,
              start_time: {
                timestamp: Math.floor(new Date(start).getTime() / 1000).toString()
              },
              end_time: {
                timestamp: Math.floor(new Date(end).getTime() / 1000).toString()
              }
            }
          }
        }
      });

      await interaction.editReply(`Calendar event created: ${title}`);
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      await interaction.editReply('Failed to create calendar event.');
    }
  }

  /**
   * Forward Discord message to Lark
   */
  private async forwardDiscordMessageToLark(message: any): Promise<void> {
    try {
      await this.larkClient.executeTool({
        name: 'im.v1.message.create',
        arguments: {
          data: {
            receive_id: this.config.larkChatId!,
            content: JSON.stringify({
              text: `Discord message from ${message.author.username}#${message.author.discriminator}: ${message.content}`
            }),
            msg_type: 'text'
          }
        }
      });
    } catch (error) {
      console.error('Failed to forward Discord message to Lark:', error);
    }
  }

  /**
   * Send notification from Lark to Discord
   */
  async sendLarkNotificationToDiscord(message: string): Promise<void> {
    if (!this.config.discordChannelId) {
      console.warn('Discord channel ID not configured');
      return;
    }

    try {
      const channel = await this.discordClient.channels.fetch(this.config.discordChannelId);
      if (channel?.isTextBased()) {
        await channel.send(`📢 Lark Notification: ${message}`);
      }
    } catch (error) {
      console.error('Failed to send notification to Discord:', error);
    }
  }

  /**
   * Gracefully shutdown the bot
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down Discord bot...');
    await this.discordClient.destroy();
  }
}

// Example usage
async function main() {
  const config: Config = {
    discordToken: process.env.DISCORD_BOT_TOKEN || '',
    larkAppId: process.env.APP_ID || '',
    larkAppSecret: process.env.APP_SECRET || '',
    larkChatId: process.env.LARK_CHAT_ID,
    discordChannelId: process.env.DISCORD_CHANNEL_ID
  };

  // Validate configuration
  if (!config.discordToken || !config.larkAppId || !config.larkAppSecret) {
    console.error('Missing required configuration. Please check your environment variables.');
    process.exit(1);
  }

  const bridge = new DiscordLarkBridge(config);

  try {
    await bridge.initialize();
    console.log('Discord-Lark bridge initialized successfully');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nReceived SIGINT, shutting down gracefully...');
      await bridge.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\nReceived SIGTERM, shutting down gracefully...');
      await bridge.shutdown();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to initialize Discord-Lark bridge:', error);
    process.exit(1);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { DiscordLarkBridge, Config };