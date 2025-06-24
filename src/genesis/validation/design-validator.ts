/**
 * Design Validation Engine
 * 生成された設計図の整合性チェック機能
 */

export interface ValidationRule {
  id: string;
  name: string;
  category: 'structural' | 'logical' | 'performance' | 'security' | 'compliance' | 'best_practice';
  severity: 'error' | 'warning' | 'info' | 'suggestion';
  description: string;
  validator: (design: DesignArtifact) => ValidationResult;
  autoFix?: (design: DesignArtifact) => AutoFixResult;
}

export interface DesignArtifact {
  type: 'requirements' | 'entities' | 'base_structure' | 'business_logic' | 'workflows' | 'ui_design' | 'implementation_plan';
  id: string;
  name: string;
  version: string;
  content: any;
  metadata: {
    generatedAt: number;
    generatedBy: string;
    dependencies: string[];
    tags: string[];
  };
}

export interface ValidationResult {
  ruleId: string;
  passed: boolean;
  severity: ValidationRule['severity'];
  message: string;
  details?: string;
  affectedElements: string[];
  suggestions: string[];
  autoFixAvailable: boolean;
}

export interface AutoFixResult {
  success: boolean;
  changes: Array<{
    type: 'add' | 'remove' | 'modify';
    target: string;
    oldValue?: any;
    newValue?: any;
    description: string;
  }>;
  updatedDesign: DesignArtifact;
  warnings: string[];
}

export interface ValidationReport {
  designId: string;
  designType: string;
  timestamp: number;
  overallScore: number; // 0-100
  status: 'passed' | 'warning' | 'failed';
  summary: {
    total: number;
    passed: number;
    warnings: number;
    errors: number;
    suggestions: number;
  };
  results: ValidationResult[];
  recommendations: string[];
  autoFixSuggestions: Array<{
    ruleId: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
  }>;
}

/**
 * Design Validation Engine
 * 設計アーティファクトの包括的検証システム
 */
export class DesignValidationEngine {
  private static readonly VALIDATION_RULES = new Map<string, ValidationRule>();

  static {
    // 基本構造検証ルール
    this.registerRule({
      id: 'REQ_001',
      name: 'Requirements Completeness',
      category: 'structural',
      severity: 'error',
      description: '要求仕様の完全性チェック',
      validator: (design) => this.validateRequirementsCompleteness(design)
    });

    this.registerRule({
      id: 'ENT_001',
      name: 'Entity Naming Convention',
      category: 'best_practice',
      severity: 'warning',
      description: 'エンティティ命名規則の検証',
      validator: (design) => this.validateEntityNaming(design),
      autoFix: (design) => this.fixEntityNaming(design)
    });

    this.registerRule({
      id: 'ENT_002',
      name: 'Primary Key Validation',
      category: 'structural',
      severity: 'error',
      description: '主キーの存在と妥当性検証',
      validator: (design) => this.validatePrimaryKeys(design),
      autoFix: (design) => this.fixPrimaryKeys(design)
    });

    this.registerRule({
      id: 'REL_001',
      name: 'Relationship Integrity',
      category: 'logical',
      severity: 'error',
      description: 'エンティティ間関係の整合性検証',
      validator: (design) => this.validateRelationshipIntegrity(design)
    });

    this.registerRule({
      id: 'FIELD_001',
      name: 'Field Type Consistency',
      category: 'logical',
      severity: 'warning',
      description: 'フィールドタイプの一貫性検証',
      validator: (design) => this.validateFieldTypeConsistency(design)
    });

    this.registerRule({
      id: 'PERF_001',
      name: 'Table Size Optimization',
      category: 'performance',
      severity: 'suggestion',
      description: 'テーブルサイズとパフォーマンス最適化',
      validator: (design) => this.validateTableSizeOptimization(design)
    });

    this.registerRule({
      id: 'SEC_001',
      name: 'Sensitive Data Protection',
      category: 'security',
      severity: 'warning',
      description: '機密データの保護検証',
      validator: (design) => this.validateSensitiveDataProtection(design)
    });

    this.registerRule({
      id: 'FLOW_001',
      name: 'Workflow Logic Validation',
      category: 'logical',
      severity: 'error',
      description: 'ワークフローロジックの検証',
      validator: (design) => this.validateWorkflowLogic(design)
    });

    this.registerRule({
      id: 'UI_001',
      name: 'User Interface Accessibility',
      category: 'compliance',
      severity: 'warning',
      description: 'UIアクセシビリティ検証',
      validator: (design) => this.validateUIAccessibility(design)
    });

    this.registerRule({
      id: 'IMPL_001',
      name: 'Implementation Feasibility',
      category: 'logical',
      severity: 'error',
      description: '実装可能性の検証',
      validator: (design) => this.validateImplementationFeasibility(design)
    });
  }

