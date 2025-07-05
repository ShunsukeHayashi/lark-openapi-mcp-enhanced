/**
 * Test Tool Recommendation Engine
 */

import { RecommendationEngine, RecommendationContext } from '../../src/agents/ml/recommendation-engine';
import { CoordinatorAgent, createCoordinatorInstance } from '../../src/agents/specialists/coordinator-agent';
import { LarkMcpToolOptions } from '../../src/mcp-tool/types';

describe('Tool Recommendation Engine', () => {
  describe('RecommendationEngine Core', () => {
    let engine: RecommendationEngine;
    let mockTools: any[];

    beforeEach(() => {
      engine = new RecommendationEngine();
      mockTools = [
        {
          name: 'bitable.v1.appTableRecord.search',
          description: 'Search records in table',
          project: 'bitable',
          accessTokens: ['tenant'],
          schema: { data: {} },
        },
        {
          name: 'im.v1.message.create',
          description: 'Send message',
          project: 'im',
          accessTokens: ['tenant'],
          schema: { data: {} },
        },
        {
          name: 'docx.v1.document.create',
          description: 'Create document',
          project: 'docx',
          accessTokens: ['tenant'],
          schema: { data: {} },
        },
        {
          name: 'calendar.v4.calendar.event.create',
          description: 'Create calendar event',
          project: 'calendar',
          accessTokens: ['tenant'],
          schema: { data: {} },
        },
      ];
    });

    test('should recommend tools for search tasks', () => {
      const context: RecommendationContext = {
        currentTask: 'Search for customer records in the CRM table',
        recentTasks: [],
        taskCategory: 'data_retrieval',
      };

      const recommendations = engine.recommendTools(context, mockTools, 3);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].tool.name).toBe('bitable.v1.appTableRecord.search');
      expect(recommendations[0].confidence).toBeGreaterThan(0);
      expect(recommendations[0].reason).toBeTruthy();
      expect(recommendations[0].similarPatterns.length).toBeGreaterThan(0);
    });

    test('should recommend tools for messaging tasks', () => {
      const context: RecommendationContext = {
        currentTask: 'Send a notification message to the team',
        recentTasks: [],
        taskCategory: 'communication',
      };

      const recommendations = engine.recommendTools(context, mockTools, 3);

      expect(recommendations.some(r => r.tool.name === 'im.v1.message.create')).toBe(true);
      const messageRec = recommendations.find(r => r.tool.name === 'im.v1.message.create');
      expect(messageRec?.reason).toContain('Send messages');
    });

    test('should learn from execution and improve recommendations', () => {
      // Execute a search task successfully
      engine.learnFromExecution(
        'Search customer data in base',
        ['bitable.v1.appTableRecord.search'],
        true,
        150
      );

      // Get recommendations for similar task
      const context: RecommendationContext = {
        currentTask: 'Search for customer records in the CRM table',
        recentTasks: ['Search customer data in base'],
        taskCategory: 'data_retrieval',
      };

      const recommendations = engine.recommendTools(context, mockTools, 3);

      // Should have recommendations
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Should recommend search tool
      const searchRec = recommendations.find(r => r.tool.name === 'bitable.v1.appTableRecord.search');
      expect(searchRec).toBeDefined();
      expect(searchRec?.confidence).toBeGreaterThan(0.3);
    });

    test('should create custom patterns for new tasks', () => {
      const initialPatternCount = engine.getAllPatterns().length;

      // Execute a unique task
      engine.learnFromExecution(
        'Generate weekly sales report and send to management',
        ['docx.v1.document.create', 'im.v1.message.create'],
        true,
        500
      );

      const patterns = engine.getAllPatterns();
      expect(patterns.length).toBeGreaterThan(initialPatternCount);
      
      const customPattern = patterns.find(p => p.category === 'custom');
      expect(customPattern).toBeDefined();
      expect(customPattern?.commonTools).toHaveLength(2);
    });

    test('should consider tool co-occurrence in recommendations', () => {
      // Train with tools used together multiple times to reach threshold
      for (let i = 0; i < 6; i++) {
        engine.learnFromExecution(
          `Create report and send it - ${i}`,
          ['docx.v1.document.create', 'im.v1.message.create'],
          true,
          300
        );
      }

      // Now recommend for a messaging task with previous tool context
      const context: RecommendationContext = {
        currentTask: 'Send a notification message to the team',
        recentTasks: [],
        previousTools: ['docx.v1.document.create'],
        taskCategory: 'communication',
      };

      const recommendations = engine.recommendTools(context, mockTools, 3);

      // Should recommend message tool due to both keyword match and co-occurrence
      const messageRec = recommendations.find(r => r.tool.name === 'im.v1.message.create');
      expect(messageRec).toBeDefined();
      
      // Check that it has high confidence due to multiple factors
      expect(messageRec?.confidence).toBeGreaterThan(0.4);
      
      // Check that the tool was recommended (it should be in the recommendations)
      expect(recommendations.map(r => r.tool.name)).toContain('im.v1.message.create');
    });

    test('should export and import patterns', () => {
      // Train the engine
      engine.learnFromExecution('Search data', ['bitable.v1.appTableRecord.search'], true, 100);
      engine.learnFromExecution('Send message', ['im.v1.message.create'], true, 50);

      // Export
      const exported = engine.exportPatterns();
      expect(exported).toBeTruthy();

      // Create new engine and import
      const newEngine = new RecommendationEngine();
      newEngine.importPatterns(exported);

      // Verify patterns were imported
      const patterns = newEngine.getAllPatterns();
      expect(patterns.length).toBeGreaterThan(0);
    });
  });

  describe('Coordinator Integration', () => {
    let coordinator: CoordinatorAgent;

    beforeEach(() => {
      const mcpOptions: LarkMcpToolOptions = {
        appId: 'test-app-id',
        appSecret: 'test-app-secret',
        toolsOptions: {
          language: 'en',
          allowTools: [
            'bitable.v1.appTableRecord.search',
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

    test('should get tool recommendations', async () => {
      const tool = coordinator.tools.get('get_tool_recommendations');
      expect(tool).toBeDefined();

      const result = await tool?.execute({
        task: 'Search for sales records in the customer database',
        includeRecentContext: true,
        topK: 3
      });
      
      expect(result.success).toBe(true);
      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      // Check recommendation structure
      result.recommendations.forEach((rec: any) => {
        expect(rec).toHaveProperty('tool');
        expect(rec).toHaveProperty('confidence');
        expect(rec).toHaveProperty('reason');
        expect(rec).toHaveProperty('patterns');
        expect(rec).toHaveProperty('usageStats');
      });
    });

    test('should view task patterns', async () => {
      const tool = coordinator.tools.get('view_task_patterns');
      expect(tool).toBeDefined();

      const result = await tool?.execute({});
      
      expect(result.success).toBe(true);
      expect(result.patterns).toBeDefined();
      expect(Array.isArray(result.patterns)).toBe(true);
      expect(result.summary).toBeDefined();
      expect(result.summary.totalPatterns).toBeGreaterThanOrEqual(0);
    });

    test('should analyze task patterns', async () => {
      const tool = coordinator.tools.get('analyze_task_patterns');
      expect(tool).toBeDefined();

      const result = await tool?.execute({});
      
      expect(result.success).toBe(true);
      expect(result.insights).toBeDefined();
      expect(result.insights.totalPatterns).toBeGreaterThanOrEqual(0);
      expect(result.insights.topTools).toBeDefined();
      expect(result.insights.categoryDistribution).toBeDefined();
      expect(result.insights.recentActivity).toBeDefined();
    });

    test('should export and import recommendation model', async () => {
      const exportTool = coordinator.tools.get('export_recommendation_model');
      const importTool = coordinator.tools.get('import_recommendation_model');
      
      // Export
      const exportResult = await exportTool?.execute({});
      expect(exportResult.success).toBe(true);
      expect(exportResult.modelData).toBeDefined();
      
      // Import
      const importResult = await importTool?.execute({
        modelData: exportResult.modelData
      });
      expect(importResult.success).toBe(true);
      expect(importResult.patternCount).toBeGreaterThanOrEqual(0);
    });

    test('should include pattern recommendations in task assignment', async () => {
      const taskId = await coordinator.assignTask(
        'Create a monthly report and send it to management',
        'high'
      );
      
      expect(taskId).toBeDefined();
      expect(taskId).toMatch(/^task_\d+$/);
      
      // Task should have been tracked in recent tasks
      const recTool = coordinator.tools.get('get_tool_recommendations');
      const result = await recTool?.execute({
        task: 'Send another report',
        includeRecentContext: true
      });
      
      expect(result.context.recentTasks).toContain('Create a monthly report and send it to management');
    });
  });
});