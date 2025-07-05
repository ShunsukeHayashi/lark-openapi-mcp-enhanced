import { Client } from '@larksuiteoapi/node-sdk';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { LarkMcpToolOptions, McpTool, ToolNameCase, TokenMode } from './types';
import { AllTools, AllToolsZh } from './tools';
import { filterTools } from './utils/filter-tools';
import { defaultToolNames } from './constants';
import { larkOapiHandler } from './utils/handler';
import { caseTransf } from './utils/case-transf';
import { getShouldUseUAT } from './utils/get-should-use-uat';
import { createRateLimitedHttpInstance, RateLimitedHttpInstance } from '../utils/rate-limited-http';
import { globalCache, CacheManager, CacheCategory } from './utils/cache-manager';

/**
 * Feishu/Lark MCP
 */
export class LarkMcpTool {
  // Lark Client
  private client: Client | null = null;

  // User Access Token
  private userAccessToken: string | undefined;

  // Token Mode
  private tokenMode: TokenMode = TokenMode.AUTO;

  // All Tools
  private allTools: McpTool[] = [];

  // Rate-limited HTTP instance
  private rateLimitedHttp: RateLimitedHttpInstance;

  // Cache manager instance
  private cacheManager: CacheManager;

  /**
   * Feishu/Lark MCP
   * @param options Feishu/Lark Client Options
   */
  constructor(options: LarkMcpToolOptions) {
    // Initialize rate-limited HTTP instance
    this.rateLimitedHttp = createRateLimitedHttpInstance({
      enableRateLimit: options.rateLimiting?.enabled !== false,
      rateLimits: options.rateLimiting?.rateLimits,
      logger: options.rateLimiting?.logger,
    });

    // Initialize cache manager
    this.cacheManager = globalCache;

    if (options.client) {
      this.client = options.client;
    } else if (options.appId && options.appSecret) {
      this.client = new Client({
        appId: options.appId,
        appSecret: options.appSecret,
        // Use rate-limited HTTP instance
        httpInstance: this.rateLimitedHttp.getAxiosInstance(),
        ...options,
      });
    }
    this.tokenMode = options.tokenMode || TokenMode.AUTO;
    const isZH = options.toolsOptions?.language === 'zh';

    const filterOptions = {
      allowTools: defaultToolNames,
      tokenMode: this.tokenMode,
      ...options.toolsOptions,
    };
    this.allTools = filterTools(isZH ? AllToolsZh : AllTools, filterOptions);
  }

  /**
   * Update User Access Token
   * @param userAccessToken User Access Token
   */
  updateUserAccessToken(userAccessToken: string) {
    this.userAccessToken = userAccessToken;
  }

  /**
   * Get MCP Tools
   * @returns MCP Tool Definition Array
   */
  getTools(): McpTool[] {
    return this.allTools;
  }

  /**
   * Get rate limiting metrics
   * @returns Rate limiting metrics for all tiers
   */
  getRateLimitMetrics() {
    return this.rateLimitedHttp.getRateLimitMetrics();
  }

  /**
   * Reset rate limiters
   */
  resetRateLimiters(): void {
    this.rateLimitedHttp.resetRateLimiters();
  }

  /**
   * Enable or disable rate limiting
   * @param enabled Whether to enable rate limiting
   */
  setRateLimitEnabled(enabled: boolean): void {
    this.rateLimitedHttp.setRateLimitEnabled(enabled);
  }

  /**
   * Get cache statistics and metrics
   * @returns Cache performance metrics and statistics
   */
  getCacheMetrics() {
    return {
      metrics: this.cacheManager.getMetrics(),
      stats: this.cacheManager.getStats(),
    };
  }

  /**
   * Clear cache by category
   * @param category Cache category to clear
   * @returns Number of entries cleared
   */
  clearCache(category?: CacheCategory): number {
    if (category) {
      return this.cacheManager.clearCategory(category);
    } else {
      this.cacheManager.clear();
      return 0;
    }
  }

  /**
   * Preload frequently accessed data into cache
   * @param appId App ID for context
   */
  async preloadCache(appId: string): Promise<void> {
    // Preload commonly accessed data that doesn't change often
    try {
      // Only preload if cache is empty to avoid unnecessary API calls
      if (!this.cacheManager.has(CacheCategory.APP_TOKENS, appId)) {
        // Cache will be populated as API calls are made
        console.log('Cache preloading will occur during normal API usage');
      }
    } catch (error) {
      // Ignore preload errors
    }
  }

  /**
   * Get cache instance for advanced operations
   * @returns Cache manager instance
   */
  getCache(): CacheManager {
    return this.cacheManager;
  }

  /**
   * Register Tools to MCP Server
   * @param server MCP Server Instance
   */
  registerMcpServer(server: McpServer, options?: { toolNameCase?: ToolNameCase }): void {
    for (const tool of this.allTools) {
      server.tool(caseTransf(tool.name, options?.toolNameCase), tool.description, tool.schema, (params: any) => {
        try {
          if (!this.client) {
            return {
              isError: true,
              content: [{ type: 'text' as const, text: 'Client not initialized' }],
            };
          }
          const handler = tool.customHandler || larkOapiHandler;
          if (this.tokenMode == TokenMode.USER_ACCESS_TOKEN && !this.userAccessToken) {
            return {
              isError: true,
              content: [{ type: 'text' as const, text: 'Invalid UserAccessToken' }],
            };
          }
          const shouldUseUAT = getShouldUseUAT(this.tokenMode, this.userAccessToken, params?.useUAT);
          return handler(
            this.client,
            { ...params, useUAT: shouldUseUAT },
            { userAccessToken: this.userAccessToken, tool },
          );
        } catch (error) {
          return {
            isError: true,
            content: [{ type: 'text' as const, text: `Error: ${JSON.stringify((error as Error)?.message)}` }],
          };
        }
      });
    }
  }
}
