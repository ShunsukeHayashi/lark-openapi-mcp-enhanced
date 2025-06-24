/**
 * Multi-language Support System
 * 英語/中国語での要求仕様対応
 */

export type SupportedLanguage = 'en' | 'zh' | 'ja';

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  numberFormat: {
    decimal: string;
    thousands: string;
    currency: string;
  };
}

export interface TranslationKey {
  key: string;
  translations: Record<SupportedLanguage, string>;
  context?: string;
  category?: string;
}

export interface LocalizedPrompt {
  language: SupportedLanguage;
  prompt: string;
  variables: string[];
  examples: string[];
}

export interface LanguageDetectionResult {
  detectedLanguage: SupportedLanguage;
  confidence: number;
  alternatives: Array<{
    language: SupportedLanguage;
    confidence: number;
  }>;
}

/**
 * Multi-language Support Manager
 * 多言語対応管理システム
 */
export class MultilangSupport {
  private languageConfigs: Map<SupportedLanguage, LanguageConfig>;
  private translations: Map<string, TranslationKey>;
  private promptTemplates: Map<string, LocalizedPrompt[]>;

  constructor() {
    this.languageConfigs = new Map();
    this.translations = new Map();
    this.promptTemplates = new Map();
    
    this.initializeLanguageConfigs();
    this.initializeTranslations();
    this.initializePromptTemplates();
  }

  /**
   * 言語設定の初期化
   */
  private initializeLanguageConfigs(): void {
    const configs: LanguageConfig[] = [
      {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        direction: 'ltr',
        dateFormat: 'MM/DD/YYYY',
        numberFormat: {
          decimal: '.',
          thousands: ',',
          currency: '$'
        }
      },
      {
        code: 'zh',
        name: 'Chinese',
        nativeName: '中文',
        direction: 'ltr',
        dateFormat: 'YYYY-MM-DD',
        numberFormat: {
          decimal: '.',
          thousands: ',',
          currency: '¥'
        }
      },
      {
        code: 'ja',
        name: 'Japanese',
        nativeName: '日本語',
        direction: 'ltr',
        dateFormat: 'YYYY/MM/DD',
        numberFormat: {
          decimal: '.',
          thousands: ',',
          currency: '¥'
        }
      }
    ];

    configs.forEach(config => {
      this.languageConfigs.set(config.code, config);
    });
  }

