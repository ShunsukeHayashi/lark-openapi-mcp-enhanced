/**
 * Formula Engine
 * Lark Base数式の自動生成と検証機能
 */

export interface FormulaField {
  name: string;
  tableName: string;
  formula: string;
  returnType: 'text' | 'number' | 'date' | 'boolean' | 'array';
  description?: string;
  dependencies: string[];
  validation?: {
    required: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface FormulaTemplate {
  id: string;
  name: string;
  category: 'calculation' | 'aggregation' | 'logical' | 'date' | 'text' | 'lookup';
  description: string;
  formula: string;
  parameters: FormulaParameter[];
  example: string;
  returnType: string;
}

export interface FormulaParameter {
  name: string;
  type: 'field' | 'value' | 'table';
  required: boolean;
  description: string;
  defaultValue?: any;
}

export interface FormulaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  optimizations: string[];
  dependencies: string[];
  returnType: string;
  complexity: 'low' | 'medium' | 'high';
}

export interface FormulaGenerationRequest {
  intent: string;
  sourceFields: Array<{
    name: string;
    type: string;
    tableName: string;
  }>;
  targetType: string;
  constraints?: any;
  examples?: Array<{
    input: any;
    expectedOutput: any;
  }>;
}

/**
 * Formula Engine
 * Lark Base数式の自動生成、検証、最適化
 */
export class FormulaEngine {
  private static readonly FUNCTION_LIBRARY = new Map<string, FormulaTemplate>([
    // 数学関数
    ['SUM', {
      id: 'SUM',
      name: 'SUM',
      category: 'aggregation',
      description: '数値の合計を計算',
      formula: 'SUM({field})',
      parameters: [
        { name: 'field', type: 'field', required: true, description: '数値フィールド' }
      ],
      example: 'SUM({売上金額})',
      returnType: 'number'
    }],
    ['AVERAGE', {
      id: 'AVERAGE',
      name: 'AVERAGE',
      category: 'aggregation',
      description: '数値の平均を計算',
      formula: 'AVERAGE({field})',
      parameters: [
        { name: 'field', type: 'field', required: true, description: '数値フィールド' }
      ],
      example: 'AVERAGE({評価点数})',
      returnType: 'number'
    }],
    ['COUNT', {
      id: 'COUNT',
      name: 'COUNT',
      category: 'aggregation',
      description: '非空白セルの数をカウント',
      formula: 'COUNT({field})',
      parameters: [
        { name: 'field', type: 'field', required: true, description: 'カウント対象フィールド' }
      ],
      example: 'COUNT({商品名})',
      returnType: 'number'
    }],
    ['MAX', {
      id: 'MAX',
      name: 'MAX',
      category: 'aggregation',
      description: '最大値を取得',
      formula: 'MAX({field})',
      parameters: [
        { name: 'field', type: 'field', required: true, description: '数値フィールド' }
      ],
      example: 'MAX({売上金額})',
      returnType: 'number'
    }],
    ['MIN', {
      id: 'MIN',
      name: 'MIN',
      category: 'aggregation',
      description: '最小値を取得',
      formula: 'MIN({field})',
      parameters: [
        { name: 'field', type: 'field', required: true, description: '数値フィールド' }
      ],
      example: 'MIN({価格})',
      returnType: 'number'
    }],

    // 論理関数
    ['IF', {
      id: 'IF',
      name: 'IF',
      category: 'logical',
      description: '条件に基づく値の選択',
      formula: 'IF({condition}, {true_value}, {false_value})',
      parameters: [
        { name: 'condition', type: 'value', required: true, description: '条件式' },
        { name: 'true_value', type: 'value', required: true, description: '真の場合の値' },
        { name: 'false_value', type: 'value', required: true, description: '偽の場合の値' }
      ],
      example: 'IF({売上金額} > 10000, "高額", "通常")',
      returnType: 'text'
    }],
    ['AND', {
      id: 'AND',
      name: 'AND',
      category: 'logical',
      description: 'すべての条件が真かチェック',
      formula: 'AND({condition1}, {condition2})',
      parameters: [
        { name: 'condition1', type: 'value', required: true, description: '条件1' },
        { name: 'condition2', type: 'value', required: true, description: '条件2' }
      ],
      example: 'AND({在庫数} > 0, {状態} = "販売中")',
      returnType: 'boolean'
    }],
    ['OR', {
      id: 'OR',
      name: 'OR',
      category: 'logical',
      description: 'いずれかの条件が真かチェック',
      formula: 'OR({condition1}, {condition2})',
      parameters: [
        { name: 'condition1', type: 'value', required: true, description: '条件1' },
        { name: 'condition2', type: 'value', required: true, description: '条件2' }
      ],
      example: 'OR({優先度} = "高", {緊急フラグ} = true)',
      returnType: 'boolean'
    }],

    // 日付関数
    ['TODAY', {
      id: 'TODAY',
      name: 'TODAY',
      category: 'date',
      description: '現在の日付を取得',
      formula: 'TODAY()',
      parameters: [],
      example: 'TODAY()',
      returnType: 'date'
    }],
    ['DATEDIF', {
      id: 'DATEDIF',
      name: 'DATEDIF',
      category: 'date',
      description: '日付間の差分を計算',
      formula: 'DATEDIF({start_date}, {end_date}, {unit})',
      parameters: [
        { name: 'start_date', type: 'field', required: true, description: '開始日' },
        { name: 'end_date', type: 'field', required: true, description: '終了日' },
        { name: 'unit', type: 'value', required: true, description: '単位（D/M/Y）' }
      ],
      example: 'DATEDIF({開始日}, {終了日}, "D")',
      returnType: 'number'
    }],

    // テキスト関数
    ['CONCATENATE', {
      id: 'CONCATENATE',
      name: 'CONCATENATE',
      category: 'text',
      description: 'テキストを結合',
      formula: 'CONCATENATE({text1}, {text2})',
      parameters: [
        { name: 'text1', type: 'field', required: true, description: 'テキスト1' },
        { name: 'text2', type: 'field', required: true, description: 'テキスト2' }
      ],
      example: 'CONCATENATE({姓}, {名})',
      returnType: 'text'
    }],
    ['UPPER', {
      id: 'UPPER',
      name: 'UPPER',
      category: 'text',
      description: 'テキストを大文字に変換',
      formula: 'UPPER({text})',
      parameters: [
        { name: 'text', type: 'field', required: true, description: 'テキストフィールド' }
      ],
      example: 'UPPER({商品コード})',
      returnType: 'text'
    }],

    // ルックアップ関数
    ['LOOKUP', {
      id: 'LOOKUP',
      name: 'LOOKUP',
      category: 'lookup',
      description: '他のテーブルから値を検索',
      formula: 'LOOKUP({table}, {search_field}, {return_field}, {search_value})',
      parameters: [
        { name: 'table', type: 'table', required: true, description: '検索対象テーブル' },
        { name: 'search_field', type: 'field', required: true, description: '検索フィールド' },
        { name: 'return_field', type: 'field', required: true, description: '取得フィールド' },
        { name: 'search_value', type: 'value', required: true, description: '検索値' }
      ],
      example: 'LOOKUP({商品マスター}, {商品ID}, {商品名}, {商品ID})',
      returnType: 'text'
    }]
  ]);

