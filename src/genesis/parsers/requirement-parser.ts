/**
 * Requirement Specification Parser
 * 要求仕様フォームの自動解析機能
 */

export interface RequirementForm {
  title: string;
  description: string;
  businessDomain: string;
  stakeholders: string[];
  objectives: string[];
  functionalRequirements: FunctionalRequirement[];
  nonFunctionalRequirements: NonFunctionalRequirement[];
  constraints: string[];
  assumptions: string[];
  success_criteria: string[];
  timeline?: string;
  budget?: string;
  priority: 'high' | 'medium' | 'low';
  complexity: 1 | 2 | 3 | 4 | 5;
}

export interface FunctionalRequirement {
  id: string;
  title: string;
  description: string;
  actor: string;
  preconditions: string[];
  steps: string[];
  postconditions: string[];
  priority: 'must' | 'should' | 'could' | 'wont';
  complexity: 1 | 2 | 3 | 4 | 5;
  dependencies: string[];
  acceptance_criteria: string[];
}

export interface NonFunctionalRequirement {
  category: 'performance' | 'security' | 'usability' | 'reliability' | 'scalability' | 'maintainability' | 'compatibility';
  description: string;
  metric?: string;
  target?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ParseResult {
  success: boolean;
  form: RequirementForm | null;
  errors: string[];
  warnings: string[];
  confidence: number;
  metadata: {
    parseTime: number;
    sourceType: 'freeform' | 'structured' | 'template';
    extractedSections: number;
  };
}

/**
 * Requirement Specification Parser
 * 自然言語の要求仕様を構造化フォームに変換
 */
export class RequirementParser {
  private static readonly SECTION_PATTERNS = {
    title: /(?:^|\n)(?:title|タイトル|件名|プロジェクト名)\s*[:：]\s*(.+)/i,
    description: /(?:^|\n)(?:description|説明|概要|目的)\s*[:：]\s*([\s\S]*?)(?=\n\s*(?:\w+\s*[:：]|$))/i,
    domain: /(?:^|\n)(?:domain|業務領域|分野|業界)\s*[:：]\s*(.+)/i,
    stakeholders: /(?:^|\n)(?:stakeholders?|関係者|ステークホルダー)\s*[:：]\s*([\s\S]*?)(?=\n\s*(?:\w+\s*[:：]|$))/i,
    objectives: /(?:^|\n)(?:objectives?|目標|ゴール|目的)\s*[:：]\s*([\s\S]*?)(?=\n\s*(?:\w+\s*[:：]|$))/i,
    functional: /(?:^|\n)(?:functional\s*requirements?|機能要求|機能要件)\s*[:：]\s*([\s\S]*?)(?=\n\s*(?:non-?functional|制約|前提|$))/i,
    nonFunctional: /(?:^|\n)(?:non-?functional\s*requirements?|非機能要求|非機能要件)\s*[:：]\s*([\s\S]*?)(?=\n\s*(?:\w+\s*[:：]|$))/i,
    constraints: /(?:^|\n)(?:constraints?|制約|制限)\s*[:：]\s*([\s\S]*?)(?=\n\s*(?:\w+\s*[:：]|$))/i,
    assumptions: /(?:^|\n)(?:assumptions?|前提条件|前提)\s*[:：]\s*([\s\S]*?)(?=\n\s*(?:\w+\s*[:：]|$))/i,
    success: /(?:^|\n)(?:success\s*criteria|成功基準|完了条件)\s*[:：]\s*([\s\S]*?)(?=\n\s*(?:\w+\s*[:：]|$))/i,
    timeline: /(?:^|\n)(?:timeline|スケジュール|期間)\s*[:：]\s*(.+)/i,
    budget: /(?:^|\n)(?:budget|予算|コスト)\s*[:：]\s*(.+)/i,
    priority: /(?:^|\n)(?:priority|優先度)\s*[:：]\s*(high|medium|low|高|中|低)/i,
    complexity: /(?:^|\n)(?:complexity|複雑度)\s*[:：]\s*([1-5]|簡単|普通|複雑|very?\s*complex)/i
  };

