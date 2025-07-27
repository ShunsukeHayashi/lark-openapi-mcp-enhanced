/**
 * Integration Tests for Claude Code Sub-Agents
 * Tests the interaction between Claude Code agents and Lark MCP tools
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/test-globals';
import { jest } from '@jest/globals';

// Mock Lark MCP client for testing
class MockLarkMcpClient {
  private tools = new Map();

  registerTool(name: string, handler: Function) {
    this.tools.set(name, handler);
  }

  async invokeTool(name: string, params: any) {
    const handler = this.tools.get(name);
    if (!handler) {
      throw new Error(`Tool ${name} not found`);
    }
    return await handler(params);
  }
}

// Test data structures
interface AgentTestCase {
  name: string;
  description: string;
  userInput: string;
  expectedTools: string[];
  expectedOutcome: string;
}

interface ToolInvocation {
  toolName: string;
  parameters: any;
  timestamp: Date;
}

describe('Claude Code Sub-Agent Integration Tests', () => {
  let mockClient: MockLarkMcpClient;
  let toolInvocations: ToolInvocation[];

  beforeAll(() => {
    mockClient = new MockLarkMcpClient();
    toolInvocations = [];

    // Setup mock Lark MCP tools
    setupMockTools();
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  function setupMockTools() {
    // Base operations mock
    mockClient.registerTool('lark-mcp:bitable_v1_app_list', async (params) => {
      toolInvocations.push({
        toolName: 'bitable_v1_app_list',
        parameters: params,
        timestamp: new Date()
      });
      return {
        data: {
          items: [
            { app_token: 'app1', app_name: 'Customer Management' },
            { app_token: 'app2', app_name: 'Sales Pipeline' }
          ]
        }
      };
    });

    mockClient.registerTool('lark-mcp:bitable_v1_appTableRecord_search', async (params) => {
      toolInvocations.push({
        toolName: 'bitable_v1_appTableRecord_search',
        parameters: params,
        timestamp: new Date()
      });
      return {
        data: {
          items: [
            { record_id: 'rec1', fields: { name: 'Customer A', revenue: 10000 } },
            { record_id: 'rec2', fields: { name: 'Customer B', revenue: 15000 } }
          ]
        }
      };
    });

    // Messaging mock
    mockClient.registerTool('lark-mcp:im_v1_message_create', async (params) => {
      toolInvocations.push({
        toolName: 'im_v1_message_create',
        parameters: params,
        timestamp: new Date()
      });
      return {
        data: {
          message_id: 'msg_123',
          create_time: new Date().toISOString()
        }
      };
    });

    // Document creation mock
    mockClient.registerTool('lark-mcp:docx_v1_document_create', async (params) => {
      toolInvocations.push({
        toolName: 'docx_v1_document_create',
        parameters: params,
        timestamp: new Date()
      });
      return {
        data: {
          document: {
            document_id: 'doc_456',
            title: params.title || 'Generated Report'
          }
        }
      };
    });

    // Calendar event mock
    mockClient.registerTool('lark-mcp:calendar_v4_calendar_event_create', async (params) => {
      toolInvocations.push({
        toolName: 'calendar_v4_calendar_event_create',
        parameters: params,
        timestamp: new Date()
      });
      return {
        data: {
          event: {
            event_id: 'evt_789',
            summary: params.summary
          }
        }
      };
    });

    // External system mocks
    mockClient.registerTool('youtube-main', async (params) => {
      toolInvocations.push({
        toolName: 'youtube-main',
        parameters: params,
        timestamp: new Date()
      });
      return {
        data: {
          analytics: {
            views: 50000,
            subscribers: 1200,
            engagement_rate: 0.085
          }
        }
      };
    });

    mockClient.registerTool('gas-interpreter', async (params) => {
      toolInvocations.push({
        toolName: 'gas-interpreter',
        parameters: params,
        timestamp: new Date()
      });
      return {
        data: {
          execution_result: 'Script executed successfully',
          output: 'Data processed: 150 records'
        }
      };
    });
  }

  describe('Enterprise Orchestrator Agent', () => {
    const testCases: AgentTestCase[] = [
      {
        name: 'Customer Onboarding Workflow',
        description: 'Complete multi-domain customer setup process',
        userInput: 'Set up onboarding for new enterprise client ABC Corp',
        expectedTools: [
          'lark-mcp:bitable_v1_appTableRecord_create',
          'lark-mcp:docx_v1_document_create',
          'lark-mcp:calendar_v4_calendar_event_create',
          'lark-mcp:im_v1_message_create'
        ],
        expectedOutcome: 'Customer onboarding workflow completed successfully'
      },
      {
        name: 'Project Workspace Creation',
        description: 'Multi-component project setup',
        userInput: 'Create a project workspace for Q1 planning with Base, Docs, and Calendar',
        expectedTools: [
          'lark-mcp:bitable_v1_app_list',
          'lark-mcp:docx_v1_document_create',
          'lark-mcp:calendar_v4_calendar_event_create'
        ],
        expectedOutcome: 'Project workspace created with all components'
      }
    ];

    testCases.forEach(testCase => {
      test(`should handle ${testCase.name}`, async () => {
        // Reset tool invocations
        toolInvocations = [];

        // Simulate agent decision-making process
        const agentResponse = await simulateOrchestratorAgent(testCase.userInput);

        // Verify correct tools were invoked
        const invokedToolNames = toolInvocations.map(inv => inv.toolName);
        testCase.expectedTools.forEach(expectedTool => {
          const toolName = expectedTool.replace('lark-mcp:', '');
          expect(invokedToolNames).toContain(toolName);
        });

        // Verify successful completion
        expect(agentResponse.success).toBe(true);
        expect(agentResponse.summary).toContain('successfully');
      });
    });
  });

  describe('Analytics Specialist Agent', () => {
    const analyticsTestCases: AgentTestCase[] = [
      {
        name: 'Sales Performance Analysis',
        description: 'Comprehensive sales data analysis',
        userInput: 'Analyze our Q4 sales performance and create a report',
        expectedTools: [
          'lark-mcp:bitable_v1_app_list',
          'lark-mcp:bitable_v1_appTableRecord_search',
          'lark-mcp:docx_v1_document_create'
        ],
        expectedOutcome: 'Sales analysis completed with generated report'
      },
      {
        name: 'Customer Retention Analysis',
        description: 'Deep dive into customer behavior patterns',
        userInput: 'Analyze customer retention trends and identify improvement opportunities',
        expectedTools: [
          'lark-mcp:bitable_v1_appTableRecord_search',
          'lark-mcp:bitable_v1_appTableRecord_batch_get'
        ],
        expectedOutcome: 'Customer retention analysis with actionable insights'
      }
    ];

    analyticsTestCases.forEach(testCase => {
      test(`should handle ${testCase.name}`, async () => {
        toolInvocations = [];

        const agentResponse = await simulateAnalyticsAgent(testCase.userInput);

        const invokedToolNames = toolInvocations.map(inv => inv.toolName);
        testCase.expectedTools.forEach(expectedTool => {
          const toolName = expectedTool.replace('lark-mcp:', '');
          expect(invokedToolNames).toContain(toolName);
        });

        expect(agentResponse.success).toBe(true);
        expect(agentResponse.analysis).toBeDefined();
        expect(agentResponse.insights).toBeInstanceOf(Array);
      });
    });
  });

  describe('Integration Bridge Agent', () => {
    const integrationTestCases: AgentTestCase[] = [
      {
        name: 'YouTube Analytics Sync',
        description: 'Synchronize YouTube data with Lark Base',
        userInput: 'Sync our YouTube channel analytics to Lark Base',
        expectedTools: [
          'youtube-main',
          'lark-mcp:bitable_v1_appTableRecord_create',
          'lark-mcp:im_v1_message_create'
        ],
        expectedOutcome: 'YouTube analytics synchronized successfully'
      },
      {
        name: 'GAS Automation Integration',
        description: 'Execute GAS script and process results in Lark',
        userInput: 'Run the monthly data processing script and update our Base tables',
        expectedTools: [
          'gas-interpreter',
          'lark-mcp:bitable_v1_appTableRecord_update'
        ],
        expectedOutcome: 'GAS script executed and Lark data updated'
      }
    ];

    integrationTestCases.forEach(testCase => {
      test(`should handle ${testCase.name}`, async () => {
        toolInvocations = [];

        const agentResponse = await simulateIntegrationAgent(testCase.userInput);

        const invokedToolNames = toolInvocations.map(inv => inv.toolName);
        testCase.expectedTools.forEach(expectedTool => {
          const toolName = expectedTool.replace('lark-mcp:', '');
          expect(invokedToolNames).toContain(toolName);
        });

        expect(agentResponse.success).toBe(true);
        expect(agentResponse.integrationResults).toBeDefined();
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle tool failure gracefully', async () => {
      // Setup tool to fail
      mockClient.registerTool('lark-mcp:bitable_v1_app_list', async () => {
        throw new Error('API rate limit exceeded');
      });

      const agentResponse = await simulateOrchestratorAgent('List all applications');

      expect(agentResponse.success).toBe(false);
      expect(agentResponse.error).toContain('rate limit');
      expect(agentResponse.suggestions).toBeInstanceOf(Array);
    });

    test('should implement retry logic for transient failures', async () => {
      let attemptCount = 0;
      
      mockClient.registerTool('lark-mcp:bitable_v1_app_list', async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary network error');
        }
        return { data: { items: [] } };
      });

      const agentResponse = await simulateOrchestratorAgent('List all applications');

      expect(agentResponse.success).toBe(true);
      expect(attemptCount).toBe(3);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle concurrent tool invocations', async () => {
      const startTime = Date.now();
      
      const promises = Array.from({ length: 5 }, (_, i) => 
        simulateAnalyticsAgent(`Analyze dataset ${i}`)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should complete within reasonable time (parallel execution)
      expect(endTime - startTime).toBeLessThan(10000);
    });

    test('should respect rate limits', async () => {
      // Setup rate-limited tool
      let requestCount = 0;
      const rateLimitWindow = 1000; // 1 second
      const maxRequests = 3;

      mockClient.registerTool('lark-mcp:bitable_v1_appTableRecord_search', async () => {
        requestCount++;
        if (requestCount > maxRequests) {
          throw new Error('Rate limit exceeded');
        }
        return { data: { items: [] } };
      });

      // Reset counter after window
      setTimeout(() => { requestCount = 0; }, rateLimitWindow);

      const results = await Promise.allSettled([
        simulateAnalyticsAgent('Query 1'),
        simulateAnalyticsAgent('Query 2'),
        simulateAnalyticsAgent('Query 3'),
        simulateAnalyticsAgent('Query 4'), // Should be rate limited
      ]);

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      expect(successful).toBe(3);
      expect(failed).toBe(1);
    });
  });

  // Simulation functions for testing
  async function simulateOrchestratorAgent(userInput: string) {
    // Simulate the enterprise orchestrator's decision-making
    const workflow = analyzeUserIntent(userInput);
    
    try {
      const results = [];
      
      for (const step of workflow.steps) {
        const result = await mockClient.invokeTool(step.tool, step.params);
        results.push(result);
      }

      return {
        success: true,
        summary: `${workflow.name} completed successfully`,
        results
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        suggestions: ['Check system status', 'Retry operation', 'Contact support']
      };
    }
  }

  async function simulateAnalyticsAgent(userInput: string) {
    // Simulate analytics agent behavior
    const analysisType = determineAnalysisType(userInput);
    
    try {
      // Data collection phase
      const apps = await mockClient.invokeTool('lark-mcp:bitable_v1_app_list', {});
      const data = await mockClient.invokeTool('lark-mcp:bitable_v1_appTableRecord_search', {
        app_token: 'app1',
        table_id: 'tbl1'
      });

      // Analysis phase (simulated)
      const insights = performAnalysis(data.data.items, analysisType);

      // Report generation
      if (userInput.includes('report')) {
        await mockClient.invokeTool('lark-mcp:docx_v1_document_create', {
          title: `${analysisType} Analysis Report`
        });
      }

      return {
        success: true,
        analysis: analysisType,
        insights,
        dataPoints: data.data.items.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        analysis: analysisType
      };
    }
  }

  async function simulateIntegrationAgent(userInput: string) {
    // Simulate integration bridge behavior
    const integrationType = determineIntegrationType(userInput);
    
    try {
      const integrationResults = [];

      if (userInput.includes('YouTube')) {
        const youtubeData = await mockClient.invokeTool('youtube-main', {
          operation: 'getAnalytics'
        });
        integrationResults.push(youtubeData);

        // Sync to Lark Base
        await mockClient.invokeTool('lark-mcp:bitable_v1_appTableRecord_create', {
          app_token: 'app1',
          table_id: 'tbl_analytics',
          record: youtubeData.data.analytics
        });
      }

      if (userInput.includes('GAS') || userInput.includes('script')) {
        const gasResult = await mockClient.invokeTool('gas-interpreter', {
          script: 'processMonthlyData()',
          parameters: {}
        });
        integrationResults.push(gasResult);
      }

      // Notification
      if (integrationResults.length > 0) {
        await mockClient.invokeTool('lark-mcp:im_v1_message_create', {
          content: `Integration completed: ${integrationType}`
        });
      }

      return {
        success: true,
        integrationType,
        integrationResults,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        integrationType
      };
    }
  }

  // Helper functions
  function analyzeUserIntent(userInput: string) {
    if (userInput.includes('onboarding')) {
      return {
        name: 'Customer Onboarding',
        steps: [
          { tool: 'lark-mcp:bitable_v1_appTableRecord_create', params: {} },
          { tool: 'lark-mcp:docx_v1_document_create', params: {} },
          { tool: 'lark-mcp:calendar_v4_calendar_event_create', params: {} },
          { tool: 'lark-mcp:im_v1_message_create', params: {} }
        ]
      };
    }

    if (userInput.includes('workspace')) {
      return {
        name: 'Project Workspace Creation',
        steps: [
          { tool: 'lark-mcp:bitable_v1_app_list', params: {} },
          { tool: 'lark-mcp:docx_v1_document_create', params: {} },
          { tool: 'lark-mcp:calendar_v4_calendar_event_create', params: {} }
        ]
      };
    }

    return {
      name: 'Default Workflow',
      steps: [
        { tool: 'lark-mcp:bitable_v1_app_list', params: {} }
      ]
    };
  }

  function determineAnalysisType(userInput: string): string {
    if (userInput.includes('sales')) return 'Sales Performance';
    if (userInput.includes('retention')) return 'Customer Retention';
    if (userInput.includes('engagement')) return 'User Engagement';
    return 'General Analytics';
  }

  function determineIntegrationType(userInput: string): string {
    if (userInput.includes('YouTube')) return 'YouTube Integration';
    if (userInput.includes('GAS')) return 'Google Apps Script';
    if (userInput.includes('Context')) return 'Context Engineering';
    return 'Multi-System Integration';
  }

  function performAnalysis(data: any[], analysisType: string) {
    // Simulated analysis results
    return [
      { metric: 'Total Records', value: data.length },
      { metric: 'Growth Rate', value: '12%' },
      { metric: 'Top Performer', value: data[0]?.fields?.name || 'N/A' }
    ];
  }
});