  /**
   * 翻訳キーの初期化
   */
  private initializeTranslations(): void {
    const translationKeys: TranslationKey[] = [
      // システムメッセージ
      {
        key: 'system.initializing',
        translations: {
          en: 'Initializing system...',
          zh: '正在初始化系统...',
          ja: 'システムを初期化中...'
        },
        category: 'system'
      },
      {
        key: 'system.completed',
        translations: {
          en: 'Operation completed successfully',
          zh: '操作成功完成',
          ja: '操作が正常に完了しました'
        },
        category: 'system'
      },
      {
        key: 'system.error',
        translations: {
          en: 'An error occurred',
          zh: '发生错误',
          ja: 'エラーが発生しました'
        },
        category: 'system'
      },

      // プロンプトエンジン
      {
        key: 'prompt.requirements_analysis',
        translations: {
          en: 'Requirements Analysis',
          zh: '需求分析',
          ja: '要求分析'
        },
        category: 'prompt'
      },
      {
        key: 'prompt.er_design',
        translations: {
          en: 'ER Diagram Design',
          zh: 'ER图设计',
          ja: 'ER図設計'
        },
        category: 'prompt'
      },
      {
        key: 'prompt.base_structure',
        translations: {
          en: 'Base Structure Design',
          zh: '基础结构设计',
          ja: 'ベース構造設計'
        },
        category: 'prompt'
      },
      {
        key: 'prompt.business_logic',
        translations: {
          en: 'Business Logic Design',
          zh: '业务逻辑设计',
          ja: 'ビジネスロジック設計'
        },
        category: 'prompt'
      },
      {
        key: 'prompt.automation',
        translations: {
          en: 'Automation Design',
          zh: '自动化设计',
          ja: '自動化設計'
        },
        category: 'prompt'
      },
      {
        key: 'prompt.ui_design',
        translations: {
          en: 'UI Design',
          zh: '界面设计',
          ja: 'UI設計'
        },
        category: 'prompt'
      },
      {
        key: 'prompt.implementation',
        translations: {
          en: 'Implementation Planning',
          zh: '实施计划',
          ja: '実装計画'
        },
        category: 'prompt'
      },

      // フィールドタイプ
      {
        key: 'field.text',
        translations: {
          en: 'Text',
          zh: '文本',
          ja: 'テキスト'
        },
        category: 'field'
      },
      {
        key: 'field.number',
        translations: {
          en: 'Number',
          zh: '数字',
          ja: '数値'
        },
        category: 'field'
      },
      {
        key: 'field.date',
        translations: {
          en: 'Date',
          zh: '日期',
          ja: '日付'
        },
        category: 'field'
      },
      {
        key: 'field.checkbox',
        translations: {
          en: 'Checkbox',
          zh: '复选框',
          ja: 'チェックボックス'
        },
        category: 'field'
      },
      {
        key: 'field.select',
        translations: {
          en: 'Single Select',
          zh: '单选',
          ja: '単一選択'
        },
        category: 'field'
      },
      {
        key: 'field.multi_select',
        translations: {
          en: 'Multi Select',
          zh: '多选',
          ja: '複数選択'
        },
        category: 'field'
      },

      // ステータス
      {
        key: 'status.active',
        translations: {
          en: 'Active',
          zh: '活跃',
          ja: 'アクティブ'
        },
        category: 'status'
      },
      {
        key: 'status.inactive',
        translations: {
          en: 'Inactive',
          zh: '非活跃',
          ja: '非アクティブ'
        },
        category: 'status'
      },
      {
        key: 'status.pending',
        translations: {
          en: 'Pending',
          zh: '待处理',
          ja: '保留中'
        },
        category: 'status'
      },
      {
        key: 'status.completed',
        translations: {
          en: 'Completed',
          zh: '已完成',
          ja: '完了'
        },
        category: 'status'
      },

      // エラーメッセージ
      {
        key: 'error.invalid_requirements',
        translations: {
          en: 'Invalid requirements specification',
          zh: '无效的需求规格',
          ja: '無効な要求仕様'
        },
        category: 'error'
      },
      {
        key: 'error.api_failure',
        translations: {
          en: 'API call failed',
          zh: 'API调用失败',
          ja: 'API呼び出しに失敗しました'
        },
        category: 'error'
      },
      {
        key: 'error.validation_failed',
        translations: {
          en: 'Validation failed',
          zh: '验证失败',
          ja: '検証に失敗しました'
        },
        category: 'error'
      }
    ];

    translationKeys.forEach(key => {
      this.translations.set(key.key, key);
    });
  }

  /**
   * プロンプトテンプレートの初期化
   */
  private initializePromptTemplates(): void {
    // 要求分析プロンプト
    this.addPromptTemplate('requirements_analysis', [
      {
        language: 'en',
        prompt: `Analyze the following requirements and extract key information:

Requirements: {requirements}

Please provide:
1. Business objectives
2. Key entities and relationships
3. Required functionality
4. User roles and permissions
5. Data requirements
6. Integration needs

Format your response in structured JSON.`,
        variables: ['requirements'],
        examples: [
          'Customer management system for a small business',
          'Project tracking application for a development team',
          'Inventory management system for a retail store'
        ]
      },
      {
        language: 'zh',
        prompt: `分析以下需求并提取关键信息：

需求：{requirements}

请提供：
1. 业务目标
2. 关键实体和关系
3. 所需功能
4. 用户角色和权限
5. 数据需求
6. 集成需求

请以结构化JSON格式回复。`,
        variables: ['requirements'],
        examples: [
          '小型企业的客户管理系统',
          '开发团队的项目跟踪应用',
          '零售店的库存管理系统'
        ]
      },
      {
        language: 'ja',
        prompt: `以下の要求を分析し、重要な情報を抽出してください：

要求：{requirements}

以下を提供してください：
1. ビジネス目標
2. 主要エンティティと関係
3. 必要な機能
4. ユーザーロールと権限
5. データ要件
6. 統合要件

構造化されたJSON形式で回答してください。`,
        variables: ['requirements'],
        examples: [
          '小企業向け顧客管理システム',
          '開発チーム向けプロジェクト追跡アプリケーション',
          '小売店向け在庫管理システム'
        ]
      }
    ]);

    // ER図設計プロンプト
    this.addPromptTemplate('er_design', [
      {
        language: 'en',
        prompt: `Design an ER diagram based on the following requirements:

Requirements: {requirements}

Please create:
1. Entity definitions with attributes
2. Relationships between entities
3. Primary and foreign keys
4. Cardinality constraints
5. Business rules

Format as Mermaid ER diagram syntax.`,
        variables: ['requirements'],
        examples: [
          'Customer -> Order (1:N), Order -> Product (M:N)',
          'Employee -> Department (N:1), Project -> Task (1:N)',
          'Product -> Category (N:1), Supplier -> Product (1:N)'
        ]
      },
      {
        language: 'zh',
        prompt: `根据以下需求设计ER图：

需求：{requirements}

请创建：
1. 实体定义和属性
2. 实体间关系
3. 主键和外键
4. 基数约束
5. 业务规则

使用Mermaid ER图语法格式。`,
        variables: ['requirements'],
        examples: [
          '客户 -> 订单 (1:N), 订单 -> 产品 (M:N)',
          '员工 -> 部门 (N:1), 项目 -> 任务 (1:N)',
          '产品 -> 类别 (N:1), 供应商 -> 产品 (1:N)'
        ]
      },
      {
        language: 'ja',
        prompt: `以下の要求に基づいてER図を設計してください：

要求：{requirements}

以下を作成してください：
1. 属性を含むエンティティ定義
2. エンティティ間の関係
3. 主キーと外部キー
4. カーディナリティ制約
5. ビジネスルール

Mermaid ER図構文でフォーマットしてください。`,
        variables: ['requirements'],
        examples: [
          '顧客 -> 注文 (1:N), 注文 -> 商品 (M:N)',
          '従業員 -> 部署 (N:1), プロジェクト -> タスク (1:N)',
          '商品 -> カテゴリ (N:1), 仕入先 -> 商品 (1:N)'
        ]
      }
    ]);
  }

