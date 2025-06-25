/**
 * Base Operations Specialist Agent
 * Specialized for Lark Base/Bitable operations
 */

import { Agent, AgentConfig, AgentTool } from '../agent';
import { AgentCapability, AgentMetadata } from '../types';
import { TOOL_OPERATION_PROMPTS, PromptUtils } from '../prompts';
import { globalRegistry } from '../registry';

export class BaseSpecialistAgent extends Agent {
  constructor(config: Partial<AgentConfig> = {}) {
    const specialistConfig: AgentConfig = {
      name: 'Base Operations Specialist',
      instructions: `
あなたはLark Base（Bitable）操作の専門エージェントです。
以下の操作を正確かつ効率的に実行してください：

**専門領域:**
• テーブル作成・設定・管理
• レコードの検索・作成・更新・削除
• ビューの作成・フィルタリング
• フィールド設定・バリデーション
• Base間の連携・データ移行
• 一括処理・バッチ操作

**操作原則:**
1. データ整合性を最優先
2. 権限確認を必ず実行
3. 大量データは分割処理
4. 操作ログを詳細に記録
5. エラー時は適切なロールバック

**出力形式:**
常に構造化されたJSON形式で結果を返してください。
`,
      tools: [], // Will be set after super()
      model: 'gpt-4',
      temperature: 0.1, // 精密な操作のため低温度
      maxTokens: 4000,
      language: 'ja',
      ...config
    };

    super(specialistConfig);
    
    // Set tools after super() call
    this.config.tools = this.createSpecialistTools();
  }

