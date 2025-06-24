/**
 * Structured Data Extractor
 * Markdown応答から構造化データを抽出する機能
 */

export interface ExtractionRule {
  name: string;
  pattern: RegExp;
  transform?: (match: string) => any;
  required?: boolean;
}

export interface ExtractionSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties?: Record<string, ExtractionSchema>;
  items?: ExtractionSchema;
  rules?: ExtractionRule[];
  default?: any;
}

export interface ExtractionResult {
  success: boolean;
  data: any;
  errors: string[];
  warnings: string[];
  metadata: {
    sourceLength: number;
    extractedFields: number;
    confidence: number;
  };
}

/**
 * Structured Data Extractor
 * Markdown形式のAI応答から構造化データを抽出
 */
export class StructuredDataExtractor {
  private static readonly CODE_BLOCK_PATTERN = /```(?:json|javascript|js)?\s*([\s\S]*?)```/gi;
  private static readonly JSON_PATTERN = /\{[\s\S]*\}/g;
  private static readonly TABLE_PATTERN = /\|([^|]+)\|/g;
  private static readonly LIST_PATTERN = /^[-*+]\s+(.+)$/gm;
  private static readonly HEADING_PATTERN = /^#{1,6}\s+(.+)$/gm;

  /**
   * Markdownテキストから構造化データを抽出
   */
  static extract(markdownText: string, schema?: ExtractionSchema): ExtractionResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let extractedData: any = null;
    let confidence = 0;

