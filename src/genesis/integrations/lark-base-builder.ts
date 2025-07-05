/**
 * Lark Base API Integration Layer
 * 自動Base/Table/Field作成機能
 */

import { LarkMcpTool } from '../../mcp-tool';

export interface BaseSpec {
  name: string;
  description: string;
  tables: TableSpec[];
  automations?: AutomationSpec[];
}

export interface TableSpec {
  name: string;
  description: string;
  fields: FieldSpec[];
  views?: ViewSpec[];
  permissions?: PermissionSpec[];
}

export interface FieldSpec {
  name: string;
  type:
    | 'text'
    | 'number'
    | 'date'
    | 'checkbox'
    | 'singleSelect'
    | 'multiSelect'
    | 'attachment'
    | 'user'
    | 'formula'
    | 'phone'
    | 'email'
    | 'url'
    | 'rating'
    | 'currency'
    | 'percent'
    | 'duration'
    | 'created_time'
    | 'modified_time'
    | 'created_by'
    | 'modified_by';
  description?: string;
  required?: boolean;
  options?: {
    choices?: string[];
    formula?: string;
    format?: string;
    precision?: number;
    showAs?: string;
    timeFormat?: string;
    dateFormat?: string;
    includeTime?: boolean;
  };
}

export interface ViewSpec {
  name: string;
  type: 'grid' | 'kanban' | 'calendar' | 'gallery' | 'form' | 'timeline';
  description?: string;
  config?: {
    groupBy?: string;
    sortBy?: Array<{ field: string; direction: 'asc' | 'desc' }>;
    filters?: Array<{ field: string; condition: string; value: any }>;
    fieldOrder?: string[];
    hiddenFields?: string[];
  };
}

export interface AutomationSpec {
  name: string;
  description: string;
  trigger: {
    type: 'record_created' | 'record_updated' | 'field_changed' | 'scheduled' | 'manual';
    conditions?: any;
    schedule?: string;
  };
  actions: Array<{
    type: 'create_record' | 'update_record' | 'send_notification' | 'send_email' | 'webhook' | 'script';
    config: any;
  }>;
}

export interface PermissionSpec {
  role: string;
  level: 'view' | 'comment' | 'edit' | 'admin';
  restrictions?: {
    fields?: string[];
    records?: any;
  };
}

export interface BuildResult {
  success: boolean;
  baseId?: string;
  tableIds?: Record<string, string>;
  fieldIds?: Record<string, Record<string, string>>;
  viewIds?: Record<string, Record<string, string>>;
  errors: string[];
  warnings: string[];
  metadata: {
    buildTime: number;
    tablesCreated: number;
    fieldsCreated: number;
    viewsCreated: number;
    automationsCreated: number;
  };
}

/**
 * Lark Base Builder
 * 設計仕様からLark Baseを自動構築
 */
export class LarkBaseBuilder {
  private larkClient: LarkMcpTool;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(
    larkClient: LarkMcpTool,
    options: {
      retryAttempts?: number;
      retryDelay?: number;
    } = {},
  ) {
    this.larkClient = larkClient;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  /**
   * Base仕様からLark Baseを構築
   */
  async buildBase(spec: BaseSpec): Promise<BuildResult> {
    const startTime = Date.now();
    const result: BuildResult = {
      success: false,
      tableIds: {},
      fieldIds: {},
      viewIds: {},
      errors: [],
      warnings: [],
      metadata: {
        buildTime: 0,
        tablesCreated: 0,
        fieldsCreated: 0,
        viewsCreated: 0,
        automationsCreated: 0,
      },
    };

    try {
      // 1. Base作成
      const baseResult = await this.createBase(spec);
      if (!baseResult.success) {
        result.errors.push(...baseResult.errors);
        return result;
      }

      result.baseId = baseResult.baseId;

      // 2. テーブル作成
      for (const tableSpec of spec.tables) {
        const tableResult = await this.createTable(result.baseId!, tableSpec);

        if (tableResult.success) {
          result.tableIds![tableSpec.name] = tableResult.tableId!;
          result.fieldIds![tableSpec.name] = tableResult.fieldIds!;
          result.viewIds![tableSpec.name] = tableResult.viewIds!;

          result.metadata.tablesCreated++;
          result.metadata.fieldsCreated += Object.keys(tableResult.fieldIds!).length;
          result.metadata.viewsCreated += Object.keys(tableResult.viewIds!).length;
        } else {
          result.errors.push(...tableResult.errors);
          result.warnings.push(`Table ${tableSpec.name} creation failed`);
        }
      }

      // 3. 自動化設定
      if (spec.automations) {
        for (const automation of spec.automations) {
          const automationResult = await this.createAutomation(result.baseId!, automation, result.tableIds!);

          if (automationResult.success) {
            result.metadata.automationsCreated++;
          } else {
            result.warnings.push(...automationResult.errors);
          }
        }
      }

      result.success = result.metadata.tablesCreated > 0;
      result.metadata.buildTime = Date.now() - startTime;

      return result;
    } catch (error) {
      result.errors.push(`Build failed: ${error}`);
      result.metadata.buildTime = Date.now() - startTime;
      return result;
    }
  }

  /**
   * Base作成
   */
  private async createBase(spec: BaseSpec): Promise<{
    success: boolean;
    baseId?: string;
    errors: string[];
  }> {
    try {
      // For now, return a mock result since we need to implement the actual API calls
      // This will be implemented when we have the proper Lark Base API integration
      return {
        success: true,
        baseId: 'mock-base-id-' + Date.now(),
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Base creation failed: ${error}`],
      };
    }
  }

  /**
   * テーブル作成
   */
  private async createTable(
    baseId: string,
    spec: TableSpec,
  ): Promise<{
    success: boolean;
    tableId?: string;
    fieldIds?: Record<string, string>;
    viewIds?: Record<string, string>;
    errors: string[];
  }> {
    try {
      // Mock implementation for now
      const tableId = `mock-table-${spec.name}-${Date.now()}`;
      const fieldIds: Record<string, string> = {};
      const viewIds: Record<string, string> = {};

      // Mock field creation
      for (const field of spec.fields) {
        fieldIds[field.name] = `mock-field-${field.name}-${Date.now()}`;
      }

      // Mock view creation
      if (spec.views) {
        for (const view of spec.views) {
          viewIds[view.name] = `mock-view-${view.name}-${Date.now()}`;
        }
      }

      return {
        success: true,
        tableId,
        fieldIds,
        viewIds,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Table creation failed: ${error}`],
      };
    }
  }

