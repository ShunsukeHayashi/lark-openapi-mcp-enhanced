import { BuiltinToolName, BuiltinTools } from './en/builtin-tools';
import { BuiltinTools as BuiltinToolsZh } from './zh/builtin-tools';

import { ToolName as GenToolName, GenTools as GenToolsEn, ProjectName as GenProjectName } from './en/gen-tools';
import { GenTools as GenToolsZh } from './zh/gen-tools';

// Import custom workflow tools
import { 
  employeeOnboardingComplete, 
  smartApprovalRouter, 
  businessIntelligenceSuite,
  CUSTOM_WORKFLOW_TOOLS
} from './custom-workflows';

// Define custom workflow tool names
export type CustomWorkflowToolName = typeof CUSTOM_WORKFLOW_TOOLS[keyof typeof CUSTOM_WORKFLOW_TOOLS];

export type ToolName = GenToolName | BuiltinToolName | CustomWorkflowToolName;
export type ProjectName = GenProjectName | 'custom_workflows';

// Custom workflow tools array
export const CustomWorkflowTools = [
  employeeOnboardingComplete,
  smartApprovalRouter,
  businessIntelligenceSuite
];

export const AllTools = [...GenToolsEn, ...BuiltinTools, ...CustomWorkflowTools];
export const AllToolsZh = [...GenToolsZh, ...BuiltinToolsZh, ...CustomWorkflowTools];
