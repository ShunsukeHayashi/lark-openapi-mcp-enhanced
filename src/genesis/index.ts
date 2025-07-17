/**
 * Genesis System Main Entry Point
 * Lark Genesis Architect メインエクスポート
 */

// Core components
export { GenesisPromptEngine, COMMAND_STACK } from './core/prompt-engine';
export type { CommandStackLevel, ExecutionContext, PromptEngineConfig } from './core/prompt-engine';

export { StructuredDataExtractor } from './core/data-extractor';
export type { ExtractionRule, ExtractionSchema, ExtractionResult } from './core/data-extractor';

// Integration components
export { LarkBaseBuilder } from './integrations/lark-base-builder';
export type {
  BaseSpec,
  TableSpec,
  FieldSpec,
  ViewSpec,
  AutomationSpec,
  PermissionSpec,
  BuildResult,
} from './integrations/lark-base-builder';

// System components
export { TemplateManager } from './systems/template-manager';
export type {
  Template,
  TemplateMetadata,
  TemplateCategory,
  TemplateVariable,
  TemplateExample,
} from './systems/template-manager';

export { ProgressMonitor } from './systems/progress-monitor';
export type { ProgressSession, ProgressStep, ProgressEvent, ProgressListener } from './systems/progress-monitor';

export { MultilangSupport } from './systems/multilang-support';
export type {
  SupportedLanguage,
  LanguageConfig,
  TranslationKey,
  LocalizedPrompt,
  LanguageDetectionResult,
} from './systems/multilang-support';

export { PerformanceOptimizer } from './systems/performance-optimizer';
export type {
  PerformanceMetrics,
  OptimizationConfig,
  BatchOperation,
  CacheEntry,
  ResourceUsage,
} from './systems/performance-optimizer';

// Utilities
export { GeminiClient } from './utils/gemini-client';
export type { GeminiConfig, GeminiRequest, GeminiResponse } from './utils/gemini-client';

// Import types for internal use
import { GenesisPromptEngine, ExecutionContext } from './core/prompt-engine';
import { StructuredDataExtractor } from './core/data-extractor';
import { LarkBaseBuilder, BaseSpec, BuildResult } from './integrations/lark-base-builder';
import { TemplateManager } from './systems/template-manager';
import { ProgressMonitor } from './systems/progress-monitor';
import { MultilangSupport, SupportedLanguage } from './systems/multilang-support';
import {
  PerformanceOptimizer,
  OptimizationConfig,
  PerformanceMetrics,
  ResourceUsage,
} from './systems/performance-optimizer';

/**
 * Genesis Architect
 * 統合システムクラス
 */
export class GenesisArchitect {
  private promptEngine: GenesisPromptEngine;
  private dataExtractor: StructuredDataExtractor;
  private baseBuilder: LarkBaseBuilder;
  private templateManager: TemplateManager;
  private progressMonitor: ProgressMonitor;
  private multilangSupport: MultilangSupport;
  private performanceOptimizer: PerformanceOptimizer;

  constructor(config: {
    geminiApiKey: string;
    larkClient: any;
    maxRetries?: number;
    timeoutMs?: number;
    enableLogging?: boolean;
    language?: SupportedLanguage;
    optimizationConfig?: Partial<OptimizationConfig>;
  }) {
    this.promptEngine = new GenesisPromptEngine({
      geminiApiKey: config.geminiApiKey,
      maxRetries: config.maxRetries || 3,
      timeoutMs: config.timeoutMs || 30000,
      enableLogging: config.enableLogging !== false,
    });

    this.dataExtractor = StructuredDataExtractor;

    this.baseBuilder = new LarkBaseBuilder(config.larkClient, {
      retryAttempts: config.maxRetries || 3,
      retryDelay: 1000,
    });

    // 新システムの初期化
    this.templateManager = new TemplateManager();
    this.progressMonitor = new ProgressMonitor();
    this.multilangSupport = new MultilangSupport();
    this.performanceOptimizer = new PerformanceOptimizer(config.optimizationConfig);
  }

