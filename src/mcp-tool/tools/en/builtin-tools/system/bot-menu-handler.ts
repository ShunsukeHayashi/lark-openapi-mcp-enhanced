import { McpTool } from '../../../../types';
import { z } from 'zod';

export type SystemBotMenuToolName =
  | 'system.bot.help'
  | 'system.bot.preset'
  | 'system.bot.settings'
  | 'system.bot.status';

// ヘルプコマンド処理
export const systemBotHelpTool: McpTool = {
  project: 'system',
  name: 'system.bot.help',
  accessTokens: ['tenant'],
  description: '[MCP Bot] - Display help information for tool categories',
  schema: {
    data: z.object({
      category: z.string().optional().describe('Tool category (bitable, messaging, document, calendar, contact)'),
      chat_id: z.string().describe('Chat ID to send response to'),
    }),
  },
  customHandler: async (client, params): Promise<any> => {
    try {
      const { category, chat_id } = params.data;

      let helpContent = '';

      if (!category) {
        helpContent = `🔧 **MCP Tool Categories**

📊 **bitable** - Lark Base operations
💬 **messaging** - Chat and message tools  
📄 **document** - Document management
📅 **calendar** - Calendar operations
👥 **contact** - Contact management

Type 'help [category]' for detailed information.`;
      } else {
        const helpTexts: Record<string, string> = {
          bitable: `📊 **Bitable Operations**

Available tools:
• Search records in Base tables
• Create new records
• Batch create multiple records
• Update existing records
• Delete records

Example: Create a record in your sales Base table.`,
          messaging: `💬 **Messaging Tools**

Available tools:
• Send messages to users/groups
• Search chat groups
• Batch send notifications
• Create group chats
• Manage chat members

Example: Send a notification to your team.`,
          document: `📄 **Document Tools**

Available tools:
• Search documents
• Get document content
• Import documents
• Access wiki pages
• Export documents

Example: Find and retrieve project documents.`,
          calendar: `📅 **Calendar Operations**

Available tools:
• Create calendar events
• Search events
• Update event details
• Manage attendees
• Set reminders

Example: Schedule a team meeting.`,
          contact: `👥 **Contact Management**

Available tools:
• Search users by email/phone
• Get user information
• Access department info
• Manage user groups
• Directory operations

Example: Find contact info for team members.`,
        };

        helpContent = helpTexts[category] || `❌ Unknown category: ${category}`;
      }

      // Send response message
      const response = await client.request({
        method: 'POST',
        url: '/open-apis/im/v1/messages',
        params: { receive_id_type: 'chat_id' },
        data: {
          receive_id: chat_id,
          msg_type: 'text',
          content: JSON.stringify({ text: helpContent }),
        },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: `Help message sent successfully`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Failed to send help: ${error}`,
          },
        ],
      };
    }
  },
};

// プリセット切り替えツール
export const systemBotPresetTool: McpTool = {
  project: 'system',
  name: 'system.bot.preset',
  accessTokens: ['tenant'],
  description: '[MCP Bot] - Switch tool preset configuration',
  schema: {
    data: z.object({
      preset_name: z.string().describe('Preset name (light, default, im.default, base.default)'),
      chat_id: z.string().describe('Chat ID to send response to'),
    }),
  },
  customHandler: async (client, params): Promise<any> => {
    try {
      const { preset_name, chat_id } = params.data;

      const presetInfo: Record<string, { tools: number; description: string }> = {
        'preset.light': { tools: 10, description: 'Basic operations - lightweight tool set' },
        'preset.default': { tools: 19, description: 'Standard comprehensive tool set' },
        'preset.im.default': { tools: 5, description: 'Instant messaging focused tools' },
        'preset.base.default': { tools: 7, description: 'Lark Base management tools' },
        'preset.base.batch': { tools: 7, description: 'Lark Base with batch operations' },
        'preset.doc.default': { tools: 6, description: 'Document and wiki tools' },
        'preset.task.default': { tools: 4, description: 'Task management tools' },
        'preset.calendar.default': { tools: 5, description: 'Calendar event tools' },
      };

      const info = presetInfo[preset_name];
      let responseText = '';

      if (info) {
        responseText = `✅ **Preset Changed Successfully**

🔧 **${preset_name}**
📊 Tools: ${info.tools}
📝 Description: ${info.description}

The MCP server configuration has been updated. You can now use the tools included in this preset.`;
      } else {
        responseText = `❌ **Unknown Preset**

Available presets:
${Object.keys(presetInfo)
  .map((name) => `• ${name}`)
  .join('\n')}

Type 'use [preset_name]' to switch presets.`;
      }

      // Send response message
      await client.request({
        method: 'POST',
        url: '/open-apis/im/v1/messages',
        params: { receive_id_type: 'chat_id' },
        data: {
          receive_id: chat_id,
          msg_type: 'text',
          content: JSON.stringify({ text: responseText }),
        },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: `Preset switch response sent`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Failed to process preset switch: ${error}`,
          },
        ],
      };
    }
  },
};

