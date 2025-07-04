/**
 * Complete set of prompts for all Lark/Feishu functions
 * Provides guided templates for using all API capabilities
 */

export const completePrompts = [
  // ========== User Management Prompts ==========
  {
    name: 'complete_user_management',
    description: 'Manage users - create, update, query, and organize',
    arguments: [
      {
        name: 'action',
        description: 'What user management action to perform',
        required: true
      },
      {
        name: 'details',
        description: 'Specific details about the users',
        required: true
      }
    ],
    template: `# User Management

## Action: {{action}}
## Details: {{details}}

## Available User Operations:

### 1. Create Users
- Add new employees to the organization
- Set up user profiles with contact information
- Assign to departments and set roles
- Configure employee types and numbers

### 2. Query Users
- Search by email, mobile, or user ID
- Get detailed user information
- List users in departments
- Find users by attributes

### 3. Update Users
- Modify user profiles
- Change department assignments
- Update contact information
- Manage user status

### 4. User Permissions
- Assign roles and permissions
- Add users to groups
- Set up access controls
- Manage admin privileges

## Best Practices:
- Always validate email formats
- Use consistent employee numbering
- Set appropriate department assignments
- Configure proper access levels
`
  },

  // ========== Department & Organization Prompts ==========
  {
    name: 'complete_org_structure',
    description: 'Design and manage organizational structure',
    arguments: [
      {
        name: 'structure_type',
        description: 'Type of organizational structure needed',
        required: true
      },
      {
        name: 'hierarchy',
        description: 'Organizational hierarchy details',
        required: true
      }
    ],
    template: `# Organization Structure Management

## Structure Type: {{structure_type}}
## Hierarchy: {{hierarchy}}

## Department Management:

### 1. Create Departments
- Build hierarchical structure
- Set parent-child relationships
- Assign department leaders
- Configure display order

### 2. Organize Teams
- Create sub-departments
- Set up cross-functional units
- Define reporting structures
- Manage virtual teams

### 3. Department Operations
- Move departments in hierarchy
- Merge or split departments
- Archive inactive departments
- Set department attributes

### 4. Access Control
- Department-based permissions
- Visibility settings
- Data access boundaries
- Admin delegation

## Common Structures:
1. **Functional Structure**
   - Sales, Marketing, Engineering, HR
   - Clear specialization
   - Vertical reporting

2. **Divisional Structure**
   - Product-based divisions
   - Geographic divisions
   - Customer-segment divisions

3. **Matrix Structure**
   - Dual reporting relationships
   - Project-based teams
   - Resource sharing

4. **Flat Structure**
   - Minimal hierarchy
   - Self-managing teams
   - Direct communication
`
  },

  // ========== Approval Workflow Prompts ==========
  {
    name: 'complete_approval_workflow',
    description: 'Create and manage approval workflows',
    arguments: [
      {
        name: 'workflow_type',
        description: 'Type of approval workflow',
        required: true
      },
      {
        name: 'approval_rules',
        description: 'Rules and conditions for approval',
        required: true
      }
    ],
    template: `# Approval Workflow Design

## Workflow Type: {{workflow_type}}
## Approval Rules: {{approval_rules}}

## Approval Components:

### 1. Common Approval Types
- **Leave Requests**
  * Annual leave
  * Sick leave
  * Personal time off
  * Maternity/paternity leave

- **Expense Claims**
  * Travel expenses
  * Business meals
  * Office supplies
  * Training costs

- **Purchase Requests**
  * Equipment purchase
  * Software licenses
  * Service contracts
  * Vendor payments

- **HR Requests**
  * Hiring approval
  * Promotion requests
  * Salary adjustments
  * Transfer requests

### 2. Approval Flow Design
- **Sequential Approval**
  * Step-by-step approval chain
  * Each level must approve
  * Clear escalation path

- **Parallel Approval**
  * Multiple approvers simultaneously
  * All must approve or any can approve
  * Faster processing

- **Conditional Routing**
  * Amount-based routing
  * Department-specific paths
  * Risk-level routing

### 3. Approval Rules
- **Auto-approval Conditions**
  * Below threshold amounts
  * Pre-approved categories
  * Trusted requesters

- **Escalation Rules**
  * Time-based escalation
  * Absence handling
  * Override authorities

- **Rejection Handling**
  * Revision and resubmit
  * Alternative approvers
  * Appeal process

### 4. Notifications
- Request submitted alerts
- Approval needed reminders
- Status change updates
- Completion notifications

## Implementation Steps:
1. Define approval stages
2. Set approver criteria
3. Configure conditions
4. Add form fields
5. Set up notifications
6. Test workflow
7. Deploy and monitor
`
  },

  // ========== Knowledge Management Prompts ==========
  {
    name: 'complete_knowledge_base',
    description: 'Build and organize knowledge base/wiki',
    arguments: [
      {
        name: 'kb_purpose',
        description: 'Purpose and scope of knowledge base',
        required: true
      },
      {
        name: 'content_structure',
        description: 'How content should be organized',
        required: true
      }
    ],
    template: `# Knowledge Base Setup

## Purpose: {{kb_purpose}}
## Content Structure: {{content_structure}}

## Knowledge Base Components:

### 1. Space Organization
- **Department Wikis**
  * Team documentation
  * Process guides
  * Best practices
  * FAQs

- **Project Documentation**
  * Requirements
  * Technical specs
  * Meeting notes
  * Decisions log

- **Company Handbook**
  * Policies
  * Procedures
  * Guidelines
  * Training materials

### 2. Content Types
- **How-to Guides**
  * Step-by-step instructions
  * Screenshots and videos
  * Troubleshooting tips
  * Common issues

- **Reference Materials**
  * API documentation
  * Configuration guides
  * Standards and protocols
  * Glossaries

- **Templates**
  * Document templates
  * Process templates
  * Checklists
  * Forms

### 3. Access Control
- Public vs private spaces
- Role-based access
- Guest access
- External sharing

### 4. Content Management
- Version control
- Review cycles
- Archive policies
- Search optimization

## Best Practices:
- Use consistent naming
- Create clear navigation
- Regular content reviews
- Encourage contributions
- Monitor usage analytics
`
  },

  // ========== Meeting Management Prompts ==========
  {
    name: 'complete_meeting_management',
    description: 'Manage meetings, rooms, and scheduling',
    arguments: [
      {
        name: 'meeting_type',
        description: 'Type of meeting to organize',
        required: true
      },
      {
        name: 'requirements',
        description: 'Meeting requirements and constraints',
        required: true
      }
    ],
    template: `# Meeting Management

## Meeting Type: {{meeting_type}}
## Requirements: {{requirements}}

## Meeting Components:

### 1. Meeting Types
- **Regular Meetings**
  * Daily standups
  * Weekly team meetings
  * Monthly reviews
  * Quarterly planning

- **Ad-hoc Meetings**
  * Problem-solving sessions
  * Decision meetings
  * Brainstorming
  * Emergency meetings

- **Formal Meetings**
  * Board meetings
  * All-hands meetings
  * Client presentations
  * Training sessions

### 2. Room Booking
- Check room availability
- Book appropriate size
- Required equipment:
  * Video conferencing
  * Whiteboard
  * Projector
  * Phone conferencing

- Special requirements:
  * Catering
  * Recording capability
  * Accessibility
  * Privacy

### 3. Scheduling Best Practices
- Find common availability
- Consider time zones
- Buffer time between meetings
- Avoid meeting overload
- Set appropriate duration

### 4. Meeting Preparation
- Send agenda in advance
- Share pre-read materials
- Define expected outcomes
- Assign roles:
  * Facilitator
  * Note-taker
  * Timekeeper
  * Decision maker

### 5. Follow-up
- Send meeting notes
- Action items with owners
- Deadlines and next steps
- Schedule follow-ups

## Meeting Efficiency Tips:
- Start and end on time
- Stay on agenda
- Encourage participation
- Document decisions
- Track action items
`
  },

  // ========== OKR Management Prompts ==========
  {
    name: 'complete_okr_management',
    description: 'Set up and manage OKRs (Objectives and Key Results)',
    arguments: [
      {
        name: 'okr_level',
        description: 'Company, team, or individual OKRs',
        required: true
      },
      {
        name: 'time_period',
        description: 'Quarterly, annual, or custom period',
        required: true
      }
    ],
    template: `# OKR Management

## OKR Level: {{okr_level}}
## Time Period: {{time_period}}

## OKR Framework:

### 1. Setting Objectives
- **Characteristics of Good Objectives**
  * Inspirational and motivating
  * Qualitative and memorable
  * Achievable but challenging
  * Aligned with company mission

- **Examples**
  * "Become the market leader in customer satisfaction"
  * "Build a world-class engineering team"
  * "Transform our customer onboarding experience"

### 2. Defining Key Results
- **SMART Key Results**
  * Specific and unambiguous
  * Measurable with numbers
  * Achievable but stretchy
  * Relevant to objective
  * Time-bound

- **Examples**
  * "Increase NPS score from 45 to 70"
  * "Reduce customer churn from 5% to 2%"
  * "Launch 3 new product features by Q3"

### 3. OKR Alignment
- **Cascade Structure**
  * Company OKRs → Department OKRs
  * Department OKRs → Team OKRs
  * Team OKRs → Individual OKRs

- **Cross-functional Alignment**
  * Shared objectives
  * Dependencies mapping
  * Collaborative key results

### 4. Tracking Progress
- **Check-in Frequency**
  * Weekly progress updates
  * Monthly deep dives
  * Quarterly reviews

- **Progress Indicators**
  * 0-30%: Needs attention
  * 31-70%: On track
  * 71-100%: Exceeding

### 5. OKR Best Practices
- Keep it simple (3-5 objectives)
- Focus on outcomes, not tasks
- Make them public and transparent
- Regular reviews and updates
- Celebrate achievements
- Learn from misses

## Common OKR Mistakes:
- Too many objectives
- Key results that are tasks
- Sandbagging targets
- Set and forget
- No regular reviews
`
  },

  // ========== HR Operations Prompts ==========
  {
    name: 'complete_hr_operations',
    description: 'Manage HR processes and employee lifecycle',
    arguments: [
      {
        name: 'hr_process',
        description: 'Which HR process to implement',
        required: true
      },
      {
        name: 'employee_stage',
        description: 'Stage in employee lifecycle',
        required: true
      }
    ],
    template: `# HR Operations

## HR Process: {{hr_process}}
## Employee Stage: {{employee_stage}}

## Employee Lifecycle Management:

### 1. Recruitment & Onboarding
- **Pre-boarding**
  * Send welcome package
  * Prepare workstation
  * Create accounts
  * Schedule orientation

- **First Day**
  * Office tour
  * Team introductions
  * System access setup
  * Policy overview

- **First Week**
  * Role-specific training
  * Meet stakeholders
  * Set initial goals
  * Assign buddy/mentor

- **First Month**
  * Regular check-ins
  * Feedback sessions
  * Training progress
  * Cultural integration

### 2. Performance Management
- **Goal Setting**
  * SMART goals
  * Align with team objectives
  * Development goals
  * Stretch assignments

- **Continuous Feedback**
  * Regular 1-on-1s
  * Real-time feedback
  * Recognition
  * Coaching

- **Performance Reviews**
  * Self-assessment
  * Manager review
  * 360 feedback
  * Calibration

### 3. Learning & Development
- **Skills Assessment**
  * Current capabilities
  * Gap analysis
  * Future needs
  * Career aspirations

- **Training Programs**
  * Technical skills
  * Soft skills
  * Leadership development
  * Certifications

- **Career Pathing**
  * Growth opportunities
  * Succession planning
  * Lateral moves
  * Stretch projects

### 4. Compensation & Benefits
- **Salary Management**
  * Market benchmarking
  * Pay equity
  * Merit increases
  * Promotions

- **Benefits Administration**
  * Health insurance
  * Retirement plans
  * Time off policies
  * Wellness programs

### 5. Offboarding
- **Exit Process**
  * Exit interview
  * Knowledge transfer
  * Return equipment
  * Access revocation

- **Post-departure**
  * Final paycheck
  * Benefits continuation
  * References
  * Alumni network

## HR Compliance:
- Labor law compliance
- Data privacy (GDPR)
- Equal opportunity
- Workplace safety
- Documentation requirements
`
  },

  // ========== Integration Prompts ==========
  {
    name: 'complete_system_integration',
    description: 'Integrate Lark with other systems and workflows',
    arguments: [
      {
        name: 'integration_type',
        description: 'Type of integration needed',
        required: true
      },
      {
        name: 'systems',
        description: 'Systems to integrate with',
        required: true
      }
    ],
    template: `# System Integration

## Integration Type: {{integration_type}}
## Systems: {{systems}}

## Integration Patterns:

### 1. Data Synchronization
- **User Directory Sync**
  * LDAP/Active Directory
  * HR systems
  * Email systems
  * SSO providers

- **Calendar Integration**
  * Google Calendar
  * Outlook Calendar
  * Room booking systems
  * Scheduling tools

- **Document Integration**
  * Cloud storage (Google Drive, OneDrive)
  * Document management systems
  * Version control
  * Backup systems

### 2. Workflow Automation
- **Approval Workflows**
  * ERP integration
  * Expense systems
  * Procurement
  * Contract management

- **Notification Routing**
  * Alert systems
  * Monitoring tools
  * Help desk
  * CRM updates

### 3. Webhook Integrations
- **Incoming Webhooks**
  * GitHub/GitLab events
  * CI/CD notifications
  * Monitoring alerts
  * Customer feedback

- **Outgoing Webhooks**
  * Trigger external workflows
  * Update external systems
  * Log events
  * Analytics tracking

### 4. API Integration
- **REST API Usage**
  * Authentication methods
  * Rate limiting
  * Error handling
  * Batch operations

- **Event Streaming**
  * Real-time updates
  * Event sourcing
  * Message queues
  * Pub/sub patterns

### 5. Common Integrations
- **CRM Systems**
  * Salesforce
  * HubSpot
  * Dynamics 365
  * Custom CRM

- **Project Management**
  * Jira
  * Asana
  * Trello
  * Monday.com

- **Development Tools**
  * GitHub/GitLab
  * Jenkins
  * Sentry
  * Datadog

## Best Practices:
- Use appropriate auth methods
- Handle rate limits gracefully
- Implement retry logic
- Log integration events
- Monitor integration health
- Plan for failures
- Document integration flows
`
  },
  {
    name: 'complete_genesis_create',
    description: 'Create complete business applications using Genesis templates',
    arguments: [
      {
        name: 'business_scenario',
        description: 'What kind of business application you need',
        required: true
      },
      {
        name: 'specific_requirements',
        description: 'Any specific features or customizations needed',
        required: false
      }
    ],
    template: `# Complete Business Application Creation with Genesis

## Business Scenario: {{business_scenario}}
## Specific Requirements: {{specific_requirements}}

## Available Solutions:

### 1. Pre-built Templates
Use Genesis templates for common business scenarios:
- **CRM**: Customer relationship management
- **Project Management**: Task and project tracking
- **HR Management**: Employee records and processes
- **Inventory Management**: Stock and supplier tracking
- **Event Planning**: Event organization
- **Bug Tracking**: Software issue management

To create from template:
\`\`\`
genesis.builtin.create_base
- baseName: "Your Base Name"
- options.template: "template_id"
- options.useRealAPI: true
\`\`\`

### 2. Custom Applications
For unique requirements, Genesis can analyze and create:
\`\`\`
genesis.builtin.analyze_requirements
- requirements: "Your detailed requirements"
- analysisDepth: "comprehensive"
\`\`\`

Then create with:
\`\`\`
genesis.builtin.create_base
- requirements: "Your requirements"
- baseName: "Your Base Name"
- options.enableAI: true
- options.useRealAPI: true
\`\`\`

### 3. Excel Migration
Convert existing Excel files to Lark Base:
\`\`\`
Use genesis_migrate_excel prompt for guidance
\`\`\`

### 4. Optimization
Improve existing Lark Bases:
\`\`\`
genesis.builtin.optimize_base
- baseToken: "Your base token"
- optimizationGoals: ["performance", "automation", "analytics"]
\`\`\`

## Complete Workflow:
1. Choose approach (template/custom)
2. Create base structure
3. Add custom views and dashboards
4. Set up automation workflows
5. Configure permissions and sharing
6. Add AI-powered features

## Advanced Features:
- Multi-language support (EN/ZH/JA)
- Real-time collaboration
- Mobile app access
- API integration
- Advanced analytics
- Machine learning capabilities`
  }
];

/**
 * Register complete prompts with MCP server
 */
export function registerCompletePrompts(server: any): void {
  for (const prompt of completePrompts) {
    server.prompt(
      prompt.name,
      prompt.description,
      prompt.arguments,
      ({ arguments: args }: any) => {
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
                text: content
              }
            }
          ]
        };
      }
    );
  }
}