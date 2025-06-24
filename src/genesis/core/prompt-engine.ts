/**
 * Genesis Prompt Engine - 7段階コマンドスタック処理システム
 * 要求仕様からLark Baseの自動設計・構築を行う中核エンジン
 */

import { GeminiClient } from '../utils/gemini-client';

export interface CommandStackLevel {
  id: string;
  name: string;
  description: string;
  prompt: string;
  dependencies?: string[];
  outputSchema: any;
}

export interface ExecutionContext {
  requirements: string;
  currentLevel: number;
  results: Record<string, any>;
  metadata: {
    projectId: string;
    timestamp: number;
    version: string;
  };
}

export interface PromptEngineConfig {
  geminiApiKey: string;
  maxRetries: number;
  timeoutMs: number;
  enableLogging: boolean;
}

/**
 * 7段階コマンドスタック定義
 */
export const COMMAND_STACK: CommandStackLevel[] = [
  {
    id: 'C1',
    name: 'Requirements Analysis',
    description: '要求仕様の分析と構造化',
    prompt: `
あなたは企業システム設計の専門家です。以下の要求仕様を分析し、構造化してください。

## 入力
{requirements}

## 出力形式（JSON）
\`\`\`json
{
  "projectTitle": "プロジェクト名",
  "domain": "業務領域",
  "stakeholders": ["ステークホルダー1", "ステークホルダー2"],
  "businessGoals": ["目標1", "目標2"],
  "functionalRequirements": [
    {
      "id": "F001",
      "description": "機能説明",
      "priority": "high|medium|low",
      "complexity": 1-5
    }
  ],
  "nonFunctionalRequirements": {
    "performance": "パフォーマンス要件",
    "security": "セキュリティ要件",
    "scalability": "拡張性要件"
  },
  "constraints": ["制約1", "制約2"]
}
\`\`\`
`,
    outputSchema: {
      type: 'object',
      properties: {
        projectTitle: { type: 'string' },
        domain: { type: 'string' },
        stakeholders: { type: 'array', items: { type: 'string' } },
        businessGoals: { type: 'array', items: { type: 'string' } },
        functionalRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              complexity: { type: 'number', minimum: 1, maximum: 5 }
            }
          }
        },
        nonFunctionalRequirements: {
          type: 'object',
          properties: {
            performance: { type: 'string' },
            security: { type: 'string' },
            scalability: { type: 'string' }
          }
        },
        constraints: { type: 'array', items: { type: 'string' } }
      },
      required: ['projectTitle', 'domain', 'functionalRequirements']
    }
  },
  {
    id: 'C2',
    name: 'Entity Relationship Design',
    description: 'エンティティ関係設計とデータモデル構築',
    prompt: `
以下の要求分析結果を基に、エンティティ関係図を設計してください。

## 入力
{C1_result}

## 出力形式（JSON）
\`\`\`json
{
  "entities": [
    {
      "name": "エンティティ名",
      "description": "説明",
      "attributes": [
        {
          "name": "属性名",
          "type": "string|number|date|boolean|select|multiSelect",
          "required": true,
          "description": "属性説明",
          "options": ["選択肢1", "選択肢2"] // select/multiSelectの場合のみ
        }
      ],
      "primaryKey": "主キー属性名"
    }
  ],
  "relationships": [
    {
      "from": "エンティティ1",
      "to": "エンティティ2",
      "type": "oneToOne|oneToMany|manyToMany",
      "description": "関係説明"
    }
  ],
  "mermaidDiagram": "erDiagram\\n エンティティ1 ||--o{ エンティティ2 : relationship"
}
\`\`\`
`,
    dependencies: ['C1'],
    outputSchema: {
      type: 'object',
      properties: {
        entities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              attributes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string', enum: ['string', 'number', 'date', 'boolean', 'select', 'multiSelect'] },
                    required: { type: 'boolean' },
                    description: { type: 'string' },
                    options: { type: 'array', items: { type: 'string' } }
                  }
                }
              },
              primaryKey: { type: 'string' }
            }
          }
        },
        relationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              type: { type: 'string', enum: ['oneToOne', 'oneToMany', 'manyToMany'] },
              description: { type: 'string' }
            }
          }
        },
        mermaidDiagram: { type: 'string' }
      }
    }
  },
  {
    id: 'C3',
    name: 'Lark Base Structure Design',
    description: 'Lark Base構造設計',
    prompt: `
エンティティ関係設計を基に、Lark Baseの構造を設計してください。

## 入力
{C2_result}

## 出力形式（JSON）
\`\`\`json
{
  "baseName": "Base名",
  "description": "Base説明",
  "tables": [
    {
      "name": "テーブル名",
      "description": "テーブル説明",
      "fields": [
        {
          "name": "フィールド名",
          "type": "text|number|date|checkbox|singleSelect|multiSelect|attachment|user|formula",
          "description": "フィールド説明",
          "required": true,
          "options": {
            "choices": ["選択肢1", "選択肢2"], // select系の場合
            "formula": "SUM({field1})", // formulaの場合
            "format": "YYYY-MM-DD" // dateの場合
          }
        }
      ],
      "views": [
        {
          "name": "ビュー名",
          "type": "grid|kanban|calendar|gallery",
          "filters": [],
          "sorts": []
        }
      ]
    }
  ],
  "automations": [
    {
      "name": "自動化名",
      "trigger": "トリガー条件",
      "actions": ["アクション1", "アクション2"]
    }
  ]
}
\`\`\`
`,
    dependencies: ['C2'],
    outputSchema: {
      type: 'object',
      properties: {
        baseName: { type: 'string' },
        description: { type: 'string' },
        tables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              fields: { type: 'array' },
              views: { type: 'array' }
            }
          }
        },
        automations: { type: 'array' }
      }
    }
  },
  {
    id: 'C4',
    name: 'Business Logic Design',
    description: 'ビジネスロジック設計',
    prompt: `
Lark Base構造を基に、ビジネスロジックと計算式を設計してください。

## 入力
{C3_result}

## 出力形式（JSON）
\`\`\`json
{
  "businessRules": [
    {
      "id": "BR001",
      "name": "ルール名",
      "description": "ルール説明",
      "condition": "条件",
      "action": "アクション",
      "table": "適用テーブル"
    }
  ],
  "formulas": [
    {
      "field": "フィールド名",
      "table": "テーブル名",
      "formula": "Lark Base数式",
      "description": "数式説明"
    }
  ],
  "validations": [
    {
      "field": "フィールド名",
      "table": "テーブル名",
      "rule": "検証ルール",
      "message": "エラーメッセージ"
    }
  ]
}
\`\`\`
`,
    dependencies: ['C3'],
    outputSchema: {
      type: 'object',
      properties: {
        businessRules: { type: 'array' },
        formulas: { type: 'array' },
        validations: { type: 'array' }
      }
    }
  },
  {
    id: 'C5',
    name: 'Automation Design',
    description: '自動化ワークフロー設計',
    prompt: `
ビジネスロジックを基に、Lark自動化ワークフローを設計してください。

## 入力
{C4_result}

## 出力形式（JSON）
\`\`\`json
{
  "workflows": [
    {
      "name": "ワークフロー名",
      "description": "説明",
      "trigger": {
        "type": "recordCreated|recordUpdated|scheduled|manual",
        "conditions": {}
      },
      "steps": [
        {
          "type": "condition|action|notification",
          "config": {},
          "description": "ステップ説明"
        }
      ]
    }
  ],
  "notifications": [
    {
      "name": "通知名",
      "trigger": "トリガー条件",
      "recipients": ["受信者"],
      "template": "通知テンプレート"
    }
  ]
}
\`\`\`
`,
    dependencies: ['C4'],
    outputSchema: {
      type: 'object',
      properties: {
        workflows: { type: 'array' },
        notifications: { type: 'array' }
      }
    }
  },
  {
    id: 'C6',
    name: 'User Interface Design',
    description: 'ユーザーインターフェース設計',
    prompt: `
自動化設計を基に、ユーザーインターフェースを設計してください。

## 入力
{C5_result}

## 出力形式（JSON）
\`\`\`json
{
  "dashboards": [
    {
      "name": "ダッシュボード名",
      "description": "説明",
      "widgets": [
        {
          "type": "chart|table|metric|text",
          "title": "ウィジェットタイトル",
          "config": {},
          "position": {"x": 0, "y": 0, "width": 4, "height": 3}
        }
      ]
    }
  ],
  "forms": [
    {
      "name": "フォーム名",
      "description": "説明",
      "fields": [],
      "validation": {},
      "submissions": {
        "target": "テーブル名",
        "mapping": {}
      }
    }
  ],
  "permissions": [
    {
      "role": "ロール名",
      "permissions": {
        "read": ["テーブル1", "テーブル2"],
        "write": ["テーブル1"],
        "admin": []
      }
    }
  ]
}
\`\`\`
`,
    dependencies: ['C5'],
    outputSchema: {
      type: 'object',
      properties: {
        dashboards: { type: 'array' },
        forms: { type: 'array' },
        permissions: { type: 'array' }
      }
    }
  },
  {
    id: 'C7',
    name: 'Implementation Plan',
    description: '実装計画と手順書',
    prompt: `
全ての設計を基に、実装計画と手順書を作成してください。

## 入力
{C6_result}

## 出力形式（JSON）
\`\`\`json
{
  "implementationPlan": {
    "phases": [
      {
        "name": "フェーズ名",
        "description": "説明",
        "duration": "期間",
        "tasks": [
          {
            "name": "タスク名",
            "description": "説明",
            "effort": "工数",
            "dependencies": [],
            "deliverables": ["成果物1", "成果物2"]
          }
        ]
      }
    ],
    "risks": [
      {
        "description": "リスク説明",
        "impact": "high|medium|low",
        "probability": "high|medium|low",
        "mitigation": "対策"
      }
    ]
  },
  "deploymentGuide": {
    "prerequisites": ["前提条件1", "前提条件2"],
    "steps": [
      {
        "step": 1,
        "description": "手順説明",
        "commands": ["コマンド1", "コマンド2"],
        "validation": "検証方法"
      }
    ],
    "rollback": ["ロールバック手順1", "ロールバック手順2"]
  },
  "documentation": {
    "userManual": "ユーザーマニュアル概要",
    "adminGuide": "管理者ガイド概要",
    "troubleshooting": ["よくある問題1と解決策", "よくある問題2と解決策"]
  }
}
\`\`\`
`,
    dependencies: ['C6'],
    outputSchema: {
      type: 'object',
      properties: {
        implementationPlan: { type: 'object' },
        deploymentGuide: { type: 'object' },
        documentation: { type: 'object' }
      }
    }
  }
];