  private createSpecialistTools(): AgentTool[] {
    return [
      {
        name: 'search_base_records',
        description: 'Search records in Lark Base tables with advanced filtering',
        execute: async (params: any) => {
          const { tableId, appId, filters, pageSize = 100 } = params;
          
          const prompt = PromptUtils.fillTemplate(TOOL_OPERATION_PROMPTS.BASE_OPERATIONS, {
            OPERATION_TYPE: 'search_records',
            TABLE_INFO: JSON.stringify({ tableId, appId }),
            PARAMETERS: JSON.stringify({ filters, pageSize })
          });

          // Execute search via MCP tools
          return this.executeMcpTool('bitable.v1.app.table.record.search', {
            app_token: appId,
            table_id: tableId,
            filter: filters,
            page_size: pageSize
          });
        },
        schema: {
          type: 'object',
          properties: {
            appId: { type: 'string', description: 'Base application ID' },
            tableId: { type: 'string', description: 'Table ID within the Base' },
            filters: { type: 'object', description: 'Search filters' },
            pageSize: { type: 'number', default: 100 }
          },
          required: ['appId', 'tableId']
        }
      },

      {
        name: 'create_base_record',
        description: 'Create new record in Lark Base table',
        execute: async (params: any) => {
          const { tableId, appId, fields } = params;
          
          return this.executeMcpTool('bitable.v1.app.table.record.create', {
            app_token: appId,
            table_id: tableId,
            fields
          });
        },
        schema: {
          type: 'object',
          properties: {
            appId: { type: 'string', description: 'Base application ID' },
            tableId: { type: 'string', description: 'Table ID' },
            fields: { type: 'object', description: 'Record field values' }
          },
          required: ['appId', 'tableId', 'fields']
        }
      },

      {
        name: 'update_base_record',
        description: 'Update existing record in Lark Base table',
        execute: async (params: any) => {
          const { tableId, appId, recordId, fields } = params;
          
          return this.executeMcpTool('bitable.v1.app.table.record.update', {
            app_token: appId,
            table_id: tableId,
            record_id: recordId,
            fields
          });
        },
        schema: {
          type: 'object',
          properties: {
            appId: { type: 'string', description: 'Base application ID' },
            tableId: { type: 'string', description: 'Table ID' },
            recordId: { type: 'string', description: 'Record ID to update' },
            fields: { type: 'object', description: 'Updated field values' }
          },
          required: ['appId', 'tableId', 'recordId', 'fields']
        }
      },

      {
        name: 'batch_create_records',
        description: 'Create multiple records in batch',
        execute: async (params: any) => {
          const { tableId, appId, records } = params;
          
          // Split large batches for stability
          const batchSize = 500;
          const results = [];
          
          for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            
            const result = await this.executeMcpTool('bitable.v1.app.table.record.batch_create', {
              app_token: appId,
              table_id: tableId,
              records: batch.map((fields: any) => ({ fields }))
            });
            
            results.push(result);
          }
          
          return {
            success: true,
            totalCreated: records.length,
            batches: results.length,
            results
          };
        },
        schema: {
          type: 'object',
          properties: {
            appId: { type: 'string', description: 'Base application ID' },
            tableId: { type: 'string', description: 'Table ID' },
            records: { 
              type: 'array', 
              description: 'Array of record field objects',
              items: { type: 'object' }
            }
          },
          required: ['appId', 'tableId', 'records']
        }
      },

      {
        name: 'get_table_schema',
        description: 'Get table structure and field definitions',
        execute: async (params: any) => {
          const { tableId, appId } = params;
          
          return this.executeMcpTool('bitable.v1.app.table.get', {
            app_token: appId,
            table_id: tableId
          });
        },
        schema: {
          type: 'object',
          properties: {
            appId: { type: 'string', description: 'Base application ID' },
            tableId: { type: 'string', description: 'Table ID' }
          },
          required: ['appId', 'tableId']
        }
      },

      {
        name: 'create_table_view',
        description: 'Create filtered view of table data',
        execute: async (params: any) => {
          const { tableId, appId, viewName, filter, sort } = params;
          
          return this.executeMcpTool('bitable.v1.app.table.view.create', {
            app_token: appId,
            table_id: tableId,
            view_name: viewName,
            filter,
            sort
          });
        },
        schema: {
          type: 'object',
          properties: {
            appId: { type: 'string', description: 'Base application ID' },
            tableId: { type: 'string', description: 'Table ID' },
            viewName: { type: 'string', description: 'Name for the new view' },
            filter: { type: 'object', description: 'View filter conditions' },
            sort: { type: 'array', description: 'Sort configuration' }
          },
          required: ['appId', 'tableId', 'viewName']
        }
      }
    ];
  }

  /**
   * Execute MCP tool with error handling and structured response
   */
  private async executeMcpTool(toolName: string, params: any): Promise<any> {
    try {
      // This would integrate with the actual MCP tool system
      // For now, return a structured response format
      
      const response = {
        success: true,
        tool: toolName,
        parameters: params,
        timestamp: new Date().toISOString(),
        data: {
          // Tool execution results would go here
          message: `Executed ${toolName} successfully`,
          ...params
        }
      };

      return response;

    } catch (error) {
      return {
        success: false,
        tool: toolName,
        parameters: params,
        error: String(error),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Analyze Base operation complexity and recommend approach
   */
  async analyzeOperation(operation: string, context: any): Promise<{
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedTime: number;
    recommendations: string[];
    requiredTools: string[];
  }> {
    const lowerOp = operation.toLowerCase();
    
    // Simple operations
    if (lowerOp.includes('get') || lowerOp.includes('read') || lowerOp.includes('search')) {
      return {
        complexity: 'simple',
        estimatedTime: 30, // seconds
        recommendations: [
          'Use appropriate filters to limit data size',
          'Consider pagination for large datasets'
        ],
        requiredTools: ['search_base_records', 'get_table_schema']
      };
    }

    // Moderate operations
    if (lowerOp.includes('create') || lowerOp.includes('update') || lowerOp.includes('delete')) {
      return {
        complexity: 'moderate',
        estimatedTime: 60,
        recommendations: [
          'Validate data before modification',
          'Use transactions for consistency',
          'Create backup before bulk operations'
        ],
        requiredTools: ['create_base_record', 'update_base_record']
      };
    }

    // Complex operations
    return {
      complexity: 'complex',
      estimatedTime: 300,
      recommendations: [
        'Break down into smaller batches',
        'Monitor progress and implement retry logic',
        'Consider impact on other users',
        'Schedule during low-usage periods'
      ],
      requiredTools: ['batch_create_records', 'create_table_view']
    };
  }
}

/**
 * Create and register Base Specialist Agent
 */
export async function createBaseSpecialist(): Promise<string> {
  const capabilities: AgentCapability[] = [
    {
      name: 'base_operations',
      description: 'Lark Base table and record operations',
      category: 'base',
      inputSchema: {
        type: 'object',
        properties: {
          operation: { type: 'string' },
          appId: { type: 'string' },
          tableId: { type: 'string' }
        }
      }
    },
    {
      name: 'batch_processing',
      description: 'Large-scale batch operations on Base data',
      category: 'base',
      inputSchema: {
        type: 'object',
        properties: {
          batchSize: { type: 'number' },
          records: { type: 'array' }
        }
      }
    },
    {
      name: 'data_validation',
      description: 'Validate and clean Base data',
      category: 'base'
    },
    {
      name: 'schema_management',
      description: 'Manage table structures and field definitions',
      category: 'base'
    }
  ];

  const metadata: AgentMetadata = {
    id: `base_specialist_${Date.now()}`,
    name: 'Base Operations Specialist',
    type: 'specialist',
    capabilities,
    status: 'idle',
    maxConcurrentTasks: 3,
    currentTasks: 0,
    lastHeartbeat: new Date(),
    version: '1.0.0'
  };

  const registered = await globalRegistry.registerAgent(metadata);
  if (registered) {
    console.log('✅ Base Specialist Agent registered successfully');
    return metadata.id;
  } else {
    throw new Error('Failed to register Base Specialist Agent');
  }
}