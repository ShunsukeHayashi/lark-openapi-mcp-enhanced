/**
 * Tests for MCP Server Initialization
 * Testing server setup, configuration, and tool registration
 */

import { initMcpServer } from '@/mcp-server/shared/init';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as larkmcp from '@/mcp-tool';
import { currentVersion } from '@/utils/version';

// Mock dependencies
jest.mock('@modelcontextprotocol/sdk/server/mcp.js');
jest.mock('@/mcp-tool');
jest.mock('@/utils/noop', () => ({
  noop: jest.fn()
}));
jest.mock('@/utils/version', () => ({
  currentVersion: '1.0.0-test'
}));
jest.mock('@/utils/http-instance', () => ({
  oapiHttpInstance: 'mock-http-instance'
}));

// Mock console and process
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

describe('initMcpServer', () => {
  let mockLarkClient: jest.Mocked<larkmcp.LarkMcpTool>;
  let mockMcpServer: jest.Mocked<McpServer>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock McpServer constructor
    mockMcpServer = {} as any;
    (McpServer as jest.Mock).mockImplementation(() => mockMcpServer);
    
    // Mock LarkMcpTool
    mockLarkClient = {
      updateUserAccessToken: jest.fn(),
      registerMcpServer: jest.fn()
    } as any;
    (larkmcp.LarkMcpTool as jest.Mock).mockImplementation(() => mockLarkClient);
    
    // Mock preset tools
    (larkmcp as any).presetTools = {
      'preset.default': ['tool1', 'tool2'],
      'preset.light': ['tool1'],
      'preset.base': ['base.tool1', 'base.tool2']
    };
  });

  describe('Credential validation', () => {
    test('should exit if appId is missing', () => {
      const options = {
        appId: '',
        appSecret: 'secret'
      };

      initMcpServer(options as any);
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error: Missing App Credentials, please provide APP_ID and APP_SECRET or specify them via command line arguments'
      );
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    test('should exit if appSecret is missing', () => {
      const options = {
        appId: 'app-id',
        appSecret: ''
      };

      initMcpServer(options as any);
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error: Missing App Credentials, please provide APP_ID and APP_SECRET or specify them via command line arguments'
      );
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    test('should proceed with valid credentials', () => {
      const options = {
        appId: 'app-id',
        appSecret: 'app-secret'
      };

      const result = initMcpServer(options as any);

      expect(mockProcessExit).not.toHaveBeenCalled();
      expect(result).toHaveProperty('mcpServer');
      expect(result).toHaveProperty('larkClient');
    });
  });

  describe('MCP Server creation', () => {
    test('should create MCP server with correct configuration', () => {
      const options = {
        appId: 'app-id',
        appSecret: 'app-secret'
      };

      initMcpServer(options as any);

      expect(McpServer).toHaveBeenCalledWith({
        id: 'lark-mcp-server',
        name: 'Feishu/Lark MCP Server',
        version: '1.0.0-test'
      });
    });
  });

  describe('Tool configuration', () => {
    test('should handle empty tools array', () => {
      const options = {
        appId: 'app-id',
        appSecret: 'app-secret',
        tools: []
      };

      initMcpServer(options as any);

      expect(larkmcp.LarkMcpTool).toHaveBeenCalledWith(
        expect.objectContaining({
          toolsOptions: { language: undefined }
        })
      );
    });

    test('should handle tools as string', () => {
      const options = {
        appId: 'app-id',
        appSecret: 'app-secret',
        tools: 'tool1,tool2,tool3'
      };

      initMcpServer(options as any);

      expect(larkmcp.LarkMcpTool).toHaveBeenCalledWith(
        expect.objectContaining({
          toolsOptions: { 
            allowTools: ['tool1', 'tool2', 'tool3'], 
            language: undefined 
          }
        })
      );
    });

    test('should expand preset tools', () => {
      const options = {
        appId: 'app-id',
        appSecret: 'app-secret',
        tools: ['preset.default', 'custom-tool']
      };

      initMcpServer(options as any);

      expect(larkmcp.LarkMcpTool).toHaveBeenCalledWith(
        expect.objectContaining({
          toolsOptions: { 
            allowTools: ['tool1', 'tool2', 'preset.default', 'custom-tool'], 
            language: undefined 
          }
        })
      );
    });

    test('should deduplicate tools', () => {
      const options = {
        appId: 'app-id',
        appSecret: 'app-secret',
        tools: ['tool1', 'tool1', 'preset.light', 'tool2']
      };

      initMcpServer(options as any);

      expect(larkmcp.LarkMcpTool).toHaveBeenCalledWith(
        expect.objectContaining({
          toolsOptions: { 
            allowTools: ['tool1', 'preset.light', 'tool2'], 
            language: undefined 
          }
        })
      );
    });

    test('should use language option', () => {
      const options = {
        appId: 'app-id',
        appSecret: 'app-secret',
        language: 'zh'
      };

      initMcpServer(options as any);

      expect(larkmcp.LarkMcpTool).toHaveBeenCalledWith(
        expect.objectContaining({
          toolsOptions: { language: 'zh' }
        })
      );
    });
  });

  describe('Rate limiting configuration', () => {
    test('should enable rate limiting by default', () => {
      const options = {
        appId: 'app-id',
        appSecret: 'app-secret'
      };

      initMcpServer(options as any);

      expect(larkmcp.LarkMcpTool).toHaveBeenCalledWith(
        expect.objectContaining({
          rateLimiting: expect.objectContaining({
            enabled: true
          })
        })
      );
    });

    test('should disable rate limiting when specified', () => {
      const options = {
        appId: 'app-id',
        appSecret: 'app-secret',
        disableRateLimit: true
      };

      initMcpServer(options as any);

      expect(larkmcp.LarkMcpTool).toHaveBeenCalledWith(
        expect.objectContaining({
          rateLimiting: expect.objectContaining({
            enabled: false
          })
        })
      );
    });

    test('should configure custom rate limits', () => {
      const options = {
        appId: 'app-id',
        appSecret: 'app-secret',
        rateLimitRequests: '100',
        rateLimitWrites: '20'
      };

      initMcpServer(options as any);

      expect(larkmcp.LarkMcpTool).toHaveBeenCalledWith(
        expect.objectContaining({
          rateLimiting: expect.objectContaining({
            rateLimits: {
              default: {
                capacity: 200,
                tokensPerInterval: 100,
                intervalMs: 60000,
                maxWaitTimeMs: 5000
              },
              read: {
                capacity: 200,
                tokensPerInterval: 100,
                intervalMs: 60000,
                maxWaitTimeMs: 2000
              },
              write: {
                capacity: 40,
                tokensPerInterval: 20,
                intervalMs: 60000,
                maxWaitTimeMs: 10000
              },
              admin: {
                capacity: 4,
                tokensPerInterval: 2,
                intervalMs: 60000,
                maxWaitTimeMs: 30000
              }
            }
          })
        })
      );
    });
  });

  describe('Lark client configuration', () => {
    test('should pass all configuration to LarkMcpTool', () => {
      const options = {
        appId: 'app-id',
        appSecret: 'app-secret',
        domain: 'https://custom.domain.com',
        tokenMode: 'user' as const
      };

      initMcpServer(options as any);

      expect(larkmcp.LarkMcpTool).toHaveBeenCalledWith(
        expect.objectContaining({
          appId: 'app-id',
          appSecret: 'app-secret',
          httpInstance: 'mock-http-instance',
          domain: 'https://custom.domain.com',
          tokenMode: 'user'
        })
      );
    });

    test('should update user access token if provided', () => {
      const options = {
        appId: 'app-id',
        appSecret: 'app-secret',
        userAccessToken: 'user-token-123'
      };

      initMcpServer(options as any);

      expect(mockLarkClient.updateUserAccessToken).toHaveBeenCalledWith('user-token-123');
    });

    test('should not update user access token if not provided', () => {
      const options = {
        appId: 'app-id',
        appSecret: 'app-secret'
      };

      initMcpServer(options as any);

      expect(mockLarkClient.updateUserAccessToken).not.toHaveBeenCalled();
    });

    test('should register MCP server with Lark client', () => {
      const options = {
        appId: 'app-id',
        appSecret: 'app-secret',
        toolNameCase: 'camelCase'
      };

      initMcpServer(options as any);

      expect(mockLarkClient.registerMcpServer).toHaveBeenCalledWith(
        mockMcpServer,
        { toolNameCase: 'camelCase' }
      );
    });
  });

  describe('Return values', () => {
    test('should return both mcpServer and larkClient', () => {
      const options = {
        appId: 'app-id',
        appSecret: 'app-secret'
      };

      const result = initMcpServer(options as any);

      expect(result).toEqual({
        mcpServer: mockMcpServer,
        larkClient: mockLarkClient
      });
    });
  });

  describe('Edge cases', () => {
    test('should handle undefined tools option', () => {
      const options = {
        appId: 'app-id',
        appSecret: 'app-secret',
        tools: undefined
      };

      initMcpServer(options as any);

      expect(larkmcp.LarkMcpTool).toHaveBeenCalledWith(
        expect.objectContaining({
          toolsOptions: { language: undefined }
        })
      );
    });

    test('should handle low write rate limits', () => {
      const options = {
        appId: 'app-id',
        appSecret: 'app-secret',
        rateLimitRequests: '10',
        rateLimitWrites: '1'
      };

      initMcpServer(options as any);

      const call = (larkmcp.LarkMcpTool as jest.Mock).mock.calls[0][0];
      expect(call.rateLimiting.rateLimits.admin.capacity).toBe(2); // Math.max(2, ...)
      expect(call.rateLimiting.rateLimits.admin.tokensPerInterval).toBe(1); // Math.max(1, ...)
    });
  });
});