  /**
   * 要求仕様からLark Baseまでの完全自動生成
   */
  async createFromRequirements(
    requirements: string,
    options?: {
      language?: SupportedLanguage;
      templateId?: string;
      templateVariables?: Record<string, any>;
      enableProgressTracking?: boolean;
    },
  ): Promise<{
    success: boolean;
    baseId?: string;
    executionContext: ExecutionContext;
    buildResult: BuildResult;
    errors: string[];
    progressSessionId?: string;
  }> {
    const errors: string[] = [];
    let progressSessionId: string | undefined;

    try {
      // 言語検出
      const detectedLanguage = this.multilangSupport.detectLanguage(requirements);
      const language = options?.language || detectedLanguage.detectedLanguage;

      // プログレスセッションの作成
      if (options?.enableProgressTracking) {
        const session = this.progressMonitor.createSession({
          projectName: 'Lark Base Generation',
          description: 'Generating Lark Base from requirements',
          steps: [
            { id: 'detect_language', name: 'Language Detection', description: 'Detecting input language' },
            { id: 'analyze_requirements', name: 'Requirements Analysis', description: 'Analyzing requirements' },
            { id: 'design_er', name: 'ER Design', description: 'Creating ER diagram' },
            { id: 'design_base', name: 'Base Design', description: 'Designing base structure' },
            { id: 'build_base', name: 'Base Construction', description: 'Building Lark Base' },
          ],
          metadata: {
            sessionType: 'custom',
            priority: 'high',
          },
        });
        progressSessionId = session.id;
        this.progressMonitor.startSession(session.id);
      }

      // テンプレートの適用（指定されている場合）
      let baseSpec: BaseSpec | undefined;
      if (options?.templateId) {
        try {
          baseSpec = this.templateManager.applyTemplate(options.templateId, options.templateVariables || {});
        } catch (error) {
          errors.push(`Template application failed: ${error}`);
        }
      }

      // テンプレートが適用されていない場合は通常の処理
      if (!baseSpec) {
        // 1. 7段階プロンプト実行（最適化付き）
        const context = await this.performanceOptimizer.executeOptimized(
          () => this.promptEngine.executeCommandStack(requirements),
          'high',
        );

        // 2. 最終結果からBase仕様を抽出
        const implementationPlan = context.results['C7'];
        if (!implementationPlan) {
          throw new Error('Implementation plan not generated');
        }

        // 3. Base仕様への変換（C3の結果を使用）
        const baseDesign = context.results['C3'];
        if (!baseDesign) {
          throw new Error('Base design not generated');
        }

        baseSpec = this.convertToBaseSpec(baseDesign);
      }

      // 4. Lark Base構築（最適化付き）
      const buildResult = await this.performanceOptimizer.executeOptimized(
        () => this.baseBuilder.buildBase(baseSpec!),
        'critical',
      );

      // プログレスセッションの完了
      if (progressSessionId) {
        this.progressMonitor.completeSession(progressSessionId, { baseId: buildResult.baseId });
      }

      return {
        success: buildResult.success,
        baseId: buildResult.baseId,
        executionContext: {} as ExecutionContext, // テンプレート使用時は空
        buildResult,
        errors: [...errors, ...buildResult.errors],
        progressSessionId,
      };
    } catch (error) {
      errors.push(`Genesis execution failed: ${error}`);

      // プログレスセッションの失敗
      if (progressSessionId) {
        this.progressMonitor.failSession(progressSessionId, String(error));
      }

      return {
        success: false,
        executionContext: {} as ExecutionContext,
        buildResult: {} as BuildResult,
        errors,
        progressSessionId,
      };
    }
  }

