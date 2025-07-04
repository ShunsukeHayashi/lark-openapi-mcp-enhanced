# Genesis Templates Documentation

## Overview

Genesis Templates provide pre-built business application structures for Lark Base. These templates include complete table schemas, views, dashboards, and automation workflows designed for common business scenarios.

## Available Templates

### 1. CRM (Customer Relationship Management)
**Template ID**: `crm`

Perfect for managing sales pipelines, customer relationships, and business development activities.

**Features**:
- 4 interconnected tables (Customers, Contacts, Opportunities, Activities)
- Sales pipeline kanban view
- Revenue forecasting dashboards
- Automated follow-up reminders
- Activity tracking and reporting

**Use Cases**:
- B2B sales management
- Customer success tracking
- Account management
- Sales forecasting

### 2. Project Management
**Template ID**: `project_management`

Comprehensive project tracking system with task management, resource allocation, and progress monitoring.

**Features**:
- 4 tables (Projects, Tasks, Milestones, Time Tracking)
- Sprint board and Gantt chart views
- Resource utilization dashboards
- Automated task notifications
- Time tracking with billing support

**Use Cases**:
- Software development projects
- Marketing campaigns
- Product launches
- Construction projects

### 3. HR Management
**Template ID**: `hr_management`

Complete HR system for managing employee lifecycle, from onboarding to performance reviews.

**Features**:
- 4 tables (Employees, Leave Requests, Performance Reviews, Onboarding Tasks)
- Organization chart view
- Leave calendar
- Automated onboarding workflows
- Performance tracking dashboards

**Use Cases**:
- Employee lifecycle management
- Leave management
- Performance tracking
- Organizational planning

### 4. Additional Templates

- **Inventory Management** (`inventory_management`): Stock control and supplier management
- **Event Planning** (`event_planning`): Event organization and resource coordination
- **Bug Tracking** (`bug_tracking`): Software issue and feature tracking

## How to Use Templates

### 1. List Available Templates

```javascript
// Using MCP tool
genesis.builtin.list_templates({
  category: "all",
  includeDetails: true
})
```

### 2. Create Base from Template

```javascript
// Create a CRM system
genesis.builtin.create_base({
  baseName: "My Sales CRM",
  requirements: "Sales pipeline management system",
  options: {
    template: "crm",
    language: "en",
    useRealAPI: true  // Set to true for actual creation
  }
})
```

### 3. Using MCP Prompts

You can also use the Genesis prompts for guided creation:

```
# Show all templates
Use prompt: genesis_templates

# Create from specific template
Use prompt: genesis_templates
Arguments:
- template_id: "project_management"
- base_name: "Q1 2024 Projects"
```

## Template Structure

Each template includes:

### Tables
- Pre-defined table schemas with appropriate field types
- Relationships between tables (links/lookups)
- Default values and validation rules

### Views
- **Grid Views**: Traditional table views with filters
- **Kanban Views**: Card-based workflow visualization
- **Calendar Views**: Date-based event tracking
- **Gallery Views**: Visual representation of records
- **Gantt Views**: Project timeline visualization

### Dashboards
- Key metrics and KPIs
- Charts and visualizations
- Real-time data updates
- Executive summaries

### Automations
- Triggered workflows (record creation, updates)
- Scheduled tasks (reminders, reports)
- Notification rules
- Data synchronization

## Customization Guide

### Adding Custom Fields

After creating a base from template, you can add custom fields:

```javascript
// Add a custom field to the Customers table
bitable.v1.appTableField.create({
  app_token: "your_base_token",
  table_id: "customers_table_id",
  field_name: "Customer Segment",
  type: 7,  // Single select
  property: {
    options: [
      { name: "Enterprise", color: 1 },
      { name: "SMB", color: 2 },
      { name: "Startup", color: 3 }
    ]
  }
})
```

### Creating Custom Views

```javascript
// Create a filtered view for high-value opportunities
genesis.builtin.create_view({
  appToken: "your_base_token",
  tableId: "opportunities_table_id",
  viewConfig: {
    name: "High-Value Deals",
    viewType: "grid",
    filters: [
      {
        field: "Amount",
        operator: "greaterThan",
        value: 100000
      },
      {
        field: "Stage",
        operator: "isNot",
        value: "Closed Lost"
      }
    ],
    sorts: [
      {
        field: "Amount",
        order: "desc"
      }
    ]
  }
})
```

### Setting Up Custom Automation

```javascript
// Create deal won celebration automation
genesis.builtin.create_automation({
  appToken: "your_base_token",
  automationConfig: {
    name: "Celebrate Closed Deals",
    trigger: {
      type: "field_changed",
      config: {
        table: "Opportunities",
        field: "Stage",
        condition: "equals",
        value: "Closed Won"
      }
    },
    actions: [
      {
        type: "send_notification",
        config: {
          recipient: "all_team_members",
          message: "🎉 Deal closed: {{Opportunity Name}} - ${{Amount}}!"
        }
      }
    ]
  }
})
```

## Best Practices

### 1. Start with Templates
- Choose the template closest to your needs
- Templates save hours of setup time
- All templates follow Lark Base best practices

### 2. Customize Gradually
- Start using the template as-is
- Add custom fields as needs emerge
- Create new views for specific teams
- Build automations based on actual workflows

### 3. Maintain Data Quality
- Use validation rules on critical fields
- Set up required fields appropriately
- Create data entry forms for consistency
- Regular data cleanup automations

### 4. Scale Thoughtfully
- Monitor base performance
- Archive old records periodically
- Use filtered views to reduce load
- Consider splitting very large bases

## Advanced Features

### Multi-Language Support

Templates support multiple languages:

```javascript
genesis.builtin.create_base({
  baseName: "我的CRM系统",
  options: {
    template: "crm",
    language: "zh"  // Chinese field names
  }
})
```

### Template Combinations

You can create hybrid systems by combining templates:

1. Create base from primary template
2. Add tables from other templates manually
3. Link tables across different domains
4. Build unified dashboards

### Integration with External Systems

Templates are designed to work with Lark's API ecosystem:

- Webhook integration for real-time updates
- API access for external applications
- Scheduled data imports/exports
- Third-party tool connections

## Troubleshooting

### Common Issues

1. **Template not found**: Ensure you're using the correct template ID
2. **Creation fails**: Check API permissions and rate limits
3. **Missing features**: Some features require additional Lark permissions
4. **Performance issues**: Consider data volume and optimization

### Getting Help

- Use `genesis.builtin.analyze_requirements` for custom needs
- Check the MCP resources for examples
- Review API documentation for advanced features
- Contact support for enterprise features

## Future Templates

Upcoming templates in development:
- **Finance Management**: Budgeting and expense tracking
- **Education Management**: Course and student tracking
- **Healthcare**: Patient and appointment management
- **Real Estate**: Property and client management

---

For more information, use the Genesis tools and prompts available in the MCP server.