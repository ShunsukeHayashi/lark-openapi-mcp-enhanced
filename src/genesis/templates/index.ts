/**
 * Genesis Templates for Common Business Use Cases
 * These templates provide pre-configured table structures, views, and automation rules
 * for common business scenarios like CRM, Project Management, and HR systems.
 */

import { GenesisTemplate, TableDefinition, ViewConfiguration, AutomationRule, DashboardWidget } from '../types';

/**
 * CRM (Customer Relationship Management) Template
 * Includes customers, contacts, opportunities, activities, and reports
 */
export const crmTemplate: GenesisTemplate = {
  id: 'crm',
  name: 'Customer Relationship Management',
  description: 'Complete CRM system for managing customers, sales opportunities, and activities',
  category: 'sales',
  icon: '👥',
  tables: [
    {
      name: 'Customers',
      description: 'Company/organization records',
      fields: [
        { name: 'Company Name', type: 'text', required: true },
        {
          name: 'Industry',
          type: 'select',
          options: ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Other'],
        },
        { name: 'Company Size', type: 'select', options: ['1-10', '11-50', '51-200', '201-500', '500+'] },
        { name: 'Website', type: 'url' },
        { name: 'Annual Revenue', type: 'currency' },
        { name: 'Status', type: 'select', options: ['Prospect', 'Active', 'Inactive'], defaultValue: 'Prospect' },
        { name: 'Account Owner', type: 'user' },
        { name: 'Created Date', type: 'createdTime' },
        { name: 'Last Activity', type: 'lastModifiedTime' },
        { name: 'Notes', type: 'longText' },
      ],
    },
    {
      name: 'Contacts',
      description: 'Individual contact records',
      fields: [
        { name: 'Full Name', type: 'text', required: true },
        { name: 'Email', type: 'email', required: true },
        { name: 'Phone', type: 'phone' },
        { name: 'Job Title', type: 'text' },
        { name: 'Company', type: 'link', linkedTable: 'Customers' },
        { name: 'Contact Type', type: 'select', options: ['Primary', 'Secondary', 'Technical', 'Executive'] },
        { name: 'LinkedIn', type: 'url' },
        { name: 'Last Contacted', type: 'date' },
        { name: 'Contact Owner', type: 'user' },
        { name: 'Tags', type: 'multiSelect', options: ['Decision Maker', 'Influencer', 'Champion', 'Blocker'] },
      ],
    },
    {
      name: 'Opportunities',
      description: 'Sales opportunity tracking',
      fields: [
        { name: 'Opportunity Name', type: 'text', required: true },
        { name: 'Customer', type: 'link', linkedTable: 'Customers', required: true },
        { name: 'Primary Contact', type: 'link', linkedTable: 'Contacts' },
        {
          name: 'Stage',
          type: 'select',
          options: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
          defaultValue: 'Prospecting',
        },
        { name: 'Amount', type: 'currency' },
        { name: 'Probability', type: 'percent', defaultValue: 10 },
        { name: 'Expected Close Date', type: 'date' },
        { name: 'Owner', type: 'user' },
        { name: 'Competition', type: 'multiSelect', options: ['Competitor A', 'Competitor B', 'Competitor C', 'None'] },
        { name: 'Next Steps', type: 'longText' },
        { name: 'Created Date', type: 'createdTime' },
      ],
    },
    {
      name: 'Activities',
      description: 'Track interactions and activities',
      fields: [
        { name: 'Subject', type: 'text', required: true },
        { name: 'Type', type: 'select', options: ['Call', 'Email', 'Meeting', 'Demo', 'Task'], required: true },
        { name: 'Related To', type: 'link', linkedTable: 'Opportunities' },
        { name: 'Contact', type: 'link', linkedTable: 'Contacts' },
        { name: 'Date', type: 'dateTime', defaultValue: 'now' },
        { name: 'Duration (minutes)', type: 'number' },
        {
          name: 'Status',
          type: 'select',
          options: ['Planned', 'In Progress', 'Completed', 'Cancelled'],
          defaultValue: 'Planned',
        },
        { name: 'Assigned To', type: 'user' },
        { name: 'Notes', type: 'longText' },
        { name: 'Follow Up Required', type: 'checkbox' },
      ],
    },
  ],
  views: [
    {
      name: 'Active Opportunities Pipeline',
      tableId: 'Opportunities',
      type: 'kanban',
      groupBy: 'Stage',
      filters: [
        { field: 'Stage', operator: 'isNot', value: 'Closed Won' },
        { field: 'Stage', operator: 'isNot', value: 'Closed Lost' },
      ],
      sortBy: [{ field: 'Amount', order: 'desc' }],
    },
    {
      name: 'My Activities Today',
      tableId: 'Activities',
      type: 'grid',
      filters: [
        { field: 'Assigned To', operator: 'is', value: 'current_user' },
        { field: 'Date', operator: 'is', value: 'today' },
      ],
      sortBy: [{ field: 'Date', order: 'asc' }],
    },
    {
      name: 'High-Value Customers',
      tableId: 'Customers',
      type: 'grid',
      filters: [
        { field: 'Annual Revenue', operator: 'greaterThan', value: 1000000 },
        { field: 'Status', operator: 'is', value: 'Active' },
      ],
      sortBy: [{ field: 'Annual Revenue', order: 'desc' }],
    },
  ],
  dashboards: [
    {
      name: 'Sales Overview',
      widgets: [
        {
          type: 'metric',
          title: 'Total Pipeline Value',
          config: {
            table: 'Opportunities',
            aggregation: 'sum',
            field: 'Amount',
            filters: [{ field: 'Stage', operator: 'isNot', value: 'Closed Lost' }],
          },
        },
        {
          type: 'chart',
          title: 'Opportunities by Stage',
          config: {
            table: 'Opportunities',
            chartType: 'bar',
            groupBy: 'Stage',
            aggregation: 'count',
          },
        },
        {
          type: 'chart',
          title: 'Monthly Revenue Trend',
          config: {
            table: 'Opportunities',
            chartType: 'line',
            dateField: 'Expected Close Date',
            aggregation: 'sum',
            field: 'Amount',
            filters: [{ field: 'Stage', operator: 'is', value: 'Closed Won' }],
          },
        },
      ],
    },
  ],
  automations: [
    {
      name: 'New Opportunity Notification',
      trigger: {
        type: 'record_created',
        table: 'Opportunities',
      },
      actions: [
        {
          type: 'send_notification',
          config: {
            recipient: '{{Owner}}',
            message: 'New opportunity created: {{Opportunity Name}} - ${{Amount}}',
          },
        },
      ],
    },
    {
      name: 'Follow-up Reminder',
      trigger: {
        type: 'field_updated',
        table: 'Activities',
        field: 'Follow Up Required',
        condition: { value: true },
      },
      actions: [
        {
          type: 'create_task',
          config: {
            assignee: '{{Assigned To}}',
            title: 'Follow up on {{Subject}}',
            dueDate: '+1 day',
          },
        },
      ],
    },
  ],
};

