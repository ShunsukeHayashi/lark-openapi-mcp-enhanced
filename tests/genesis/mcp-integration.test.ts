/**
 * Integration tests for Genesis MCP functionality
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { initMcpServer } from '../../src/mcp-server/shared/init';
import { genesisPrompts } from '../../src/mcp-server/genesis-prompts';
import { completePrompts } from '../../src/mcp-server/complete-prompts';
import { mcpResources } from '../../src/mcp-server/resources';

// Mock the MCP server
jest.mock('@modelcontextprotocol/sdk/server/mcp.js');
jest.mock('../../src/utils/http-instance', () => ({
  oapiHttpInstance: {},
}));

describe('MCP Integration Tests', () => {
  let mockMcpServer: any;
  let registeredTools: Map<string, any>;
  let registeredPrompts: Map<string, any>;
  let registeredResources: Map<string, any>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    registeredTools = new Map();
    registeredPrompts = new Map();
    registeredResources = new Map();

    mockMcpServer = {
      tool: jest.fn((name: string, description: string, schema: any, handler: any) => {
        registeredTools.set(name, { name, description, schema, handler });
      }),
      prompt: jest.fn((name: string, description: string, args: any, handler: any) => {
        registeredPrompts.set(name, { name, description, args, handler });
      }),
      resource: jest.fn((name: string, description: string, mimeType: string, handler: any) => {
        registeredResources.set(name, { name, description, mimeType, handler });
      }),
    };

    (McpServer as jest.MockedClass<typeof McpServer>).mockImplementation(() => mockMcpServer);
  });

  describe('MCP Server Initialization', () => {
    test('should initialize MCP server with Genesis tools', () => {
      const options = {
        appId: 'test_app',
        appSecret: 'test_secret',
        mode: 'stdio' as const,
        tools: 'preset.genesis.default',
      };

      const { mcpServer } = initMcpServer(options);

      expect(mcpServer).toBeDefined();
      expect(mockMcpServer.tool).toHaveBeenCalled();
      
      // Check Genesis tools are registered
      expect(registeredTools.has('genesis_builtin_create_base')).toBeTruthy();
      expect(registeredTools.has('genesis_builtin_analyze_requirements')).toBeTruthy();
      expect(registeredTools.has('genesis_builtin_create_view')).toBeTruthy();
      expect(registeredTools.has('genesis_builtin_create_dashboard')).toBeTruthy();
    });

    test('should register Genesis prompts', () => {
      const options = {
        appId: 'test_app',
        appSecret: 'test_secret',
        mode: 'stdio' as const,
      };

      initMcpServer(options);

      // Check Genesis prompts are registered
      expect(mockMcpServer.prompt).toHaveBeenCalled();
      expect(registeredPrompts.has('genesis_create_base')).toBeTruthy();
      expect(registeredPrompts.has('genesis_create_view_dashboard')).toBeTruthy();
      expect(registeredPrompts.has('genesis_automation_workflow')).toBeTruthy();
    });

    test('should register complete prompts', () => {
      const options = {
        appId: 'test_app',
        appSecret: 'test_secret',
        mode: 'stdio' as const,
      };

      initMcpServer(options);

      // Check complete prompts are registered
      expect(registeredPrompts.has('complete_user_management')).toBeTruthy();
      expect(registeredPrompts.has('complete_org_structure')).toBeTruthy();
      expect(registeredPrompts.has('complete_approval_workflow')).toBeTruthy();
      expect(registeredPrompts.has('complete_knowledge_base')).toBeTruthy();
    });

    test('should register resources', () => {
      const options = {
        appId: 'test_app',
        appSecret: 'test_secret',
        mode: 'stdio' as const,
      };

      initMcpServer(options);

      // Check resources are registered
      expect(mockMcpServer.resource).toHaveBeenCalled();
      expect(registeredResources.has('lark_api_reference')).toBeTruthy();
      expect(registeredResources.has('automation_templates')).toBeTruthy();
      expect(registeredResources.has('base_table_schemas')).toBeTruthy();
      expect(registeredResources.has('integration_examples')).toBeTruthy();
    });
  });

  describe('Genesis Prompt Execution', () => {
    test('should execute genesis_create_base prompt', () => {
      const options = {
        appId: 'test_app',
        appSecret: 'test_secret',
        mode: 'stdio' as const,
      };

      initMcpServer(options);

      const createBasePrompt = registeredPrompts.get('genesis_create_base');
      expect(createBasePrompt).toBeDefined();

      const result = createBasePrompt.handler({
        arguments: {
          requirements: 'Create a project management system with task tracking',
        },
      });

      expect(result.messages).toBeDefined();
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].content.text).toContain('project management system');
      expect(result.messages[0].content.text).toContain('task tracking');
    });

    test('should execute complete_user_management prompt', () => {
      const options = {
        appId: 'test_app',
        appSecret: 'test_secret',
        mode: 'stdio' as const,
      };

      initMcpServer(options);

      const userMgmtPrompt = registeredPrompts.get('complete_user_management');
      expect(userMgmtPrompt).toBeDefined();

      const result = userMgmtPrompt.handler({
        arguments: {
          action: 'Create new employees',
          details: 'Add 5 new engineers to the development team',
        },
      });

      expect(result.messages[0].content.text).toContain('Create new employees');
      expect(result.messages[0].content.text).toContain('Add 5 new engineers');
    });
  });

  describe('Resource Access', () => {
    test('should access lark_api_reference resource', async () => {
      const options = {
        appId: 'test_app',
        appSecret: 'test_secret',
        mode: 'stdio' as const,
      };

      initMcpServer(options);

      const apiRefResource = registeredResources.get('lark_api_reference');
      expect(apiRefResource).toBeDefined();

      const result = await apiRefResource.handler();
      expect(result.content).toContain('Lark/Feishu API Reference');
      expect(result.content).toContain('Authentication & Authorization');
      expect(result.content).toContain('Rate Limits');
    });

    test('should access automation_templates resource', async () => {
      const options = {
        appId: 'test_app',
        appSecret: 'test_secret',
        mode: 'stdio' as const,
      };

      initMcpServer(options);

      const templatesResource = registeredResources.get('automation_templates');
      expect(templatesResource).toBeDefined();

      const result = await templatesResource.handler();
      const templates = JSON.parse(result.content);
      
      expect(templates.templates).toBeDefined();
      expect(templates.templates.length).toBeGreaterThan(0);
      expect(templates.templates[0].name).toBe('employee_onboarding');
    });
  });

  describe('Tool Presets', () => {
    test('should load genesis preset tools', () => {
      const options = {
        appId: 'test_app',
        appSecret: 'test_secret',
        mode: 'stdio' as const,
        tools: 'preset.genesis.default',
      };

      initMcpServer(options);

      // Check that Genesis tools and supporting APIs are loaded
      expect(registeredTools.has('genesis_builtin_create_base')).toBeTruthy();
      expect(registeredTools.has('bitable_v1_app_create')).toBeTruthy();
      expect(registeredTools.has('bitable_v1_appTableView_create')).toBeTruthy();
      expect(registeredTools.has('sheets_v3_spreadsheetSheetFilterView_create')).toBeTruthy();
    });

    test('should load complete preset tools', () => {
      const options = {
        appId: 'test_app',
        appSecret: 'test_secret',
        mode: 'stdio' as const,
        tools: 'preset.complete.all',
      };

      initMcpServer(options);

      // Check that complete tools are loaded
      expect(registeredTools.has('complete_user_get_info')).toBeTruthy();
      expect(registeredTools.has('complete_department_create')).toBeTruthy();
      expect(registeredTools.has('complete_approval_create_instance')).toBeTruthy();
      
      // Should also include genesis tools
      expect(registeredTools.has('genesis_builtin_create_base')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing credentials', () => {
      // Mock process.exit
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
        throw new Error(`Process exited with code ${code}`);
      });

      const options = {
        appId: '',
        appSecret: '',
        mode: 'stdio' as const,
      };

      expect(() => initMcpServer(options)).toThrow('Process exited with code 1');
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });
  });
});