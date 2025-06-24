/**
 * Template Management System
 * よく使われる設計パターンのテンプレート化
 */

import { BaseSpec, TableSpec, FieldSpec, AutomationSpec } from '../integrations/lark-base-builder';

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  complexity: 'simple' | 'medium' | 'complex';
  estimatedTime: number; // minutes
  version: string;
  author: string;
  lastUpdated: Date;
  usageCount: number;
}

export type TemplateCategory = 
  | 'crm' 
  | 'project-management' 
  | 'inventory' 
  | 'hr' 
  | 'finance' 
  | 'e-commerce' 
  | 'support' 
  | 'marketing' 
  | 'custom';

export interface Template {
  metadata: TemplateMetadata;
  baseSpec: BaseSpec;
  variables: TemplateVariable[];
  instructions: string;
  examples: TemplateExample[];
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  description: string;
  required: boolean;
  defaultValue?: any;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface TemplateExample {
  name: string;
  description: string;
  variables: Record<string, any>;
  preview?: string;
}

/**
 * Template Manager
 * テンプレート管理システム
 */
export class TemplateManager {
  private templates: Map<string, Template> = new Map();
  private categories: Map<TemplateCategory, Template[]> = new Map();

  constructor() {
    this.initializeBuiltinTemplates();
  }

  /**
   * ビルトインテンプレートの初期化
   */
  private initializeBuiltinTemplates(): void {
    // CRM Template
    this.registerTemplate(this.createCRMTemplate());
    
    // Project Management Template
    this.registerTemplate(this.createProjectManagementTemplate());
    
    // Inventory Management Template
    this.registerTemplate(this.createInventoryTemplate());
    
    // HR Management Template
    this.registerTemplate(this.createHRTemplate());
    
    // E-commerce Template
    this.registerTemplate(this.createEcommerceTemplate());
    
    // Support Ticket Template
    this.registerTemplate(this.createSupportTemplate());
  }

  /**
   * テンプレートの登録
   */
  registerTemplate(template: Template): void {
    this.templates.set(template.metadata.id, template);
    
    const category = template.metadata.category;
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category)!.push(template);
  }

  /**
   * テンプレートの取得
   */
  getTemplate(id: string): Template | undefined {
    return this.templates.get(id);
  }

  /**
   * カテゴリ別テンプレート取得
   */
  getTemplatesByCategory(category: TemplateCategory): Template[] {
    return this.categories.get(category) || [];
  }

  /**
   * 全テンプレート取得
   */
  getAllTemplates(): Template[] {
    return Array.from(this.templates.values());
  }