  /**
   * 設計アーティファクトの包括的検証
   */
  static validateDesign(design: DesignArtifact, options: {
    includeCategories?: ValidationRule['category'][];
    excludeRules?: string[];
    autoFix?: boolean;
  } = {}): ValidationReport {
    const startTime = Date.now();
    const results: ValidationResult[] = [];
    const autoFixSuggestions: ValidationReport['autoFixSuggestions'] = [];

    // 適用ルールの決定
    const applicableRules = this.getApplicableRules(design.type, options);

    // 各ルールの実行
    for (const rule of applicableRules) {
      try {
        const result = rule.validator(design);
        result.ruleId = rule.id;
        results.push(result);

        // 自動修正可能性のチェック
        if (!result.passed && rule.autoFix) {
          autoFixSuggestions.push({
            ruleId: rule.id,
            description: `Auto-fix available for: ${rule.name}`,
            impact: this.assessAutoFixImpact(rule, result)
          });
        }
      } catch (error) {
        results.push({
          ruleId: rule.id,
          passed: false,
          severity: 'error',
          message: `Validation rule execution failed: ${error}`,
          affectedElements: [],
          suggestions: [],
          autoFixAvailable: false
        });
      }
    }

    // 統計の計算
    const summary = this.calculateSummary(results);
    const overallScore = this.calculateOverallScore(results);
    const status = this.determineOverallStatus(results);
    const recommendations = this.generateRecommendations(results);

    return {
      designId: design.id,
      designType: design.type,
      timestamp: Date.now(),
      overallScore,
      status,
      summary,
      results,
      recommendations,
      autoFixSuggestions
    };
  }

  /**
   * バッチ検証
   */
  static validateMultipleDesigns(designs: DesignArtifact[]): Array<ValidationReport> {
    return designs.map(design => this.validateDesign(design));
  }