  /**
   * 段階的実行（プレビュー機能）
   */
  async executeStep(
    requirements: string,
    stepId: string,
    options?: {
      language?: SupportedLanguage;
      enableProgressTracking?: boolean;
    },
  ): Promise<{
    success: boolean;
    result: any;
    errors: string[];
    progressSessionId?: string;
  }> {
    try {
      const context: ExecutionContext = {
        requirements,
        currentLevel: 0,
        results: {},
        metadata: {
          projectId: `preview_${Date.now()}`,
          timestamp: Date.now(),
          version: '1.0.0',
        },
      };

      let progressSessionId: string | undefined;

      // プログレスセッションの作成
      if (options?.enableProgressTracking) {
        const session = this.progressMonitor.createSession({
          projectName: 'Step Execution',
          description: `Executing step: ${stepId}`,
          steps: [{ id: 'execute_step', name: 'Step Execution', description: `Executing ${stepId}` }],
          metadata: {
            sessionType: 'custom',
            priority: 'medium',
          },
        });
        progressSessionId = session.id;
        this.progressMonitor.startSession(session.id);
        this.progressMonitor.startStep(session.id, 'execute_step');
      }

      const result = await this.performanceOptimizer.executeOptimized(
        () => this.promptEngine.executeSpecificCommand(stepId, context),
        'medium',
      );

      // プログレスセッションの完了
      if (progressSessionId) {
        this.progressMonitor.completeStep(progressSessionId, 'execute_step', { result });
        this.progressMonitor.completeSession(progressSessionId, { result });
      }

      return {
        success: true,
        result,
        errors: [],
        progressSessionId,
      };
    } catch (error) {
      return {
        success: false,
        result: null,
        errors: [`Step execution failed: ${error}`],
      };
    }
  }

  /**
   * Base設計仕様への変換
   */
  private convertToBaseSpec(designResult: any): BaseSpec {
    return {
      name: designResult.baseName || 'Generated Base',
      description: designResult.description || 'Auto-generated Lark Base',
      tables: (designResult.tables || []).map((table: any) => ({
        name: table.name,
        description: table.description || '',
        fields: (table.fields || []).map((field: any) => ({
          name: field.name,
          type: this.mapFieldType(field.type),
          description: field.description,
          required: field.required,
          options: field.options,
        })),
        views: (table.views || []).map((view: any) => ({
          name: view.name,
          type: view.type,
          config: view.config,
        })),
      })),
      automations: designResult.automations || [],
    };
  }

  /**
   * フィールドタイプマッピング
   */
  private mapFieldType(type: string): any {
    const typeMap: Record<string, string> = {
      text: 'text',
      number: 'number',
      date: 'date',
      checkbox: 'checkbox',
      singleSelect: 'singleSelect',
      multiSelect: 'multiSelect',
      attachment: 'attachment',
      user: 'user',
      formula: 'formula',
    };

    return typeMap[type] || 'text';
  }

  /**
   * テンプレート管理機能
   */
  getTemplateManager(): TemplateManager {
    return this.templateManager;
  }

  /**
   * プログレス監視機能
   */
  getProgressMonitor(): ProgressMonitor {
    return this.progressMonitor;
  }

  /**
   * 多言語対応機能
   */
  getMultilangSupport(): MultilangSupport {
    return this.multilangSupport;
  }

  /**
   * パフォーマンス最適化機能
   */
  getPerformanceOptimizer(): PerformanceOptimizer {
    return this.performanceOptimizer;
  }

  /**
   * 実行状況の取得
   */
  getStatus(): {
    isReady: boolean;
    version: string;
    capabilities: string[];
    performance: PerformanceMetrics;
    resourceUsage: ResourceUsage;
  } {
    return {
      isReady: true,
      version: '2.0.0',
      capabilities: [
        'Requirements Analysis',
        'ER Design',
        'Base Structure Design',
        'Business Logic Design',
        'Automation Design',
        'UI Design',
        'Implementation Planning',
        'Auto Base Creation',
        'Template Management',
        'Progress Monitoring',
        'Multi-language Support',
        'Performance Optimization',
      ],
      performance: this.performanceOptimizer.getMetrics(),
      resourceUsage: this.performanceOptimizer.getResourceUsage(),
    };
  }

  /**
   * システムのクリーンアップ
   */
  cleanup(): void {
    this.performanceOptimizer.cleanup();
  }
}
