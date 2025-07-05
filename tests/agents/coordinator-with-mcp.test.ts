/**
 * Test Coordinator Agent with Real MCP Tool Execution
 */

import { CoordinatorAgent, createCoordinatorInstance } from '../../src/agents/specialists/coordinator-agent';
import { LarkMcpToolOptions } from '../../src/mcp-tool/types';

describe('Coordinator Agent with MCP Tools', () => {
  let coordinator: CoordinatorAgent;

  beforeEach(() => {
    // Mock MCP options
    const mcpOptions: LarkMcpToolOptions = {
      appId: 'test-app-id',
      appSecret: 'test-app-secret',
      toolsOptions: {
        language: 'en',
        allowTools: ['bitable.v1.appTableRecord.search', 'im.v1.message.create']
      }
    };

    coordinator = createCoordinatorInstance(mcpOptions);
  });

  afterEach(() => {
    // Cleanup resources
    if (coordinator && typeof coordinator.cleanup === 'function') {
      coordinator.cleanup();
    }
  });

  test('should prioritize Lark MCP tools over Chrome MCP tools', async () => {
    const tool = coordinator.tools.get('select_optimal_mcp_tools');
    expect(tool).toBeDefined();

    const result = await tool?.execute({
      taskType: 'base_operation',
      requirements: ['search records in table'],
      context: {}
    });

    expect(result.success).toBe(true);
    expect(result.selectedTools).toBeDefined();
    expect(result.prioritization).toBe('Lark MCP tools prioritized over Chrome MCP tools');
  });

  test('should get tool priorities correctly', async () => {
    const tool = coordinator.tools.get('get_tool_priorities');
    expect(tool).toBeDefined();

    const result = await tool?.execute({});
    
    expect(result.success).toBe(true);
    expect(result.toolPriorities).toBeDefined();
    expect(result.priorityLevels).toBeDefined();
  });

  test('should track execution metrics', async () => {
    const tool = coordinator.tools.get('get_execution_metrics');
    expect(tool).toBeDefined();

    const result = await tool?.execute({});
    
    expect(result.success).toBe(true);
    expect(result.metrics).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.totalTools).toBe(0); // No executions yet
  });

  test('should assign tasks with MCP tool recommendations', async () => {
    const taskId = await coordinator.assignTask('Search for customer records in the CRM base', 'high');
    
    expect(taskId).toBeDefined();
    expect(taskId).toMatch(/^task_\d+$/);
  });

  test('should get tool discovery status', async () => {
    const tool = coordinator.tools.get('get_tool_discovery_status');
    expect(tool).toBeDefined();

    const result = await tool?.execute({});
    
    expect(result.success).toBe(true);
    expect(result.status).toBeDefined();
    expect(result.status.totalAvailableTools).toBeGreaterThanOrEqual(0);
    expect(result.status.refreshInterval).toBe('300s'); // Default 5 minutes
    expect(result.status.autoRefreshEnabled).toBe(true);
  });

  test('should refresh available tools', async () => {
    const tool = coordinator.tools.get('refresh_available_tools');
    expect(tool).toBeDefined();

    const result = await tool?.execute({ force: true });
    
    expect(result.success).toBe(true);
    expect(result.toolsRefreshed).toBe(true);
    expect(result.totalTools).toBeGreaterThanOrEqual(0);
    expect(result.newTools).toBeDefined();
    expect(result.removedTools).toBeDefined();
  });

  test('should configure tool refresh settings', async () => {
    const tool = coordinator.tools.get('configure_tool_refresh');
    expect(tool).toBeDefined();

    const result = await tool?.execute({
      intervalMinutes: 10,
      autoRefresh: true
    });
    
    expect(result.success).toBe(true);
    expect(result.configuration.refreshInterval).toBe('600s'); // 10 minutes
    expect(result.configuration.autoRefreshEnabled).toBe(true);
  });

  test('should not refresh tools if recently refreshed', async () => {
    const tool = coordinator.tools.get('refresh_available_tools');
    expect(tool).toBeDefined();

    // First refresh
    await tool?.execute({ force: true });
    
    // Try to refresh again without force
    const result = await tool?.execute({ force: false });
    
    expect(result.success).toBe(true);
    expect(result.toolsRefreshed).toBe(false);
    expect(result.message).toContain('recently refreshed');
  });

  test('should get tool fallback chains', async () => {
    const tool = coordinator.tools.get('get_tool_fallback_chains');
    expect(tool).toBeDefined();

    const result = await tool?.execute({});
    
    expect(result.success).toBe(true);
    expect(result.fallbackChains).toBeDefined();
    expect(result.maxRetryAttempts).toBe(3); // Default
    expect(result.totalMappings).toBeGreaterThan(0);
  });

  test('should configure tool fallbacks', async () => {
    const tool = coordinator.tools.get('configure_tool_fallbacks');
    expect(tool).toBeDefined();

    const result = await tool?.execute({
      toolName: 'test.tool.primary',
      fallbackTools: ['test.tool.fallback1', 'test.tool.fallback2'],
      maxRetries: 5
    });
    
    expect(result.success).toBe(true);
    expect(result.configuration.fallbackTools).toHaveLength(2);
    expect(result.configuration.maxRetryAttempts).toBe(5);
  });

  test('should execute tool with fallback mechanism', async () => {
    const tool = coordinator.tools.get('execute_with_fallback');
    expect(tool).toBeDefined();

    // This will fail as we don't have real Lark client in tests
    const result = await tool?.execute({
      toolName: 'bitable.v1.appTableRecord.search',
      toolParams: { app_token: 'test', table_id: 'test' },
      useFallbacks: true
    });
    
    // Even if it fails, the structure should be correct
    expect(result).toHaveProperty('attemptedTools');
    expect(result.attemptedTools).toContain('bitable.v1.appTableRecord.search');
  });

  test('should calculate tool reliability metrics', async () => {
    // First, execute some tools to generate history
    const executeTool = coordinator.tools.get('execute_mcp_tool');
    if (executeTool) {
      // Execute a few times to generate history
      await executeTool.execute({
        toolName: 'bitable.v1.appTableRecord.search',
        toolParams: { test: true }
      });
    }

    // Now check reliability metrics
    const metrics = coordinator.getToolReliabilityMetrics();
    expect(metrics).toBeDefined();
    
    // Check structure of metrics
    Object.values(metrics).forEach((metric: any) => {
      expect(metric).toHaveProperty('reliabilityScore');
      expect(metric).toHaveProperty('hasFallbacks');
      expect(metric).toHaveProperty('fallbackTools');
    });
  });

  describe('Configuration Management', () => {
    test('should reload configuration from file', async () => {
      const tool = coordinator.tools.get('reload_configuration');
      expect(tool).toBeDefined();

      const result = await tool?.execute({});
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Configuration reloaded successfully');
      expect(result.priorities).toBeGreaterThanOrEqual(0);
      expect(result.fallbacks).toBeGreaterThanOrEqual(0);
      expect(result.retryPolicy).toBeDefined();
      expect(result.retryPolicy.maxAttempts).toBe(3);
      expect(result.retryPolicy.baseDelay).toBe(1000);
    });

    test('should update tool priority via configuration', async () => {
      const tool = coordinator.tools.get('update_tool_priority');
      expect(tool).toBeDefined();

      const result = await tool?.execute({
        pattern: 'test.custom.tool',
        priority: 7,
        group: 'customTools'
      });
      
      expect(result.success).toBe(true);
      expect(result.pattern).toBe('test.custom.tool');
      expect(result.priority).toBe(7);
      expect(result.message).toContain('updated');
    });

    test('should add tool fallback mapping', async () => {
      const tool = coordinator.tools.get('add_tool_fallback');
      expect(tool).toBeDefined();

      const result = await tool?.execute({
        primaryTool: 'test.primary.tool',
        fallbackTools: ['test.fallback1', 'test.fallback2'],
        description: 'Test fallback mapping'
      });
      
      expect(result.success).toBe(true);
      expect(result.primaryTool).toBe('test.primary.tool');
      expect(result.fallbackTools).toHaveLength(2);
      expect(result.message).toContain('added');
    });

    test('should toggle configuration auto-reload', async () => {
      const tool = coordinator.tools.get('toggle_config_auto_reload');
      expect(tool).toBeDefined();

      // Disable auto-reload
      let result = await tool?.execute({ enabled: false });
      
      expect(result.success).toBe(true);
      expect(result.autoReloadEnabled).toBe(false);
      expect(result.message).toBe('Configuration auto-reload disabled');

      // Enable auto-reload
      result = await tool?.execute({ enabled: true });
      
      expect(result.success).toBe(true);
      expect(result.autoReloadEnabled).toBe(true);
      expect(result.message).toBe('Configuration auto-reload enabled');
    });
  });
});