/**
 * Genesis System Prompts for MCP Server
 * AI-powered Lark Base generation prompts
 */

export const genesisPrompts = [
  {
    name: 'genesis_templates',
    description: 'Show available Genesis templates and create base from template',
    arguments: [
      {
        name: 'template_id',
        description: 'Template ID (e.g., crm, project_management, hr_management)',
        required: false,
      },
      {
        name: 'base_name',
        description: 'Name for the new Lark Base',
        required: false,
      },
    ],
    template: `# Genesis Templates - Pre-built Business Application Templates

{{#if template_id}}
## Creating Base from Template: {{template_id}}
Base name: {{base_name}}

Use the following tools:
1. First, use genesis.builtin.list_templates to see template details
2. Then use genesis.builtin.create_base with:
   - baseName: "{{base_name}}"
   - options.template: "{{template_id}}"
   - options.useRealAPI: true (for actual creation)

This will create a complete Lark Base with:
- Pre-configured tables with appropriate fields
- Multiple views (Grid, Kanban, Calendar, etc.)
- Interactive dashboards with charts and metrics
- Automation workflows for common tasks
{{else}}
## Available Genesis Templates:

### 🏆 SALES & CRM
**crm** - Customer Relationship Management
- Manage customers, contacts, opportunities, and sales activities
- Includes sales pipeline, activity tracking, and revenue dashboards

### 📊 OPERATIONS
**project_management** - Project & Task Management
- Track projects, tasks, milestones, and team collaboration
- Features sprint boards, Gantt views, and workload analytics

**inventory_management** - Inventory & Stock Control
- Manage products, stock levels, suppliers, and purchase orders
- Includes low stock alerts and supplier performance tracking

**event_planning** - Event Management System
- Organize events, attendees, vendors, and schedules
- Features timeline views and resource allocation

### 🏢 HUMAN RESOURCES
**hr_management** - HR & Employee Management
- Complete HR system with employee records, leave tracking, and reviews
- Includes onboarding automation and org chart views

### 💻 DEVELOPMENT
**bug_tracking** - Bug & Issue Tracking
- Track software bugs, features, and development tasks
- Includes priority matrix and sprint planning views

## How to Use Templates:
1. List templates with details: genesis.builtin.list_templates
2. Create base from template: genesis.builtin.create_base with template option

Example: Create a CRM system
- baseName: "My Sales CRM"
- options.template: "crm"
- options.useRealAPI: true
{{/if}}`,
  },
  {
    name: 'genesis_create_base',
    description: 'Create a complete Lark Base application from natural language requirements',
    arguments: [
      {
        name: 'requirements',
        description: 'Natural language description of the application requirements',
        required: true,
      },
    ],
    template: `# Genesis System - AI-Powered Base Creation

## Task
Create a Lark Base application based on the following requirements:

{{requirements}}

## Steps to follow:
1. Analyze the requirements to identify:
   - Data entities (tables)
   - Fields and their types
   - Relationships between tables
   - Views needed
   - Automation rules

2. Design the data structure:
   - Create normalized tables
   - Define appropriate field types
   - Set up relationships
   - Add validation rules

3. Implement views:
   - Create filtered views for different user roles
   - Add dashboard views for analytics
   - Set up calendar/timeline views if applicable

4. Configure automation:
   - Auto-assignment rules
   - Notification triggers
   - Data validation automation
   - Workflow automation

5. Add AI features:
   - Smart field suggestions
   - Auto-categorization
   - Predictive analytics formulas

## Best Practices:
- Keep tables normalized (3NF)
- Use consistent naming conventions
- Add descriptions to all fields
- Create indexes for frequently searched fields
- Implement proper access controls
`,
  },
  {
    name: 'genesis_migrate_excel',
    description: 'Migrate an Excel spreadsheet to a Lark Base with AI optimization',
    arguments: [
      {
        name: 'excel_structure',
        description: 'Description of Excel file structure and data',
        required: true,
      },
    ],
    template: `# Excel to Lark Base Migration

## Excel Structure:
{{excel_structure}}

## Migration Strategy:
1. Analyze Excel structure for:
   - Multiple tables in single sheets
   - Denormalized data
   - Calculated columns
   - Pivot table requirements

2. Transform to relational model:
   - Split into normalized tables
   - Convert formulas to Lark formulas
   - Create relationships
   - Preserve business logic

3. Enhance with Lark features:
   - Add data validation
   - Create automated workflows
   - Build interactive dashboards
   - Enable collaborative features
`,
  },
  {
    name: 'genesis_template_crm',
    description: 'Generate a CRM system using Genesis templates',
    arguments: [
      {
        name: 'business_type',
        description: 'Type of business (B2B, B2C, SaaS, etc.)',
        required: true,
      },
      {
        name: 'features',
        description: 'Specific CRM features needed',
        required: false,
      },
    ],
    template: `# CRM System Template

## Business Type: {{business_type}}
## Custom Features: {{features}}

## Standard CRM Components:

### Tables:
1. **Contacts**
   - Personal information
   - Communication preferences
   - Tags and segments
   - Activity history

2. **Companies**
   - Company details
   - Industry and size
   - Relationship mapping
   - Revenue tracking

3. **Deals/Opportunities**
   - Pipeline stages
   - Probability scoring
   - Revenue forecasting
   - Activity tracking

4. **Activities**
   - Calls, emails, meetings
   - Task management
   - Follow-up scheduling
   - Outcome tracking

5. **Products/Services**
   - Catalog management
   - Pricing tiers
   - Feature mapping

### Automation:
- Lead scoring
- Assignment rules
- Follow-up reminders
- Pipeline movement triggers
- Revenue calculations

### AI Features:
- Predictive lead scoring
- Best time to contact
- Deal probability analysis
- Churn risk assessment
`,
  },
  {
    name: 'genesis_optimize_base',
    description: 'Optimize an existing Lark Base with AI recommendations',
    arguments: [
      {
        name: 'base_structure',
        description: 'Current base tables and relationships',
        required: true,
      },
      {
        name: 'pain_points',
        description: 'Current issues or inefficiencies',
        required: true,
      },
    ],
    template: `# Lark Base Optimization

## Current Structure:
{{base_structure}}

## Pain Points:
{{pain_points}}

## Optimization Areas:

1. **Performance**
   - Index optimization
   - Formula efficiency
   - View performance
   - Data archiving strategy

2. **Data Quality**
   - Validation rules
   - Duplicate detection
   - Data completeness checks
   - Consistency enforcement

3. **User Experience**
   - Simplified workflows
   - Better view organization
   - Quick filters
   - Bulk operations

4. **Automation**
   - Reduce manual tasks
   - Error prevention
   - Notification optimization
   - Workflow streamlining

5. **Analytics**
   - KPI dashboards
   - Trend analysis
   - Predictive metrics
   - Real-time reporting
`,
  },
  {
    name: 'genesis_ai_features',
    description: 'Add AI-powered features to a Lark Base',
    arguments: [
      {
        name: 'base_context',
        description: 'Description of the base and its purpose',
        required: true,
      },
      {
        name: 'desired_intelligence',
        description: 'What kind of AI assistance is needed',
        required: true,
      },
    ],
    template: `# AI Feature Integration

## Base Context:
{{base_context}}

## Desired Intelligence:
{{desired_intelligence}}

## AI Feature Recommendations:

1. **Smart Data Entry**
   - Auto-completion from history
   - Duplicate detection
   - Data validation suggestions
   - Smart defaults

2. **Predictive Analytics**
   - Trend forecasting
   - Anomaly detection
   - Pattern recognition
   - Risk scoring

3. **Intelligent Automation**
   - Smart assignment
   - Priority scoring
   - Workflow optimization
   - Resource balancing

4. **Natural Language**
   - Query builder
   - Report generation
   - Data insights
   - Conversational analytics

5. **Machine Learning**
   - Classification models
   - Clustering analysis
   - Recommendation engine
   - Sentiment analysis
`,
  },
  {
    name: 'genesis_create_view_dashboard',
    description: 'Create views, dashboards, automation, and filter views for Lark applications',
    arguments: [
      {
        name: 'app_type',
        description: 'Type of application (base or spreadsheet)',
        required: true,
      },
      {
        name: 'requirements',
        description: 'What kind of views, dashboards, or automation needed',
        required: true,
      },
    ],
    template: `# Create Views and Dashboards

## Application Type: {{app_type}}
## Requirements: {{requirements}}

## Creation Options:

### For Lark Base:

1. **Custom Views**
   - Grid view: Traditional table view
   - Kanban view: Card-based workflow view
   - Calendar view: Date-based visualization
   - Gallery view: Image-focused display
   - Gantt view: Timeline project view
   - Form view: Data entry interface

2. **Dashboard Creation**
   - Copy existing dashboard as template
   - Customize widgets:
     * Charts (bar, line, pie)
     * Metrics (KPI cards)
     * Tables (summary data)
     * Filters (interactive controls)

3. **Automation Workflows**
   - Triggers:
     * Record created/updated
     * Field changed
     * Schedule-based
     * Form submitted
   - Actions:
     * Send notifications
     * Update records
     * Create records
     * Send emails
     * Call external APIs

### For Spreadsheets:

4. **Filter Views**
   - Create saved filter configurations
   - Multiple filter conditions
   - Sort and hide columns
   - Share specific views with teams

## Best Practices:
- Create role-based views for different users
- Use dashboards for executive summaries
- Automate repetitive tasks
- Set up filter views for common queries
`,
  },
  {
    name: 'genesis_automation_workflow',
    description: 'Design complex automation workflows for Lark Base',
    arguments: [
      {
        name: 'workflow_purpose',
        description: 'What the automation should accomplish',
        required: true,
      },
      {
        name: 'trigger_conditions',
        description: 'When the automation should run',
        required: true,
      },
    ],
    template: `# Automation Workflow Design

## Purpose: {{workflow_purpose}}
## Trigger Conditions: {{trigger_conditions}}

## Workflow Components:

1. **Triggers**
   - Record creation
   - Record updates
   - Field value changes
   - Time-based schedules
   - Form submissions
   - External API calls

2. **Conditions**
   - Field value comparisons
   - Date/time checks
   - User role verification
   - Record count thresholds
   - Complex logic (AND/OR)

3. **Actions**
   - **Notifications**
     * In-app notifications
     * Email alerts
     * Mobile push
     * Webhook calls
   
   - **Data Operations**
     * Create new records
     * Update existing records
     * Delete records
     * Copy to another base
   
   - **Integrations**
     * Send to external APIs
     * Update calendar events
     * Create tasks
     * Send chat messages

4. **Error Handling**
   - Retry failed actions
   - Send error notifications
   - Log failures
   - Fallback actions

## Common Automation Patterns:

1. **Approval Workflows**
   - Multi-level approvals
   - Escalation rules
   - Deadline reminders

2. **Data Synchronization**
   - Cross-base updates
   - External system sync
   - Duplicate prevention

3. **Notification Systems**
   - Status change alerts
   - Assignment notifications
   - Deadline warnings

4. **Data Quality**
   - Validation rules
   - Auto-formatting
   - Duplicate detection
`,
  },
];

/**
 * Register Genesis prompts with MCP server
 */
export function registerGenesisPrompts(server: any): void {
  for (const prompt of genesisPrompts) {
    server.prompt(prompt.name, prompt.description, prompt.arguments, ({ arguments: args }: any) => {
      // Replace template variables with actual values
      let content = prompt.template;
      for (const [key, value] of Object.entries(args)) {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value as string);
      }

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: content,
            },
          },
        ],
      };
    });
  }
}
