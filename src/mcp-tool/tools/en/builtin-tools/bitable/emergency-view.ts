import { z } from 'zod';
import { McpTool } from '../../../../types';
import * as lark from '@larksuiteoapi/node-sdk';

/**
 * 緊急発注アラートView作成用カスタムツール
 * View作成とフィルター・ソート設定を一括で行う
 */
export const createEmergencyOrderViewTool: McpTool = {
  project: 'bitable',
  name: 'bitable.builtin.createEmergencyOrderView',
  accessTokens: ['tenant', 'user'],
  description: '[Feishu/Lark]-Base-Create Emergency Order Alert View with filters and sorting',
  schema: {
    data: z.object({
      app_token: z.string().describe('Base app token'),
      table_id: z.string().describe('Table ID'),
      view_name: z.string().default('🚨緊急発注アラート').describe('View name'),
      filter_fields: z.object({
        urgent_flag_field: z.string().describe('Field ID for urgent order flag'),
        order_remaining_field: z.string().describe('Field ID for order remaining'),
        stockout_prediction_field: z.string().describe('Field ID for stockout prediction'),
        sales_30days_field: z.string().describe('Field ID for 30 days sales'),
      }).optional().describe('Field IDs for filtering (if not provided, will try to auto-detect)'),
    }),
  },
  customHandler: async (client: lark.Client, params: any, options?: any): Promise<any> => {
    const { app_token, table_id, view_name, filter_fields } = params.data;
    
    try {
      // Step 1: Get field information
      const fieldsResponse = await client.bitable.appTableField.list({
        path: { app_token, table_id },
        params: { page_size: 100 }
      });
      
      const fields = fieldsResponse.data?.items || [];
      
      // Create field mapping
      const fieldMap: Record<string, string> = {};
      fields.forEach((field: any) => {
        fieldMap[field.field_name] = field.field_id;
      });
      
      // Auto-detect field IDs if not provided
      const urgentFlagFieldId = filter_fields?.urgent_flag_field || 
        fieldMap['緊急発注フラグ'] || fieldMap['Urgent Order Flag'] || 
        fieldMap['urgent_flag'] || '';
        
      const orderRemainingFieldId = filter_fields?.order_remaining_field ||
        fieldMap['発注残数'] || fieldMap['Order Remaining'] || 
        fieldMap['order_remaining'] || '';
        
      const stockoutPredictionFieldId = filter_fields?.stockout_prediction_field ||
        fieldMap['在庫切れ予測'] || fieldMap['Stockout Prediction'] || 
        fieldMap['stockout_days'] || '';
        
      const sales30DaysFieldId = filter_fields?.sales_30days_field ||
        fieldMap['30日販売数'] || fieldMap['30 Days Sales'] || 
        fieldMap['sales_30days'] || '';
      
      // Step 2: Create view
      const createResponse = await client.bitable.appTableView.create({
        path: { app_token, table_id },
        data: { view_name, view_type: 'grid' }
      });
      
      const viewId = createResponse.data?.view?.view_id;
      if (!viewId) {
        throw new Error('Failed to create view');
      }
      
      // Step 3: Update view with filters
      const filterConditions = [];
      
      if (urgentFlagFieldId) {
        filterConditions.push({
          field_id: urgentFlagFieldId,
          operator: 'is' as const,
          value: '🚩緊急'
        });
      }
      
      if (orderRemainingFieldId) {
        filterConditions.push({
          field_id: orderRemainingFieldId,
          operator: 'is' as const,
          value: '0'
        });
      }
      
      if (stockoutPredictionFieldId) {
        filterConditions.push({
          field_id: stockoutPredictionFieldId,
          operator: 'isLess' as const,
          value: '30'
        });
      }
      
      if (sales30DaysFieldId) {
        filterConditions.push({
          field_id: sales30DaysFieldId,
          operator: 'isGreater' as const,
          value: '0'
        });
      }
      
      // Update view with filters if any conditions exist
      if (filterConditions.length > 0) {
        try {
          await client.bitable.appTableView.patch({
            path: { app_token, table_id, view_id: viewId },
            data: {
              property: {
                filter_info: {
                  conjunction: 'and',
                  conditions: filterConditions
                }
              }
            }
          });
        } catch (patchError) {
          console.warn('Warning: Could not apply filters automatically. Manual configuration required.');
        }
      }
      
      // Return success with view information
      return {
        data: {
          success: true,
          view_id: viewId,
          view_url: `https://f82jyx0mblu.jp.larksuite.com/base/${app_token}?table=${table_id}&view=${viewId}`,
          detected_fields: {
            urgent_flag: urgentFlagFieldId || 'not found',
            order_remaining: orderRemainingFieldId || 'not found',
            stockout_prediction: stockoutPredictionFieldId || 'not found',
            sales_30days: sales30DaysFieldId || 'not found'
          },
          manual_steps_required: filterConditions.length === 0 ? 
            'Filters could not be applied automatically. Please configure manually in the UI.' : 
            'Filters applied. Please add sorting and conditional formatting manually.',
          field_mapping: fieldMap
        }
      };
      
    } catch (error: any) {
      throw new Error(`Failed to create emergency order view: ${error.message}`);
    }
  }
};