  /**
   * 意図から数式を自動生成
   */
  static generateFormula(request: FormulaGenerationRequest): {
    success: boolean;
    formula: string;
    description: string;
    dependencies: string[];
    confidence: number;
    alternatives: Array<{
      formula: string;
      description: string;
      confidence: number;
    }>;
  } {
    const alternatives: Array<{
      formula: string;
      description: string;
      confidence: number;
    }> = [];

    try {
      // 1. 意図の解析
      const intent = this.parseIntent(request.intent);
      
      // 2. パターンマッチング
      const patterns = this.matchPatterns(intent, request.sourceFields, request.targetType);
      
      // 3. 数式候補の生成
      const candidates = this.generateCandidates(patterns, request);
      
      // 4. 最適な数式の選択
      const bestCandidate = candidates.sort((a, b) => b.confidence - a.confidence)[0];
      
      if (!bestCandidate) {
        return {
          success: false,
          formula: '',
          description: '',
          dependencies: [],
          confidence: 0,
          alternatives: []
        };
      }

      // 5. 代替案の生成
      alternatives.push(...candidates.slice(1, 4));

      return {
        success: true,
        formula: bestCandidate.formula,
        description: bestCandidate.description,
        dependencies: bestCandidate.dependencies,
        confidence: bestCandidate.confidence,
        alternatives
      };

    } catch (error) {
      return {
        success: false,
        formula: '',
        description: `Generation failed: ${error}`,
        dependencies: [],
        confidence: 0,
        alternatives: []
      };
    }
  }

