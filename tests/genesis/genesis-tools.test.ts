/**
 * Tests for Genesis System Tools
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import * as lark from '@larksuiteoapi/node-sdk';
import {
  genesisCreateBase,
  genesisAnalyzeRequirements,
  genesisGenerateERDiagram,
  genesisOptimizeBase,
  genesisCreateView,
  genesisCreateDashboard,
  genesisCreateAutomation,
  genesisCreateFilterView,
} from '../../src/mcp-tool/tools/en/builtin-tools/genesis';

// Mock Lark client
const mockClient = {
  bitable: {
    app: {
      create: jest.fn(),
    },
    appTable: {
      create: jest.fn(),
    },
    appTableView: {
      create: jest.fn(),
    },
    appDashboard: {
      copy: jest.fn(),
    },
    appWorkflow: {
      list: jest.fn(),
    },
  },
  sheets: {
    spreadsheetSheetFilterView: {
      create: jest.fn(),
    },
  },
} as unknown as lark.Client;

describe('Genesis Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('genesisCreateBase', () => {
    test('should create base in simulation mode by default', async () => {
      const params = {
        requirements: 'Create a task management system',
        baseName: 'Task Manager',
        folderToken: 'folder_123',
        options: {
          enableAI: true,
          template: 'project' as const,
        },
      };

      const result = await genesisCreateBase.customHandler!(mockClient, params);

      expect(result.isError).toBeFalsy();
      expect(result.content).toBeDefined();
      expect(result.content![0].type).toBe('text');
      const text = result.content![0].text;
      expect(text).toContain('simulation');
      expect(text).toContain('Task Manager');
    });

    test('should create real base when useRealAPI is true', async () => {
      // Mock successful API responses
      (mockClient.bitable.app.create as jest.Mock).mockResolvedValue({
        data: { app: { app_token: 'app_123' } },
      });
      (mockClient.bitable.appTable.create as jest.Mock).mockResolvedValue({
        data: { table_id: 'table_123' },
      });

      const params = {
        requirements: 'Create a task management system',
        baseName: 'Task Manager',
        options: {
          useRealAPI: true,
        },
      };

      const result = await genesisCreateBase.customHandler!(mockClient, params);

      expect(result.isError).toBeFalsy();
      expect(mockClient.bitable.app.create).toHaveBeenCalledWith({
        data: {
          name: 'Task Manager',
          folder_token: '',
        },
      });
      expect(mockClient.bitable.appTable.create).toHaveBeenCalledTimes(3); // 3 tables created
      
      const text = result.content![0].text;
      expect(text).toContain('app_123');
      expect(text).toContain('Successfully created');
    });

    test('should handle API errors gracefully', async () => {
      (mockClient.bitable.app.create as jest.Mock).mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      const params = {
        requirements: 'Create a base',
        baseName: 'Test Base',
        options: {
          useRealAPI: true,
        },
      };

      const result = await genesisCreateBase.customHandler!(mockClient, params);

      expect(result.isError).toBeTruthy();
      expect(result.content![0].text).toContain('Failed to create Lark Base');
      expect(result.content![0].text).toContain('API rate limit exceeded');
    });
  });

  describe('genesisAnalyzeRequirements', () => {
    test('should analyze requirements and return suggestions', async () => {
      const params = {
        requirements: 'I need a CRM system for managing customer relationships',
        analysisDepth: 'detailed' as const,
      };

      const result = await genesisAnalyzeRequirements.customHandler!(mockClient, params);

      expect(result.isError).toBeFalsy();
      const text = result.content![0].text;
      expect(text).toContain('Task Management'); // Default simulation response
      expect(text).toContain('suggestedTables');
      expect(text).toContain('relationships');
      expect(text).toContain('aiFeatures');
    });
  });

  describe('genesisGenerateERDiagram', () => {
    test('should generate ER diagram in Mermaid format', async () => {
      const params = {
        tables: [
          {
            name: 'Users',
            fields: [
              { name: 'id', type: 'number', isPrimary: true },
              { name: 'name', type: 'text' },
              { name: 'email', type: 'email' },
            ],
          },
          {
            name: 'Tasks',
            fields: [
              { name: 'id', type: 'number', isPrimary: true },
              { name: 'title', type: 'text' },
              { name: 'user_id', type: 'number', isForeign: true },
            ],
          },
        ],
        format: 'mermaid' as const,
      };

      const result = await genesisGenerateERDiagram.customHandler!(mockClient, params);

      expect(result.isError).toBeFalsy();
      const text = result.content![0].text;
      expect(text).toContain('graph TD');
      expect(text).toContain('Users[Users]');
      expect(text).toContain('Tasks[Tasks]');
      expect(text).toContain('-->');
    });
  });

  describe('genesisCreateView', () => {
    test('should create view in simulation mode', async () => {
      const params = {
        appToken: 'app_123',
        tableId: 'table_123',
        viewConfig: {
          name: 'My Tasks',
          viewType: 'kanban' as const,
          filters: [
            { field: 'assignee', operator: 'is' as const, value: 'current_user' },
          ],
          sorts: [
            { field: 'priority', order: 'desc' as const },
          ],
        },
      };

      const result = await genesisCreateView.customHandler!(mockClient, params);

      expect(result.isError).toBeFalsy();
      const text = result.content![0].text;
      expect(text).toContain('simulation');
      expect(text).toContain('My Tasks');
      expect(text).toContain('kanban');
      expect(text).toContain('1 filters');
      expect(text).toContain('1 sort rules');
    });

    test('should create real view when useRealAPI is true', async () => {
      (mockClient.bitable.appTableView.create as jest.Mock).mockResolvedValue({
        data: { view: { view_id: 'view_123' } },
      });

      const params = {
        appToken: 'app_123',
        tableId: 'table_123',
        viewConfig: {
          name: 'My Tasks',
          viewType: 'grid' as const,
          useRealAPI: true,
        },
      };

      const result = await genesisCreateView.customHandler!(mockClient, params);

      expect(result.isError).toBeFalsy();
      expect(mockClient.bitable.appTableView.create).toHaveBeenCalledWith({
        path: {
          app_token: 'app_123',
          table_id: 'table_123',
        },
        data: {
          view_name: 'My Tasks',
          view_type: 'grid',
        },
      });
      
      const text = result.content![0].text;
      expect(text).toContain('view_123');
      expect(text).toContain('Successfully created');
    });
  });

  describe('genesisCreateDashboard', () => {
    test('should create dashboard by copying', async () => {
      const params = {
        appToken: 'app_123',
        sourceDashboardId: 'dashboard_456',
        dashboardConfig: {
          name: 'Sales Dashboard',
          customizations: {
            theme: 'dark' as const,
            widgets: [
              { type: 'chart' as const, config: { chartType: 'bar' } },
              { type: 'metric' as const, config: { metric: 'revenue' } },
            ],
          },
        },
      };

      const result = await genesisCreateDashboard.customHandler!(mockClient, params);

      expect(result.isError).toBeFalsy();
      const text = result.content![0].text;
      expect(text).toContain('Sales Dashboard');
      expect(text).toContain('dashboard_456');
      expect(text).toContain('2'); // widget count
    });
  });

  describe('genesisCreateAutomation', () => {
    test('should create automation workflow', async () => {
      const params = {
        appToken: 'app_123',
        automationConfig: {
          name: 'Task Assignment Automation',
          description: 'Auto-assign tasks based on workload',
          trigger: {
            type: 'record_created' as const,
            config: { table: 'Tasks' },
          },
          actions: [
            {
              type: 'send_notification' as const,
              config: { recipient: 'assignee' },
            },
            {
              type: 'update_record' as const,
              config: { field: 'status', value: 'assigned' },
            },
          ],
          conditions: [
            {
              field: 'priority',
              operator: 'equals' as const,
              value: 'high',
            },
          ],
        },
      };

      const result = await genesisCreateAutomation.customHandler!(mockClient, params);

      expect(result.isError).toBeFalsy();
      const text = result.content![0].text;
      expect(text).toContain('Task Assignment Automation');
      expect(text).toContain('record_created');
      expect(text).toContain('2 actions');
      expect(text).toContain('1'); // condition count
    });
  });

  describe('genesisCreateFilterView', () => {
    test('should create filter view for spreadsheet', async () => {
      const params = {
        spreadsheetToken: 'sheet_123',
        sheetId: 'sheet_456',
        filterViewConfig: {
          title: 'High Priority Tasks',
          range: {
            startRow: 0,
            endRow: 100,
            startColumn: 0,
            endColumn: 10,
          },
          filterConditions: [
            {
              column: 3,
              condition: {
                filterType: 'text' as const,
                operator: 'equals' as const,
                values: ['High', 'Urgent'],
              },
            },
          ],
        },
      };

      const result = await genesisCreateFilterView.customHandler!(mockClient, params);

      expect(result.isError).toBeFalsy();
      const text = result.content![0].text;
      expect(text).toContain('High Priority Tasks');
      expect(text).toContain('101 rows, 11 columns');
      expect(text).toContain('1 filter conditions');
    });
  });

  describe('genesisOptimizeBase', () => {
    test('should provide optimization recommendations', async () => {
      const params = {
        baseToken: 'app_123',
        optimizationGoals: ['performance', 'automation'],
        applyChanges: false,
      };

      const result = await genesisOptimizeBase.customHandler!(mockClient, params);

      expect(result.isError).toBeFalsy();
      const text = result.content![0].text;
      expect(text).toContain('app_123');
      expect(text).toContain('recommendations');
      expect(text).toContain('Performance');
      expect(text).toContain('Automation');
      expect(text).toContain('Preview mode only');
    });
  });
});