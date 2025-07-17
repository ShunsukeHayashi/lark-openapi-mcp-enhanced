/**
 * Type definitions for Genesis system
 */

/**
 * Field types supported by Lark Base
 */
export type FieldType =
  | 'text' // Single line text
  | 'longText' // Multi-line text
  | 'number' // Number
  | 'currency' // Currency with formatting
  | 'percent' // Percentage
  | 'date' // Date only
  | 'dateTime' // Date and time
  | 'checkbox' // Boolean
  | 'select' // Single select
  | 'multiSelect' // Multiple select
  | 'user' // Single user
  | 'multipleUsers' // Multiple users
  | 'link' // Link to another table
  | 'lookup' // Lookup from linked record
  | 'formula' // Calculated field
  | 'rollup' // Aggregation from linked records
  | 'attachment' // File attachments
  | 'email' // Email with validation
  | 'phone' // Phone number
  | 'url' // URL with validation
  | 'rating' // Star rating
  | 'progress' // Progress bar
  | 'createdTime' // Auto-created time
  | 'createdBy' // Auto-created by user
  | 'lastModifiedTime' // Auto-modified time
  | 'lastModifiedBy' // Auto-modified by user
  | 'autoNumber'; // Auto-incrementing number

/**
 * Field definition for a table
 */
export interface FieldDefinition {
  name: string;
  type: FieldType;
  description?: string;
  required?: boolean;
  unique?: boolean;
  defaultValue?: any;
  options?: string[]; // For select/multiSelect
  linkedTable?: string; // For link fields
  linkedField?: string; // For lookup fields
  multiple?: boolean; // For link fields
  formula?: string; // For formula fields
  aggregation?: 'count' | 'sum' | 'average' | 'max' | 'min'; // For rollup
  precision?: number; // For number/currency fields
  dateFormat?: string; // For date fields
  includeTime?: boolean; // For date fields
}

/**
 * Table definition
 */
export interface TableDefinition {
  name: string;
  description?: string;
  fields: FieldDefinition[];
  primaryField?: string; // Field to use as primary display
}

/**
 * View types supported by Lark Base
 */
export type ViewType = 'grid' | 'kanban' | 'gallery' | 'calendar' | 'gantt' | 'form' | 'hierarchy';

/**
 * Filter operators
 */
export type FilterOperator =
  | 'is'
  | 'isNot'
  | 'contains'
  | 'doesNotContain'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'isWithin'
  | 'isBefore'
  | 'isAfter';

/**
 * View filter configuration
 */
export interface ViewFilter {
  field: string;
  operator: FilterOperator;
  value?: any;
}

/**
 * Sort configuration
 */
export interface SortConfig {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * View configuration
 */
export interface ViewConfiguration {
  name: string;
  tableId: string;
  type: ViewType;
  description?: string;
  filters?: ViewFilter[];
  sortBy?: SortConfig[];
  groupBy?: string; // For kanban views
  colorBy?: string; // For color coding
  coverField?: string; // For gallery views
  dateField?: string; // For calendar views
  startDateField?: string; // For gantt views
  endDateField?: string; // For gantt views
  parentField?: string; // For hierarchy views
  visibleFields?: string[]; // Fields to show
  hiddenFields?: string[]; // Fields to hide
  fieldWidths?: Record<string, number>; // Custom field widths
  rowHeight?: 'short' | 'medium' | 'tall' | 'extra_tall';
}

/**
 * Automation trigger types
 */
export type TriggerType =
  | 'record_created'
  | 'record_updated'
  | 'field_updated'
  | 'record_matches_conditions'
  | 'form_submitted'
  | 'time_based'
  | 'webhook';

/**
 * Automation action types
 */
export type ActionType =
  | 'update_record'
  | 'create_record'
  | 'create_records'
  | 'delete_record'
  | 'send_notification'
  | 'send_email'
  | 'create_task'
  | 'run_script'
  | 'call_webhook';

/**
 * Automation trigger configuration
 */
export interface AutomationTrigger {
  type: TriggerType;
  table?: string;
  field?: string;
  condition?: any;
  config?: Record<string, any>;
}

/**
 * Automation action configuration
 */
export interface AutomationAction {
  type: ActionType;
  config: Record<string, any>;
}

/**
 * Automation rule
 */
export interface AutomationRule {
  name: string;
  description?: string;
  enabled?: boolean;
  trigger: AutomationTrigger;
  conditions?: ViewFilter[]; // Additional conditions
  actions: AutomationAction[];
}

/**
 * Dashboard widget types
 */
export type WidgetType = 'metric' | 'chart' | 'table' | 'text' | 'image';

/**
 * Chart types for dashboard widgets
 */
export type ChartType = 'bar' | 'line' | 'pie' | 'donut' | 'area' | 'scatter' | 'heatmap';

/**
 * Dashboard widget configuration
 */
export interface DashboardWidget {
  type: WidgetType;
  title: string;
  description?: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  config: {
    table?: string;
    view?: string;
    field?: string;
    aggregation?: 'count' | 'sum' | 'average' | 'max' | 'min';
    groupBy?: string;
    filters?: ViewFilter[];
    chartType?: ChartType;
    dateField?: string;
    dateRange?: string;
    metric?: string;
    text?: string;
    imageUrl?: string;
  };
}

/**
 * Dashboard configuration
 */
export interface DashboardConfiguration {
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layout?: 'auto' | 'fixed';
  refreshInterval?: number; // In seconds
}

/**
 * Genesis template definition
 */
export interface GenesisTemplate {
  id: string;
  name: string;
  description: string;
  category: 'sales' | 'operations' | 'hr' | 'finance' | 'development' | 'other';
  icon?: string;
  tables: TableDefinition[];
  views: ViewConfiguration[];
  dashboards: DashboardConfiguration[];
  automations: AutomationRule[];
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimatedSetupTime?: number; // In minutes
  requiredIntegrations?: string[];
}

/**
 * Genesis creation options
 */
export interface GenesisOptions {
  useRealAPI?: boolean; // Use real Lark API or simulation
  template?: string; // Template ID to use
  enableAI?: boolean; // Enable AI features
  autoCreateViews?: boolean; // Auto-create recommended views
  autoCreateDashboards?: boolean; // Auto-create dashboards
  autoCreateAutomations?: boolean; // Auto-create automations
  folderToken?: string; // Folder to create base in
  language?: 'en' | 'zh' | 'ja'; // Language for field names
}

/**
 * Genesis analysis result
 */
export interface GenesisAnalysisResult {
  confidence: number; // 0-100
  suggestedTables: TableDefinition[];
  suggestedViews: ViewConfiguration[];
  relationships: Array<{
    fromTable: string;
    fromField: string;
    toTable: string;
    toField: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  }>;
  aiFeatures: Array<{
    feature: string;
    description: string;
    benefit: string;
  }>;
  warnings?: string[];
  recommendations?: string[];
}

/**
 * Genesis creation result
 */
export interface GenesisCreationResult {
  success: boolean;
  baseToken?: string;
  baseUrl?: string;
  tables?: Array<{
    name: string;
    tableId: string;
    recordCount: number;
  }>;
  views?: Array<{
    name: string;
    viewId: string;
    type: ViewType;
  }>;
  dashboards?: Array<{
    name: string;
    dashboardId: string;
  }>;
  automations?: Array<{
    name: string;
    automationId: string;
    enabled: boolean;
  }>;
  error?: string;
  executionTime?: number; // In milliseconds
}
