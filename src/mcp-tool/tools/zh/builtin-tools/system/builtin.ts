import { McpTool } from '../../../../types';
import { z } from 'zod';

// Tool name type
export type systemBuiltinToolName = 'system.builtin.info' | 'system.builtin.time';

export const larkSystemBuiltinInfoTool: McpTool = {
  project: 'system',
  name: 'system.builtin.info',
  accessTokens: ['tenant', 'user'],
  description: '[飞书/Lark] - 系统 - 获取系统信息用于调试',
  schema: {
    data: z.object({
      include_version: z.boolean().describe('包含版本信息').optional(),
      include_env: z.boolean().describe('包含环境信息').optional(),
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
            text: `系统信息: ${JSON.stringify(info, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `获取系统信息失败: ${error instanceof Error ? error.message : String(error)}`,
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
  description: '[飞书/Lark] - 系统 - 获取各种格式的当前时间',
  schema: {
    data: z.object({
      timezone: z.string().describe('时区 (例如: "UTC", "Asia/Shanghai")').optional(),
      format: z.enum(['iso', 'unix', 'readable']).describe('时间格式').optional(),
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
          result.timestamp = now.toLocaleString('zh-CN');
          break;
        case 'iso':
        default:
          result.timestamp = now.toISOString();
          break;
      }

      if (params.data.timezone) {
        try {
          result.timezone_info = now.toLocaleString('zh-CN', { timeZone: params.data.timezone });
        } catch (error) {
          result.timezone_error = '无效时区';
        }
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: `当前时间: ${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `获取时间失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  },
};

export const systemBuiltinTools = [larkSystemBuiltinInfoTool, larkSystemBuiltinTimeTool];