  /**
   * テンプレート検索
   */
  searchTemplates(query: string): Template[] {
    const searchTerm = query.toLowerCase();
    return Array.from(this.templates.values()).filter(template => 
      template.metadata.name.toLowerCase().includes(searchTerm) ||
      template.metadata.description.toLowerCase().includes(searchTerm) ||
      template.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * テンプレートの適用
   */
  applyTemplate(templateId: string, variables: Record<string, any>): BaseSpec {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // 変数の検証
    this.validateTemplateVariables(template, variables);

    // テンプレートの適用
    const baseSpec = this.processTemplate(template, variables);
    
    // 使用回数の更新
    template.metadata.usageCount++;
    
    return baseSpec;
  }

  /**
   * 変数の検証
   */
  private validateTemplateVariables(template: Template, variables: Record<string, any>): void {
    for (const variable of template.variables) {
      if (variable.required && !(variable.name in variables)) {
        throw new Error(`Required variable missing: ${variable.name}`);
      }

      const value = variables[variable.name];
      if (value !== undefined) {
        this.validateVariableValue(variable, value);
      }
    }
  }

  /**
   * 変数値の検証
   */
  private validateVariableValue(variable: TemplateVariable, value: any): void {
    if (variable.validation) {
      if (variable.validation.min !== undefined && value < variable.validation.min) {
        throw new Error(`${variable.name} must be at least ${variable.validation.min}`);
      }
      if (variable.validation.max !== undefined && value > variable.validation.max) {
        throw new Error(`${variable.name} must be at most ${variable.validation.max}`);
      }
      if (variable.validation.pattern && typeof value === 'string') {
        const regex = new RegExp(variable.validation.pattern);
        if (!regex.test(value)) {
          throw new Error(`${variable.name} does not match required pattern`);
        }
      }
    }

    if (variable.type === 'select' && variable.options && !variable.options.includes(value)) {
      throw new Error(`${variable.name} must be one of: ${variable.options.join(', ')}`);
    }
  }

  /**
   * テンプレート処理
   */
  private processTemplate(template: Template, variables: Record<string, any>): BaseSpec {
    // テンプレートのディープコピー
    const baseSpec = JSON.parse(JSON.stringify(template.baseSpec));
    
    // 変数の置換
    this.replaceVariables(baseSpec, variables);
    
    return baseSpec;
  }

  /**
   * 変数の置換
   */
  private replaceVariables(obj: any, variables: Record<string, any>): void {
    if (typeof obj === 'string') {
      // 文字列内の変数を置換
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        if (obj.includes(placeholder)) {
          obj = obj.replace(new RegExp(placeholder, 'g'), String(value));
        }
      }
    } else if (Array.isArray(obj)) {
      obj.forEach(item => this.replaceVariables(item, variables));
    } else if (typeof obj === 'object' && obj !== null) {
      Object.values(obj).forEach(value => this.replaceVariables(value, variables));
    }
  }

  /**
   * CRM テンプレート作成
   */
  private createCRMTemplate(): Template {
    return {
      metadata: {
        id: 'crm-basic',
        name: 'Basic CRM System',
        description: '顧客管理システムの基本テンプレート',
        category: 'crm',
        tags: ['customer', 'sales', 'leads', 'opportunities'],
        complexity: 'medium',
        estimatedTime: 45,
        version: '1.0.0',
        author: 'Genesis System',
        lastUpdated: new Date(),
        usageCount: 0
      },
      variables: [
        {
          name: 'companyName',
          type: 'string',
          description: '会社名',
          required: true,
          validation: { min: 1, max: 100 }
        },
        {
          name: 'includeLeads',
          type: 'boolean',
          description: 'リード管理を含める',
          required: false,
          defaultValue: true
        },
        {
          name: 'includeOpportunities',
          type: 'boolean',
          description: '商談管理を含める',
          required: false,
          defaultValue: true
        }
      ],
      baseSpec: {
        name: '{{companyName}} CRM',
        description: '顧客管理システム',
        tables: [
          {
            name: 'Customers',
            description: '顧客情報',
            fields: [
              { name: 'Name', type: 'text', description: '顧客名', required: true },
              { name: 'Email', type: 'text', description: 'メールアドレス', required: true },
              { name: 'Phone', type: 'text', description: '電話番号', required: false },
              { name: 'Company', type: 'text', description: '会社名', required: false },
              { name: 'Status', type: 'singleSelect', description: 'ステータス', required: true, options: { choices: ['Active', 'Inactive', 'Prospect'] } },
              { name: 'Created Date', type: 'date', description: '作成日', required: true },
              { name: 'Last Contact', type: 'date', description: '最終連絡日', required: false }
            ],
            views: [
              { name: 'All Customers', type: 'grid', config: {} },
              { name: 'Active Customers', type: 'grid', config: { filters: [{ field: 'Status', condition: 'equals', value: 'Active' }] } }
            ]
          }
        ],
        automations: []
      },
      instructions: '基本的なCRMシステムを作成します。顧客情報の管理、リード管理、商談管理機能を含みます。',
      examples: [
        {
          name: 'Simple CRM',
          description: '基本的な顧客管理',
          variables: {
            companyName: 'My Company',
            includeLeads: true,
            includeOpportunities: true
          }
        }
      ]
    };
  }

  /**
   * プロジェクト管理テンプレート作成
   */
  private createProjectManagementTemplate(): Template {
    return {
      metadata: {
        id: 'project-management',
        name: 'Project Management System',
        description: 'プロジェクト管理システム',
        category: 'project-management',
        tags: ['project', 'task', 'team', 'timeline'],
        complexity: 'medium',
        estimatedTime: 60,
        version: '1.0.0',
        author: 'Genesis System',
        lastUpdated: new Date(),
        usageCount: 0
      },
      variables: [
        {
          name: 'projectName',
          type: 'string',
          description: 'プロジェクト名',
          required: true
        },
        {
          name: 'includeTimeTracking',
          type: 'boolean',
          description: '時間追跡を含める',
          required: false,
          defaultValue: false
        }
      ],
      baseSpec: {
        name: '{{projectName}} Project Management',
        description: 'プロジェクト管理システム',
        tables: [
          {
            name: 'Projects',
            description: 'プロジェクト情報',
            fields: [
              { name: 'Project Name', type: 'text', description: 'プロジェクト名', required: true },
              { name: 'Description', type: 'text', description: '説明', required: false },
              { name: 'Status', type: 'singleSelect', description: 'ステータス', required: true, options: { choices: ['Planning', 'In Progress', 'Completed', 'On Hold'] } },
              { name: 'Start Date', type: 'date', description: '開始日', required: true },
              { name: 'End Date', type: 'date', description: '終了日', required: false },
              { name: 'Priority', type: 'singleSelect', description: '優先度', required: true, options: { choices: ['Low', 'Medium', 'High', 'Critical'] } }
            ],
            views: [
              { name: 'All Projects', type: 'grid', config: {} },
              { name: 'Active Projects', type: 'grid', config: { filters: [{ field: 'Status', condition: 'equals', value: 'In Progress' }] } }
            ]
          },
          {
            name: 'Tasks',
            description: 'タスク情報',
            fields: [
              { name: 'Task Name', type: 'text', description: 'タスク名', required: true },
              { name: 'Project', type: 'text', description: 'プロジェクト', required: true },
              { name: 'Assigned To', type: 'user', description: '担当者', required: false },
              { name: 'Status', type: 'singleSelect', description: 'ステータス', required: true, options: { choices: ['To Do', 'In Progress', 'Review', 'Done'] } },
              { name: 'Priority', type: 'singleSelect', description: '優先度', required: true, options: { choices: ['Low', 'Medium', 'High'] } },
              { name: 'Due Date', type: 'date', description: '期限', required: false }
            ],
            views: [
              { name: 'All Tasks', type: 'grid', config: {} },
              { name: 'My Tasks', type: 'grid', config: {} }
            ]
          }
        ],
        automations: []
      },
      instructions: 'プロジェクトとタスクの管理システムを作成します。',
      examples: [
        {
          name: 'Basic Project Management',
          description: '基本的なプロジェクト管理',
          variables: {
            projectName: 'Development Project',
            includeTimeTracking: false
          }
        }
      ]
    };
  }

  /**
   * 在庫管理テンプレート作成
   */
  private createInventoryTemplate(): Template {
    return {
      metadata: {
        id: 'inventory-management',
        name: 'Inventory Management System',
        description: '在庫管理システム',
        category: 'inventory',
        tags: ['inventory', 'stock', 'products', 'warehouse'],
        complexity: 'medium',
        estimatedTime: 50,
        version: '1.0.0',
        author: 'Genesis System',
        lastUpdated: new Date(),
        usageCount: 0
      },
      variables: [
        {
          name: 'warehouseName',
          type: 'string',
          description: '倉庫名',
          required: true
        },
        {
          name: 'includeSuppliers',
          type: 'boolean',
          description: '仕入先管理を含める',
          required: false,
          defaultValue: true
        }
      ],
      baseSpec: {
        name: '{{warehouseName}} Inventory',
        description: '在庫管理システム',
        tables: [
          {
            name: 'Products',
            description: '商品情報',
            fields: [
              { name: 'Product Name', type: 'text', description: '商品名', required: true },
              { name: 'SKU', type: 'text', description: 'SKU', required: true },
              { name: 'Category', type: 'singleSelect', description: 'カテゴリ', required: false, options: { choices: ['Electronics', 'Clothing', 'Books', 'Other'] } },
              { name: 'Current Stock', type: 'number', description: '現在在庫', required: true },
              { name: 'Min Stock Level', type: 'number', description: '最小在庫レベル', required: true },
              { name: 'Unit Price', type: 'number', description: '単価', required: false }
            ],
            views: [
              { name: 'All Products', type: 'grid', config: {} },
              { name: 'Low Stock', type: 'grid', config: { filters: [{ field: 'Current Stock', condition: 'lessThan', value: 'Min Stock Level' }] } }
            ]
          }
        ],
        automations: []
      },
      instructions: '在庫管理システムを作成します。商品の在庫追跡、発注管理機能を含みます。',
      examples: [
        {
          name: 'Basic Inventory',
          description: '基本的な在庫管理',
          variables: {
            warehouseName: 'Main Warehouse',
            includeSuppliers: true
          }
        }
      ]
    };
  }

  /**
   * HR管理テンプレート作成
   */
  private createHRTemplate(): Template {
    return {
      metadata: {
        id: 'hr-management',
        name: 'HR Management System',
        description: '人事管理システム',
        category: 'hr',
        tags: ['hr', 'employee', 'attendance', 'payroll'],
        complexity: 'complex',
        estimatedTime: 90,
        version: '1.0.0',
        author: 'Genesis System',
        lastUpdated: new Date(),
        usageCount: 0
      },
      variables: [
        {
          name: 'companyName',
          type: 'string',
          description: '会社名',
          required: true
        },
        {
          name: 'includePayroll',
          type: 'boolean',
          description: '給与計算を含める',
          required: false,
          defaultValue: false
        }
      ],
      baseSpec: {
        name: '{{companyName}} HR System',
        description: '人事管理システム',
        tables: [
          {
            name: 'Employees',
            description: '従業員情報',
            fields: [
              { name: 'Employee ID', type: 'text', description: '従業員ID', required: true },
              { name: 'Name', type: 'text', description: '氏名', required: true },
              { name: 'Email', type: 'text', description: 'メールアドレス', required: true },
              { name: 'Department', type: 'singleSelect', description: '部署', required: true, options: { choices: ['IT', 'Sales', 'Marketing', 'HR', 'Finance'] } },
              { name: 'Position', type: 'text', description: '役職', required: false },
              { name: 'Hire Date', type: 'date', description: '入社日', required: true },
              { name: 'Status', type: 'singleSelect', description: 'ステータス', required: true, options: { choices: ['Active', 'Inactive', 'On Leave'] } }
            ],
            views: [
              { name: 'All Employees', type: 'grid', config: {} },
              { name: 'Active Employees', type: 'grid', config: { filters: [{ field: 'Status', condition: 'equals', value: 'Active' }] } }
            ]
          }
        ],
        automations: []
      },
      instructions: '人事管理システムを作成します。従業員情報、勤怠管理、給与計算機能を含みます。',
      examples: [
        {
          name: 'Basic HR System',
          description: '基本的な人事管理',
          variables: {
            companyName: 'My Company',
            includePayroll: false
          }
        }
      ]
    };
  }

  /**
   * E-commerceテンプレート作成
   */
  private createEcommerceTemplate(): Template {
    return {
      metadata: {
        id: 'ecommerce',
        name: 'E-commerce Management System',
        description: 'ECサイト管理システム',
        category: 'e-commerce',
        tags: ['ecommerce', 'orders', 'products', 'customers'],
        complexity: 'complex',
        estimatedTime: 120,
        version: '1.0.0',
        author: 'Genesis System',
        lastUpdated: new Date(),
        usageCount: 0
      },
      variables: [
        {
          name: 'storeName',
          type: 'string',
          description: '店舗名',
          required: true
        },
        {
          name: 'includeInventory',
          type: 'boolean',
          description: '在庫管理を含める',
          required: false,
          defaultValue: true
        }
      ],
      baseSpec: {
        name: '{{storeName}} E-commerce',
        description: 'ECサイト管理システム',
        tables: [
          {
            name: 'Products',
            description: '商品情報',
            fields: [
              { name: 'Product Name', type: 'text', description: '商品名', required: true },
              { name: 'SKU', type: 'text', description: 'SKU', required: true },
              { name: 'Price', type: 'number', description: '価格', required: true },
              { name: 'Category', type: 'singleSelect', description: 'カテゴリ', required: false, options: { choices: ['Electronics', 'Clothing', 'Books', 'Home'] } },
              { name: 'Status', type: 'singleSelect', description: 'ステータス', required: true, options: { choices: ['Active', 'Inactive', 'Out of Stock'] } }
            ],
            views: [
              { name: 'All Products', type: 'grid', config: {} },
              { name: 'Active Products', type: 'grid', config: { filters: [{ field: 'Status', condition: 'equals', value: 'Active' }] } }
            ]
          },
          {
            name: 'Orders',
            description: '注文情報',
            fields: [
              { name: 'Order ID', type: 'text', description: '注文ID', required: true },
              { name: 'Customer Name', type: 'text', description: '顧客名', required: true },
              { name: 'Customer Email', type: 'text', description: '顧客メール', required: true },
              { name: 'Order Date', type: 'date', description: '注文日', required: true },
              { name: 'Status', type: 'singleSelect', description: 'ステータス', required: true, options: { choices: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] } },
              { name: 'Total Amount', type: 'number', description: '合計金額', required: true }
            ],
            views: [
              { name: 'All Orders', type: 'grid', config: {} },
              { name: 'Recent Orders', type: 'grid', config: {} }
            ]
          }
        ],
        automations: []
      },
      instructions: 'ECサイト管理システムを作成します。商品管理、注文管理、顧客管理機能を含みます。',
      examples: [
        {
          name: 'Basic E-commerce',
          description: '基本的なECサイト管理',
          variables: {
            storeName: 'My Online Store',
            includeInventory: true
          }
        }
      ]
    };
  }