/**
 * Project Management Template
 * Includes projects, tasks, milestones, team members, and time tracking
 */
export const projectManagementTemplate: GenesisTemplate = {
  id: 'project_management',
  name: 'Project Management',
  description: 'Comprehensive project tracking with tasks, milestones, and team collaboration',
  category: 'operations',
  icon: '📊',
  tables: [
    {
      name: 'Projects',
      description: 'Project information and status',
      fields: [
        { name: 'Project Name', type: 'text', required: true },
        { name: 'Description', type: 'longText' },
        {
          name: 'Status',
          type: 'select',
          options: ['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'],
          defaultValue: 'Planning',
        },
        { name: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'], defaultValue: 'Medium' },
        { name: 'Start Date', type: 'date' },
        { name: 'End Date', type: 'date' },
        { name: 'Project Manager', type: 'user' },
        { name: 'Team Members', type: 'multipleUsers' },
        { name: 'Budget', type: 'currency' },
        { name: 'Progress', type: 'percent', defaultValue: 0 },
        { name: 'Client', type: 'text' },
        { name: 'Project Code', type: 'text', unique: true },
      ],
    },
    {
      name: 'Tasks',
      description: 'Individual task tracking',
      fields: [
        { name: 'Task Name', type: 'text', required: true },
        { name: 'Project', type: 'link', linkedTable: 'Projects', required: true },
        { name: 'Description', type: 'longText' },
        {
          name: 'Status',
          type: 'select',
          options: ['To Do', 'In Progress', 'Review', 'Done', 'Blocked'],
          defaultValue: 'To Do',
        },
        { name: 'Priority', type: 'select', options: ['Low', 'Medium', 'High'], defaultValue: 'Medium' },
        { name: 'Assignee', type: 'user' },
        { name: 'Due Date', type: 'date' },
        { name: 'Estimated Hours', type: 'number' },
        { name: 'Actual Hours', type: 'number' },
        { name: 'Dependencies', type: 'link', linkedTable: 'Tasks', multiple: true },
        { name: 'Labels', type: 'multiSelect', options: ['Bug', 'Feature', 'Enhancement', 'Documentation', 'Testing'] },
        { name: 'Completion %', type: 'percent', defaultValue: 0 },
      ],
    },
    {
      name: 'Milestones',
      description: 'Key project milestones',
      fields: [
        { name: 'Milestone Name', type: 'text', required: true },
        { name: 'Project', type: 'link', linkedTable: 'Projects', required: true },
        { name: 'Target Date', type: 'date', required: true },
        {
          name: 'Status',
          type: 'select',
          options: ['Upcoming', 'At Risk', 'Achieved', 'Missed'],
          defaultValue: 'Upcoming',
        },
        { name: 'Owner', type: 'user' },
        { name: 'Description', type: 'longText' },
        { name: 'Success Criteria', type: 'longText' },
        { name: 'Related Tasks', type: 'link', linkedTable: 'Tasks', multiple: true },
      ],
    },
    {
      name: 'Time Tracking',
      description: 'Track time spent on tasks',
      fields: [
        { name: 'Date', type: 'date', required: true, defaultValue: 'today' },
        { name: 'Team Member', type: 'user', required: true },
        { name: 'Task', type: 'link', linkedTable: 'Tasks', required: true },
        { name: 'Hours', type: 'number', required: true },
        { name: 'Description', type: 'text' },
        { name: 'Billable', type: 'checkbox', defaultValue: true },
        { name: 'Rate', type: 'currency' },
        { name: 'Total', type: 'formula', formula: 'Hours * Rate' },
      ],
    },
  ],
  views: [
    {
      name: 'Project Dashboard',
      tableId: 'Projects',
      type: 'kanban',
      groupBy: 'Status',
      sortBy: [{ field: 'Priority', order: 'desc' }],
    },
    {
      name: 'My Tasks',
      tableId: 'Tasks',
      type: 'grid',
      filters: [
        { field: 'Assignee', operator: 'is', value: 'current_user' },
        { field: 'Status', operator: 'isNot', value: 'Done' },
      ],
      sortBy: [{ field: 'Due Date', order: 'asc' }],
    },
    {
      name: 'Sprint Board',
      tableId: 'Tasks',
      type: 'kanban',
      groupBy: 'Status',
      filters: [{ field: 'Due Date', operator: 'isWithin', value: 'next_14_days' }],
    },
    {
      name: 'Upcoming Milestones',
      tableId: 'Milestones',
      type: 'calendar',
      dateField: 'Target Date',
      filters: [{ field: 'Status', operator: 'is', value: 'Upcoming' }],
    },
  ],
  dashboards: [
    {
      name: 'Project Overview',
      widgets: [
        {
          type: 'metric',
          title: 'Active Projects',
          config: {
            table: 'Projects',
            aggregation: 'count',
            filters: [{ field: 'Status', operator: 'is', value: 'In Progress' }],
          },
        },
        {
          type: 'chart',
          title: 'Task Status Distribution',
          config: {
            table: 'Tasks',
            chartType: 'pie',
            groupBy: 'Status',
            aggregation: 'count',
          },
        },
        {
          type: 'chart',
          title: 'Team Workload',
          config: {
            table: 'Tasks',
            chartType: 'bar',
            groupBy: 'Assignee',
            aggregation: 'sum',
            field: 'Estimated Hours',
            filters: [{ field: 'Status', operator: 'isNot', value: 'Done' }],
          },
        },
      ],
    },
  ],
  automations: [
    {
      name: 'Task Due Date Reminder',
      trigger: {
        type: 'time_based',
        config: {
          table: 'Tasks',
          condition: {
            field: 'Due Date',
            operator: 'is',
            value: 'tomorrow',
          },
        },
      },
      actions: [
        {
          type: 'send_notification',
          config: {
            recipient: '{{Assignee}}',
            message: 'Task "{{Task Name}}" is due tomorrow',
          },
        },
      ],
    },
    {
      name: 'Update Project Progress',
      trigger: {
        type: 'field_updated',
        table: 'Tasks',
        field: 'Status',
      },
      actions: [
        {
          type: 'update_record',
          config: {
            table: 'Projects',
            record: '{{Project}}',
            updates: {
              Progress: 'calculate_from_tasks',
            },
          },
        },
      ],
    },
  ],
};

/**
 * HR Management Template
 * Includes employees, departments, leave requests, performance reviews, and onboarding
 */
export const hrManagementTemplate: GenesisTemplate = {
  id: 'hr_management',
  name: 'Human Resources Management',
  description: 'Complete HR system for employee management, leave tracking, and performance reviews',
  category: 'hr',
  icon: '🏢',
  tables: [
    {
      name: 'Employees',
      description: 'Employee master records',
      fields: [
        { name: 'Employee ID', type: 'text', required: true, unique: true },
        { name: 'Full Name', type: 'text', required: true },
        { name: 'Email', type: 'email', required: true, unique: true },
        { name: 'Phone', type: 'phone' },
        { name: 'Department', type: 'link', linkedTable: 'Departments' },
        { name: 'Job Title', type: 'text' },
        { name: 'Manager', type: 'link', linkedTable: 'Employees' },
        {
          name: 'Employment Type',
          type: 'select',
          options: ['Full-time', 'Part-time', 'Contract', 'Intern'],
          defaultValue: 'Full-time',
        },
        { name: 'Start Date', type: 'date' },
        { name: 'Status', type: 'select', options: ['Active', 'On Leave', 'Terminated'], defaultValue: 'Active' },
        { name: 'Office Location', type: 'select', options: ['Headquarters', 'Branch A', 'Branch B', 'Remote'] },
        { name: 'Salary Band', type: 'select', options: ['Band 1', 'Band 2', 'Band 3', 'Band 4', 'Band 5'] },
        { name: 'Emergency Contact', type: 'text' },
        {
          name: 'Skills',
          type: 'multiSelect',
          options: ['Leadership', 'Technical', 'Communication', 'Project Management', 'Analytics'],
        },
      ],
    },
    {
      name: 'Departments',
      description: 'Department structure',
      fields: [
        { name: 'Department Name', type: 'text', required: true },
        { name: 'Department Code', type: 'text', unique: true },
        { name: 'Department Head', type: 'link', linkedTable: 'Employees' },
        { name: 'Parent Department', type: 'link', linkedTable: 'Departments' },
        { name: 'Budget', type: 'currency' },
        {
          name: 'Headcount',
          type: 'rollup',
          linkedTable: 'Employees',
          linkedField: 'Department',
          aggregation: 'count',
        },
        { name: 'Cost Center', type: 'text' },
        { name: 'Active', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      name: 'Leave Requests',
      description: 'Employee leave/time-off requests',
      fields: [
        { name: 'Employee', type: 'link', linkedTable: 'Employees', required: true },
        {
          name: 'Leave Type',
          type: 'select',
          options: ['Annual Leave', 'Sick Leave', 'Personal Leave', 'Maternity/Paternity', 'Unpaid Leave'],
          required: true,
        },
        { name: 'Start Date', type: 'date', required: true },
        { name: 'End Date', type: 'date', required: true },
        { name: 'Days', type: 'formula', formula: 'WORKDAY_DIFF(Start Date, End Date)' },
        {
          name: 'Status',
          type: 'select',
          options: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
          defaultValue: 'Pending',
        },
        { name: 'Approver', type: 'link', linkedTable: 'Employees' },
        { name: 'Reason', type: 'longText' },
        { name: 'Approval Date', type: 'date' },
        { name: 'Comments', type: 'longText' },
        { name: 'Submitted Date', type: 'createdTime' },
      ],
    },
    {
      name: 'Performance Reviews',
      description: 'Employee performance evaluations',
      fields: [
        { name: 'Employee', type: 'link', linkedTable: 'Employees', required: true },
        { name: 'Review Period', type: 'text', required: true },
        { name: 'Review Date', type: 'date', required: true },
        { name: 'Reviewer', type: 'link', linkedTable: 'Employees', required: true },
        {
          name: 'Overall Rating',
          type: 'select',
          options: ['Exceeds Expectations', 'Meets Expectations', 'Needs Improvement', 'Unsatisfactory'],
        },
        { name: 'Goals Achievement', type: 'percent' },
        { name: 'Strengths', type: 'longText' },
        { name: 'Areas for Improvement', type: 'longText' },
        { name: 'Development Plan', type: 'longText' },
        { name: 'Next Review Date', type: 'date' },
        {
          name: 'Status',
          type: 'select',
          options: ['Draft', 'Submitted', 'Reviewed', 'Finalized'],
          defaultValue: 'Draft',
        },
      ],
    },
    {
      name: 'Onboarding Tasks',
      description: 'New employee onboarding checklist',
      fields: [
        { name: 'Task Name', type: 'text', required: true },
        { name: 'Employee', type: 'link', linkedTable: 'Employees', required: true },
        {
          name: 'Category',
          type: 'select',
          options: ['IT Setup', 'HR Documentation', 'Training', 'Access & Security', 'Team Introduction'],
        },
        { name: 'Due Date', type: 'date' },
        { name: 'Assigned To', type: 'link', linkedTable: 'Employees' },
        {
          name: 'Status',
          type: 'select',
          options: ['Not Started', 'In Progress', 'Completed'],
          defaultValue: 'Not Started',
        },
        { name: 'Completed Date', type: 'date' },
        { name: 'Notes', type: 'longText' },
        { name: 'Required Documents', type: 'attachment' },
      ],
    },
  ],
  views: [
    {
      name: 'Organization Chart',
      tableId: 'Employees',
      type: 'hierarchy',
      parentField: 'Manager',
      filters: [{ field: 'Status', operator: 'is', value: 'Active' }],
    },
    {
      name: 'Leave Calendar',
      tableId: 'Leave Requests',
      type: 'calendar',
      startDateField: 'Start Date',
      endDateField: 'End Date',
      colorBy: 'Leave Type',
      filters: [{ field: 'Status', operator: 'is', value: 'Approved' }],
    },
    {
      name: 'Pending Approvals',
      tableId: 'Leave Requests',
      type: 'grid',
      filters: [
        { field: 'Status', operator: 'is', value: 'Pending' },
        { field: 'Approver', operator: 'is', value: 'current_user' },
      ],
      sortBy: [{ field: 'Submitted Date', order: 'asc' }],
    },
    {
      name: 'New Employee Onboarding',
      tableId: 'Onboarding Tasks',
      type: 'kanban',
      groupBy: 'Status',
      filters: [{ field: 'Status', operator: 'isNot', value: 'Completed' }],
    },
  ],
  dashboards: [
    {
      name: 'HR Analytics',
      widgets: [
        {
          type: 'metric',
          title: 'Total Headcount',
          config: {
            table: 'Employees',
            aggregation: 'count',
            filters: [{ field: 'Status', operator: 'is', value: 'Active' }],
          },
        },
        {
          type: 'chart',
          title: 'Employees by Department',
          config: {
            table: 'Employees',
            chartType: 'bar',
            groupBy: 'Department',
            aggregation: 'count',
            filters: [{ field: 'Status', operator: 'is', value: 'Active' }],
          },
        },
        {
          type: 'chart',
          title: 'Leave Requests by Type',
          config: {
            table: 'Leave Requests',
            chartType: 'pie',
            groupBy: 'Leave Type',
            aggregation: 'sum',
            field: 'Days',
            dateRange: 'this_year',
          },
        },
        {
          type: 'metric',
          title: 'Average Performance Rating',
          config: {
            table: 'Performance Reviews',
            aggregation: 'average',
            field: 'Goals Achievement',
            filters: [{ field: 'Review Period', operator: 'contains', value: 'current_year' }],
          },
        },
      ],
    },
  ],
  automations: [
    {
      name: 'New Employee Onboarding',
      trigger: {
        type: 'record_created',
        table: 'Employees',
      },
      actions: [
        {
          type: 'create_records',
          config: {
            table: 'Onboarding Tasks',
            template: 'standard_onboarding_tasks',
            linkTo: 'Employee',
          },
        },
        {
          type: 'send_notification',
          config: {
            recipient: 'hr_team',
            message: 'New employee {{Full Name}} has been added. Please initiate onboarding process.',
          },
        },
      ],
    },
    {
      name: 'Leave Request Notification',
      trigger: {
        type: 'record_created',
        table: 'Leave Requests',
      },
      actions: [
        {
          type: 'send_notification',
          config: {
            recipient: '{{Approver}}',
            message: '{{Employee.Full Name}} has submitted a leave request for {{Days}} days',
          },
        },
      ],
    },
    {
      name: 'Performance Review Reminder',
      trigger: {
        type: 'time_based',
        config: {
          table: 'Performance Reviews',
          condition: {
            field: 'Next Review Date',
            operator: 'is',
            value: 'in_30_days',
          },
        },
      },
      actions: [
        {
          type: 'send_notification',
          config: {
            recipient: '{{Reviewer}}',
            message: 'Performance review for {{Employee.Full Name}} is due in 30 days',
          },
        },
      ],
    },
  ],
};

/**
 * Additional templates collection
 */
export const additionalTemplates: GenesisTemplate[] = [
  {
    id: 'inventory_management',
    name: 'Inventory Management',
    description: 'Track products, stock levels, suppliers, and purchase orders',
    category: 'operations',
    icon: '📦',
    tables: [], // Simplified for brevity
    views: [],
    dashboards: [],
    automations: [],
  },
  {
    id: 'event_planning',
    name: 'Event Planning',
    description: 'Manage events, attendees, vendors, and schedules',
    category: 'operations',
    icon: '🎉',
    tables: [],
    views: [],
    dashboards: [],
    automations: [],
  },
  {
    id: 'bug_tracking',
    name: 'Bug Tracking',
    description: 'Track software bugs, features, and development tasks',
    category: 'development',
    icon: '🐛',
    tables: [],
    views: [],
    dashboards: [],
    automations: [],
  },
];

/**
 * Template registry
 */
export const templateRegistry: Map<string, GenesisTemplate> = new Map([
  ['crm', crmTemplate],
  ['project_management', projectManagementTemplate],
  ['hr_management', hrManagementTemplate],
  ...additionalTemplates.map((t) => [t.id, t] as [string, GenesisTemplate]),
]);

/**
 * Get template by ID
 */
export function getTemplate(templateId: string): GenesisTemplate | undefined {
  return templateRegistry.get(templateId);
}

/**
 * Get all available templates
 */
export function getAllTemplates(): GenesisTemplate[] {
  return Array.from(templateRegistry.values());
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): GenesisTemplate[] {
  return getAllTemplates().filter((t) => t.category === category);
}