  /**
   * 意図の解析
   */
  private static parseIntent(intent: string): {
    operation: string;
    fields: string[];
    conditions: string[];
    output: string;
  } {
    const operations = {
      'sum': ['合計', '総計', 'sum', 'total'],
      'average': ['平均', 'average', 'avg', '平均値'],
      'count': ['個数', 'count', '数', 'カウント'],
      'max': ['最大', 'max', '最大値'],
      'min': ['最小', 'min', '最小値'],
      'if': ['条件', 'if', '場合', '分岐'],
      'concatenate': ['結合', '連結', 'concatenate', '組み合わせ'],
      'lookup': ['検索', 'lookup', '参照', '取得'],
      'calculate': ['計算', '演算', 'calculate'],
      'date_diff': ['日数', '期間', '差分', 'datediff']
    };

    let detectedOperation = 'calculate';
    
    for (const [op, keywords] of Object.entries(operations)) {
      if (keywords.some(keyword => intent.toLowerCase().includes(keyword))) {
        detectedOperation = op;
        break;
      }
    }

    // フィールド名の抽出（{}で囲まれたもの）
    const fieldMatches = intent.match(/\{([^}]+)\}/g) || [];
    const fields = fieldMatches.map(match => match.slice(1, -1));

    // 条件の抽出
    const conditionKeywords = ['>', '<', '=', '>=', '<=', '!=', 'より', '以上', '以下', '等しい'];
    const conditions = conditionKeywords.filter(keyword => intent.includes(keyword));

    return {
      operation: detectedOperation,
      fields,
      conditions,
      output: intent
    };
  }

  /**
   * パターンマッチング
   */
  private static matchPatterns(
    intent: any,
    sourceFields: any[],
    targetType: string
  ): Array<{
    template: FormulaTemplate;
    score: number;
    mappings: Record<string, string>;
  }> {
    const patterns: Array<{
      template: FormulaTemplate;
      score: number;
      mappings: Record<string, string>;
    }> = [];

    for (const template of this.FUNCTION_LIBRARY.values()) {
      let score = 0;
      const mappings: Record<string, string> = {};

      // 操作タイプのマッチング
      if (template.id.toLowerCase() === intent.operation) {
        score += 50;
      }

      // 戻り値タイプのマッチング
      if (template.returnType === targetType) {
        score += 30;
      }

      // フィールドマッピングの試行
      template.parameters.forEach(param => {
        if (param.type === 'field') {
          const matchingField = sourceFields.find(field => 
            intent.fields.includes(field.name) || 
            this.isCompatibleType(field.type, param.name)
          );
          
          if (matchingField) {
            mappings[param.name] = matchingField.name;
            score += 20;
          }
        }
      });

      if (score > 0) {
        patterns.push({ template, score, mappings });
      }
    }

    return patterns.sort((a, b) => b.score - a.score);
  }

  /**
   * 数式候補の生成
   */
  private static generateCandidates(
    patterns: any[],
    request: FormulaGenerationRequest
  ): Array<{
    formula: string;
    description: string;
    dependencies: string[];
    confidence: number;
  }> {
    const candidates: Array<{
      formula: string;
      description: string;
      dependencies: string[];
      confidence: number;
    }> = [];

    patterns.forEach(pattern => {
      try {
        let formula = pattern.template.formula;
        const dependencies: string[] = [];
        
        // パラメータの置換
        pattern.template.parameters.forEach((param: any) => {
          const placeholder = `{${param.name}}`;
          let replacement = '';

          if (param.type === 'field' && pattern.mappings[param.name]) {
            replacement = `{${pattern.mappings[param.name]}}`;
            dependencies.push(pattern.mappings[param.name]);
          } else if (param.type === 'value') {
            replacement = param.defaultValue || '';
          }

          formula = formula.replace(placeholder, replacement);
        });

        // 信頼度の計算
        const confidence = Math.min(1.0, pattern.score / 100);

        candidates.push({
          formula,
          description: pattern.template.description,
          dependencies,
          confidence
        });

      } catch (error) {
        // スキップ
      }
    });

    return candidates;
  }

