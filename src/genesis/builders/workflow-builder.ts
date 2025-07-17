/**
 * Workflow Automation Builder
 * Lark自動化ワークフローの設計・実装機能
 */

export interface WorkflowTrigger {
  type: 'record_created' | 'record_updated' | 'field_changed' | 'scheduled' | 'manual' | 'webhook' | 'form_submitted';
  tableId?: string;
  fieldId?: string;
  conditions?: WorkflowCondition[];
  schedule?: {
    type: 'daily' | 'weekly' | 'monthly' | 'custom';
    time?: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    cronExpression?: string;
  };
  webhookConfig?: {
    url: string;
    method: 'GET' | 'POST';
    headers?: Record<string, string>;
  };
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'is_empty' | 'is_not_empty';
  value: any;
  logicalOperator?: 'and' | 'or';
}

export interface WorkflowAction {
  type:
    | 'create_record'
    | 'update_record'
    | 'delete_record'
    | 'send_notification'
    | 'send_email'
    | 'webhook'
    | 'script'
    | 'approval_request'
    | 'assign_task';
  config: {
    // 共通設定
    delay?: number; // 遅延実行（秒）

    // レコード操作
    targetTableId?: string;
    fieldMappings?: Record<string, any>;
    recordId?: string;

    // 通知設定
    recipients?: string[];
    message?: string;
    title?: string;

    // メール設定
    emailTemplate?: string;
    subject?: string;
    body?: string;
    attachments?: string[];

    // Webhook設定
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    payload?: any;

    // スクリプト設定
    scriptCode?: string;
    scriptLanguage?: 'javascript' | 'python';

    // 承認設定
    approvers?: string[];
    approvalType?: 'any' | 'all' | 'sequential';

    // タスク設定
    assignee?: string;
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high';
  };
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  errorHandling?: {
    retryCount: number;
    retryDelay: number;
    onError: 'stop' | 'continue' | 'notify';
    errorNotificationRecipients?: string[];
  };
  metadata: {
    createdAt: number;
    updatedAt: number;
    version: string;
    author: string;
  };
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  category: 'approval' | 'notification' | 'data_sync' | 'automation' | 'integration';
  description: string;
  template: Omit<WorkflowDefinition, 'id' | 'metadata'>;
  parameters: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'table' | 'field' | 'user';
    required: boolean;
    description: string;
    defaultValue?: any;
  }>;
}

export interface WorkflowExecutionResult {
  success: boolean;
  workflowId: string;
  executionId: string;
  triggeredAt: number;
  completedAt?: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  results: Array<{
    actionType: string;
    success: boolean;
    result?: any;
    error?: string;
    executedAt: number;
  }>;
  logs: string[];
  errors: string[];
}

/**
 * Workflow Automation Builder
 * ビジネスロジックから自動化ワークフローを設計・構築
 */
