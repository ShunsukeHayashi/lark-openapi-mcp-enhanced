import * as larkmcp from '../../mcp-tool';
export interface McpServerOptions {
  appId?: string;
  appSecret?: string;
  domain?: string;
  tools?: string | string[];
  userAccessToken?: string;
  language?: 'zh' | 'en';
  toolNameCase?: larkmcp.ToolNameCase;
  tokenMode?: larkmcp.TokenMode;
  host: string;
  port: number;
  // Rate limiting options
  disableRateLimit?: boolean;
  rateLimitRequests?: string;
  rateLimitWrites?: string;
}
