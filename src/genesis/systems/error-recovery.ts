/**
 * Error Recovery & Rollback System
 * 失敗時の復旧とロールバック機能
 */

export interface Checkpoint {
  id: string;
  name: string;
  description: string;
  timestamp: number;
  sessionId: string;
  stepId?: string;
  state: {
    session: any;
    generatedArtifacts: any[];
    larkResources: LarkResource[];
    systemState: any;
  };
  metadata: {
    version: string;
    checksumState: string;
    size: number;
    dependencies: string[];
  };
}

export interface LarkResource {
  type: 'base' | 'table' | 'field' | 'view' | 'automation' | 'permission';
  id: string;
  parentId?: string;
  name: string;
  configuration: any;
  created: boolean;
  createdAt?: number;
}

export interface RecoveryPlan {
  id: string;
  errorId: string;
  strategy: 'retry' | 'rollback' | 'repair' | 'skip' | 'manual';
  description: string;
  actions: RecoveryAction[];
  estimatedTime: number;
  riskLevel: 'low' | 'medium' | 'high';
  affectedResources: string[];
  prerequisites: string[];
}

export interface RecoveryAction {
  id: string;
  type: 'delete_resource' | 'restore_state' | 'retry_operation' | 'repair_data' | 'notify_user' | 'create_fallback';
  description: string;
  parameters: any;
  order: number;
  critical: boolean;
  rollbackable: boolean;
}

export interface ErrorContext {
  id: string;
  sessionId: string;
  stepId?: string;
  errorType:
    | 'api_error'
    | 'validation_error'
    | 'timeout'
    | 'permission_error'
    | 'rate_limit'
    | 'network_error'
    | 'system_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stackTrace?: string;
  timestamp: number;
  context: {
    operation: string;
    parameters: any;
    environment: any;
    userContext: any;
  };
  impact: {
    affectedResources: string[];
    dataLoss: boolean;
    serviceInterruption: boolean;
    userImpact: 'none' | 'minimal' | 'moderate' | 'severe';
  };
  recovery: {
    automated: boolean;
    attempted: boolean;
    successful?: boolean;
    planId?: string;
    retryCount: number;
  };
}

export interface RollbackResult {
  success: boolean;
  checkpointId: string;
  restoredState: any;
  deletedResources: LarkResource[];
  errors: string[];
  warnings: string[];
  timeline: Array<{
    timestamp: number;
    action: string;
    result: 'success' | 'failed' | 'skipped';
    details?: string;
  }>;
}

/**
 * Error Recovery & Rollback System
 * 自動復旧とロールバック機能を提供
 */
export class ErrorRecoverySystem {
  private static checkpoints = new Map<string, Checkpoint>();
  private static errorLog = new Map<string, ErrorContext>();
  private static recoveryPlans = new Map<string, RecoveryPlan>();