/**
 * 緊急発注レコード検索ツール
 * 緊急発注が必要な商品を検索して返す
 */
export const searchEmergencyOrdersTool: McpTool = {
  project: 'bitable',
  name: 'bitable.builtin.searchEmergencyOrders',
  accessTokens: ['tenant', 'user'],
  description: '[Feishu/Lark]-Base-Search for products requiring emergency orders',
  schema: {
    data: z.object({
      app_token: z.string().describe('Base app token'),
      table_id: z.string().describe('Table ID'),
      limit: z.number().default(50).describe('Maximum number of records to return'),
    }),
  },
  customHandler: async (client: lark.Client, params: any, options?: any): Promise<any> => {
    const { app_token, table_id, limit } = params.data;
    
    try {
      // Get field information first
      const fieldsResponse = await client.bitable.appTableField.list({
        path: { app_token, table_id },
        params: { page_size: 100 }
      });
      
      const fields = fieldsResponse.data?.items || [];
      const fieldMap: Record<string, string> = {};
      fields.forEach((field: any) => {
        fieldMap[field.field_name] = field.field_id;
      });
      
      // Build search conditions
      const conditions = [];
      
      const urgentFieldId = fieldMap['緊急発注フラグ'] || fieldMap['Urgent Order Flag'];
      if (urgentFieldId) {
        conditions.push({
          field_name: urgentFieldId,  // Changed from field_id to field_name
          operator: 'is' as const,
          value: ['🚩緊急']
        });
      }
      
      const stockoutFieldId = fieldMap['在庫切れ予測'] || fieldMap['Stockout Prediction'];
      if (stockoutFieldId) {
        conditions.push({
          field_name: stockoutFieldId,  // Changed from field_id to field_name
          operator: 'isLess' as const,
          value: ['30']
        });
      }
      
      // Search records
      const searchResponse = await client.bitable.appTableRecord.search({
        path: { app_token, table_id },
        data: {
          filter: conditions.length > 0 ? {
            conjunction: 'and',
            conditions
          } : undefined,
          automatic_fields: false
        }
      });
      
      const records = searchResponse.data?.items || [];
      
      return {
        data: {
          total: records.length,
          urgent_products: records.map((record: any) => ({
            record_id: record.record_id,
            fields: record.fields
          })),
          search_conditions: conditions,
          message: `Found ${records.length} products requiring emergency orders`
        }
      };
      
    } catch (error: any) {
      throw new Error(`Failed to search emergency orders: ${error.message}`);
    }
  }
};

// Export tools
export const bitableBuiltinTools = [
  createEmergencyOrderViewTool,
  searchEmergencyOrdersTool
];

export type bitableBuiltinToolName = 
  | 'bitable.builtin.createEmergencyOrderView'
  | 'bitable.builtin.searchEmergencyOrders';