  private static readonly USER_STORY_PATTERN = /(?:^|\n)(?:as\s+(?:a|an)\s+(.+?),?\s*)?(?:i\s+want\s+(?:to\s+)?(.+?),?\s*)?(?:so\s+that\s+(.+))?/gi;
  private static readonly ACCEPTANCE_CRITERIA_PATTERN = /(?:^|\n)(?:given|when|then|and)\s+(.+)/gi;
  private static readonly LIST_ITEM_PATTERN = /(?:^|\n)[-*•]\s+(.+)/g;
  private static readonly NUMBERED_LIST_PATTERN = /(?:^|\n)\d+\.\s+(.+)/g;

  /**
   * 要求仕様テキストを解析
   */
  static parse(text: string): ParseResult {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let confidence = 0.5;
    let extractedSections = 0;

    try {
      // 1. ソースタイプの判定
      const sourceType = this.determineSourceType(text);
      
      // 2. 基本情報の抽出
      const basicInfo = this.extractBasicInfo(text);
      if (basicInfo.title) extractedSections++;
      if (basicInfo.description) extractedSections++;
      if (basicInfo.domain) extractedSections++;

      // 3. ステークホルダーの抽出
      const stakeholders = this.extractStakeholders(text);
      if (stakeholders.length > 0) extractedSections++;

      // 4. 目標の抽出
      const objectives = this.extractObjectives(text);
      if (objectives.length > 0) extractedSections++;

      // 5. 機能要求の抽出
      const functionalRequirements = this.extractFunctionalRequirements(text);
      if (functionalRequirements.length > 0) extractedSections++;

      // 6. 非機能要求の抽出
      const nonFunctionalRequirements = this.extractNonFunctionalRequirements(text);
      if (nonFunctionalRequirements.length > 0) extractedSections++;

      // 7. 制約・前提条件の抽出
      const constraints = this.extractConstraints(text);
      const assumptions = this.extractAssumptions(text);
      const successCriteria = this.extractSuccessCriteria(text);

      // 8. メタデータの抽出
      const metadata = this.extractMetadata(text);

      // 9. 信頼度の計算
      confidence = this.calculateConfidence({
        basicInfo,
        stakeholders,
        objectives,
        functionalRequirements,
        nonFunctionalRequirements,
        constraints,
        assumptions,
        successCriteria,
        extractedSections
      });

      // 10. 結果の構築
      const form: RequirementForm = {
        title: basicInfo.title || 'Untitled Project',
        description: basicInfo.description || '',
        businessDomain: basicInfo.domain || 'General',
        stakeholders,
        objectives,
        functionalRequirements,
        nonFunctionalRequirements,
        constraints,
        assumptions,
        success_criteria: successCriteria,
        timeline: metadata.timeline,
        budget: metadata.budget,
        priority: metadata.priority || 'medium',
        complexity: metadata.complexity || 3
      };

      // 11. 検証
      const validationResult = this.validateForm(form);
      warnings.push(...validationResult.warnings);
      if (validationResult.errors.length > 0) {
        errors.push(...validationResult.errors);
        confidence *= 0.7;
      }

      return {
        success: errors.length === 0,
        form,
        errors,
        warnings,
        confidence,
        metadata: {
          parseTime: Date.now() - startTime,
          sourceType,
          extractedSections
        }
      };

    } catch (error) {
      errors.push(`Parsing failed: ${error}`);
      
      return {
        success: false,
        form: null,
        errors,
        warnings,
        confidence: 0,
        metadata: {
          parseTime: Date.now() - startTime,
          sourceType: 'freeform',
          extractedSections: 0
        }
      };
    }
  }

  /**
   * ソースタイプの判定
   */
  private static determineSourceType(text: string): 'freeform' | 'structured' | 'template' {
    const structuredIndicators = [
      /title\s*[:：]/i,
      /description\s*[:：]/i,
      /requirements?\s*[:：]/i,
      /functional\s*[:：]/i,
      /non-?functional\s*[:：]/i
    ];

    const templateIndicators = [
      /project\s*name\s*[:：]/i,
      /business\s*domain\s*[:：]/i,
      /stakeholders?\s*[:：]/i,
      /acceptance\s*criteria\s*[:：]/i
    ];

    const structuredScore = structuredIndicators.reduce((score, pattern) => 
      score + (pattern.test(text) ? 1 : 0), 0);
    
    const templateScore = templateIndicators.reduce((score, pattern) => 
      score + (pattern.test(text) ? 1 : 0), 0);

    if (templateScore >= 3) return 'template';
    if (structuredScore >= 2) return 'structured';
    return 'freeform';
  }