  /**
   * サポートチケットテンプレート作成
   */
  private createSupportTemplate(): Template {
    return {
      metadata: {
        id: 'support-tickets',
        name: 'Support Ticket System',
        description: 'サポートチケット管理システム',
        category: 'support',
        tags: ['support', 'tickets', 'customer-service', 'helpdesk'],
        complexity: 'medium',
        estimatedTime: 40,
        version: '1.0.0',
        author: 'Genesis System',
        lastUpdated: new Date(),
        usageCount: 0
      },
      variables: [
        {
          name: 'supportTeamName',
          type: 'string',
          description: 'サポートチーム名',
          required: true
        },
        {
          name: 'includeSLA',
          type: 'boolean',
          description: 'SLA管理を含める',
          required: false,
          defaultValue: false
        }
      ],
      baseSpec: {
        name: '{{supportTeamName}} Support',
        description: 'サポートチケット管理システム',
        tables: [
          {
            name: 'Support Tickets',
            description: 'サポートチケット',
            fields: [
              { name: 'Ticket ID', type: 'text', description: 'チケットID', required: true },
              { name: 'Customer Name', type: 'text', description: '顧客名', required: true },
              { name: 'Customer Email', type: 'text', description: '顧客メール', required: true },
              { name: 'Subject', type: 'text', description: '件名', required: true },
              { name: 'Description', type: 'text', description: '詳細', required: true },
              { name: 'Priority', type: 'singleSelect', description: '優先度', required: true, options: { choices: ['Low', 'Medium', 'High', 'Critical'] } },
              { name: 'Status', type: 'singleSelect', description: 'ステータス', required: true, options: { choices: ['Open', 'In Progress', 'Waiting for Customer', 'Resolved', 'Closed'] } },
              { name: 'Assigned To', type: 'user', description: '担当者', required: false },
              { name: 'Created Date', type: 'date', description: '作成日', required: true },
              { name: 'Last Updated', type: 'date', description: '最終更新日', required: true }
            ],
            views: [
              { name: 'All Tickets', type: 'grid', config: {} },
              { name: 'Open Tickets', type: 'grid', config: { filters: [{ field: 'Status', condition: 'equals', value: 'Open' }] } },
              { name: 'My Tickets', type: 'grid', config: {} }
            ]
          }
        ],
        automations: []
      },
      instructions: 'サポートチケット管理システムを作成します。顧客からの問い合わせを効率的に管理できます。',
      examples: [
        {
          name: 'Basic Support System',
          description: '基本的なサポートシステム',
          variables: {
            supportTeamName: 'Customer Support',
            includeSLA: false
          }
        }
      ]
    };
  }