export class WorkflowBuilder {
  private static readonly WORKFLOW_TEMPLATES = new Map<string, WorkflowTemplate>([
    [
      'approval_workflow',
      {
        id: 'approval_workflow',
        name: '承認ワークフロー',
        category: 'approval',
        description: '新規レコード作成時の承認プロセス',
        template: {
          name: '{{entity_name}}承認ワークフロー',
          description: '{{entity_name}}の新規作成時に承認を要求',
          enabled: true,
          trigger: {
            type: 'record_created',
            tableId: '{{table_id}}',
          },
          actions: [
            {
              type: 'approval_request',
              config: {
                approvers: ['{{approver_user_id}}'],
                approvalType: 'any',
                title: '{{entity_name}}の承認依頼',
                message: '新しい{{entity_name}}が作成されました。承認をお願いします。',
              },
            },
            {
              type: 'update_record',
              config: {
                fieldMappings: {
                  '{{status_field}}': '承認待ち',
                },
              },
            },
          ],
        },
        parameters: [
          { name: 'entity_name', type: 'string', required: true, description: 'エンティティ名' },
          { name: 'table_id', type: 'table', required: true, description: '対象テーブル' },
          { name: 'approver_user_id', type: 'user', required: true, description: '承認者' },
          { name: 'status_field', type: 'field', required: true, description: 'ステータスフィールド' },
        ],
      },
    ],

    [
      'notification_workflow',
      {
        id: 'notification_workflow',
        name: '通知ワークフロー',
        category: 'notification',
        description: '重要なフィールド更新時の通知',
        template: {
          name: '{{field_name}}更新通知',
          description: '{{field_name}}が更新された時の通知',
          enabled: true,
          trigger: {
            type: 'field_changed',
            tableId: '{{table_id}}',
            fieldId: '{{field_id}}',
          },
          actions: [
            {
              type: 'send_notification',
              config: {
                recipients: ['{{recipient_user_id}}'],
                title: '{{field_name}}が更新されました',
                message: '{{field_name}}の値が変更されました。確認をお願いします。',
              },
            },
          ],
        },
        parameters: [
          { name: 'field_name', type: 'string', required: true, description: 'フィールド名' },
          { name: 'table_id', type: 'table', required: true, description: '対象テーブル' },
          { name: 'field_id', type: 'field', required: true, description: '対象フィールド' },
          { name: 'recipient_user_id', type: 'user', required: true, description: '通知受信者' },
        ],
      },
    ],

    [
      'data_sync_workflow',
      {
        id: 'data_sync_workflow',
        name: 'データ同期ワークフロー',
        category: 'data_sync',
        description: 'マスターデータ更新時の関連データ同期',
        template: {
          name: '{{source_table}}→{{target_table}}同期',
          description: 'マスターデータ更新時の自動同期',
          enabled: true,
          trigger: {
            type: 'record_updated',
            tableId: '{{source_table_id}}',
          },
          actions: [
            {
              type: 'update_record',
              config: {
                targetTableId: '{{target_table_id}}',
                fieldMappings: {
                  '{{target_field}}': '{{source_field}}',
                },
              },
            },
          ],
        },
        parameters: [
          { name: 'source_table', type: 'string', required: true, description: 'ソーステーブル名' },
          { name: 'target_table', type: 'string', required: true, description: 'ターゲットテーブル名' },
          { name: 'source_table_id', type: 'table', required: true, description: 'ソーステーブルID' },
          { name: 'target_table_id', type: 'table', required: true, description: 'ターゲットテーブルID' },
          { name: 'source_field', type: 'field', required: true, description: 'ソースフィールド' },
          { name: 'target_field', type: 'field', required: true, description: 'ターゲットフィールド' },
        ],
      },
    ],

    [
      'scheduled_report_workflow',
      {
        id: 'scheduled_report_workflow',
        name: '定期レポートワークフロー',
        category: 'automation',
        description: '定期的なレポート生成と送信',
        template: {
          name: '{{report_name}}定期レポート',
          description: '{{frequency}}でのレポート自動生成',
          enabled: true,
          trigger: {
            type: 'scheduled',
            schedule: {
              type: 'daily',
              time: '{{schedule_time}}',
            },
          },
          actions: [
            {
              type: 'script',
              config: {
                scriptCode: `
// レポートデータの取得と整形
const reportData = await generateReport('{{table_id}}');
return { success: true, data: reportData };
              `,
                scriptLanguage: 'javascript',
              },
            },
            {
              type: 'send_email',
              config: {
                recipients: ['{{recipient_email}}'],
                subject: '{{report_name}} - {{current_date}}',
                body: 'レポートを添付いたします。',
                emailTemplate: 'report_template',
              },
            },
          ],
        },
        parameters: [
          { name: 'report_name', type: 'string', required: true, description: 'レポート名' },
          { name: 'frequency', type: 'string', required: true, description: '頻度' },
          { name: 'schedule_type', type: 'string', required: true, description: 'スケジュールタイプ' },
          { name: 'schedule_time', type: 'string', required: true, description: '実行時刻' },
          { name: 'table_id', type: 'table', required: true, description: 'データソーステーブル' },
          { name: 'recipient_email', type: 'string', required: true, description: '送信先メールアドレス' },
        ],
      },
    ],
  ]);

  /**
   * ビジネスルールからワークフローを自動生成
   */
  static generateWorkflow(
    businessRules: Array<{
      id: string;
      name: string;
      description: string;
      condition: string;
      action: string;
      table: string;
    }>,
  ): {
    success: boolean;
    workflows: WorkflowDefinition[];
    errors: string[];
  } {
    const workflows: WorkflowDefinition[] = [];
    const errors: string[] = [];

    try {
      businessRules.forEach((rule, index) => {
        try {
          const workflow = this.convertRuleToWorkflow(rule, index);
          if (workflow) {
            workflows.push(workflow);
          }
        } catch (error) {
          errors.push(`Failed to convert rule ${rule.id}: ${error}`);
        }
      });

      return {
        success: errors.length === 0,
        workflows,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        workflows: [],
        errors: [`Workflow generation failed: ${error}`],
      };
    }
  }

