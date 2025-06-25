/**
 * Coordinator Agent - Simplified Implementation
 * Manages task distribution and workflow coordination
 */

import { Agent, AgentConfig, AgentTool } from '../agent';
import { AgentCapability, AgentMetadata, Task, TaskAssignment } from '../types';
import { globalRegistry } from '../registry';

export class CoordinatorAgent extends Agent {
  private activeTasks: Map<string, Task> = new Map();
  private workflows: Map<string, any> = new Map();

  constructor(config: Partial<AgentConfig> = {}) {
    const coordinatorConfig: AgentConfig = {
      name: 'Task Coordinator',
      instructions: `
Task coordination and workflow management specialist.
Distribute tasks efficiently across available agents.
Monitor progress and handle task dependencies.
`,
      tools: [],
      model: 'gpt-4',
      temperature: 0.3,
      maxTokens: 2000,
      language: 'en',
      ...config
    };

    super(coordinatorConfig);
    this.config.tools = this.createCoordinatorTools();
  }

  private createCoordinatorTools(): AgentTool[] {
    return [
      {
        name: 'assign_task',
        description: 'Assign task to appropriate specialist agent',
        execute: async (params: any) => {
          const { taskId, agentType, context } = params;
          
          const task: Task = {
            id: taskId,
            name: context.name || 'Unnamed Task',
            description: context.description || '',
            type: 'simple',
            priority: context.priority || 'medium',
            requiredCapabilities: context.capabilities || [],
            context,
            status: 'assigned',
            createdAt: new Date()
          };

          this.activeTasks.set(taskId, task);

          return {
            success: true,
            taskId,
            assignedTo: agentType,
            status: 'assigned',
            timestamp: new Date().toISOString()
          };
        },
        schema: {
          type: 'object',
          properties: {
            taskId: { type: 'string' },
            agentType: { type: 'string' },
            context: { type: 'object' }
          },
          required: ['taskId', 'agentType']
        }
      },

      {
        name: 'get_task_status',
        description: 'Get current status of a task',
        execute: async (params: any) => {
          const { taskId } = params;
          const task = this.activeTasks.get(taskId);

          if (!task) {
            return {
              success: false,
              error: 'Task not found',
              taskId
            };
          }

          return {
            success: true,
            task: {
              id: task.id,
              name: task.name,
              status: task.status,
              priority: task.priority,
              createdAt: task.createdAt,
              assignedAgentId: task.assignedAgentId
            }
          };
        },
        schema: {
          type: 'object',
          properties: {
            taskId: { type: 'string' }
          },
          required: ['taskId']
        }
      },

      {
        name: 'list_active_tasks',
        description: 'List all currently active tasks',
        execute: async () => {
          const tasks = Array.from(this.activeTasks.values()).map(task => ({
            id: task.id,
            name: task.name,
            status: task.status,
            priority: task.priority,
            createdAt: task.createdAt
          }));

          return {
            success: true,
            activeTasks: tasks,
            count: tasks.length
          };
        },
        schema: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }

  /**
   * Simple task assignment logic
   */
  async assignTask(taskDescription: string, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<string> {
    const taskId = `task_${Date.now()}`;
    const agentType = this.determineAgentType(taskDescription);

    await this.executeFunction('assign_task', {
      taskId,
      agentType,
      context: {
        description: taskDescription,
        priority
      }
    });

    return taskId;
  }

  private determineAgentType(description: string): string {
    const lower = description.toLowerCase();
    
    if (lower.includes('base') || lower.includes('table') || lower.includes('record')) {
      return 'base_specialist';
    }
    if (lower.includes('message') || lower.includes('chat') || lower.includes('im')) {
      return 'messaging_specialist';
    }
    if (lower.includes('document') || lower.includes('doc') || lower.includes('wiki')) {
      return 'document_specialist';
    }
    if (lower.includes('calendar') || lower.includes('event') || lower.includes('meeting')) {
      return 'calendar_specialist';
    }
    
    return 'general_specialist';
  }
}

/**
 * Create and register Coordinator Agent
 */
export async function createCoordinator(): Promise<string> {
  const capabilities: AgentCapability[] = [
    {
      name: 'task_coordination',
      description: 'Coordinate tasks across multiple agents',
      category: 'system'
    },
    {
      name: 'workflow_management',
      description: 'Manage complex workflows and dependencies',
      category: 'system'
    }
  ];

  const metadata: AgentMetadata = {
    id: `coordinator_${Date.now()}`,
    name: 'Task Coordinator',
    type: 'coordinator',
    capabilities,
    status: 'idle',
    maxConcurrentTasks: 10,
    currentTasks: 0,
    lastHeartbeat: new Date(),
    version: '1.0.0'
  };

  const registered = await globalRegistry.registerAgent(metadata);
  if (registered) {
    console.log('✅ Coordinator Agent registered successfully');
    return metadata.id;
  } else {
    throw new Error('Failed to register Coordinator Agent');
  }
}