/**
 * Genesis Prompt Engine
 * 7段階のコマンドスタックを順次実行し、要求仕様からLark Base設計まで自動化
 */
export class GenesisPromptEngine {
  private config: PromptEngineConfig;
  private geminiClient: GeminiClient;

  constructor(config: PromptEngineConfig) {
    this.config = config;
    this.geminiClient = new GeminiClient({
      apiKey: this.config.geminiApiKey,
      maxRetries: this.config.maxRetries,
      timeoutMs: this.config.timeoutMs
    });
  }

  /**
   * 7段階コマンドスタックを順次実行
   */
  async executeCommandStack(requirements: string): Promise<ExecutionContext> {
    const context: ExecutionContext = {
      requirements,
      currentLevel: 0,
      results: {},
      metadata: {
        projectId: `genesis_${Date.now()}`,
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };

    for (let i = 0; i < COMMAND_STACK.length; i++) {
      const command = COMMAND_STACK[i];
      this.log(`Executing ${command.id}: ${command.name}`);
      
      try {
        context.currentLevel = i + 1;
        const result = await this.executeCommand(command, context);
        context.results[command.id] = result;
        
        this.log(`Completed ${command.id} successfully`);
      } catch (error) {
        this.log(`Error in ${command.id}: ${error}`);
        throw new Error(`Command ${command.id} failed: ${error}`);
      }
    }

    return context;
  }

  /**
   * 単一コマンドの実行
   */
  private async executeCommand(command: CommandStackLevel, context: ExecutionContext): Promise<any> {
    // 依存関係チェック
    if (command.dependencies) {
      for (const dep of command.dependencies) {
        if (!context.results[dep]) {
          throw new Error(`Dependency ${dep} not found for command ${command.id}`);
        }
      }
    }

    // プロンプト組み立て
    let prompt = command.prompt;
    
    // 依存関係の結果を注入
    if (command.dependencies) {
      for (const dep of command.dependencies) {
        const depResult = JSON.stringify(context.results[dep], null, 2);
        prompt = prompt.replace(`{${dep}_result}`, depResult);
      }
    }
    
    // 要求仕様を注入
    prompt = prompt.replace('{requirements}', context.requirements);

    // Gemini APIを呼び出し
    const response = await this.callGeminiAPI(prompt, command.outputSchema);
    
    // レスポンス検証
    this.validateResponse(response, command.outputSchema);
    
    return response;
  }

  /**
   * Gemini API呼び出し
   */
  private async callGeminiAPI(prompt: string, schema: any): Promise<any> {
    try {
      const response = await this.geminiClient.generateStructuredContent(prompt, schema, {
        temperature: 0.1,
        maxOutputTokens: 4096
      });
      
      return response;
    } catch (error) {
      this.log(`Gemini API error: ${error}`);
      throw error;
    }
  }

  /**
   * レスポンス検証
   */
  private validateResponse(response: any, schema: any): void {
    // JSON Schema検証の実装
    // プレースホルダー - 実際の検証ロジックを実装
  }

  /**
   * ログ出力
   */
  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[GenesisPromptEngine] ${new Date().toISOString()}: ${message}`);
    }
  }

  /**
   * 特定のコマンドのみ実行
   */
  async executeSpecificCommand(commandId: string, context: ExecutionContext): Promise<any> {
    const command = COMMAND_STACK.find(c => c.id === commandId);
    if (!command) {
      throw new Error(`Command ${commandId} not found`);
    }

    return this.executeCommand(command, context);
  }

  /**
   * 実行状況の取得
   */
  getExecutionStatus(context: ExecutionContext): any {
    const totalCommands = COMMAND_STACK.length;
    const completedCommands = Object.keys(context.results).length;
    
    return {
      progress: (completedCommands / totalCommands) * 100,
      currentLevel: context.currentLevel,
      completedCommands: Object.keys(context.results),
      nextCommand: COMMAND_STACK[completedCommands]?.id || null,
      isComplete: completedCommands === totalCommands
    };
  }
}