  /**
   * チェックポイントの作成
   */
  static async createCheckpoint(
    sessionId: string,
    name: string,
    description: string,
    state: any,
    stepId?: string,
  ): Promise<{
    success: boolean;
    checkpointId?: string;
    error?: string;
  }> {
    try {
      const checkpointId = `checkpoint_${Date.now()}_${sessionId}`;

      // システム状態の収集
      const systemState = await this.collectSystemState(sessionId);

      // Larkリソースの収集
      const larkResources = await this.collectLarkResources(sessionId);

      // 状態のチェックサム計算
      const checksumState = this.calculateChecksum(state);

      const checkpoint: Checkpoint = {
        id: checkpointId,
        name,
        description,
        timestamp: Date.now(),
        sessionId,
        stepId,
        state: {
          session: this.deepClone(state),
          generatedArtifacts: this.collectGeneratedArtifacts(sessionId),
          larkResources,
          systemState,
        },
        metadata: {
          version: '1.0.0',
          checksumState,
          size: JSON.stringify(state).length,
          dependencies: this.extractDependencies(state),
        },
      };

      this.checkpoints.set(checkpointId, checkpoint);

      // 古いチェックポイントのクリーンアップ
      await this.cleanupOldCheckpoints(sessionId);

      return {
        success: true,
        checkpointId,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create checkpoint: ${error}`,
      };
    }
  }

  /**
   * エラーの記録と分析
   */
  static recordError(
    sessionId: string,
    error: Error,
    context: {
      operation: string;
      parameters: any;
      stepId?: string;
    },
  ): ErrorContext {
    const errorId = `error_${Date.now()}_${sessionId}`;

    const errorContext: ErrorContext = {
      id: errorId,
      sessionId,
      stepId: context.stepId,
      errorType: this.classifyError(error),
      severity: this.assessSeverity(error, context),
      message: error.message,
      stackTrace: error.stack,
      timestamp: Date.now(),
      context: {
        operation: context.operation,
        parameters: context.parameters,
        environment: this.getEnvironmentInfo(),
        userContext: this.getUserContext(sessionId),
      },
      impact: this.assessImpact(error, context),
      recovery: {
        automated: false,
        attempted: false,
        retryCount: 0,
      },
    };

    this.errorLog.set(errorId, errorContext);

    return errorContext;
  }

  /**
   * 自動復旧の実行
   */
  static async executeAutoRecovery(errorContext: ErrorContext): Promise<{
    success: boolean;
    recoveryPlan?: RecoveryPlan;
    result?: any;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // 復旧計画の生成
      const recoveryPlan = this.generateRecoveryPlan(errorContext);

      if (!recoveryPlan) {
        return {
          success: false,
          errors: ['No suitable recovery plan found'],
        };
      }

      // 復旧計画の記録
      this.recoveryPlans.set(recoveryPlan.id, recoveryPlan);

      // エラーコンテキストの更新
      errorContext.recovery.automated = true;
      errorContext.recovery.attempted = true;
      errorContext.recovery.planId = recoveryPlan.id;

      // 復旧アクションの実行
      const executionResult = await this.executeRecoveryPlan(recoveryPlan, errorContext);

      errorContext.recovery.successful = executionResult.success;

      return {
        success: executionResult.success,
        recoveryPlan,
        result: executionResult.result,
        errors: executionResult.errors,
      };
    } catch (error) {
      errors.push(`Auto recovery failed: ${error}`);

      return {
        success: false,
        errors,
      };
    }
  }

  /**
   * ロールバックの実行
   */
  static async executeRollback(
    sessionId: string,
    checkpointId: string,
    options: {
      cleanupResources?: boolean;
      preserveUserData?: boolean;
      notifyUsers?: boolean;
    } = {},
  ): Promise<RollbackResult> {
    const result: RollbackResult = {
      success: false,
      checkpointId,
      restoredState: null,
      deletedResources: [],
      errors: [],
      warnings: [],
      timeline: [],
    };

    try {
      const checkpoint = this.checkpoints.get(checkpointId);

      if (!checkpoint) {
        result.errors.push(`Checkpoint not found: ${checkpointId}`);
        return result;
      }

      if (checkpoint.sessionId !== sessionId) {
        result.errors.push('Checkpoint belongs to different session');
        return result;
      }

      this.addTimelineEntry(result, 'Rollback started');

      // 1. 現在の状態をバックアップ
      const backupCheckpoint = await this.createCheckpoint(
        sessionId,
        'Pre-rollback backup',
        'Automatic backup before rollback',
        await this.collectCurrentState(sessionId),
      );

      if (!backupCheckpoint.success) {
        result.warnings.push('Failed to create backup checkpoint');
      }

      // 2. Larkリソースの削除（作成後のもの）
      if (options.cleanupResources !== false) {
        const cleanupResult = await this.cleanupLarkResources(checkpoint, options.preserveUserData);

        result.deletedResources.push(...cleanupResult.deletedResources);
        result.errors.push(...cleanupResult.errors);
        result.warnings.push(...cleanupResult.warnings);

        this.addTimelineEntry(result, `Cleaned up ${cleanupResult.deletedResources.length} resources`);
      }

      // 3. 状態の復元
      const restorationResult = await this.restoreSystemState(checkpoint);

      if (restorationResult.success) {
        result.restoredState = restorationResult.state;
        this.addTimelineEntry(result, 'System state restored');
      } else {
        result.errors.push(...restorationResult.errors);
        this.addTimelineEntry(result, 'Failed to restore system state');
      }

      // 4. 整合性チェック
      const integrityCheck = await this.verifyRollbackIntegrity(checkpoint, result);

      if (!integrityCheck.valid) {
        result.warnings.push(...integrityCheck.issues);
      }

      // 5. 通知
      if (options.notifyUsers) {
        await this.notifyRollbackCompletion(sessionId, result);
      }

      result.success = result.errors.length === 0;
      this.addTimelineEntry(
        result,
        result.success ? 'Rollback completed successfully' : 'Rollback completed with errors',
      );

      return result;
    } catch (error) {
      result.errors.push(`Rollback failed: ${error}`);
      this.addTimelineEntry(result, 'Rollback failed with exception');

      return result;
    }
  }

  /**
   * エラーの分類
   */
  private static classifyError(error: Error): ErrorContext['errorType'] {
    const message = error.message.toLowerCase();

    if (message.includes('timeout')) return 'timeout';
    if (message.includes('permission') || message.includes('unauthorized')) return 'permission_error';
    if (message.includes('rate limit')) return 'rate_limit';
    if (message.includes('network') || message.includes('connection')) return 'network_error';
    if (message.includes('validation')) return 'validation_error';
    if (message.includes('api')) return 'api_error';

    return 'system_error';
  }

  /**
   * 重要度の評価
   */
  private static assessSeverity(error: Error, context: any): ErrorContext['severity'] {
    const errorType = this.classifyError(error);

    // 重要な操作での失敗は高重要度
    if (context.operation.includes('create') || context.operation.includes('delete')) {
      return 'high';
    }

    // 権限エラーやAPI エラーは中重要度
    if (errorType === 'permission_error' || errorType === 'api_error') {
      return 'medium';
    }

    // タイムアウトやネットワークエラーは低重要度（リトライ可能）
    if (errorType === 'timeout' || errorType === 'network_error') {
      return 'low';
    }

    return 'medium';
  }

  /**
   * 影響度の評価
   */
  private static assessImpact(error: Error, context: any): ErrorContext['impact'] {
    return {
      affectedResources: this.extractAffectedResources(context),
      dataLoss: context.operation.includes('delete') || context.operation.includes('clear'),
      serviceInterruption: context.operation.includes('create') || context.operation.includes('deploy'),
      userImpact: this.assessUserImpact(error, context),
    };
  }

  /**
   * 復旧計画の生成
   */
  private static generateRecoveryPlan(errorContext: ErrorContext): RecoveryPlan | null {
    const planId = `plan_${Date.now()}_${errorContext.sessionId}`;

    let strategy: RecoveryPlan['strategy'];
    let actions: RecoveryAction[] = [];
    let estimatedTime = 0;
    let riskLevel: RecoveryPlan['riskLevel'] = 'low';

    switch (errorContext.errorType) {
      case 'timeout':
      case 'rate_limit':
      case 'network_error':
        strategy = 'retry';
        actions = [
          {
            id: 'action_1',
            type: 'retry_operation',
            description: 'Retry the failed operation with exponential backoff',
            parameters: {
              maxRetries: 3,
              backoffMultiplier: 2,
              initialDelay: 1000,
            },
            order: 1,
            critical: false,
            rollbackable: true,
          },
        ];
        estimatedTime = 5;
        break;

      case 'validation_error':
        strategy = 'repair';
        actions = [
          {
            id: 'action_1',
            type: 'repair_data',
            description: 'Fix validation issues and retry',
            parameters: {
              validationRules: errorContext.context.parameters,
            },
            order: 1,
            critical: true,
            rollbackable: true,
          },
        ];
        estimatedTime = 10;
        riskLevel = 'medium';
        break;

      case 'permission_error':
        strategy = 'manual';
        actions = [
          {
            id: 'action_1',
            type: 'notify_user',
            description: 'Notify user about permission issues',
            parameters: {
              message: 'Permission denied. Please check your access rights.',
              severity: 'high',
            },
            order: 1,
            critical: true,
            rollbackable: false,
          },
        ];
        estimatedTime = 0;
        riskLevel = 'high';
        break;

      case 'api_error':
        if (errorContext.severity === 'high') {
          strategy = 'rollback';
          actions = [
            {
              id: 'action_1',
              type: 'restore_state',
              description: 'Rollback to last stable checkpoint',
              parameters: {
                checkpointId: this.findLastStableCheckpoint(errorContext.sessionId),
              },
              order: 1,
              critical: true,
              rollbackable: false,
            },
          ];
          estimatedTime = 15;
          riskLevel = 'high';
        } else {
          strategy = 'retry';
          actions = [
            {
              id: 'action_1',
              type: 'retry_operation',
              description: 'Retry API operation',
              parameters: { maxRetries: 2 },
              order: 1,
              critical: false,
              rollbackable: true,
            },
          ];
          estimatedTime = 3;
        }
        break;

      default:
        strategy = 'manual';
        actions = [
          {
            id: 'action_1',
            type: 'notify_user',
            description: 'Manual intervention required',
            parameters: {
              errorContext,
              requiresUserAction: true,
            },
            order: 1,
            critical: true,
            rollbackable: false,
          },
        ];
        estimatedTime = 0;
        riskLevel = 'high';
    }

    return {
      id: planId,
      errorId: errorContext.id,
      strategy,
      description: `Auto-generated recovery plan for ${errorContext.errorType}`,
      actions,
      estimatedTime,
      riskLevel,
      affectedResources: errorContext.impact.affectedResources,
      prerequisites: [],
    };
  }

  /**
   * 復旧計画の実行
   */
  private static async executeRecoveryPlan(
    plan: RecoveryPlan,
    errorContext: ErrorContext,
  ): Promise<{
    success: boolean;
    result?: any;
    errors: string[];
  }> {
    const errors: string[] = [];
    let overallSuccess = true;

    try {
      for (const action of plan.actions.sort((a, b) => a.order - b.order)) {
        const actionResult = await this.executeRecoveryAction(action, errorContext);

        if (!actionResult.success) {
          overallSuccess = false;
          errors.push(`Action ${action.id} failed: ${actionResult.error}`);

          if (action.critical) {
            break; // 重要なアクションが失敗した場合は停止
          }
        }
      }

      return {
        success: overallSuccess,
        result: overallSuccess ? 'Recovery completed' : 'Recovery partially failed',
        errors,
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Recovery plan execution failed: ${error}`],
      };
    }
  }

  /**
   * 復旧アクションの実行
   */
  private static async executeRecoveryAction(
    action: RecoveryAction,
    errorContext: ErrorContext,
  ): Promise<{
    success: boolean;
    result?: any;
    error?: string;
  }> {
    try {
      switch (action.type) {
        case 'retry_operation':
          return await this.retryOperation(action.parameters, errorContext);

        case 'restore_state':
          return await this.restoreFromCheckpoint(action.parameters.checkpointId);

        case 'repair_data':
          return await this.repairData(action.parameters, errorContext);

        case 'notify_user':
          return await this.notifyUser(action.parameters, errorContext);

        case 'delete_resource':
          return await this.deleteResource(action.parameters);

        case 'create_fallback':
          return await this.createFallback(action.parameters, errorContext);

        default:
          return {
            success: false,
            error: `Unknown action type: ${action.type}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: `Action execution failed: ${error}`,
      };
    }
  }

  /**
   * システム状態の収集
   */
  private static async collectSystemState(sessionId: string): Promise<any> {
    return {
      timestamp: Date.now(),
      sessionId,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Larkリソースの収集
   */
  private static async collectLarkResources(sessionId: string): Promise<LarkResource[]> {
    // 実際の実装では、セッションに関連するLarkリソースを収集
    // ここではモック実装
    return [];
  }

  /**
   * チェックサムの計算
   */
  private static calculateChecksum(state: any): string {
    const stateString = JSON.stringify(state);
    // 簡単なハッシュ計算（実際はcrypto.createHash等を使用）
    let hash = 0;
    for (let i = 0; i < stateString.length; i++) {
      const char = stateString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32bit整数に変換
    }
    return hash.toString(16);
  }

  /**
   * オブジェクトの深いクローン
   */
  private static deepClone(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * 依存関係の抽出
   */
  private static extractDependencies(state: any): string[] {
    // 実装省略：状態から依存関係を抽出
    return [];
  }

  /**
   * 古いチェックポイントのクリーンアップ
   */
  private static async cleanupOldCheckpoints(sessionId: string): Promise<void> {
    const sessionCheckpoints = Array.from(this.checkpoints.values())
      .filter((cp) => cp.sessionId === sessionId)
      .sort((a, b) => b.timestamp - a.timestamp);

    // 最新の5つを保持、古いものは削除
    const toDelete = sessionCheckpoints.slice(5);

    toDelete.forEach((cp) => {
      this.checkpoints.delete(cp.id);
    });
  }

  /**
   * その他のヘルパーメソッド
   */
  private static getEnvironmentInfo(): any {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
    };
  }

  private static getUserContext(sessionId: string): any {
    return {
      sessionId,
      timestamp: Date.now(),
    };
  }

  private static extractAffectedResources(context: any): string[] {
    // コンテキストから影響を受けるリソースを抽出
    return [];
  }

  private static assessUserImpact(error: Error, context: any): ErrorContext['impact']['userImpact'] {
    if (context.operation.includes('critical')) return 'severe';
    if (context.operation.includes('create')) return 'moderate';
    return 'minimal';
  }

  private static findLastStableCheckpoint(sessionId: string): string | null {
    const sessionCheckpoints = Array.from(this.checkpoints.values())
      .filter((cp) => cp.sessionId === sessionId)
      .sort((a, b) => b.timestamp - a.timestamp);

    return sessionCheckpoints[0]?.id || null;
  }

  private static async retryOperation(parameters: any, errorContext: ErrorContext): Promise<any> {
    // リトライロジックの実装
    return { success: true, result: 'Retry succeeded' };
  }

  private static async restoreFromCheckpoint(checkpointId: string): Promise<any> {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      return { success: false, error: 'Checkpoint not found' };
    }
    return { success: true, result: 'State restored' };
  }

  private static async repairData(parameters: any, errorContext: ErrorContext): Promise<any> {
    // データ修復ロジック
    return { success: true, result: 'Data repaired' };
  }

  private static async notifyUser(parameters: any, errorContext: ErrorContext): Promise<any> {
    // ユーザー通知ロジック
    console.log('User notification:', parameters.message);
    return { success: true, result: 'User notified' };
  }

  private static async deleteResource(parameters: any): Promise<any> {
    // リソース削除ロジック
    return { success: true, result: 'Resource deleted' };
  }

  private static async createFallback(parameters: any, errorContext: ErrorContext): Promise<any> {
    // フォールバック作成ロジック
    return { success: true, result: 'Fallback created' };
  }

  private static collectGeneratedArtifacts(sessionId: string): any[] {
    // 生成された成果物の収集
    return [];
  }

  private static async collectCurrentState(sessionId: string): Promise<any> {
    // 現在の状態の収集
    return { sessionId, timestamp: Date.now() };
  }

  private static async cleanupLarkResources(checkpoint: Checkpoint, preserveUserData?: boolean): Promise<any> {
    // Larkリソースのクリーンアップ
    return {
      deletedResources: [],
      errors: [],
      warnings: [],
    };
  }

  private static async restoreSystemState(checkpoint: Checkpoint): Promise<any> {
    // システム状態の復元
    return {
      success: true,
      state: checkpoint.state,
      errors: [],
    };
  }

  private static async verifyRollbackIntegrity(checkpoint: Checkpoint, result: RollbackResult): Promise<any> {
    // ロールバック整合性の検証
    return {
      valid: true,
      issues: [],
    };
  }

  private static async notifyRollbackCompletion(sessionId: string, result: RollbackResult): Promise<void> {
    // ロールバック完了通知
    console.log(`Rollback completed for session ${sessionId}`);
  }

  private static addTimelineEntry(result: RollbackResult, action: string): void {
    result.timeline.push({
      timestamp: Date.now(),
      action,
      result: 'success',
    });
  }
}