  /**
   * 基本情報の抽出
   */
  private static extractBasicInfo(text: string): {
    title: string | null;
    description: string | null;
    domain: string | null;
  } {
    const titleMatch = text.match(this.SECTION_PATTERNS.title);
    const descriptionMatch = text.match(this.SECTION_PATTERNS.description);
    const domainMatch = text.match(this.SECTION_PATTERNS.domain);

    return {
      title: titleMatch ? titleMatch[1].trim() : null,
      description: descriptionMatch ? descriptionMatch[1].trim() : null,
      domain: domainMatch ? domainMatch[1].trim() : null
    };
  }

  /**
   * ステークホルダーの抽出
   */
  private static extractStakeholders(text: string): string[] {
    const sectionMatch = text.match(this.SECTION_PATTERNS.stakeholders);
    if (!sectionMatch) return [];

    const section = sectionMatch[1];
    const stakeholders: string[] = [];

    // リスト形式の抽出
    const listMatches = [...section.matchAll(this.LIST_ITEM_PATTERN)];
    stakeholders.push(...listMatches.map(match => match[1].trim()));

    // 番号付きリスト形式の抽出
    const numberedMatches = [...section.matchAll(this.NUMBERED_LIST_PATTERN)];
    stakeholders.push(...numberedMatches.map(match => match[1].trim()));

    // カンマ区切りの抽出
    if (stakeholders.length === 0) {
      const commaSeparated = section.split(',').map(s => s.trim()).filter(s => s);
      stakeholders.push(...commaSeparated);
    }

    return Array.from(new Set(stakeholders));
  }

  /**
   * 目標の抽出
   */
  private static extractObjectives(text: string): string[] {
    const sectionMatch = text.match(this.SECTION_PATTERNS.objectives);
    if (!sectionMatch) return [];

    const section = sectionMatch[1];
    const objectives: string[] = [];

    // リスト形式の抽出
    const listMatches = [...section.matchAll(this.LIST_ITEM_PATTERN)];
    objectives.push(...listMatches.map(match => match[1].trim()));

    // 番号付きリスト形式の抽出
    const numberedMatches = [...section.matchAll(this.NUMBERED_LIST_PATTERN)];
    objectives.push(...numberedMatches.map(match => match[1].trim()));

    // 改行区切りの抽出
    if (objectives.length === 0) {
      const lines = section.split('\n').map(line => line.trim()).filter(line => line);
      objectives.push(...lines);
    }

    return Array.from(new Set(objectives));
  }

  /**
   * 機能要求の抽出
   */
  private static extractFunctionalRequirements(text: string): FunctionalRequirement[] {
    const requirements: FunctionalRequirement[] = [];
    let idCounter = 1;

    // 1. 構造化された機能要求セクションの抽出
    const sectionMatch = text.match(this.SECTION_PATTERNS.functional);
    if (sectionMatch) {
      const section = sectionMatch[1];
      const reqTexts = this.extractRequirementTexts(section);
      
      reqTexts.forEach(reqText => {
        const req = this.parseIndividualRequirement(reqText, `FR${String(idCounter).padStart(3, '0')}`);
        if (req) {
          requirements.push(req);
          idCounter++;
        }
      });
    }

    // 2. ユーザーストーリー形式の抽出
    const userStories = this.extractUserStories(text);
    userStories.forEach(story => {
      requirements.push({
        id: `US${String(idCounter).padStart(3, '0')}`,
        title: story.title,
        description: story.description,
        actor: story.actor,
        preconditions: [],
        steps: story.steps,
        postconditions: [],
        priority: 'should',
        complexity: 3,
        dependencies: [],
        acceptance_criteria: story.acceptanceCriteria
      });
      idCounter++;
    });

    return requirements;
  }

  /**
   * 非機能要求の抽出
   */
  private static extractNonFunctionalRequirements(text: string): NonFunctionalRequirement[] {
    const requirements: NonFunctionalRequirement[] = [];
    
    const sectionMatch = text.match(this.SECTION_PATTERNS.nonFunctional);
    if (!sectionMatch) return requirements;

    const section = sectionMatch[1];
    const categories = {
      performance: /(?:performance|パフォーマンス|性能|応答時間|スループット)/i,
      security: /(?:security|セキュリティ|認証|認可|暗号化)/i,
      usability: /(?:usability|ユーザビリティ|使いやすさ|操作性)/i,
      reliability: /(?:reliability|信頼性|可用性|uptime)/i,
      scalability: /(?:scalability|拡張性|スケーラビリティ)/i,
      maintainability: /(?:maintainability|保守性|メンテナンス)/i,
      compatibility: /(?:compatibility|互換性|対応環境)/i
    };

    const lines = section.split('\n').map(line => line.trim()).filter(line => line);
    
    lines.forEach(line => {
      for (const [category, pattern] of Object.entries(categories)) {
        if (pattern.test(line)) {
          requirements.push({
            category: category as NonFunctionalRequirement['category'],
            description: line,
            priority: 'medium'
          });
          break;
        }
      }
    });

    return requirements;
  }

