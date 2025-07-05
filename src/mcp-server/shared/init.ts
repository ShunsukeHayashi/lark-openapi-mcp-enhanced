import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { noop } from '../../utils/noop';
import { currentVersion } from '../../utils/version';
import { McpServerOptions } from './types';
import * as larkmcp from '../../mcp-tool';
import { oapiHttpInstance } from '../../utils/http-instance';
import { registerGenesisPrompts } from '../genesis-prompts';
import { registerCompletePrompts } from '../complete-prompts';
import { registerResources } from '../resources';

export function initMcpServer(options: McpServerOptions) {
  const { appId, appSecret, userAccessToken } = options;

  if (!appId || !appSecret) {
    throw new Error(
      'Missing App Credentials: Please provide APP_ID and APP_SECRET via environment variables or command line arguments. ' +
        'Visit https://open.larksuite.com/ to create an app and obtain credentials.',
    );
  }

  let allowTools = Array.isArray(options.tools) ? options.tools : options.tools?.split(',') || [];

  for (const [presetName, presetTools] of Object.entries(larkmcp.presetTools)) {
    if (allowTools.includes(presetName)) {
      allowTools = [...presetTools, ...allowTools];
    }
  }

  // Unique
  allowTools = Array.from(new Set(allowTools));

  // Create MCP Server
  const mcpServer = new McpServer({ id: 'lark-mcp-server', name: 'Feishu/Lark MCP Server', version: currentVersion });

  // Configure rate limiting
  const rateLimitingConfig: any = {
    enabled: !options.disableRateLimit,
    logger: { warn: noop, error: noop, debug: noop, info: noop, trace: noop },
  };

  // Parse rate limiting values
  if (options.rateLimitRequests || options.rateLimitWrites) {
    const requestsPerMinute = parseInt(options.rateLimitRequests || '50');
    const writesPerMinute = parseInt(options.rateLimitWrites || '10');

    rateLimitingConfig.rateLimits = {
      default: {
        capacity: requestsPerMinute * 2,
        tokensPerInterval: requestsPerMinute,
        intervalMs: 60000,
        maxWaitTimeMs: 5000,
      },
      read: {
        capacity: requestsPerMinute * 2,
        tokensPerInterval: requestsPerMinute,
        intervalMs: 60000,
        maxWaitTimeMs: 2000,
      },
      write: {
        capacity: writesPerMinute * 2,
        tokensPerInterval: writesPerMinute,
        intervalMs: 60000,
        maxWaitTimeMs: 10000,
      },
      admin: {
        capacity: Math.max(2, Math.floor(writesPerMinute / 5)),
        tokensPerInterval: Math.max(1, Math.floor(writesPerMinute / 10)),
        intervalMs: 60000,
        maxWaitTimeMs: 30000,
      },
    };
  }

  const larkClient = new larkmcp.LarkMcpTool({
    appId,
    appSecret,
    logger: { warn: noop, error: noop, debug: noop, info: noop, trace: noop },
    httpInstance: oapiHttpInstance,
    domain: options.domain,
    toolsOptions: allowTools.length
      ? { allowTools: allowTools as larkmcp.ToolName[], language: options.language }
      : { language: options.language },
    tokenMode: options.tokenMode,
    rateLimiting: rateLimitingConfig,
  });

  if (userAccessToken) {
    larkClient.updateUserAccessToken(userAccessToken);
  }

  larkClient.registerMcpServer(mcpServer, { toolNameCase: options.toolNameCase });

  // Register Genesis prompts
  registerGenesisPrompts(mcpServer);

  // Register complete prompts for all functions
  registerCompletePrompts(mcpServer);

  // Register resources
  registerResources(mcpServer);

  return { mcpServer, larkClient };
}
