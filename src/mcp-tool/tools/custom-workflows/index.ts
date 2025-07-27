/**
 * =============================================================================
 * Custom Workflow Tools Index
 * =============================================================================
 * Export all custom workflow tools for integrated business process automation
 * =============================================================================
 */

// Import custom workflow tools
export { employeeOnboardingComplete } from './employee-onboarding';
export { smartApprovalRouter } from './smart-approval-router';
export { businessIntelligenceSuite } from './business-intelligence-suite';

// Custom workflow tool names for easy reference
export const CUSTOM_WORKFLOW_TOOLS = {
  EMPLOYEE_ONBOARDING: 'employee.onboarding.complete',
  SMART_APPROVAL_ROUTER: 'approval.smart_router.process',
  BUSINESS_INTELLIGENCE: 'business.intelligence.suite.analyze',
} as const;

// Custom workflow presets
export const CUSTOM_WORKFLOW_PRESETS = {
  // HR & People Operations
  HR_AUTOMATION: [
    'employee.onboarding.complete',
    'corehr.v1.employee.create',
    'contact.v3.user.batchGetId',
    'drive.v1.permissionMember.create',
    'im.v1.chatMembers.create',
    'bitable.v1.appTableRecord.create'
  ],
  
  // Approval & Workflow Management
  APPROVAL_AUTOMATION: [
    'approval.smart_router.process',
    'approval.v4.instance.create',
    'contact.v3.user.list',
    'im.v1.message.create',
    'bitable.v1.appTableRecord.search'
  ],
  
  // Business Intelligence & Analytics
  BUSINESS_ANALYTICS: [
    'business.intelligence.suite.analyze',
    'bitable.v1.appTableRecord.search',
    'search.v2.dataSearch',
    'aily.v1.analysis.generate',
    'docx.v1.document.create'
  ],
  
  // Complete Business Automation Suite
  COMPLETE_AUTOMATION: [
    // Custom workflows
    'employee.onboarding.complete',
    'approval.smart_router.process', 
    'business.intelligence.suite.analyze',
    
    // Essential supporting tools
    'contact.v3.user.batchGetId',
    'drive.v1.permissionMember.create',
    'drive.v1.permissionMember.list',
    'bitable.v1.appTableRecord.create',
    'bitable.v1.appTableRecord.search',
    'bitable.v1.appTableRecord.update',
    'im.v1.message.create',
    'im.v1.chatMembers.create',
    'approval.v4.instance.create',
    'docx.v1.document.create',
    'aily.v1.analysis.generate'
  ]
} as const;

/**
 * Custom Workflow Tool Categories
 * Organized by business function for easy discovery
 */
export const WORKFLOW_CATEGORIES = {
  HUMAN_RESOURCES: {
    description: 'Employee lifecycle and HR process automation',
    tools: ['employee.onboarding.complete'],
    use_cases: [
      'New employee onboarding automation',
      'Employee offboarding (future)',
      'Performance review orchestration (future)',
      'Training program management (future)'
    ]
  },
  
  PROCESS_AUTOMATION: {
    description: 'Business process and approval workflow automation',
    tools: ['approval.smart_router.process'],
    use_cases: [
      'Intelligent approval routing',
      'Escalation management',
      'Compliance checking',
      'Workflow optimization'
    ]
  },
  
  BUSINESS_INTELLIGENCE: {
    description: 'Data analytics and business intelligence automation',
    tools: ['business.intelligence.suite.analyze'],
    use_cases: [
      'Executive dashboard generation',
      'Trend analysis and forecasting',
      'Anomaly detection',
      'Automated reporting'
    ]
  }
} as const;

/**
 * Integration Guidelines
 * How to integrate custom workflows with existing tools
 */
export const INTEGRATION_PATTERNS = {
  // Sequential workflow pattern
  SEQUENTIAL: {
    description: 'Execute workflows in sequence for complex processes',
    example: [
      'employee.onboarding.complete', // Creates employee and sets up access
      'approval.smart_router.process', // Routes equipment approval
      'business.intelligence.suite.analyze' // Analyzes onboarding metrics
    ]
  },
  
  // Event-driven pattern
  EVENT_DRIVEN: {
    description: 'Trigger workflows based on business events',
    example: {
      on_employee_start: 'employee.onboarding.complete',
      on_approval_request: 'approval.smart_router.process',
      on_monthly_close: 'business.intelligence.suite.analyze'
    }
  },
  
  // Conditional workflow pattern
  CONDITIONAL: {
    description: 'Execute different workflows based on conditions',
    example: {
      if_new_hire: 'employee.onboarding.complete',
      if_approval_needed: 'approval.smart_router.process',
      if_analysis_scheduled: 'business.intelligence.suite.analyze'
    }
  }
} as const;