    try {
      // 1. JSONコードブロックの抽出を試行
      const jsonResult = this.extractFromCodeBlocks(markdownText);
      if (jsonResult.success) {
        extractedData = jsonResult.data;
        confidence = 0.9;
      }

      // 2. インラインJSONの抽出を試行
      if (!extractedData) {
        const inlineResult = this.extractInlineJSON(markdownText);
        if (inlineResult.success) {
          extractedData = inlineResult.data;
          confidence = 0.7;
        }
      }

      // 3. テーブル形式の抽出を試行
      if (!extractedData) {
        const tableResult = this.extractFromTables(markdownText);
        if (tableResult.success) {
          extractedData = tableResult.data;
          confidence = 0.6;
        }
      }

      // 4. リスト形式の抽出を試行
      if (!extractedData) {
        const listResult = this.extractFromLists(markdownText);
        if (listResult.success) {
          extractedData = listResult.data;
          confidence = 0.5;
        }
      }

      // 5. 構造化抽出（見出しベース）
      if (!extractedData) {
        const structuredResult = this.extractStructured(markdownText);
        if (structuredResult.success) {
          extractedData = structuredResult.data;
          confidence = 0.4;
        }
      }

      // スキーマ検証
      if (schema && extractedData) {
        const validationResult = this.validateAgainstSchema(extractedData, schema);
        if (!validationResult.valid) {
          warnings.push(...validationResult.errors);
          confidence *= 0.8;
        }
      }

      return {
        success: extractedData !== null,
        data: extractedData,
        errors,
        warnings,
        metadata: {
          sourceLength: markdownText.length,
          extractedFields: this.countFields(extractedData),
          confidence
        }
      };

    } catch (error) {
      errors.push(`Extraction failed: ${error}`);
      return {
        success: false,
        data: null,
        errors,
        warnings,
        metadata: {
          sourceLength: markdownText.length,
          extractedFields: 0,
          confidence: 0
        }
      };
    }
  }

  /**
   * JSONコードブロックからの抽出
   */
  private static extractFromCodeBlocks(text: string): { success: boolean; data: any } {
    const matches = [...text.matchAll(this.CODE_BLOCK_PATTERN)];
    
    for (const match of matches) {
      try {
        const jsonText = match[1].trim();
        const parsed = JSON.parse(jsonText);
        return { success: true, data: parsed };
      } catch {
        continue;
      }
    }

    return { success: false, data: null };
  }

  /**
   * インラインJSONの抽出
   */
  private static extractInlineJSON(text: string): { success: boolean; data: any } {
    const matches = [...text.matchAll(this.JSON_PATTERN)];
    
    for (const match of matches) {
      try {
        const parsed = JSON.parse(match[0]);
        // 単純な値ではなく、オブジェクトまたは配列の場合のみ採用
        if (typeof parsed === 'object' && parsed !== null) {
          return { success: true, data: parsed };
        }
      } catch {
        continue;
      }
    }

    return { success: false, data: null };
  }

  /**
   * テーブル形式からの抽出
   */
  private static extractFromTables(text: string): { success: boolean; data: any } {
    const lines = text.split('\n');
    const tables: any[] = [];
    let currentTable: string[][] = [];
    let inTable = false;

    for (const line of lines) {
      if (line.includes('|')) {
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
        if (cells.length > 0) {
          currentTable.push(cells);
          inTable = true;
        }
      } else if (inTable && currentTable.length > 0) {
        // テーブル終了
        if (currentTable.length > 1) {
          const headers = currentTable[0];
          const rows = currentTable.slice(1).filter(row => !row.every(cell => cell.match(/^[-:]+$/)));
          
          if (rows.length > 0) {
            const tableData = rows.map(row => {
              const obj: any = {};
              headers.forEach((header, index) => {
                obj[header] = row[index] || '';
              });
              return obj;
            });
            tables.push(tableData);
          }
        }
        currentTable = [];
        inTable = false;
      }
    }

    // 最後のテーブル処理
    if (currentTable.length > 1) {
      const headers = currentTable[0];
      const rows = currentTable.slice(1).filter(row => !row.every(cell => cell.match(/^[-:]+$/)));
      
      if (rows.length > 0) {
        const tableData = rows.map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });
        tables.push(tableData);
      }
    }

    if (tables.length > 0) {
      return { success: true, data: tables.length === 1 ? tables[0] : tables };
    }

    return { success: false, data: null };
  }

  /**
   * リスト形式からの抽出
   */
  private static extractFromLists(text: string): { success: boolean; data: any } {
    const matches = [...text.matchAll(this.LIST_PATTERN)];
    
    if (matches.length === 0) {
      return { success: false, data: null };
    }

    const items = matches.map(match => {
      const item = match[1].trim();
      
      // Key-Value形式の検出
      const kvMatch = item.match(/^(.+?):\s*(.+)$/);
      if (kvMatch) {
        return { key: kvMatch[1].trim(), value: kvMatch[2].trim() };
      }
      
      return item;
    });

    // すべてKey-Value形式の場合はオブジェクトとして返す
    if (items.every(item => typeof item === 'object' && 'key' in item)) {
      const obj: any = {};
      items.forEach((item: any) => {
        obj[item.key] = item.value;
      });
      return { success: true, data: obj };
    }

    return { success: true, data: items };
  }

  /**
   * 構造化抽出（見出しベース）
   */
  private static extractStructured(text: string): { success: boolean; data: any } {
    const headings = [...text.matchAll(this.HEADING_PATTERN)];
    
    if (headings.length === 0) {
      return { success: false, data: null };
    }

    const result: any = {};
    const lines = text.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];

    for (const line of lines) {
      const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
      
      if (headingMatch) {
        // 前のセクションを保存
        if (currentSection && currentContent.length > 0) {
          result[currentSection] = this.parseContent(currentContent.join('\n'));
        }
        
        currentSection = headingMatch[1].trim();
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    // 最後のセクションを保存
    if (currentSection && currentContent.length > 0) {
      result[currentSection] = this.parseContent(currentContent.join('\n'));
    }

    return { success: Object.keys(result).length > 0, data: result };
  }

  /**
   * セクションコンテンツの解析
   */
  private static parseContent(content: string): any {
    const trimmed = content.trim();
    
    // JSON試行
    try {
      return JSON.parse(trimmed);
    } catch {}

    // リスト試行
    const listResult = this.extractFromLists(trimmed);
    if (listResult.success) {
      return listResult.data;
    }

    // テーブル試行
    const tableResult = this.extractFromTables(trimmed);
    if (tableResult.success) {
      return tableResult.data;
    }

    // プレーンテキスト
    return trimmed;
  }

  /**
   * スキーマに対する検証
   */
  private static validateAgainstSchema(data: any, schema: ExtractionSchema): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 型チェック
    if (!this.validateType(data, schema.type)) {
      errors.push(`Type mismatch. Expected: ${schema.type}, got: ${typeof data}`);
    }

    // プロパティチェック（オブジェクトの場合）
    if (schema.type === 'object' && schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (data && key in data) {
          const propResult = this.validateAgainstSchema(data[key], propSchema);
          errors.push(...propResult.errors.map(err => `${key}.${err}`));
        }
      }
    }

    // 配列アイテムチェック
    if (schema.type === 'array' && schema.items && Array.isArray(data)) {
      data.forEach((item, index) => {
        const itemResult = this.validateAgainstSchema(item, schema.items!);
        errors.push(...itemResult.errors.map(err => `[${index}].${err}`));
      });
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * 型検証
   */
  private static validateType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  /**
   * フィールド数のカウント
   */
  private static countFields(data: any): number {
    if (data === null || data === undefined) {
      return 0;
    }

    if (Array.isArray(data)) {
      return data.reduce((count: number, item: any) => count + this.countFields(item), 0);
    }

    if (typeof data === 'object') {
      return Object.keys(data).length + 
             Object.values(data).reduce((count: number, value: any) => count + this.countFields(value), 0);
    }

    return 1;
  }

  /**
   * 信頼度の計算
   */
  static calculateConfidence(result: ExtractionResult): number {
    let confidence = result.metadata.confidence;

    // エラーがある場合は信頼度を下げる
    confidence *= Math.max(0.1, 1 - (result.errors.length * 0.2));
    
    // 警告がある場合は軽く信頼度を下げる
    confidence *= Math.max(0.5, 1 - (result.warnings.length * 0.1));
    
    // 抽出フィールド数が多いほど信頼度を上げる
    const fieldBonus = Math.min(0.2, result.metadata.extractedFields * 0.01);
    confidence += fieldBonus;

    return Math.min(1.0, Math.max(0.0, confidence));
  }

  /**
   * 複数候補からの最適選択
   */
  static selectBestExtraction(candidates: ExtractionResult[]): ExtractionResult | null {
    if (candidates.length === 0) {
      return null;
    }

    // 成功した候補のみを対象とする
    const successful = candidates.filter(c => c.success);
    
    if (successful.length === 0) {
      return candidates[0]; // 失敗した中でも最初のものを返す
    }

    // 信頼度とフィールド数でスコアリング
    const scored = successful.map(candidate => ({
      candidate,
      score: this.calculateConfidence(candidate) * 0.7 + 
             (candidate.metadata.extractedFields / 100) * 0.3
    }));

    // 最高スコアの候補を選択
    scored.sort((a, b) => b.score - a.score);
    
    return scored[0].candidate;
  }
}