  /**
   * 数式の検証
   */
  static validateFormula(
    formula: string,
    availableFields: Array<{ name: string; type: string; tableName: string }>
  ): FormulaValidationResult {
    const result: FormulaValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      optimizations: [],
      dependencies: [],
      returnType: 'text',
      complexity: 'low'
    };

    try {
      // 1. 構文チェック
      const syntaxCheck = this.checkSyntax(formula);
      if (!syntaxCheck.isValid) {
        result.isValid = false;
        result.errors.push(...syntaxCheck.errors);
      }

      // 2. フィールド参照チェック
      const fieldCheck = this.checkFieldReferences(formula, availableFields);
      result.errors.push(...fieldCheck.errors);
      result.warnings.push(...fieldCheck.warnings);
      result.dependencies.push(...fieldCheck.dependencies);

      // 3. 関数チェック
      const functionCheck = this.checkFunctions(formula);
      result.errors.push(...functionCheck.errors);
      result.warnings.push(...functionCheck.warnings);

      // 4. 戻り値タイプの推定
      result.returnType = this.inferReturnType(formula, availableFields);

      // 5. 複雑度の評価
      result.complexity = this.evaluateComplexity(formula);

      // 6. 最適化提案
      result.optimizations.push(...this.suggestOptimizations(formula));

      // 7. 改善提案
      result.suggestions.push(...this.generateSuggestions(formula, availableFields));

      if (result.errors.length > 0) {
        result.isValid = false;
      }

      return result;

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Validation failed: ${error}`);
      return result;
    }
  }

  /**
   * 構文チェック
   */
  private static checkSyntax(formula: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 括弧のバランスチェック
    let parenthesesCount = 0;
    let braceCount = 0;

    for (const char of formula) {
      if (char === '(') parenthesesCount++;
      else if (char === ')') parenthesesCount--;
      else if (char === '{') braceCount++;
      else if (char === '}') braceCount--;

      if (parenthesesCount < 0) {
        errors.push('Unmatched closing parenthesis');
        break;
      }
      if (braceCount < 0) {
        errors.push('Unmatched closing brace');
        break;
      }
    }

    if (parenthesesCount > 0) {
      errors.push('Unmatched opening parenthesis');
    }
    if (braceCount > 0) {
      errors.push('Unmatched opening brace');
    }

    // 空の関数呼び出しチェック
    if (formula.includes('()')) {
      errors.push('Empty function call detected');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * フィールド参照チェック
   */
  private static checkFieldReferences(
    formula: string,
    availableFields: Array<{ name: string; type: string; tableName: string }>
  ): {
    errors: string[];
    warnings: string[];
    dependencies: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const dependencies: string[] = [];

    const fieldMatches = formula.match(/\{([^}]+)\}/g) || [];
    const fieldNames = new Set(availableFields.map(f => f.name));

    fieldMatches.forEach(match => {
      const fieldName = match.slice(1, -1);
      
      if (!fieldNames.has(fieldName)) {
        errors.push(`Field not found: ${fieldName}`);
      } else {
        dependencies.push(fieldName);
      }
    });

    return { errors, warnings, dependencies };
  }

  /**
   * 関数チェック
   */
  private static checkFunctions(formula: string): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const functionMatches = formula.match(/([A-Z_]+)\s*\(/g) || [];
    
    functionMatches.forEach(match => {
      const funcName = match.replace(/\s*\($/, '');
      
      if (!this.FUNCTION_LIBRARY.has(funcName)) {
        errors.push(`Unknown function: ${funcName}`);
      }
    });

    return { errors, warnings };
  }

  /**
   * 戻り値タイプの推定
   */
  private static inferReturnType(
    formula: string,
    availableFields: Array<{ name: string; type: string; tableName: string }>
  ): string {
    // 数値関数
    if (/^(SUM|AVERAGE|COUNT|MAX|MIN|DATEDIF)\s*\(/.test(formula)) {
      return 'number';
    }

    // 論理関数
    if (/^(AND|OR)\s*\(/.test(formula) || formula.includes(' > ') || formula.includes(' < ')) {
      return 'boolean';
    }

    // 日付関数
    if (/^(TODAY|DATE)\s*\(/.test(formula)) {
      return 'date';
    }

    // テキスト関数
    if (/^(CONCATENATE|UPPER|LOWER)\s*\(/.test(formula)) {
      return 'text';
    }

    // フィールド参照がある場合はフィールドタイプを使用
    const fieldMatch = formula.match(/\{([^}]+)\}/);
    if (fieldMatch) {
      const fieldName = fieldMatch[1];
      const field = availableFields.find(f => f.name === fieldName);
      if (field) {
        return field.type;
      }
    }

    return 'text';
  }

  /**
   * 複雑度の評価
   */
  private static evaluateComplexity(formula: string): 'low' | 'medium' | 'high' {
    let score = 0;

    // 数式の長さ
    score += Math.floor(formula.length / 50);

    // ネストした関数の数
    const functionCount = (formula.match(/[A-Z_]+\s*\(/g) || []).length;
    score += functionCount;

    // 条件分岐の数
    const ifCount = (formula.match(/IF\s*\(/g) || []).length;
    score += ifCount * 2;

    // 括弧のネストレベル
    let maxNesting = 0;
    let currentNesting = 0;
    for (const char of formula) {
      if (char === '(') {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (char === ')') {
        currentNesting--;
      }
    }
    score += maxNesting;

    if (score <= 3) return 'low';
    if (score <= 8) return 'medium';
    return 'high';
  }

  /**
   * 最適化提案
   */
  private static suggestOptimizations(formula: string): string[] {
    const optimizations: string[] = [];

    // 重複する部分式の検出
    const subExpressions = this.extractSubExpressions(formula);
    const duplicates = subExpressions.filter((expr, index) => 
      subExpressions.indexOf(expr) !== index
    );

    if (duplicates.length > 0) {
      optimizations.push('Consider extracting common sub-expressions to separate fields');
    }

    // 複雑なIF文の簡略化提案
    if (formula.includes('IF(') && formula.length > 100) {
      optimizations.push('Complex IF statement could be simplified using lookup tables');
    }

    return optimizations;
  }

  /**
   * 改善提案
   */
  private static generateSuggestions(
    formula: string,
    availableFields: Array<{ name: string; type: string; tableName: string }>
  ): string[] {
    const suggestions: string[] = [];

    // エラー処理の提案
    if (!formula.includes('IFERROR')) {
      suggestions.push('Consider adding error handling with IFERROR function');
    }

    // 可読性の改善
    if (formula.length > 80) {
      suggestions.push('Formula is quite long, consider breaking it into multiple steps');
    }

    return suggestions;
  }

  /**
   * 部分式の抽出
   */
  private static extractSubExpressions(formula: string): string[] {
    const subExpressions: string[] = [];
    
    // 簡単な実装：関数呼び出しを抽出
    const functionMatches = formula.match(/[A-Z_]+\s*\([^)]*\)/g) || [];
    subExpressions.push(...functionMatches);

    return subExpressions;
  }

  /**
   * 型の互換性チェック
   */
  private static isCompatibleType(fieldType: string, parameterName: string): boolean {
    const numericTypes = ['number', 'integer', 'decimal', 'currency'];
    const textTypes = ['text', 'string', 'email', 'url'];
    const dateTypes = ['date', 'datetime', 'timestamp'];

    if (parameterName.includes('number') || parameterName.includes('amount')) {
      return numericTypes.includes(fieldType);
    }
    
    if (parameterName.includes('text') || parameterName.includes('name')) {
      return textTypes.includes(fieldType);
    }
    
    if (parameterName.includes('date') || parameterName.includes('time')) {
      return dateTypes.includes(fieldType);
    }

    return true; // デフォルトで互換性ありとする
  }

  /**
   * 数式テンプレートの取得
   */
  static getFormulaTemplates(category?: string): FormulaTemplate[] {
    const templates = Array.from(this.FUNCTION_LIBRARY.values());
    
    if (category) {
      return templates.filter(template => template.category === category);
    }
    
    return templates;
  }

  /**
   * カスタム数式テンプレートの追加
   */
  static addCustomTemplate(template: FormulaTemplate): void {
    this.FUNCTION_LIBRARY.set(template.id, template);
  }

  /**
   * 数式の実行シミュレーション
   */
  static simulateFormula(
    formula: string,
    sampleData: Record<string, any>
  ): {
    success: boolean;
    result: any;
    error?: string;
  } {
    try {
      // 簡単な数式シミュレーション（実装省略）
      // 実際にはLark Baseの数式エンジンと同等の処理が必要
      
      return {
        success: true,
        result: 'Simulation result'
      };
    } catch (error) {
      return {
        success: false,
        result: null,
        error: `Simulation failed: ${error}`
      };
    }
  }
}