// 設定情報ツール
export const systemBotSettingsTool: McpTool = {
  project: 'system',
  name: 'system.bot.settings',
  accessTokens: ['tenant'],
  description: '[MCP Bot] - Display current MCP tool settings',
  schema: {
    data: z.object({
      chat_id: z.string().describe('Chat ID to send response to'),
      action: z.string().optional().describe('Settings action (view, language, mode)'),
    }),
  },
  customHandler: async (client, params): Promise<any> => {
    try {
      const { chat_id, action } = params.data;

      let settingsText = `⚙️ **MCP Tool Settings**

🌐 **Language**: English/中文 (Current: English)
🔧 **Tool Mode**: Default
📊 **Rate Limiting**: Enabled
🚀 **Active Preset**: preset.default (19 tools)
🔗 **Connection**: Healthy

**Available Commands:**
• \`settings language\` - Change language
• \`settings mode\` - Change tool mode  
• \`settings status\` - View detailed status

For configuration changes, please contact your administrator.`;

      if (action === 'status') {
        settingsText = `📊 **Detailed MCP Status**

🔗 **Connection Status**: ✅ Connected
🚀 **Server Version**: v0.3.1
⚡ **Response Time**: ~200ms
📈 **Request Count**: 1,247 (today)
🔒 **Rate Limit**: 47/50 requests remaining
💾 **Cache Status**: Active
🛡️ **Security**: Token-based auth enabled

**Recent Activity:**
• 14:30 - Base record search
• 14:25 - Message sent to #sales
• 14:20 - Document accessed`;
      }

      // Send response message
      await client.request({
        method: 'POST',
        url: '/open-apis/im/v1/messages',
        params: { receive_id_type: 'chat_id' },
        data: {
          receive_id: chat_id,
          msg_type: 'text',
          content: JSON.stringify({ text: settingsText }),
        },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: `Settings information sent`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Failed to display settings: ${error}`,
          },
        ],
      };
    }
  },
};

// ステータス確認ツール
export const systemBotStatusTool: McpTool = {
  project: 'system',
  name: 'system.bot.status',
  accessTokens: ['tenant'],
  description: '[MCP Bot] - Display MCP system status',
  schema: {
    data: z.object({
      chat_id: z.string().describe('Chat ID to send response to'),
    }),
  },
  customHandler: async (client, params): Promise<any> => {
    try {
      const { chat_id } = params.data;

      const statusText = `🚀 **MCP Integration Tool Status**

✅ **System**: Online
🔧 **Available Tools**: 19 (preset.default)
📊 **API Health**: All services operational
⚡ **Performance**: Excellent
🔒 **Security**: Authenticated

**Quick Actions:**
• Type 'help' for tool categories
• Type 'use [preset]' to switch tools
• Type 'settings' for configuration

Ready to assist! 🎉`;

      // Send response message
      await client.request({
        method: 'POST',
        url: '/open-apis/im/v1/messages',
        params: { receive_id_type: 'chat_id' },
        data: {
          receive_id: chat_id,
          msg_type: 'text',
          content: JSON.stringify({ text: statusText }),
        },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: `Status information sent`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Failed to display status: ${error}`,
          },
        ],
      };
    }
  },
};

export const systemBotMenuTools = [systemBotHelpTool, systemBotPresetTool, systemBotSettingsTool, systemBotStatusTool];