  /**
   * 設計依存関係の検証
   */
  static validateDesignDependencies(designs: DesignArtifact[]): {
    valid: boolean;
    issues: Array<{
      type: 'missing_dependency' | 'circular_dependency' | 'version_mismatch';
      design: string;
      dependency: string;
      description: string;
    }>;
  } {
    const issues: Array<{
      type: 'missing_dependency' | 'circular_dependency' | 'version_mismatch';
      design: string;
      dependency: string;
      description: string;
    }> = [];

    const designMap = new Map(designs.map(d => [d.id, d]));

    // 依存関係の検証
    for (const design of designs) {
      for (const depId of design.metadata.dependencies) {
        const dependency = designMap.get(depId);
        
        if (!dependency) {
          issues.push({
            type: 'missing_dependency',
            design: design.id,
            dependency: depId,
            description: `Missing dependency: ${depId}`
          });
        }
      }
    }

    // 循環依存の検出
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const detectCycle = (designId: string): boolean => {
      if (recursionStack.has(designId)) {
        return true; // 循環依存発見
      }
      if (visited.has(designId)) {
        return false;
      }

      visited.add(designId);
      recursionStack.add(designId);

      const design = designMap.get(designId);
      if (design) {
        for (const depId of design.metadata.dependencies) {
          if (detectCycle(depId)) {
            issues.push({
              type: 'circular_dependency',
              design: designId,
              dependency: depId,
              description: `Circular dependency detected between ${designId} and ${depId}`
            });
          }
        }
      }

      recursionStack.delete(designId);
      return false;
    };

    designs.forEach(design => {
      if (!visited.has(design.id)) {
        detectCycle(design.id);
      }
    });

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * 具体的な検証ルール実装
   */
  private static validateRequirementsCompleteness(design: DesignArtifact): ValidationResult {
    if (design.type !== 'requirements') {
      return this.createSkipResult('REQ_001', 'Not a requirements artifact');
    }

    const content = design.content;
    const requiredFields = ['title', 'description', 'functionalRequirements', 'stakeholders'];
    const missingFields = requiredFields.filter(field => !content[field] || 
      (Array.isArray(content[field]) && content[field].length === 0));

    return {
      ruleId: 'REQ_001',
      passed: missingFields.length === 0,
      severity: 'error',
      message: missingFields.length === 0 ? 
        'Requirements are complete' : 
        `Missing required fields: ${missingFields.join(', ')}`,
      affectedElements: missingFields,
      suggestions: missingFields.map(field => `Add ${field} to complete requirements specification`),
      autoFixAvailable: false
    };
  }

  private static validateEntityNaming(design: DesignArtifact): ValidationResult {
    if (design.type !== 'entities') {
      return this.createSkipResult('ENT_001', 'Not an entities artifact');
    }

    const entities = design.content.entities || [];
    const invalidNames: string[] = [];
    const namingPattern = /^[A-Z][a-zA-Z0-9]*$/; // PascalCase

    entities.forEach((entity: any) => {
      if (!namingPattern.test(entity.name)) {
        invalidNames.push(entity.name);
      }
    });

    return {
      ruleId: 'ENT_001',
      passed: invalidNames.length === 0,
      severity: 'warning',
      message: invalidNames.length === 0 ? 
        'Entity naming follows conventions' : 
        `Entities with invalid names: ${invalidNames.join(', ')}`,
      affectedElements: invalidNames,
      suggestions: invalidNames.map(name => `Rename '${name}' to follow PascalCase convention`),
      autoFixAvailable: true
    };
  }

  private static validatePrimaryKeys(design: DesignArtifact): ValidationResult {
    if (design.type !== 'entities') {
      return this.createSkipResult('ENT_002', 'Not an entities artifact');
    }

    const entities = design.content.entities || [];
    const entitiesWithoutPK: string[] = [];

    entities.forEach((entity: any) => {
      if (!entity.primaryKey || !entity.attributes.find((attr: any) => attr.name === entity.primaryKey)) {
        entitiesWithoutPK.push(entity.name);
      }
    });

    return {
      ruleId: 'ENT_002',
      passed: entitiesWithoutPK.length === 0,
      severity: 'error',
      message: entitiesWithoutPK.length === 0 ? 
        'All entities have valid primary keys' : 
        `Entities without primary keys: ${entitiesWithoutPK.join(', ')}`,
      affectedElements: entitiesWithoutPK,
      suggestions: entitiesWithoutPK.map(name => `Add primary key to entity '${name}'`),
      autoFixAvailable: true
    };
  }

  private static validateRelationshipIntegrity(design: DesignArtifact): ValidationResult {
    if (design.type !== 'entities') {
      return this.createSkipResult('REL_001', 'Not an entities artifact');
    }

    const entities = design.content.entities || [];
    const relationships = design.content.relationships || [];
    const entityNames = new Set(entities.map((e: any) => e.name));
    const invalidRelationships: string[] = [];

    relationships.forEach((rel: any) => {
      if (!entityNames.has(rel.fromEntity) || !entityNames.has(rel.toEntity)) {
        invalidRelationships.push(`${rel.fromEntity} -> ${rel.toEntity}`);
      }
    });

    return {
      ruleId: 'REL_001',
      passed: invalidRelationships.length === 0,
      severity: 'error',
      message: invalidRelationships.length === 0 ? 
        'All relationships are valid' : 
        `Invalid relationships: ${invalidRelationships.join(', ')}`,
      affectedElements: invalidRelationships,
      suggestions: invalidRelationships.map(rel => `Fix relationship: ${rel}`),
      autoFixAvailable: false
    };
  }

  private static validateFieldTypeConsistency(design: DesignArtifact): ValidationResult {
    if (design.type !== 'base_structure') {
      return this.createSkipResult('FIELD_001', 'Not a base structure artifact');
    }

    const tables = design.content.tables || [];
    const inconsistencies: string[] = [];

    // 同名フィールドの型一貫性チェック
    const fieldTypes = new Map<string, Set<string>>();

    tables.forEach((table: any) => {
      table.fields?.forEach((field: any) => {
        if (!fieldTypes.has(field.name)) {
          fieldTypes.set(field.name, new Set());
        }
        fieldTypes.get(field.name)!.add(field.type);
      });
    });

    fieldTypes.forEach((types, fieldName) => {
      if (types.size > 1) {
        inconsistencies.push(`${fieldName}: ${Array.from(types).join(', ')}`);
      }
    });

    return {
      ruleId: 'FIELD_001',
      passed: inconsistencies.length === 0,
      severity: 'warning',
      message: inconsistencies.length === 0 ? 
        'Field types are consistent' : 
        `Inconsistent field types: ${inconsistencies.join('; ')}`,
      affectedElements: inconsistencies,
      suggestions: inconsistencies.map(inc => `Standardize field type for: ${inc}`),
      autoFixAvailable: false
    };
  }

  private static validateTableSizeOptimization(design: DesignArtifact): ValidationResult {
    if (design.type !== 'base_structure') {
      return this.createSkipResult('PERF_001', 'Not a base structure artifact');
    }

    const tables = design.content.tables || [];
    const oversizedTables: string[] = [];
    const MAX_FIELDS = 50;

    tables.forEach((table: any) => {
      if (table.fields && table.fields.length > MAX_FIELDS) {
        oversizedTables.push(`${table.name} (${table.fields.length} fields)`);
      }
    });

    return {
      ruleId: 'PERF_001',
      passed: oversizedTables.length === 0,
      severity: 'suggestion',
      message: oversizedTables.length === 0 ? 
        'Table sizes are optimized' : 
        `Consider splitting large tables: ${oversizedTables.join(', ')}`,
      affectedElements: oversizedTables,
      suggestions: oversizedTables.map(table => `Consider normalizing: ${table}`),
      autoFixAvailable: false
    };
  }

  private static validateSensitiveDataProtection(design: DesignArtifact): ValidationResult {
    if (design.type !== 'base_structure') {
      return this.createSkipResult('SEC_001', 'Not a base structure artifact');
    }

    const tables = design.content.tables || [];
    const sensitiveFields: string[] = [];
    const sensitivePatterns = /password|secret|token|key|ssn|credit|card|bank/i;

    tables.forEach((table: any) => {
      table.fields?.forEach((field: any) => {
        if (sensitivePatterns.test(field.name) || sensitivePatterns.test(field.description || '')) {
          sensitiveFields.push(`${table.name}.${field.name}`);
        }
      });
    });

    return {
      ruleId: 'SEC_001',
      passed: sensitiveFields.length === 0,
      severity: 'warning',
      message: sensitiveFields.length === 0 ? 
        'No sensitive data detected' : 
        `Potential sensitive fields detected: ${sensitiveFields.join(', ')}`,
      affectedElements: sensitiveFields,
      suggestions: sensitiveFields.map(field => `Consider encryption/masking for: ${field}`),
      autoFixAvailable: false
    };
  }

  private static validateWorkflowLogic(design: DesignArtifact): ValidationResult {
    if (design.type !== 'workflows') {
      return this.createSkipResult('FLOW_001', 'Not a workflows artifact');
    }

    const workflows = design.content.workflows || [];
    const logicIssues: string[] = [];

    workflows.forEach((workflow: any) => {
      // 基本的なワークフロー検証
      if (!workflow.trigger) {
        logicIssues.push(`${workflow.name}: Missing trigger`);
      }
      if (!workflow.steps || workflow.steps.length === 0) {
        logicIssues.push(`${workflow.name}: No steps defined`);
      }
    });

    return {
      ruleId: 'FLOW_001',
      passed: logicIssues.length === 0,
      severity: 'error',
      message: logicIssues.length === 0 ? 
        'Workflow logic is valid' : 
        `Workflow issues: ${logicIssues.join('; ')}`,
      affectedElements: logicIssues,
      suggestions: logicIssues.map(issue => `Fix: ${issue}`),
      autoFixAvailable: false
    };
  }

  private static validateUIAccessibility(design: DesignArtifact): ValidationResult {
    if (design.type !== 'ui_design') {
      return this.createSkipResult('UI_001', 'Not a UI design artifact');
    }

    // UI アクセシビリティの基本チェック
    const forms = design.content.forms || [];
    const accessibilityIssues: string[] = [];

    forms.forEach((form: any) => {
      form.fields?.forEach((field: any) => {
        if (!field.label) {
          accessibilityIssues.push(`${form.name}.${field.name}: Missing label`);
        }
      });
    });

    return {
      ruleId: 'UI_001',
      passed: accessibilityIssues.length === 0,
      severity: 'warning',
      message: accessibilityIssues.length === 0 ? 
        'UI accessibility requirements met' : 
        `Accessibility issues: ${accessibilityIssues.join('; ')}`,
      affectedElements: accessibilityIssues,
      suggestions: accessibilityIssues.map(issue => `Fix accessibility: ${issue}`),
      autoFixAvailable: false
    };
  }

  private static validateImplementationFeasibility(design: DesignArtifact): ValidationResult {
    if (design.type !== 'implementation_plan') {
      return this.createSkipResult('IMPL_001', 'Not an implementation plan artifact');
    }

    const plan = design.content.implementationPlan || {};
    const feasibilityIssues: string[] = [];

    // 基本的な実装可能性チェック
    if (!plan.phases || plan.phases.length === 0) {
      feasibilityIssues.push('No implementation phases defined');
    }

    const totalEffort = plan.phases?.reduce((total: number, phase: any) => {
      return total + (phase.tasks?.reduce((phaseTotal: number, task: any) => {
        return phaseTotal + (parseInt(task.effort) || 0);
      }, 0) || 0);
    }, 0) || 0;

    if (totalEffort > 1000) { // 仮の閾値
      feasibilityIssues.push(`High implementation effort: ${totalEffort} hours`);
    }

    return {
      ruleId: 'IMPL_001',
      passed: feasibilityIssues.length === 0,
      severity: 'error',
      message: feasibilityIssues.length === 0 ? 
        'Implementation plan is feasible' : 
        `Feasibility issues: ${feasibilityIssues.join('; ')}`,
      affectedElements: feasibilityIssues,
      suggestions: feasibilityIssues.map(issue => `Address: ${issue}`),
      autoFixAvailable: false
    };
  }

  /**
   * 自動修正の実装例
   */
  private static fixEntityNaming(design: DesignArtifact): AutoFixResult {
    if (design.type !== 'entities') {
      return { success: false, changes: [], updatedDesign: design, warnings: ['Not an entities artifact'] };
    }

    const changes: AutoFixResult['changes'] = [];
    const updatedDesign = JSON.parse(JSON.stringify(design));
    const entities = updatedDesign.content.entities || [];

    entities.forEach((entity: any, index: number) => {
      const originalName = entity.name;
      const fixedName = this.toPascalCase(originalName);
      
      if (originalName !== fixedName) {
        entity.name = fixedName;
        changes.push({
          type: 'modify',
          target: `entities[${index}].name`,
          oldValue: originalName,
          newValue: fixedName,
          description: `Fixed entity name from '${originalName}' to '${fixedName}'`
        });
      }
    });

    return {
      success: true,
      changes,
      updatedDesign,
      warnings: []
    };
  }

  private static fixPrimaryKeys(design: DesignArtifact): AutoFixResult {
    if (design.type !== 'entities') {
      return { success: false, changes: [], updatedDesign: design, warnings: ['Not an entities artifact'] };
    }

    const changes: AutoFixResult['changes'] = [];
    const updatedDesign = JSON.parse(JSON.stringify(design));
    const entities = updatedDesign.content.entities || [];

    entities.forEach((entity: any, index: number) => {
      if (!entity.primaryKey || !entity.attributes.find((attr: any) => attr.name === entity.primaryKey)) {
        // 'id' フィールドを追加
        const idField = {
          name: 'id',
          type: 'string',
          required: true,
          description: 'Primary key field'
        };

        entity.attributes.unshift(idField);
        entity.primaryKey = 'id';

        changes.push({
          type: 'add',
          target: `entities[${index}].attributes`,
          newValue: idField,
          description: `Added primary key field to entity '${entity.name}'`
        });
      }
    });

    return {
      success: true,
      changes,
      updatedDesign,
      warnings: []
    };
  }

  /**
   * ユーティリティメソッド
   */
  private static registerRule(rule: ValidationRule): void {
    this.VALIDATION_RULES.set(rule.id, rule);
  }

  private static getApplicableRules(designType: string, options: any): ValidationRule[] {
    return Array.from(this.VALIDATION_RULES.values()).filter(rule => {
      if (options.excludeRules?.includes(rule.id)) return false;
      if (options.includeCategories && !options.includeCategories.includes(rule.category)) return false;
      return true;
    });
  }

  private static createSkipResult(ruleId: string, reason: string): ValidationResult {
    return {
      ruleId,
      passed: true,
      severity: 'info',
      message: `Skipped: ${reason}`,
      affectedElements: [],
      suggestions: [],
      autoFixAvailable: false
    };
  }

  private static calculateSummary(results: ValidationResult[]) {
    return {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      warnings: results.filter(r => !r.passed && r.severity === 'warning').length,
      errors: results.filter(r => !r.passed && r.severity === 'error').length,
      suggestions: results.filter(r => !r.passed && r.severity === 'suggestion').length
    };
  }

  private static calculateOverallScore(results: ValidationResult[]): number {
    if (results.length === 0) return 100;
    
    const weights = { error: 10, warning: 5, suggestion: 1, info: 0 };
    const totalPenalty = results.reduce((penalty, result) => {
      return penalty + (result.passed ? 0 : weights[result.severity]);
    }, 0);
    
    const maxPenalty = results.length * weights.error;
    return Math.max(0, Math.round(100 - (totalPenalty / maxPenalty) * 100));
  }

  private static determineOverallStatus(results: ValidationResult[]): 'passed' | 'warning' | 'failed' {
    if (results.some(r => !r.passed && r.severity === 'error')) return 'failed';
    if (results.some(r => !r.passed && r.severity === 'warning')) return 'warning';
    return 'passed';
  }

  private static generateRecommendations(results: ValidationResult[]): string[] {
    const recommendations: string[] = [];
    
    const errorCount = results.filter(r => !r.passed && r.severity === 'error').length;
    const warningCount = results.filter(r => !r.passed && r.severity === 'warning').length;
    
    if (errorCount > 0) {
      recommendations.push(`Address ${errorCount} critical error${errorCount > 1 ? 's' : ''} before proceeding`);
    }
    
    if (warningCount > 5) {
      recommendations.push('Consider reviewing design patterns to reduce warnings');
    }
    
    const autoFixCount = results.filter(r => !r.passed && r.autoFixAvailable).length;
    if (autoFixCount > 0) {
      recommendations.push(`${autoFixCount} issue${autoFixCount > 1 ? 's' : ''} can be automatically fixed`);
    }
    
    return recommendations;
  }

  private static assessAutoFixImpact(rule: ValidationRule, result: ValidationResult): 'low' | 'medium' | 'high' {
    if (rule.severity === 'error') return 'high';
    if (rule.severity === 'warning') return 'medium';
    return 'low';
  }

  private static toPascalCase(str: string): string {
    return str.replace(/(?:^|[\s_-]+)(\w)/g, (_, char) => char.toUpperCase());
  }

  /**
   * カスタムルールの追加
   */
  static addCustomRule(rule: ValidationRule): void {
    this.VALIDATION_RULES.set(rule.id, rule);
  }

  /**
   * 利用可能なルール一覧の取得
   */
  static getAvailableRules(): ValidationRule[] {
    return Array.from(this.VALIDATION_RULES.values());
  }

  /**
   * ルールの有効化/無効化
   */
  static toggleRule(ruleId: string, enabled: boolean): boolean {
    const rule = this.VALIDATION_RULES.get(ruleId);
    if (rule) {
      if (enabled) {
        this.VALIDATION_RULES.set(ruleId, rule);
      } else {
        this.VALIDATION_RULES.delete(ruleId);
      }
      return true;
    }
    return false;
  }
}