  /**
   * ビジネスルールをワークフローに変換
   */
  private static convertRuleToWorkflow(rule: any, index: number): WorkflowDefinition | null {
    const workflowId = `workflow_${rule.id || index}`;

    // 条件の解析
    const trigger = this.parseConditionToTrigger(rule.condition, rule.table);
    if (!trigger) {
      return null;
    }

    // アクションの解析
    const actions = this.parseActionToWorkflowActions(rule.action, rule.table);
    if (actions.length === 0) {
      return null;
    }

    return {
      id: workflowId,
      name: rule.name || `Auto-generated workflow ${index + 1}`,
      description: rule.description || 'Automatically generated from business rule',
      enabled: true,
      trigger,
      actions,
      errorHandling: {
        retryCount: 3,
        retryDelay: 5000,
        onError: 'notify',
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0',
        author: 'Genesis Architect',
      },
    };
  }

  /**
   * 条件をトリガーに変換
   */
  private static parseConditionToTrigger(condition: string, tableName: string): WorkflowTrigger | null {
    const lowerCondition = condition.toLowerCase();

    // レコード作成時
    if (lowerCondition.includes('作成') || lowerCondition.includes('新規') || lowerCondition.includes('追加')) {
      return {
        type: 'record_created',
        tableId: tableName,
      };
    }

    // レコード更新時
    if (lowerCondition.includes('更新') || lowerCondition.includes('変更') || lowerCondition.includes('修正')) {
      return {
        type: 'record_updated',
        tableId: tableName,
      };
    }

    // スケジュール実行
    if (lowerCondition.includes('定期') || lowerCondition.includes('毎日') || lowerCondition.includes('毎週')) {
      let scheduleType: 'daily' | 'weekly' | 'monthly' = 'daily';

      if (lowerCondition.includes('毎週')) scheduleType = 'weekly';
      if (lowerCondition.includes('毎月')) scheduleType = 'monthly';

      return {
        type: 'scheduled',
        schedule: {
          type: scheduleType,
          time: '09:00',
        },
      };
    }

    // 手動実行
    if (lowerCondition.includes('手動') || lowerCondition.includes('マニュアル')) {
      return {
        type: 'manual',
      };
    }

    // デフォルト：レコード更新
    return {
      type: 'record_updated',
      tableId: tableName,
    };
  }

  /**
   * アクションをワークフローアクションに変換
   */
  private static parseActionToWorkflowActions(action: string, tableName: string): WorkflowAction[] {
    const actions: WorkflowAction[] = [];
    const lowerAction = action.toLowerCase();

    // 通知アクション
    if (lowerAction.includes('通知') || lowerAction.includes('お知らせ') || lowerAction.includes('連絡')) {
      actions.push({
        type: 'send_notification',
        config: {
          recipients: ['all_users'],
          title: '自動通知',
          message: action,
        },
      });
    }

    // メール送信
    if (lowerAction.includes('メール') || lowerAction.includes('email')) {
      actions.push({
        type: 'send_email',
        config: {
          recipients: ['admin@example.com'],
          subject: '自動メール',
          body: action,
        },
      });
    }

    // レコード更新
    if (lowerAction.includes('更新') || lowerAction.includes('変更') || lowerAction.includes('設定')) {
      actions.push({
        type: 'update_record',
        config: {
          targetTableId: tableName,
          fieldMappings: {
            status: '処理済み',
          },
        },
      });
    }

    // レコード作成
    if (lowerAction.includes('作成') || lowerAction.includes('追加') || lowerAction.includes('新規')) {
      actions.push({
        type: 'create_record',
        config: {
          targetTableId: tableName,
          fieldMappings: {
            name: '自動作成レコード',
            description: action,
          },
        },
      });
    }

    // 承認要求
    if (lowerAction.includes('承認') || lowerAction.includes('申請') || lowerAction.includes('レビュー')) {
      actions.push({
        type: 'approval_request',
        config: {
          approvers: ['manager@example.com'],
          approvalType: 'any',
          title: '承認依頼',
          message: action,
        },
      });
    }

    // Webhook
    if (lowerAction.includes('webhook') || lowerAction.includes('api') || lowerAction.includes('連携')) {
      actions.push({
        type: 'webhook',
        config: {
          url: 'https://example.com/webhook',
          method: 'POST',
          payload: {
            action: action,
            table: tableName,
          },
        },
      });
    }

    // デフォルトアクション（何も該当しない場合）
    if (actions.length === 0) {
      actions.push({
        type: 'send_notification',
        config: {
          recipients: ['admin'],
          title: 'ワークフロー実行',
          message: `アクション: ${action}`,
        },
      });
    }

    return actions;
  }

