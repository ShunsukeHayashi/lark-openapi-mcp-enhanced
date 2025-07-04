/**
 * MCP Resources - Provide access to templates, examples, and documentation
 */

export const mcpResources = [
  {
    name: 'genesis_template_examples',
    description: 'Examples and details of Genesis templates for creating Lark Base applications',
    mimeType: 'application/json',
    content: JSON.stringify({
      templates: {
        crm: {
          name: 'Customer Relationship Management',
          tables: [
            {
              name: 'Customers',
              fields: ['Company Name', 'Industry', 'Status', 'Annual Revenue', 'Account Owner'],
              purpose: 'Manage customer organizations'
            },
            {
              name: 'Contacts',
              fields: ['Full Name', 'Email', 'Phone', 'Job Title', 'Company'],
              purpose: 'Individual contact records'
            },
            {
              name: 'Opportunities',
              fields: ['Opportunity Name', 'Stage', 'Amount', 'Expected Close Date', 'Owner'],
              purpose: 'Sales pipeline tracking'
            },
            {
              name: 'Activities',
              fields: ['Subject', 'Type', 'Date', 'Status', 'Related To'],
              purpose: 'Track all customer interactions'
            }
          ],
          views: ['Pipeline Kanban', 'My Activities', 'High-Value Customers', 'Forecast Report'],
          automations: ['New opportunity notifications', 'Follow-up reminders', 'Stage change alerts'],
          dashboards: ['Sales Overview', 'Activity Metrics', 'Revenue Forecast'],
          useCases: [
            'B2B sales management',
            'Customer success tracking',
            'Account management',
            'Sales forecasting'
          ]
        },
        project_management: {
          name: 'Project Management System',
          tables: [
            {
              name: 'Projects',
              fields: ['Project Name', 'Status', 'Priority', 'Start Date', 'End Date', 'Manager'],
              purpose: 'Project portfolio management'
            },
            {
              name: 'Tasks',
              fields: ['Task Name', 'Project', 'Assignee', 'Due Date', 'Status', 'Dependencies'],
              purpose: 'Detailed task tracking'
            },
            {
              name: 'Milestones',
              fields: ['Milestone Name', 'Target Date', 'Status', 'Owner', 'Success Criteria'],
              purpose: 'Key project checkpoints'
            },
            {
              name: 'Time Tracking',
              fields: ['Date', 'Team Member', 'Task', 'Hours', 'Billable'],
              purpose: 'Track time spent on tasks'
            }
          ],
          views: ['Sprint Board', 'Gantt Chart', 'Team Workload', 'Milestone Calendar'],
          automations: ['Task assignment notifications', 'Due date reminders', 'Progress updates'],
          dashboards: ['Project Overview', 'Resource Utilization', 'Sprint Metrics'],
          useCases: [
            'Software development',
            'Marketing campaigns',
            'Product launches',
            'Construction projects'
          ]
        },
        hr_management: {
          name: 'Human Resources Management',
          tables: [
            {
              name: 'Employees',
              fields: ['Employee ID', 'Full Name', 'Department', 'Job Title', 'Manager', 'Start Date'],
              purpose: 'Employee master records'
            },
            {
              name: 'Leave Requests',
              fields: ['Employee', 'Leave Type', 'Start Date', 'End Date', 'Status', 'Approver'],
              purpose: 'Time-off management'
            },
            {
              name: 'Performance Reviews',
              fields: ['Employee', 'Review Period', 'Rating', 'Goals Achievement', 'Next Review Date'],
              purpose: 'Performance evaluations'
            },
            {
              name: 'Onboarding Tasks',
              fields: ['Task Name', 'Employee', 'Category', 'Due Date', 'Status', 'Assigned To'],
              purpose: 'New hire checklist'
            }
          ],
          views: ['Organization Chart', 'Leave Calendar', 'Pending Approvals', 'Onboarding Progress'],
          automations: ['Onboarding task creation', 'Leave approval workflow', 'Review reminders'],
          dashboards: ['HR Analytics', 'Headcount Trends', 'Leave Utilization'],
          useCases: [
            'Employee lifecycle management',
            'Leave management',
            'Performance tracking',
            'Organizational planning'
          ]
        }
      },
      implementation_guide: {
        quick_start: [
          '1. Choose a template that matches your needs',
          '2. Use genesis.builtin.list_templates for details',
          '3. Create base with genesis.builtin.create_base',
          '4. Customize fields and views as needed',
          '5. Set up automation rules',
          '6. Configure user permissions'
        ],
        customization_tips: [
          'Add custom fields specific to your business',
          'Create filtered views for different teams',
          'Set up approval workflows',
          'Build dashboards for executives',
          'Integrate with other systems via API'
        ]
      }
    }, null, 2)
  },
  {
    name: 'lark_api_reference',
    description: 'Complete Lark/Feishu API reference documentation',
    mimeType: 'text/markdown',
    content: `# Lark/Feishu API Reference

## Core APIs

### 1. Authentication & Authorization
- **Access Tokens**: App and user authentication
- **OAuth 2.0**: User authorization flow
- **JWT**: Service-to-service auth

### 2. User & Contact APIs
- User management (create, update, query)
- Department structure
- User groups
- Contact sync

### 3. Messaging APIs
- Send messages (text, rich text, cards)
- Create and manage chats
- Message reactions
- Bot interactions

### 4. Document APIs
- Create and edit documents
- Manage permissions
- Real-time collaboration
- Export/import

### 5. Base/Bitable APIs
- Create bases and tables
- Manage records
- Views and filters
- Automation

### 6. Calendar APIs
- Create events
- Manage attendees
- Room booking
- Availability check

### 7. Approval APIs
- Create approval definitions
- Submit instances
- Query status
- Approval actions

### 8. Wiki/Knowledge Base APIs
- Create spaces
- Manage pages
- Permissions
- Search

### 9. Drive APIs
- File operations
- Folder management
- Permissions
- Sharing

### 10. Task APIs
- Create tasks
- Assign members
- Track progress
- Dependencies

## Rate Limits
- Default: 50 requests/minute
- Batch operations: 20/minute
- Search operations: 30/minute
- File uploads: 10/minute

## Best Practices
1. Use batch operations when possible
2. Implement exponential backoff
3. Cache frequently accessed data
4. Use webhooks for real-time updates
5. Handle errors gracefully
`
  },
  {
    name: 'automation_templates',
    description: 'Ready-to-use automation workflow templates',
    mimeType: 'application/json',
    content: JSON.stringify({
      templates: [
        {
          name: 'employee_onboarding',
          description: 'Complete employee onboarding workflow',
          steps: [
            'Create user account',
            'Add to departments',
            'Assign to groups',
            'Create email',
            'Book desk/equipment',
            'Schedule orientation',
            'Assign buddy',
            'Create tasks for manager',
            'Send welcome message'
          ],
          automations: [
            {
              trigger: 'New employee record created',
              actions: [
                'Create Lark account',
                'Send welcome email',
                'Create onboarding checklist',
                'Notify IT for equipment',
                'Schedule HR meeting'
              ]
            }
          ]
        },
        {
          name: 'project_kickoff',
          description: 'Project initialization workflow',
          steps: [
            'Create project base',
            'Set up team chat',
            'Create document space',
            'Schedule kickoff meeting',
            'Create task list',
            'Set up status reporting'
          ],
          automations: [
            {
              trigger: 'Project approved',
              actions: [
                'Create project workspace',
                'Add team members',
                'Generate project template',
                'Schedule weekly standups',
                'Create status dashboard'
              ]
            }
          ]
        },
        {
          name: 'expense_approval',
          description: 'Expense claim approval workflow',
          routing_rules: [
            { condition: 'amount < 100', approver: 'Direct manager' },
            { condition: 'amount >= 100 AND amount < 1000', approver: 'Department head' },
            { condition: 'amount >= 1000', approver: 'Finance director' }
          ],
          notifications: [
            'Submission confirmation',
            'Approval needed reminder',
            'Status updates',
            'Final approval/rejection'
          ]
        }
      ]
    }, null, 2)
  },
  {
    name: 'base_table_schemas',
    description: 'Common Lark Base table schemas',
    mimeType: 'application/json',
    content: JSON.stringify({
      schemas: [
        {
          name: 'CRM',
          tables: [
            {
              name: 'Customers',
              fields: [
                { name: 'Company Name', type: 'text', required: true },
                { name: 'Contact Person', type: 'user' },
                { name: 'Email', type: 'email' },
                { name: 'Phone', type: 'phone' },
                { name: 'Status', type: 'select', options: ['Lead', 'Prospect', 'Customer', 'Churned'] },
                { name: 'Industry', type: 'select' },
                { name: 'Deal Size', type: 'currency' },
                { name: 'Last Contact', type: 'date' },
                { name: 'Notes', type: 'text_long' }
              ]
            },
            {
              name: 'Deals',
              fields: [
                { name: 'Deal Name', type: 'text' },
                { name: 'Customer', type: 'link', link_to: 'Customers' },
                { name: 'Stage', type: 'select', options: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'] },
                { name: 'Amount', type: 'currency' },
                { name: 'Probability', type: 'percent' },
                { name: 'Close Date', type: 'date' },
                { name: 'Owner', type: 'user' }
              ]
            }
          ]
        },
        {
          name: 'Project Management',
          tables: [
            {
              name: 'Projects',
              fields: [
                { name: 'Project Name', type: 'text' },
                { name: 'Status', type: 'select', options: ['Planning', 'In Progress', 'On Hold', 'Completed'] },
                { name: 'Start Date', type: 'date' },
                { name: 'End Date', type: 'date' },
                { name: 'Project Lead', type: 'user' },
                { name: 'Budget', type: 'currency' },
                { name: 'Progress', type: 'percent' }
              ]
            },
            {
              name: 'Tasks',
              fields: [
                { name: 'Task Name', type: 'text' },
                { name: 'Project', type: 'link', link_to: 'Projects' },
                { name: 'Assignee', type: 'user' },
                { name: 'Status', type: 'select', options: ['To Do', 'In Progress', 'Review', 'Done'] },
                { name: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Urgent'] },
                { name: 'Due Date', type: 'date' },
                { name: 'Estimated Hours', type: 'number' },
                { name: 'Actual Hours', type: 'number' }
              ]
            }
          ]
        }
      ]
    }, null, 2)
  },
  {
    name: 'integration_examples',
    description: 'Code examples for common integrations',
    mimeType: 'text/markdown',
    content: `# Lark Integration Examples

## 1. Webhook Integration

### Incoming Webhook (Send to Lark)
\`\`\`javascript
const axios = require('axios');

async function sendToLark(webhookUrl, message) {
  const payload = {
    msg_type: 'interactive',
    card: {
      header: {
        title: {
          tag: 'plain_text',
          content: 'System Alert'
        }
      },
      elements: [{
        tag: 'div',
        text: {
          tag: 'plain_text',
          content: message
        }
      }]
    }
  };
  
  await axios.post(webhookUrl, payload);
}
\`\`\`

### Outgoing Webhook (Receive from Lark)
\`\`\`javascript
app.post('/lark-webhook', (req, res) => {
  const { event_type, event } = req.body;
  
  switch(event_type) {
    case 'message':
      handleMessage(event);
      break;
    case 'user_add':
      handleUserAdd(event);
      break;
  }
  
  res.json({ success: true });
});
\`\`\`

## 2. OAuth Flow

\`\`\`javascript
// Step 1: Redirect to authorization
app.get('/auth/lark', (req, res) => {
  const authUrl = 'https://open.feishu.cn/open-apis/authen/v1/index' +
    '?app_id=YOUR_APP_ID' +
    '&redirect_uri=YOUR_REDIRECT_URI' +
    '&state=RANDOM_STATE';
  res.redirect(authUrl);
});

// Step 2: Handle callback
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  const tokenResponse = await getAccessToken(code);
  // Store token and proceed
});
\`\`\`

## 3. Batch Operations

\`\`\`javascript
// Batch create records
async function batchCreateRecords(baseToken, tableId, records) {
  const BATCH_SIZE = 100;
  const batches = [];
  
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    batches.push(records.slice(i, i + BATCH_SIZE));
  }
  
  for (const batch of batches) {
    await client.bitable.appTableRecord.batchCreate({
      path: { app_token: baseToken, table_id: tableId },
      data: { records: batch }
    });
    
    // Respect rate limits
    await sleep(1000);
  }
}
\`\`\`

## 4. Real-time Sync

\`\`\`javascript
// Subscribe to events
async function subscribeToEvents() {
  await client.event.subscribe({
    event_types: [
      'user.created',
      'user.updated',
      'department.created',
      'approval.instance.created'
    ],
    url: 'https://your-server.com/lark-events'
  });
}

// Handle events
app.post('/lark-events', (req, res) => {
  const { type, event } = req.body;
  
  eventEmitter.emit(type, event);
  res.json({ challenge: req.body.challenge });
});
\`\`\`
`
  }
];

/**
 * Register resources with MCP server
 */
export function registerResources(server: any): void {
  for (const resource of mcpResources) {
    server.resource(
      resource.name,
      resource.description,
      resource.mimeType,
      async () => {
        return {
          content: resource.content
        };
      }
    );
  }
}