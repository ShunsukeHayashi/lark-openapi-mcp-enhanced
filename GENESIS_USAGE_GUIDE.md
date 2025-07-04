# Genesis System Usage Guide

## Overview

The Genesis AI System enables you to create complete Lark Base applications from natural language requirements. It includes tools for creating bases, views, dashboards, automation workflows, and more.

## Quick Start

### 1. Enable Genesis in Claude Desktop

Genesis is already configured in your Claude Desktop. The configuration uses:
```json
"--tools", "preset.genesis.default"
```

### 2. Available Genesis Tools

#### Base Management Tools
- **`genesis.builtin.create_base`** - Create a complete Lark Base from requirements
- **`genesis.builtin.analyze_requirements`** - Analyze requirements and suggest optimal structure
- **`genesis.builtin.generate_er_diagram`** - Generate Entity-Relationship diagrams
- **`genesis.builtin.optimize_base`** - Optimize existing bases with AI recommendations

#### View & Dashboard Tools
- **`genesis.builtin.create_view`** - Create custom views (Grid, Kanban, Calendar, Gallery, Gantt, Form)
- **`genesis.builtin.create_dashboard`** - Create dashboards by copying and customizing templates
- **`genesis.builtin.create_automation`** - Create automation workflows with triggers and actions
- **`genesis.builtin.create_filter_view`** - Create filter views for spreadsheets

## Usage Examples

### Example 1: Create a Task Management System

```
Use genesis.builtin.create_base to create a task management system with:
- Task tracking with priority levels (Low, Medium, High, Urgent)
- Team member assignment
- Due date tracking
- Project categorization
- Progress status (To Do, In Progress, Review, Done)
```

### Example 2: Create a Kanban View

```
Use genesis.builtin.create_view to create a Kanban view for the Tasks table:
- Group by Status field
- Sort by Priority (descending) then Due Date (ascending)
- Hide completed tasks older than 30 days
- Show only assigned tasks for current user
```

### Example 3: Create an Automation Workflow

```
Use genesis.builtin.create_automation to create a workflow that:
- Triggers when a task status changes to "Done"
- Sends notification to project manager
- Updates completion date field
- If all project tasks are done, send summary email
```

### Example 4: Create a Dashboard

```
Use genesis.builtin.create_dashboard to create a project dashboard with:
- Task completion rate chart
- Team workload distribution
- Overdue tasks metric card
- Project timeline gantt chart
```

## Genesis Prompts

You can also use Genesis prompts for guided creation:

### `genesis_create_base`
Creates a complete Lark Base application. Example:
```
Use the genesis_create_base prompt to create a customer relationship management (CRM) system for a small business
```

### `genesis_create_view_dashboard`
Creates views, dashboards, and automation. Example:
```
Use the genesis_create_view_dashboard prompt for a Lark Base to create:
- A calendar view for project deadlines
- A dashboard showing team performance metrics
- Automation to notify when tasks are overdue
```

### `genesis_automation_workflow`
Designs complex automation workflows. Example:
```
Use the genesis_automation_workflow prompt to design an approval workflow that:
- Routes purchase requests based on amount
- Escalates if not approved within 48 hours
- Logs all approvals for audit
```

## Best Practices

### 1. Start with Requirements Analysis
Always use `genesis.builtin.analyze_requirements` first to understand the optimal structure.

### 2. Create Views for Different Roles
- Manager Dashboard: High-level metrics and summaries
- Team Member View: Personal tasks and deadlines
- Admin View: All data with edit capabilities

### 3. Automate Repetitive Tasks
Common automation patterns:
- Status change notifications
- Due date reminders
- Data validation and formatting
- Cross-table synchronization

### 4. Use Filter Views for Reports
Create saved filter views for:
- Weekly status reports
- Overdue items
- High-priority tasks
- Team-specific views

## Limitations

**Note**: Currently, Genesis tools operate in simulation mode and return example responses. They demonstrate the intended functionality but don't make actual API calls to Lark. This allows you to:
- Plan your base structure
- Design views and dashboards
- Prototype automation workflows
- Generate documentation

For actual implementation, you would need to use the corresponding Lark APIs directly:
- `bitable.v1.app.create` - Create actual bases
- `bitable.v1.appTableView.create` - Create actual views
- `bitable.v1.appDashboard.copy` - Copy actual dashboards
- `sheets.v3.spreadsheetSheetFilterView.create` - Create actual filter views

## Advanced Usage

### Combining Multiple Tools

You can chain Genesis tools for complex scenarios:

1. First, analyze requirements:
   ```
   Use genesis.builtin.analyze_requirements to analyze: "I need a project management system with time tracking, budget monitoring, and resource allocation"
   ```

2. Then create the base:
   ```
   Use genesis.builtin.create_base with the analyzed structure
   ```

3. Add custom views:
   ```
   Use genesis.builtin.create_view to create:
   - Gantt chart for project timeline
   - Kanban board for task management
   - Calendar view for deadlines
   ```

4. Set up automation:
   ```
   Use genesis.builtin.create_automation for:
   - Budget alerts when 80% consumed
   - Time tracking reminders
   - Weekly progress reports
   ```

### ER Diagram Generation

Generate visual representations of your data structure:
```
Use genesis.builtin.generate_er_diagram with the tables:
- Projects (id, name, budget, start_date, end_date)
- Tasks (id, project_id, title, assignee, hours_estimated, hours_actual)
- Team_Members (id, name, role, hourly_rate)
- Time_Entries (id, task_id, member_id, date, hours)
```

## Troubleshooting

### Common Issues

1. **Tool not found**: Ensure you're using `preset.genesis.default` in your configuration
2. **Missing parameters**: Check the tool schema for required fields
3. **API limitations**: Remember that Genesis tools are currently in simulation mode

### Getting Help

- Check the tool description for parameter details
- Use `genesis.builtin.analyze_requirements` for structure suggestions
- Refer to Lark API documentation for actual implementation details

## Future Enhancements

Planned features for Genesis:
- Real API integration for actual base creation
- Excel/CSV import functionality
- Template library for common use cases
- AI-powered data migration tools
- Multi-language support for field names
- Backup and restore capabilities

## Conclusion

Genesis provides a powerful way to prototype and plan Lark Base applications using natural language. While currently in simulation mode, it helps you:
- Quickly design complex data structures
- Plan views and dashboards
- Prototype automation workflows
- Generate documentation for your applications

Use Genesis to accelerate your Lark Base development process!