  /**
   * テンプレートからワークフローを生成
   */
  static generateFromTemplate(
    templateId: string,
    parameters: Record<string, any>,
  ): {
    success: boolean;
    workflow?: WorkflowDefinition;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      const template = this.WORKFLOW_TEMPLATES.get(templateId);
      if (!template) {
        return {
          success: false,
          errors: [`Template not found: ${templateId}`],
        };
      }

      // パラメータ検証
      const missingParams = template.parameters
        .filter((param) => param.required && !parameters[param.name])
        .map((param) => param.name);

      if (missingParams.length > 0) {
        return {
          success: false,
          errors: [`Missing required parameters: ${missingParams.join(', ')}`],
        };
      }

      // テンプレートの展開
      const workflowJson = JSON.stringify(template.template);
      let expandedJson = workflowJson;

      // パラメータ置換
      for (const [key, value] of Object.entries(parameters)) {
        const placeholder = `{{${key}}}`;
        expandedJson = expandedJson.replace(new RegExp(placeholder, 'g'), String(value));
      }

      // 日付プレースホルダーの置換
      expandedJson = expandedJson.replace(/{{current_date}}/g, new Date().toISOString().split('T')[0]);

      const expandedTemplate = JSON.parse(expandedJson);

      const workflow: WorkflowDefinition = {
        id: `workflow_${Date.now()}`,
        ...expandedTemplate,
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: '1.0.0',
          author: 'Genesis Architect',
          templateId,
        },
      };