  /**
   * 要求テキストの抽出
   */
  private static extractRequirementTexts(section: string): string[] {
    const texts: string[] = [];
    
    // リスト形式
    const listMatches = [...section.matchAll(this.LIST_ITEM_PATTERN)];
    texts.push(...listMatches.map(match => match[1].trim()));

    // 番号付きリスト形式
    const numberedMatches = [...section.matchAll(this.NUMBERED_LIST_PATTERN)];
    texts.push(...numberedMatches.map(match => match[1].trim()));

    // 段落形式
    if (texts.length === 0) {
      const paragraphs = section.split('\n\n').map(p => p.trim()).filter(p => p);
      texts.push(...paragraphs);
    }

    return texts;
  }

  /**
   * 個別要求の解析
   */
  private static parseIndividualRequirement(text: string, id: string): FunctionalRequirement | null {
    if (!text.trim()) return null;

    // タイトルと説明の分離
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const title = lines[0];
    const description = lines.slice(1).join(' ') || title;

    // 優先度の推定
    let priority: FunctionalRequirement['priority'] = 'should';
    if (/(?:must|必須|required)/i.test(text)) priority = 'must';
    else if (/(?:could|option|望ましい)/i.test(text)) priority = 'could';

    // 複雑度の推定
    let complexity: number = 3;
    if (text.length < 50) complexity = 1;
    else if (text.length < 100) complexity = 2;
    else if (text.length > 200) complexity = 4;
    if (/(?:complex|複雑|integration|統合)/i.test(text)) complexity = 5;

    return {
      id,
      title,
      description,
      actor: 'User',
      preconditions: [],
      steps: [],
      postconditions: [],
      priority,
      complexity: complexity as FunctionalRequirement['complexity'],
      dependencies: [],
      acceptance_criteria: []
    };
  }

  /**
   * ユーザーストーリーの抽出
   */
  private static extractUserStories(text: string): Array<{
    title: string;
    description: string;
    actor: string;
    steps: string[];
    acceptanceCriteria: string[];
  }> {
    const stories: Array<{
      title: string;
      description: string;
      actor: string;
      steps: string[];
      acceptanceCriteria: string[];
    }> = [];

    const matches = [...text.matchAll(this.USER_STORY_PATTERN)];
    
    matches.forEach(match => {
      const actor = match[1] || 'User';
      const want = match[2] || '';
      const soThat = match[3] || '';

      if (want) {
        stories.push({
          title: `${actor} wants to ${want}`,
          description: soThat ? `So that ${soThat}` : want,
          actor,
          steps: [want],
          acceptanceCriteria: []
        });
      }
    });

    return stories;
  }

  /**
   * 制約の抽出
   */
  private static extractConstraints(text: string): string[] {
    return this.extractListItems(text, this.SECTION_PATTERNS.constraints);
  }

  /**
   * 前提条件の抽出
   */
  private static extractAssumptions(text: string): string[] {
    return this.extractListItems(text, this.SECTION_PATTERNS.assumptions);
  }

  /**
   * 成功基準の抽出
   */
  private static extractSuccessCriteria(text: string): string[] {
    return this.extractListItems(text, this.SECTION_PATTERNS.success);
  }

  /**
   * リストアイテムの抽出ヘルパー
   */
  private static extractListItems(text: string, pattern: RegExp): string[] {
    const sectionMatch = text.match(pattern);
    if (!sectionMatch) return [];

    const section = sectionMatch[1];
    const items: string[] = [];

    // リスト形式
    const listMatches = [...section.matchAll(this.LIST_ITEM_PATTERN)];
    items.push(...listMatches.map(match => match[1].trim()));

    // 番号付きリスト形式
    const numberedMatches = [...section.matchAll(this.NUMBERED_LIST_PATTERN)];
    items.push(...numberedMatches.map(match => match[1].trim()));

    // 改行区切り
    if (items.length === 0) {
      const lines = section.split('\n').map(line => line.trim()).filter(line => line);
      items.push(...lines);
    }

    return Array.from(new Set(items));
  }

