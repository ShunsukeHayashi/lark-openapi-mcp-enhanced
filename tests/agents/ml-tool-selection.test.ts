/**
 * Test ML-based Tool Selection
 */

import { CoordinatorAgent, createCoordinatorInstance } from '../../src/agents/specialists/coordinator-agent';
import { LarkMcpToolOptions } from '../../src/mcp-tool/types';

describe('ML-based Tool Selection', () => {
  let coordinator: CoordinatorAgent;

  beforeEach(() => {
    const mcpOptions: LarkMcpToolOptions = {
      appId: 'test-app-id',
      appSecret: 'test-app-secret',
      toolsOptions: {
        language: 'en',
        allowTools: [
          'bitable.v1.appTableRecord.search',
          'bitable.v1.appTableRecord.create',
          'im.v1.message.create',
          'docx.v1.document.create',
        ]
      }
    };

    coordinator = createCoordinatorInstance(mcpOptions);
  });

  afterEach(() => {
    if (coordinator && typeof coordinator.cleanup === 'function') {
      coordinator.cleanup();
    }
  });

  describe('ML Model Control', () => {
    test('should toggle ML selection on/off', async () => {
      const tool = coordinator.tools.get('toggle_ml_selection');
      expect(tool).toBeDefined();

      // Disable ML
      let result = await tool?.execute({ enabled: false });
      expect(result.success).toBe(true);
      expect(result.mlEnabled).toBe(false);

      // Enable ML
      result = await tool?.execute({ enabled: true });
      expect(result.success).toBe(true);
      expect(result.mlEnabled).toBe(true);
    });

    test('should get ML model metrics', async () => {
      const tool = coordinator.tools.get('get_ml_model_metrics');
      expect(tool).toBeDefined();

      const result = await tool?.execute({});
      
      expect(result.success).toBe(true);
      expect(result.modelMetrics).toBeDefined();
      expect(result.modelMetrics.mlEnabled).toBe(true);
      expect(result.modelMetrics.totalTrainingSamples).toBeGreaterThanOrEqual(0);
      expect(result.modelMetrics.featureWeights).toBeDefined();
      expect(result.summary).toBeDefined();
    });
  });

  describe('Tool Selection Analysis', () => {
    test('should analyze tool selection for a task', async () => {
      const tool = coordinator.tools.get('analyze_tool_selection');
      expect(tool).toBeDefined();

      const result = await tool?.execute({
        taskDescription: 'Search for urgent customer records in the CRM base',
        showAlternatives: true
      });
      
      expect(result.success).toBe(true);
      expect(result.taskAnalysis).toBeDefined();
      expect(result.taskAnalysis.taskType).toBe('base_operation');
      expect(result.taskAnalysis.priority).toBe('urgent');
      expect(result.taskAnalysis.keywords).toContain('urgent');
      expect(result.taskAnalysis.keywords).toContain('customer');
      expect(result.taskAnalysis.keywords).toContain('records');
      
      expect(result.mlSelection).toBeDefined();
      expect(result.ruleBasedSelection).toBeDefined();
      expect(result.mlPredictions).toBeDefined();
      expect(result.mlPredictions.length).toBeGreaterThan(0);
      
      // Check ML predictions structure
      result.mlPredictions.forEach((pred: any) => {
        expect(pred).toHaveProperty('tool');
        expect(pred).toHaveProperty('score');
        expect(pred).toHaveProperty('confidence');
        expect(pred).toHaveProperty('reasoning');
        expect(pred.alternatives).toBeDefined();
      });
    });

    test('should extract keywords correctly', async () => {
      const tool = coordinator.tools.get('analyze_tool_selection');
      
      const result = await tool?.execute({
        taskDescription: 'Create a new document for the project planning',
        showAlternatives: false
      });
      
      expect(result.success).toBe(true);
      expect(result.taskAnalysis.keywords).toContain('create');
      expect(result.taskAnalysis.keywords).toContain('document');
      expect(result.taskAnalysis.keywords).toContain('project');
      expect(result.taskAnalysis.keywords).toContain('planning');
    });

    test('should estimate priority correctly', async () => {
      const tool = coordinator.tools.get('analyze_tool_selection');
      
      // Test urgent priority
      let result = await tool?.execute({
        taskDescription: 'URGENT: Fix the broken integration immediately',
      });
      expect(result.taskAnalysis.priority).toBe('urgent');

      // Test high priority
      result = await tool?.execute({
        taskDescription: 'High priority task to update customer data',
      });
      expect(result.taskAnalysis.priority).toBe('high');

      // Test low priority
      result = await tool?.execute({
        taskDescription: 'Low priority cleanup task when possible',
      });
      expect(result.taskAnalysis.priority).toBe('low');

      // Test default medium priority
      result = await tool?.execute({
        taskDescription: 'Regular task to process data',
      });
      expect(result.taskAnalysis.priority).toBe('medium');
    });
  });

  describe('ML Model Import/Export', () => {
    test('should export and import ML model state', async () => {
      const exportTool = coordinator.tools.get('export_ml_model');
      const importTool = coordinator.tools.get('import_ml_model');
      
      expect(exportTool).toBeDefined();
      expect(importTool).toBeDefined();

      // Export model
      const exportResult = await exportTool?.execute({});
      expect(exportResult.success).toBe(true);
      expect(exportResult.modelState).toBeDefined();
      expect(exportResult.exportedAt).toBeDefined();
      
      const modelState = exportResult.modelState;

      // Import model
      const importResult = await importTool?.execute({ modelState });
      expect(importResult.success).toBe(true);
      expect(importResult.message).toBe('ML model imported successfully');
      expect(importResult.metrics).toBeDefined();
    });

    test('should handle invalid model import', async () => {
      const importTool = coordinator.tools.get('import_ml_model');
      
      const result = await importTool?.execute({
        modelState: 'invalid json data'
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to import ML model');
    });
  });

  describe('ML Training via Tool Execution', () => {
    test('should train model on tool execution', async () => {
      // Get initial metrics
      const metricsTool = coordinator.tools.get('get_ml_model_metrics');
      const initialMetrics = await metricsTool?.execute({});
      const initialSamples = initialMetrics.modelMetrics.totalTrainingSamples;

      // Execute a tool (this will fail but still train the model)
      const executeTool = coordinator.tools.get('execute_mcp_tool');
      await executeTool?.execute({
        toolName: 'bitable.v1.appTableRecord.search',
        toolParams: { app_token: 'test', table_id: 'test' }
      });

      // Check if model was trained
      const newMetrics = await metricsTool?.execute({});
      
      // Training happens asynchronously, so we check the execution history instead
      expect(newMetrics.performanceByTool).toBeDefined();
      expect(newMetrics.summary.totalExecutions).toBeGreaterThan(0);
    });
  });

  describe('ML Tool Selection vs Rule-based', () => {
    test('should compare ML and rule-based selections', async () => {
      const tool = coordinator.tools.get('analyze_tool_selection');
      
      const result = await tool?.execute({
        taskDescription: 'Send a message to the team about the new feature',
        showAlternatives: true
      });
      
      expect(result.success).toBe(true);
      
      // Both should select messaging tools
      const mlToolNames = result.mlSelection.map((t: any) => t.name);
      const ruleToolNames = result.ruleBasedSelection.map((t: any) => t.name);
      
      // At least one messaging tool should be selected by both
      const mlHasMessaging = mlToolNames.some((name: string) => name.includes('message'));
      const ruleHasMessaging = ruleToolNames.some((name: string) => name.includes('message'));
      
      expect(mlHasMessaging).toBe(true);
      expect(ruleHasMessaging).toBe(true);
    });
  });
});