      return {
        success: true,
        workflow,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Template generation failed: ${error}`],
      };
    }
  }

  /**
   * ワークフローの検証
   */
  static validateWorkflow(workflow: WorkflowDefinition): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // 基本検証
    if (!workflow.name) {
      errors.push('Workflow name is required');
    }

    if (!workflow.trigger) {
      errors.push('Workflow trigger is required');
    }

    if (!workflow.actions || workflow.actions.length === 0) {
      errors.push('Workflow must have at least one action');
    }

    // トリガー検証
    if (workflow.trigger) {
      const triggerValidation = this.validateTrigger(workflow.trigger);
      errors.push(...triggerValidation.errors);
      warnings.push(...triggerValidation.warnings);
    }

    // アクション検証
    workflow.actions?.forEach((action, index) => {
      const actionValidation = this.validateAction(action);
      errors.push(...actionValidation.errors.map((error) => `Action ${index + 1}: ${error}`));
      warnings.push(...actionValidation.warnings.map((warning) => `Action ${index + 1}: ${warning}`));
    });

    // 推奨事項
    if (!workflow.errorHandling) {
      suggestions.push('Consider adding error handling configuration');
    }

    if (workflow.actions && workflow.actions.length > 5) {
      suggestions.push('Workflow has many actions, consider breaking it into smaller workflows');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * トリガーの検証
   */
  private static validateTrigger(trigger: WorkflowTrigger): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (trigger.type) {
      case 'record_created':
      case 'record_updated':
      case 'field_changed':
        if (!trigger.tableId) {
          errors.push('Table ID is required for record-based triggers');
        }
        break;

      case 'scheduled':
        if (!trigger.schedule) {
          errors.push('Schedule configuration is required for scheduled triggers');
        }
        break;

      case 'webhook':
        if (!trigger.webhookConfig?.url) {
          errors.push('Webhook URL is required for webhook triggers');
        }
        break;
    }

    return { errors, warnings };
  }

  /**
   * アクションの検証
   */
  private static validateAction(action: WorkflowAction): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (action.type) {
      case 'create_record':
      case 'update_record':
        if (!action.config.targetTableId && action.type === 'create_record') {
          errors.push('Target table ID is required for record creation');
        }
        break;

      case 'send_notification':
        if (!action.config.recipients || action.config.recipients.length === 0) {
          errors.push('Recipients are required for notifications');
        }
        break;

      case 'send_email':
        if (!action.config.recipients || action.config.recipients.length === 0) {
          errors.push('Recipients are required for emails');
        }
        if (!action.config.subject) {
          warnings.push('Email subject is recommended');
        }
        break;

      case 'webhook':
        if (!action.config.url) {
          errors.push('URL is required for webhook actions');
        }
        break;

      case 'script':
        if (!action.config.scriptCode) {
          errors.push('Script code is required for script actions');
        }
        break;
    }

    return { errors, warnings };
  }

  /**
   * ワークフローテンプレートの取得
   */
  static getTemplates(category?: string): WorkflowTemplate[] {
    const templates = Array.from(this.WORKFLOW_TEMPLATES.values());

    if (category) {
      return templates.filter((template) => template.category === category);
    }

    return templates;
  }

  /**
   * カスタムテンプレートの追加
   */
  static addCustomTemplate(template: WorkflowTemplate): void {
    this.WORKFLOW_TEMPLATES.set(template.id, template);
  }

  /**
   * ワークフローの実行シミュレーション
   */
  static simulateExecution(workflow: WorkflowDefinition, sampleData: any): WorkflowExecutionResult {
    const executionId = `exec_${Date.now()}`;
    const startTime = Date.now();

    const result: WorkflowExecutionResult = {
      success: true,
      workflowId: workflow.id,
      executionId,
      triggeredAt: startTime,
      status: 'running',
      results: [],
      logs: [],
      errors: [],
    };

    try {
      // トリガー条件のチェック（シミュレーション）
      result.logs.push(`Workflow ${workflow.name} triggered`);

      // アクションの実行シミュレーション
      workflow.actions.forEach((action, index) => {
        const actionResult = this.simulateAction(action, sampleData);

        result.results.push({
          actionType: action.type,
          success: actionResult.success,
          result: actionResult.result,
          error: actionResult.error,
          executedAt: Date.now(),
        });

        result.logs.push(`Action ${index + 1} (${action.type}): ${actionResult.success ? 'Success' : 'Failed'}`);

        if (!actionResult.success) {
          result.errors.push(`Action ${index + 1} failed: ${actionResult.error}`);
        }
      });

      result.success = result.errors.length === 0;
      result.status = result.success ? 'completed' : 'failed';
      result.completedAt = Date.now();

      return result;
    } catch (error) {
      result.success = false;
      result.status = 'failed';
      result.errors.push(`Execution failed: ${error}`);
      result.completedAt = Date.now();

      return result;
    }
  }

  /**
   * アクション実行のシミュレーション
   */
  private static simulateAction(
    action: WorkflowAction,
    sampleData: any,
  ): {
    success: boolean;
    result?: any;
    error?: string;
  } {
    try {
      // 実際の実装では、各アクションタイプに応じた処理を行う
      // ここではシミュレーションのみ

      switch (action.type) {
        case 'send_notification':
          return {
            success: true,
            result: `Notification sent to ${action.config.recipients?.length || 0} recipients`,
          };

        case 'update_record':
          return {
            success: true,
            result: `Record updated with ${Object.keys(action.config.fieldMappings || {}).length} fields`,
          };

        case 'create_record':
          return {
            success: true,
            result: 'New record created successfully',
          };

        default:
          return {
            success: true,
            result: `${action.type} executed successfully`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: `Action simulation failed: ${error}`,
      };
    }
  }

  /**
   * ワークフローの最適化提案
   */
  static optimizeWorkflow(workflow: WorkflowDefinition): {
    optimizedWorkflow: WorkflowDefinition;
    optimizations: Array<{
      type: 'performance' | 'reliability' | 'maintainability';
      description: string;
      impact: 'low' | 'medium' | 'high';
    }>;
  } {
    const optimizations: Array<{
      type: 'performance' | 'reliability' | 'maintainability';
      description: string;
      impact: 'low' | 'medium' | 'high';
    }> = [];

    const optimizedWorkflow = { ...workflow };

    // エラーハンドリングの追加
    if (!optimizedWorkflow.errorHandling) {
      optimizedWorkflow.errorHandling = {
        retryCount: 3,
        retryDelay: 5000,
        onError: 'notify',
      };

      optimizations.push({
        type: 'reliability',
        description: 'Added error handling configuration',
        impact: 'high',
      });
    }

    // 遅延実行の最適化
    const hasMultipleActions = optimizedWorkflow.actions.length > 3;
    if (hasMultipleActions) {
      optimizations.push({
        type: 'performance',
        description: 'Consider adding delays between actions to prevent rate limiting',
        impact: 'medium',
      });
    }

    return {
      optimizedWorkflow,
      optimizations,
    };
  }
}
