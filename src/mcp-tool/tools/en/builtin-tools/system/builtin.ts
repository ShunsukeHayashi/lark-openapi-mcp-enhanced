import { McpTool } from '../../../../types';
import { z } from 'zod';
import { systemBotMenuTools, SystemBotMenuToolName } from './bot-menu-handler';
import { chatAgentTools, ChatAgentToolName } from './chat-agent';
import { larkChatAgentTools, LarkChatAgentToolName } from './lark-chat-agent';

// Tool name type
export type systemBuiltinToolName =
  | 'system.builtin.info'
  | 'system.builtin.time'
  | SystemBotMenuToolName
  | ChatAgentToolName
  | LarkChatAgentToolName;

export const larkSystemBuiltinInfoTool: McpTool = {
  project: 'system',
  name: 'system.builtin.info',
  accessTokens: ['tenant', 'user'],
  description: '[Feishu/Lark] - System - Get system information for debugging',
  schema: {
    data: z.object({
      include_version: z.boolean().describe('Include version information').optional(),
      include_env: z.boolean().describe('Include environment information').optional(),
    }),
  },
  customHandler: async (client, params) => {
    try {
      const info: any = {
        timestamp: new Date().toISOString(),
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
      };

      if (params.data.include_version) {
        info.package_version = require('../../../../../../package.json').version;
      }

      if (params.data.include_env) {
        info.env = {
          NODE_ENV: process.env.NODE_ENV,
          has_app_id: !!process.env.APP_ID,
          has_app_secret: !!process.env.APP_SECRET,
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: `System Information: ${JSON.stringify(info, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Failed to get system info: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  },
};

export const larkSystemBuiltinTimeTool: McpTool = {
  project: 'system',
  name: 'system.builtin.time',
  accessTokens: ['tenant', 'user'],
  description: '[Feishu/Lark] - System - Get current time in various formats',
  schema: {
    data: z.object({
      timezone: z.string().describe('Timezone (e.g., "UTC", "Asia/Shanghai")').optional(),
      format: z.enum(['iso', 'unix', 'readable']).describe('Time format').optional(),
    }),
  },
  customHandler: async (client, params) => {
    try {
      const now = new Date();
      const format = params.data.format || 'iso';

      let result: any = {
        requested_format: format,
      };

      switch (format) {
        case 'unix':
          result.timestamp = Math.floor(now.getTime() / 1000);
          break;
        case 'readable':
          result.timestamp = now.toLocaleString();
          break;
        case 'iso':
        default:
          result.timestamp = now.toISOString();
          break;
      }

      if (params.data.timezone) {
        try {
          result.timezone_info = now.toLocaleString('en-US', { timeZone: params.data.timezone });
        } catch (error) {
          result.timezone_error = 'Invalid timezone';
        }
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: `Current Time: ${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Failed to get time: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  },
};

export const systemBuiltinTools = [
  larkSystemBuiltinInfoTool,
  larkSystemBuiltinTimeTool,
  ...systemBotMenuTools,
  ...chatAgentTools,
  ...larkChatAgentTools,
];