  /**
   * カスタムテンプレート作成
   */
  createCustomTemplate(spec: {
    name: string;
    description: string;
    category: TemplateCategory;
    baseSpec: BaseSpec;
    variables?: TemplateVariable[];
    instructions?: string;
  }): Template {
    const template: Template = {
      metadata: {
        id: `custom-${Date.now()}`,
        name: spec.name,
        description: spec.description,
        category: spec.category,
        tags: [],
        complexity: 'medium',
        estimatedTime: 30,
        version: '1.0.0',
        author: 'Custom',
        lastUpdated: new Date(),
        usageCount: 0
      },
      variables: spec.variables || [],
      baseSpec: spec.baseSpec,
      instructions: spec.instructions || '',
      examples: []
    };

    this.registerTemplate(template);
    return template;
  }

  /**
   * テンプレート統計の取得
   */
  getStatistics(): {
    totalTemplates: number;
    categories: Record<TemplateCategory, number>;
    mostUsed: Template[];
    recentlyUpdated: Template[];
  } {
    const templates = Array.from(this.templates.values());
    const categories: Record<TemplateCategory, number> = {} as any;
    
    for (const [category, templateList] of this.categories.entries()) {
      categories[category] = templateList.length;
    }

    const mostUsed = templates
      .sort((a, b) => b.metadata.usageCount - a.metadata.usageCount)
      .slice(0, 5);

    const recentlyUpdated = templates
      .sort((a, b) => b.metadata.lastUpdated.getTime() - a.metadata.lastUpdated.getTime())
      .slice(0, 5);

    return {
      totalTemplates: templates.length,
      categories,
      mostUsed,
      recentlyUpdated
    };
  }
} 