  /**
   * 言語設定の取得
   */
  getLanguageConfig(language: SupportedLanguage): LanguageConfig | undefined {
    return this.languageConfigs.get(language);
  }

  /**
   * サポートされている言語の取得
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return Array.from(this.languageConfigs.keys());
  }

  /**
   * 翻訳の取得
   */
  translate(key: string, language: SupportedLanguage, fallbackLanguage: SupportedLanguage = 'en'): string {
    const translationKey = this.translations.get(key);
    if (!translationKey) {
      return key; // キーが見つからない場合はキーをそのまま返す
    }

    return translationKey.translations[language] || 
           translationKey.translations[fallbackLanguage] || 
           key;
  }

  /**
   * 翻訳キーの追加
   */
  addTranslation(key: string, translations: Record<SupportedLanguage, string>, context?: string, category?: string): void {
    this.translations.set(key, {
      key,
      translations,
      context,
      category
    });
  }

  /**
   * プロンプトテンプレートの追加
   */
  addPromptTemplate(templateId: string, prompts: LocalizedPrompt[]): void {
    this.promptTemplates.set(templateId, prompts);
  }

  /**
   * ローカライズされたプロンプトの取得
   */
  getLocalizedPrompt(templateId: string, language: SupportedLanguage, variables: Record<string, string> = {}): string {
    const templates = this.promptTemplates.get(templateId);
    if (!templates) {
      throw new Error(`Prompt template not found: ${templateId}`);
    }

    const template = templates.find(t => t.language === language) || 
                    templates.find(t => t.language === 'en') || 
                    templates[0];

    if (!template) {
      throw new Error(`No template found for template ID: ${templateId}`);
    }

    let prompt = template.prompt;
    
    // 変数の置換
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      prompt = prompt.replace(new RegExp(placeholder, 'g'), value);
    }