  /**
   * メタデータの抽出
   */
  private static extractMetadata(text: string): {
    timeline?: string;
    budget?: string;
    priority: 'high' | 'medium' | 'low';
    complexity: 1 | 2 | 3 | 4 | 5;
  } {
    const timelineMatch = text.match(this.SECTION_PATTERNS.timeline);
    const budgetMatch = text.match(this.SECTION_PATTERNS.budget);
    const priorityMatch = text.match(this.SECTION_PATTERNS.priority);
    const complexityMatch = text.match(this.SECTION_PATTERNS.complexity);

    let priority: 'high' | 'medium' | 'low' = 'medium';
    if (priorityMatch) {
      const p = priorityMatch[1].toLowerCase();
      if (p.includes('high') || p.includes('高')) priority = 'high';
      else if (p.includes('low') || p.includes('低')) priority = 'low';
    }

    let complexity: 1 | 2 | 3 | 4 | 5 = 3;
    if (complexityMatch) {
      const c = complexityMatch[1];
      if (/[1-5]/.test(c)) {
        complexity = parseInt(c) as 1 | 2 | 3 | 4 | 5;
      } else if (/簡単|simple/i.test(c)) {
        complexity = 1;
      } else if (/複雑|complex/i.test(c)) {
        complexity = 5;
      }
    }

    return {
      timeline: timelineMatch ? timelineMatch[1].trim() : undefined,
      budget: budgetMatch ? budgetMatch[1].trim() : undefined,
      priority,
      complexity
    };
  }

  /**
   * 信頼度の計算
   */
  private static calculateConfidence(data: any): number {
    let confidence = 0.3; // ベース信頼度

    // 基本情報の完全性
    if (data.basicInfo.title) confidence += 0.1;
    if (data.basicInfo.description) confidence += 0.1;
    if (data.basicInfo.domain) confidence += 0.05;

    // 要求の充実度
    confidence += Math.min(0.2, data.functionalRequirements.length * 0.05);
    confidence += Math.min(0.1, data.nonFunctionalRequirements.length * 0.02);

    // 関係者・制約の明確性
    confidence += Math.min(0.1, data.stakeholders.length * 0.02);
    confidence += Math.min(0.05, data.constraints.length * 0.01);

    // 抽出セクション数
    confidence += Math.min(0.2, data.extractedSections * 0.03);

    return Math.min(1.0, confidence);
  }

  /**
   * フォームの検証
   */
  private static validateForm(form: RequirementForm): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 必須フィールドの検証
    if (!form.title) errors.push('Title is required');
    if (!form.description) warnings.push('Description is empty');
    if (form.functionalRequirements.length === 0) warnings.push('No functional requirements found');

    // 論理的検証
    if (form.stakeholders.length === 0) warnings.push('No stakeholders identified');
    if (form.objectives.length === 0) warnings.push('No objectives specified');

    return { errors, warnings };
  }

  /**
   * フォームからテキストへの逆変換
   */
  static formToText(form: RequirementForm): string {
    const sections: string[] = [];

    sections.push(`Title: ${form.title}`);
    sections.push(`Description: ${form.description}`);
    sections.push(`Business Domain: ${form.businessDomain}`);
    
    if (form.stakeholders.length > 0) {
      sections.push(`Stakeholders:\n${form.stakeholders.map(s => `- ${s}`).join('\n')}`);
    }

    if (form.objectives.length > 0) {
      sections.push(`Objectives:\n${form.objectives.map(o => `- ${o}`).join('\n')}`);
    }

    if (form.functionalRequirements.length > 0) {
      sections.push(`Functional Requirements:\n${form.functionalRequirements.map(req => 
        `- ${req.title}: ${req.description}`).join('\n')}`);
    }

    if (form.nonFunctionalRequirements.length > 0) {
      sections.push(`Non-functional Requirements:\n${form.nonFunctionalRequirements.map(req => 
        `- ${req.category}: ${req.description}`).join('\n')}`);
    }

    if (form.constraints.length > 0) {
      sections.push(`Constraints:\n${form.constraints.map(c => `- ${c}`).join('\n')}`);
    }

    return sections.join('\n\n');
  }
}