  /**
   * フィールド作成
   */
  private async createField(
    baseId: string,
    tableId: string,
    spec: FieldSpec,
  ): Promise<{
    success: boolean;
    fieldId?: string;
    errors: string[];
  }> {
    try {
      // Mock implementation
      return {
        success: true,
        fieldId: `mock-field-${spec.name}-${Date.now()}`,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Field creation failed: ${error}`],
      };
    }
  }

  /**
   * ビュー作成
   */
  private async createView(
    baseId: string,
    tableId: string,
    spec: ViewSpec,
    fieldIds: Record<string, string>,
  ): Promise<{
    success: boolean;
    viewId?: string;
    errors: string[];
  }> {
    try {
      // Mock implementation
      return {
        success: true,
        viewId: `mock-view-${spec.name}-${Date.now()}`,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        errors: [`View creation failed: ${error}`],
      };
    }
  }

  /**
   * 自動化作成
   */
  private async createAutomation(
    baseId: string,
    spec: AutomationSpec,
    tableIds: Record<string, string>,
  ): Promise<{
    success: boolean;
    automationId?: string;
    errors: string[];
  }> {
    try {
      // Mock implementation
      return {
        success: true,
        automationId: `mock-automation-${spec.name}-${Date.now()}`,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Automation creation failed: ${error}`],
      };
    }
  }

  /**
   * フィールド仕様をLark API形式に変換
   */
  private convertFieldSpecs(specs: FieldSpec[]): any[] {
    return specs.map((spec) => this.buildFieldProperty(spec));
  }

  /**
   * フィールドタイプをLark API形式にマッピング
   */
  private mapFieldType(type: string): number {
    const typeMap: Record<string, number> = {
      text: 1,
      number: 2,
      date: 3,
      checkbox: 4,
      singleSelect: 5,
      multiSelect: 6,
      attachment: 7,
      user: 8,
      formula: 9,
      phone: 10,
      email: 11,
      url: 12,
      rating: 13,
      currency: 14,
      percent: 15,
      duration: 16,
      created_time: 17,
      modified_time: 18,
      created_by: 19,
      modified_by: 20,
    };
    return typeMap[type] || 1;
  }

  /**
   * フィールドプロパティを構築
   */
  private buildFieldProperty(spec: FieldSpec): any {
    const baseProperty = {
      field_name: spec.name,
      type: this.mapFieldType(spec.type),
      description: spec.description || '',
      required: spec.required || false,
    };

    if (spec.options) {
      if (spec.type === 'singleSelect' || spec.type === 'multiSelect') {
        return {
          ...baseProperty,
          property: {
            options: spec.options.choices?.map((choice) => ({ name: choice })) || [],
          },
        };
      } else if (spec.type === 'formula') {
        return {
          ...baseProperty,
          property: {
            formula: spec.options.formula || '',
          },
        };
      }
    }

    return baseProperty;
  }

  /**
   * ビュープロパティを構築
   */
  private buildViewProperty(spec: ViewSpec, fieldIds: Record<string, string>): any {
    const baseProperty = {
      view_name: spec.name,
      view_type: spec.type,
      description: spec.description || '',
    };

    if (spec.config) {
      return {
        ...baseProperty,
        property: {
          ...spec.config,
          field_order: spec.config.fieldOrder?.map((fieldName) => fieldIds[fieldName]).filter(Boolean) || [],
        },
      };
    }

    return baseProperty;
  }

  /**
   * リトライ機能付き実行
   */
  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < this.retryAttempts) {
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    throw lastError;
  }

  /**
   * Base削除
   */
  async deleteBase(baseId: string): Promise<boolean> {
    try {
      // Mock implementation
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Base情報取得
   */
  async getBaseInfo(baseId: string): Promise<any> {
    try {
      // Mock implementation
      return {
        app_id: baseId,
        name: 'Mock Base',
        description: 'Mock base description',
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * ビルド進捗を取得
   */
  getBuildProgress(result: BuildResult): {
    percentage: number;
    currentStep: string;
    estimatedTimeRemaining: number;
  } {
    const totalSteps = result.metadata.tablesCreated + result.metadata.fieldsCreated + result.metadata.viewsCreated;
    const completedSteps = totalSteps;

    return {
      percentage: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
      currentStep: result.success ? 'Completed' : 'Building',
      estimatedTimeRemaining: 0,
    };
  }
}