    return prompt;
  }

  /**
   * 言語検出（簡易版）
   */
  detectLanguage(text: string): LanguageDetectionResult {
    const languagePatterns = {
      en: /[a-zA-Z]/g,
      zh: /[\u4e00-\u9fff]/g,
      ja: /[\u3040-\u309f\u30a0-\u30ff]/g
    };

    const scores: Record<SupportedLanguage, number> = {
      en: 0,
      zh: 0,
      ja: 0
    };

    // 文字種の分析
    for (const [lang, pattern] of Object.entries(languagePatterns)) {
      const matches = text.match(pattern);
      if (matches) {
        scores[lang as SupportedLanguage] = matches.length;
      }
    }

    // 言語固有のキーワード検出
    const keywords = {
      en: ['the', 'and', 'or', 'for', 'with', 'system', 'management', 'data'],
      zh: ['的', '和', '或', '系统', '管理', '数据', '功能', '用户'],
      ja: ['の', 'と', 'または', 'システム', '管理', 'データ', '機能', 'ユーザー']
    };

    for (const [lang, langKeywords] of Object.entries(keywords)) {
      for (const keyword of langKeywords) {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          scores[lang as SupportedLanguage] += 1;
        }
      }
    }

    // 最も高いスコアの言語を検出
    let detectedLanguage: SupportedLanguage = 'en';
    let maxScore = scores.en;

    for (const [lang, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedLanguage = lang as SupportedLanguage;
      }
    }

    // 信頼度の計算
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const confidence = totalScore > 0 ? maxScore / totalScore : 0;

    // 代替言語の計算
    const alternatives = Object.entries(scores)
      .filter(([lang, score]) => lang !== detectedLanguage && score > 0)
      .map(([lang, score]) => ({
        language: lang as SupportedLanguage,
        confidence: totalScore > 0 ? score / totalScore : 0
      }))
      .sort((a, b) => b.confidence - a.confidence);

    return {
      detectedLanguage,
      confidence,
      alternatives
    };
  }

  /**
   * テキストの正規化
   */
  normalizeText(text: string, language: SupportedLanguage): string {
    // 基本的な正規化
    let normalized = text.trim();
    
    // 言語固有の正規化
    switch (language) {
      case 'zh':
        // 中国語の正規化（簡体字・繁体字の統一など）
        normalized = this.normalizeChineseText(normalized);
        break;
      case 'ja':
        // 日本語の正規化（全角・半角の統一など）
        normalized = this.normalizeJapaneseText(normalized);
        break;
      case 'en':
        // 英語の正規化（大文字小文字の統一など）
        normalized = this.normalizeEnglishText(normalized);
        break;
    }

    return normalized;
  }

  /**
   * 中国語テキストの正規化
   */
  private normalizeChineseText(text: string): string {
    // 簡体字・繁体字の統一（簡易版）
    const simplifiedMap: Record<string, string> = {
      '繁體': '繁体',
      '簡體': '简体',
      '系統': '系统',
      '數據': '数据',
      '用戶': '用户',
      '功能': '功能',
      '管理': '管理'
    };

    let normalized = text;
    for (const [traditional, simplified] of Object.entries(simplifiedMap)) {
      normalized = normalized.replace(new RegExp(traditional, 'g'), simplified);
    }

    return normalized;
  }

  /**
   * 日本語テキストの正規化
   */
  private normalizeJapaneseText(text: string): string {
    // 全角・半角の統一
    let normalized = text;
    
    // 全角英数字を半角に変換
    normalized = normalized.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => {
      return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
    });

    // 全角記号を半角に変換
    normalized = normalized.replace(/[！-～]/g, (char) => {
      return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
    });

    return normalized;
  }

  /**
   * 英語テキストの正規化
   */
  private normalizeEnglishText(text: string): string {
    // 大文字小文字の統一（文頭のみ大文字）
    return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  }

  /**
   * 日付のローカライゼーション
   */
  formatDate(date: Date, language: SupportedLanguage): string {
    const config = this.getLanguageConfig(language);
    if (!config) {
      return date.toISOString();
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (language) {
      case 'en':
        return `${month}/${day}/${year}`;
      case 'zh':
        return `${year}-${month}-${day}`;
      case 'ja':
        return `${year}/${month}/${day}`;
      default:
        return date.toISOString();
    }
  }

  /**
   * 数値のローカライゼーション
   */
  formatNumber(number: number, language: SupportedLanguage, options?: {
    decimals?: number;
    currency?: boolean;
  }): string {
    const config = this.getLanguageConfig(language);
    if (!config) {
      return number.toString();
    }

    const { decimals = 2, currency = false } = options || {};
    
    let formatted = number.toFixed(decimals);
    
    if (currency) {
      formatted = `${config.numberFormat.currency}${formatted}`;
    }

    return formatted;
  }

  /**
   * 翻訳統計の取得
   */
  getTranslationStatistics(): {
    totalKeys: number;
    languages: Record<SupportedLanguage, number>;
    categories: Record<string, number>;
  } {
    const keys = Array.from(this.translations.values());
    const languages: Record<SupportedLanguage, number> = { en: 0, zh: 0, ja: 0 };
    const categories: Record<string, number> = {};

    keys.forEach(key => {
      // 言語別カウント
      Object.keys(key.translations).forEach(lang => {
        languages[lang as SupportedLanguage]++;
      });

      // カテゴリ別カウント
      if (key.category) {
        categories[key.category] = (categories[key.category] || 0) + 1;
      }
    });

    return {
      totalKeys: keys.length,
      languages,
      categories
    };
  }
} 