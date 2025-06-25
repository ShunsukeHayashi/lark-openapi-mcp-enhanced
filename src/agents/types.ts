/**
 * Agent Communication Protocol Types
 * Based on AIstudio patterns with enhanced multi-agent capabilities
 */

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: 'request' | 'response' | 'notification' | 'broadcast';
  payload: any;
  timestamp: Date;
  correlationId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  ttl?: number; // Time to live in milliseconds
}

export interface AgentCapability {
  name: string;
  description: string;
  category: 'base' | 'im' | 'docs' | 'calendar' | 'system' | 'custom';
  inputSchema?: any;
  outputSchema?: any;
}

export interface AgentMetadata {
  id: string;
  name: string;
  type: AgentType;
  capabilities: AgentCapability[];
  status: 'idle' | 'busy' | 'offline' | 'error';
  maxConcurrentTasks: number;
  currentTasks: number;
  lastHeartbeat: Date;
  version: string;
}

export type AgentType = 
  | 'coordinator'     // Task distribution and workflow management
  | 'specialist'      // Domain-specific operations
  | 'bridge'          // Cross-domain communication
  | 'monitor'         // System monitoring and logging
  | 'recovery';       // Error handling and retry logic

export interface Task {
  id: string;
  name: string;
  description: string;
  type: 'simple' | 'complex' | 'parallel' | 'sequential';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requiredCapabilities: string[];
  dependencies?: string[];
  estimatedDuration?: number;
  context: Record<string, any>;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  assignedAgentId?: string;
  result?: any;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// AIstudio-inspired structured response format
export interface StructuredResponse {
  success: boolean;
  data?: any;
  error?: string;
  nextActions?: string[];
  dependencies?: string[];
  taskCompleted?: boolean;
  requiresUserInput?: boolean;
  agentRecommendation?: {
    suggestedAgent: string;
    reason: string;
    tools: string[];
  };
}

// Delimiter-based parsing support
export const RESPONSE_DELIMITERS = {
  STRUCTURED_START: '{{STRUCTURED_RESPONSE_START}}',
  STRUCTURED_END: '{{STRUCTURED_RESPONSE_END}}',
  TASK_ASSIGNMENT_START: '{{TASK_ASSIGNMENT_START}}',
  TASK_ASSIGNMENT_END: '{{TASK_ASSIGNMENT_END}}',
  AGENT_COORDINATION_START: '{{AGENT_COORDINATION_START}}',
  AGENT_COORDINATION_END: '{{AGENT_COORDINATION_END}}'
} as const;

export interface TaskAssignment {
  taskId: string;
  assignedAgentId: string;
  assignedAgentType: string;
  recommendedTools: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration?: number;
  dependencies?: string[];
  context: Record<string, any>;
}

export interface WorkflowState {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'paused';
  currentStep: number;
  totalSteps: number;
  tasks: TaskAssignment[];
  context: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface AgentCommunicationEvent {
  type: 'message_sent' | 'message_received' | 'task_assigned' | 'task_completed' | 'agent_registered' | 'agent_offline' | 'workflow_started' | 'workflow_completed';
  agentId: string;
  data: any;
  timestamp: Date;
}