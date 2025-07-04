import { z } from 'zod';
import { McpTool } from '../../../../types';
import { Client, GatewayIntentBits, TextChannel, Message } from 'discord.js';

// 保存形式の定義
const EXPORT_FORMATS = ['json', 'csv', 'markdown', 'lark_base'] as const;

// Discordクライアントの作成
async function createDiscordClient(token: string): Promise<Client> {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages
    ]
  });
  
  await client.login(token);
  return client;
}

// メッセージを指定形式に変換
function formatMessages(messages: Message[], format: string): any {
  const formattedMessages = messages.map(msg => ({
    id: msg.id,
    author: msg.author.username,
    author_id: msg.author.id,
    content: msg.content,
    timestamp: msg.createdAt.toISOString(),
    channel_id: msg.channelId,
    attachments: msg.attachments.map(att => ({
      url: att.url,
      name: att.name,
      size: att.size
    })),
    embeds: msg.embeds.map(embed => ({
      title: embed.title,
      description: embed.description,
      url: embed.url
    }))
  }));
  
  switch (format) {
    case 'json':
      return JSON.stringify(formattedMessages, null, 2);
      
    case 'csv':
      const headers = ['ID', 'Author', 'Content', 'Timestamp', 'Channel'];
      const rows = formattedMessages.map(msg => [
        msg.id,
        msg.author,
        `"${msg.content.replace(/"/g, '""')}"`,
        msg.timestamp,
        msg.channel_id
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
      
    case 'markdown':
      return formattedMessages.map(msg => 
        `### ${msg.author} - ${msg.timestamp}\n${msg.content}\n\n`
      ).join('---\n\n');
      
    case 'lark_base':
      return formattedMessages; // Lark Base形式用の生データ
      
    default:
      return formattedMessages;
  }
}

// チャンネルからメッセージを収集
export const discordMessageCollector: McpTool = {
  project: 'discord',
  name: 'discord.builtin.message.collect',
  accessTokens: ['tenant'],
  description: '[Discord] - 指定チャンネルのメッセージ履歴を収集',
  schema: {
    data: z.object({
      bot_token: z.string().describe('Discord Bot Token'),
      channel_id: z.string().describe('収集対象のチャンネルID'),
      limit: z.number().describe('取得するメッセージ数（0=すべて）').default(0),
      oldest_first: z.boolean().describe('古い順に取得').default(true),
      export_format: z.enum(EXPORT_FORMATS).describe('エクスポート形式').default('json'),
      save_to_lark: z.boolean().describe('Lark Baseに保存するか').default(false),
      lark_config: z.object({
        app_token: z.string().describe('Lark Base App Token'),
        table_id: z.string().describe('保存先テーブルID'),
        field_mapping: z.object({
          author_field: z.string().optional(),
          content_field: z.string().optional(),
          timestamp_field: z.string().optional(),
          channel_field: z.string().optional()
        }).optional()
      }).optional()
    })
  },
  customHandler: async (client, params) => {
    let discordClient: Client | null = null;
    
    try {
      // Discordに接続
      discordClient = await createDiscordClient(params.data.bot_token);
      await discordClient.guilds.fetch();
      
      // チャンネルを取得
      const channel = await discordClient.channels.fetch(params.data.channel_id);
      if (!channel || !(channel instanceof TextChannel)) {
        throw new Error('Channel not found or not a text channel');
      }
      
      // メッセージを収集
      const messages: Message[] = [];
      let lastId: string | undefined;
      const batchSize = 100; // Discord APIの制限
      
      while (true) {
        const options: any = {
          limit: params.data.limit === 0 ? batchSize : Math.min(batchSize, params.data.limit - messages.length)
        };
        
        if (lastId) {
          options[params.data.oldest_first ? 'after' : 'before'] = lastId;
        }
        
        const batch = await channel.messages.fetch(options);
        if (batch.size === 0) break;
        
        const sortedBatch = Array.from(batch.values()).sort((a, b) => 
          params.data.oldest_first 
            ? a.createdTimestamp - b.createdTimestamp 
            : b.createdTimestamp - a.createdTimestamp
        );
        
        messages.push(...sortedBatch);
        lastId = sortedBatch[sortedBatch.length - 1].id;
        
        if (params.data.limit > 0 && messages.length >= params.data.limit) {
          break;
        }
        
        // レート制限対策
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // メッセージをフォーマット
      const formattedData = formatMessages(messages, params.data.export_format);
      
      // Lark Baseに保存（オプション）
      if (params.data.save_to_lark && params.data.lark_config) {
        const larkData = Array.isArray(formattedData) ? formattedData : messages.map(msg => ({
          author: msg.author.username,
          content: msg.content,
          timestamp: msg.createdAt.toISOString(),
          channel_id: msg.channelId
        }));
        
        // バッチでLark Baseに保存
        const batchCreateData = larkData.map(item => {
          const fields: Record<string, any> = {};
          const mapping = params.data.lark_config!.field_mapping || {};
          
          if (mapping.author_field) fields[mapping.author_field] = item.author;
          if (mapping.content_field) fields[mapping.content_field] = item.content;
          if (mapping.timestamp_field) fields[mapping.timestamp_field] = item.timestamp;
          if (mapping.channel_field) fields[mapping.channel_field] = item.channel_id;
          
          return { fields };
        });
        
        // 100件ずつバッチ処理
        for (let i = 0; i < batchCreateData.length; i += 100) {
          const batch = batchCreateData.slice(i, i + 100);
          await client.bitable.v1.appTableRecord.batchCreate({
            app_token: params.data.lark_config.app_token,
            table_id: params.data.lark_config.table_id,
            data: { records: batch }
          });
        }
      }
      
      return {
        success: true,
        data: {
          channel_name: channel.name,
          guild_name: channel.guild.name,
          message_count: messages.length,
          oldest_message: messages[0]?.createdAt.toISOString(),
          newest_message: messages[messages.length - 1]?.createdAt.toISOString(),
          export_format: params.data.export_format,
          exported_data: params.data.export_format === 'lark_base' ? undefined : formattedData
        }
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: `Discord API error: ${error.message}`
      };
    } finally {
      // クライアントを破棄
      if (discordClient) {
        await discordClient.destroy();
      }
    }
  }
};

// 複数チャンネル一括収集
export const discordBulkCollector: McpTool = {
  project: 'discord',
  name: 'discord.builtin.bulk.collect',
  accessTokens: ['tenant'],
  description: '[Discord] - 複数チャンネルのメッセージを一括収集',
  schema: {
    data: z.object({
      bot_token: z.string().describe('Discord Bot Token'),
      channel_ids: z.array(z.string()).describe('収集対象のチャンネルIDリスト'),
      server_id: z.string().describe('サーバーID（全チャンネル収集時）').optional(),
      collect_all_channels: z.boolean().describe('サーバー内全チャンネルを収集').default(false),
      export_format: z.enum(EXPORT_FORMATS).describe('エクスポート形式').default('json'),
      combine_results: z.boolean().describe('結果を1つのファイルにまとめる').default(false)
    })
  },
  customHandler: async (client, params) => {
    let discordClient: Client | null = null;
    
    try {
      discordClient = await createDiscordClient(params.data.bot_token);
      
      let channelIds = params.data.channel_ids;
      
      // 全チャンネル収集モード
      if (params.data.collect_all_channels && params.data.server_id) {
        const guild = await discordClient.guilds.fetch(params.data.server_id);
        const channels = await guild.channels.fetch();
        channelIds = Array.from(channels.values())
          .filter(ch => ch.type === 0) // テキストチャンネルのみ
          .map(ch => ch.id);
      }
      
      const results = [];
      
      for (const channelId of channelIds) {
        try {
          const result = await discordMessageCollector.customHandler!(client, {
            data: {
              bot_token: params.data.bot_token,
              channel_id: channelId,
              limit: 0,
              oldest_first: true,
              export_format: params.data.export_format,
              save_to_lark: false
            }
          });
          
          results.push({
            channel_id: channelId,
            success: result.success,
            data: result.data || null,
            error: result.error || null
          });
        } catch (error: any) {
          results.push({
            channel_id: channelId,
            success: false,
            data: null,
            error: error.message
          });
        }
      }
      
      return {
        success: true,
        data: {
          total_channels: channelIds.length,
          success_count: results.filter(r => r.success).length,
          failed_count: results.filter(r => !r.success).length,
          results: params.data.combine_results ? 'Combined data' : results
        }
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    } finally {
      if (discordClient) {
        await discordClient.destroy();
      }
    }
  }
};

// ツールをエクスポート
export const discordTools = [discordMessageCollector, discordBulkCollector];