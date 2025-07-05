/**
 * Coordinator Agent - Simplified Implementation
 * Manages task distribution and workflow coordination
 */

import { Agent, AgentConfig, AgentTool } from '../agent';
import { AgentCapability, AgentMetadata, Task, TaskAssignment } from '../types';
import { globalRegistry } from '../registry';
import { McpTool, LarkMcpToolOptions } from '../../mcp-tool/types';
import { LarkMcpTool } from '../../mcp-tool/mcp-tool';

export class CoordinatorAgent extends Agent {
  private activeTasks: Map<string, Task> = new Map();
  private workflows: Map<string, any> = new Map();
  private mcpTool?: LarkMcpTool;
  private availableMcpTools: Map<string, McpTool> = new Map();
  private toolPriorities: Map<string, number> = new Map();
  private toolExecutionHistory: Map<string, any[]> = new Map();
  private lastToolRefresh: Date = new Date();
  private toolRefreshInterval: number = 300000; // 5 minutes default
  private toolFallbackMap: Map<string, string[]> = new Map();
  private maxRetryAttempts: number = 3;
  private retryDelay: number = 1000; // 1 second base delay

  constructor(config: Partial<AgentConfig> = {}, mcpOptions?: LarkMcpToolOptions) {
    const coordinatorConfig: AgentConfig = {
      name: 'Task Coordinator',
      instructions: `
Task coordination and workflow management specialist.
Distribute tasks efficiently across available agents with MCP tool priority support.
Prioritize Lark MCP tools over Chrome MCP tools for Lark-related operations.
Monitor progress and handle task dependencies.
`,
      tools: [],
      model: 'gpt-4',
      temperature: 0.3,
      maxTokens: 2000,
      language: 'en',
      ...config,
    };

    super(coordinatorConfig);
    this.initializeMcpTools(mcpOptions);
    this.config.tools = this.createCoordinatorTools();

    // Add tools to the parent's tools map
    for (const tool of this.config.tools) {
      this.tools.set(tool.name, tool);
    }
  }

  private initializeMcpTools(mcpOptions?: LarkMcpToolOptions): void {
    if (mcpOptions) {
      this.mcpTool = new LarkMcpTool(mcpOptions);
      this.loadAvailableMcpTools();
      this.setupToolPriorities();
      this.setupToolFallbacks();
    }
  }

  private loadAvailableMcpTools(): void {
    if (!this.mcpTool) return;

    try {
      const tools = this.mcpTool.getTools();
      tools.forEach((tool: McpTool) => {
        this.availableMcpTools.set(tool.name, tool);
      });
    } catch (error) {
      console.warn('Failed to load MCP tools:', error);
    }
  }

  private setupToolPriorities(): void {
    // Priority levels: 1 = highest, 10 = lowest
    // Lark MCP tools get higher priority (1-3)
    const larkToolPriorities = {
      'lark.mcp.base': 1,
      'lark.mcp.im': 1,
      'lark.mcp.docs': 2,
      'lark.mcp.calendar': 2,
      'lark.mcp.contact': 3,
    };

    // Chrome MCP tools get lower priority (4-6)
    const chromeMcpPriorities = {
      'chrome.mcp.search': 4,
      'chrome.mcp.automation': 5,
      'chrome.mcp.general': 6,
    };

    // Apply priorities
    Object.entries(larkToolPriorities).forEach(([pattern, priority]) => {
      this.setToolPriorityByPattern(pattern, priority);
    });

    Object.entries(chromeMcpPriorities).forEach(([pattern, priority]) => {
      this.setToolPriorityByPattern(pattern, priority);
    });
  }

  private setToolPriorityByPattern(pattern: string, priority: number): void {
    this.availableMcpTools.forEach((tool, name) => {
      if (name.includes(pattern) || tool.project === pattern) {
        this.toolPriorities.set(name, priority);
      }
    });
  }

  private setupToolFallbacks(): void {
    // Define fallback chains for critical tools

    // Base/Bitable operations fallbacks
    this.toolFallbackMap.set('bitable.v1.appTableRecord.search', [
      'bitable.v1.appTableRecord.list',
      'bitable.v1.appTable.list',
    ]);

    this.toolFallbackMap.set('bitable.v1.appTableRecord.create', [
      'bitable.v1.appTableRecord.batchCreate',
      'base.v2.record.create',
    ]);

    // IM/Message operations fallbacks
    this.toolFallbackMap.set('im.v1.message.create', ['im.v1.message.reply', 'im.v2.message.create']);

    // Document operations fallbacks
    this.toolFallbackMap.set('docx.v1.document.create', ['docs.v1.create', 'wiki.v2.space.node.create']);

    // Calendar operations fallbacks
    this.toolFallbackMap.set('calendar.v4.calendar.event.create', [
      'calendar.v4.calendar.event.patch',
      'event.v1.create',
    ]);

    // Apply fallbacks for Chrome MCP tools to Lark MCP alternatives
    this.toolFallbackMap.set('chrome.mcp.search', ['search.v2.app.search', 'bitable.v1.appTableRecord.search']);
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
            createdAt: new Date(),
          };

          this.activeTasks.set(taskId, task);

          return {
            success: true,
            taskId,
            assignedTo: agentType,
            status: 'assigned',
            timestamp: new Date().toISOString(),
          };
        },
        schema: {
          type: 'object',
          properties: {
            taskId: { type: 'string' },
            agentType: { type: 'string' },
            context: { type: 'object' },
          },
          required: ['taskId', 'agentType'],
        },
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
              taskId,
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
              assignedAgentId: task.assignedAgentId,
            },
          };
        },
        schema: {
          type: 'object',
          properties: {
            taskId: { type: 'string' },
          },
          required: ['taskId'],
        },
      },

      {
        name: 'list_active_tasks',
        description: 'List all currently active tasks',
        execute: async () => {
          const tasks = Array.from(this.activeTasks.values()).map((task) => ({
            id: task.id,
            name: task.name,
            status: task.status,
            priority: task.priority,
            createdAt: task.createdAt,
          }));

          return {
            success: true,
            activeTasks: tasks,
            count: tasks.length,
          };
        },
        schema: {
          type: 'object',
          properties: {},
        },
      },

      {
        name: 'select_optimal_mcp_tools',
        description: 'Select optimal MCP tools based on task requirements and priority',
        execute: async (params: any) => {
          const { taskType, requirements, context } = params;

          const selectedTools = this.selectOptimalMcpTools(taskType, requirements);

          return {
            success: true,
            selectedTools: selectedTools.map((tool) => ({
              name: tool.name,
              priority: this.toolPriorities.get(tool.name) || 10,
              project: tool.project,
              description: tool.description,
            })),
            prioritization: 'Lark MCP tools prioritized over Chrome MCP tools',
          };
        },
        schema: {
          type: 'object',
          properties: {
            taskType: { type: 'string' },
            requirements: { type: 'array', items: { type: 'string' } },
            context: { type: 'object' },
          },
          required: ['taskType'],
        },
      },

      {
        name: 'execute_mcp_tool',
        description: 'Execute selected MCP tool with given parameters using real Lark client',
        execute: async (params: any) => {
          const { toolName, toolParams, priority } = params;

          return this.executeMcpToolWithPriority(toolName, toolParams, priority);
        },
        schema: {
          type: 'object',
          properties: {
            toolName: { type: 'string' },
            toolParams: { type: 'object' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          },
          required: ['toolName', 'toolParams'],
        },
      },

      {
        name: 'get_tool_priorities',
        description: 'Get current tool priority configuration',
        execute: async () => {
          const priorities = Array.from(this.toolPriorities.entries())
            .map(([tool, priority]) => ({
              tool,
              priority,
              type: tool.includes('lark') ? 'Lark MCP' : 'Chrome MCP',
            }))
            .sort((a, b) => a.priority - b.priority);

          return {
            success: true,
            toolPriorities: priorities,
            priorityLevels: {
              1: 'Highest (Lark Base, IM)',
              2: 'High (Lark Docs, Calendar)',
              3: 'Medium-High (Lark Contact)',
              4: 'Medium (Chrome Search)',
              5: 'Medium-Low (Chrome Automation)',
              6: 'Low (Chrome General)',
            },
          };
        },
        schema: {
          type: 'object',
          properties: {},
        },
      },

      {
        name: 'get_execution_metrics',
        description: 'Get tool execution performance metrics',
        execute: async () => {
          const metrics = this.getToolExecutionMetrics();

          return {
            success: true,
            metrics,
            summary: {
              totalTools: Object.keys(metrics).length,
              totalExecutions: Object.values(metrics).reduce((sum: number, m: any) => sum + m.totalExecutions, 0),
              averageSuccessRate:
                Object.values(metrics).length > 0
                  ? (
                      Object.values(metrics).reduce((sum: number, m: any) => sum + parseFloat(m.successRate), 0) /
                      Object.values(metrics).length
                    ).toFixed(2) + '%'
                  : '0%',
            },
          };
        },
        schema: {
          type: 'object',
          properties: {},
        },
      },

      {
        name: 'refresh_available_tools',
        description: 'Refresh the list of available MCP tools and update priorities',
        execute: async (params: any) => {
          const { force = false } = params;

          const result = await this.refreshAvailableTools(force);

          return {
            success: result.success,
            toolsRefreshed: result.refreshed,
            totalTools: result.totalTools,
            newTools: result.newTools,
            removedTools: result.removedTools,
            lastRefresh: this.lastToolRefresh.toISOString(),
            message: result.message,
          };
        },
        schema: {
          type: 'object',
          properties: {
            force: { type: 'boolean', description: 'Force refresh even if within refresh interval' },
          },
        },
      },

      {
        name: 'get_tool_discovery_status',
        description: 'Get current tool discovery status and configuration',
        execute: async () => {
          const now = new Date();
          const timeSinceLastRefresh = now.getTime() - this.lastToolRefresh.getTime();
          const nextRefreshIn = Math.max(0, this.toolRefreshInterval - timeSinceLastRefresh);

          return {
            success: true,
            status: {
              totalAvailableTools: this.availableMcpTools.size,
              lastRefresh: this.lastToolRefresh.toISOString(),
              nextRefreshIn: `${Math.floor(nextRefreshIn / 1000)}s`,
              refreshInterval: `${this.toolRefreshInterval / 1000}s`,
              autoRefreshEnabled: true,
              toolsByPriority: this.getToolsByPriority(),
            },
          };
        },
        schema: {
          type: 'object',
          properties: {},
        },
      },

      {
        name: 'configure_tool_refresh',
        description: 'Configure automatic tool refresh settings',
        execute: async (params: any) => {
          const { intervalMinutes, autoRefresh = true } = params;

          if (intervalMinutes && intervalMinutes > 0) {
            this.toolRefreshInterval = intervalMinutes * 60 * 1000;
          }

          return {
            success: true,
            configuration: {
              refreshInterval: `${this.toolRefreshInterval / 1000}s`,
              autoRefreshEnabled: autoRefresh,
              updatedAt: new Date().toISOString(),
            },
          };
        },
        schema: {
          type: 'object',
          properties: {
            intervalMinutes: { type: 'number', description: 'Refresh interval in minutes' },
            autoRefresh: { type: 'boolean', description: 'Enable automatic refresh' },
          },
        },
      },

      {
        name: 'configure_tool_fallbacks',
        description: 'Configure fallback tools for failed executions',
        execute: async (params: any) => {
          const { toolName, fallbackTools, maxRetries } = params;

          if (toolName && fallbackTools) {
            this.toolFallbackMap.set(toolName, fallbackTools);
          }

          if (maxRetries && maxRetries > 0) {
            this.maxRetryAttempts = maxRetries;
          }

          return {
            success: true,
            configuration: {
              toolName,
              fallbackTools: this.toolFallbackMap.get(toolName) || [],
              maxRetryAttempts: this.maxRetryAttempts,
              totalFallbackMappings: this.toolFallbackMap.size,
            },
          };
        },
        schema: {
          type: 'object',
          properties: {
            toolName: { type: 'string', description: 'Tool name to configure fallbacks for' },
            fallbackTools: { type: 'array', items: { type: 'string' }, description: 'Array of fallback tool names' },
            maxRetries: { type: 'number', description: 'Maximum retry attempts' },
          },
        },
      },

      {
        name: 'get_tool_fallback_chains',
        description: 'Get configured fallback chains for all tools',
        execute: async () => {
          const fallbackChains: Record<string, any> = {};

          this.toolFallbackMap.forEach((fallbacks, toolName) => {
            fallbackChains[toolName] = {
              primaryTool: toolName,
              fallbackTools: fallbacks,
              totalFallbacks: fallbacks.length,
              primaryPriority: this.toolPriorities.get(toolName) || 10,
            };
          });

          return {
            success: true,
            fallbackChains,
            maxRetryAttempts: this.maxRetryAttempts,
            retryDelay: `${this.retryDelay}ms`,
            totalMappings: this.toolFallbackMap.size,
          };
        },
        schema: {
          type: 'object',
          properties: {},
        },
      },

      {
        name: 'execute_with_fallback',
        description: 'Execute MCP tool with automatic fallback on failure',
        execute: async (params: any) => {
          const { toolName, toolParams, useFallbacks = true } = params;

          return this.executeMcpToolWithFallback(toolName, toolParams, useFallbacks);
        },
        schema: {
          type: 'object',
          properties: {
            toolName: { type: 'string' },
            toolParams: { type: 'object' },
            useFallbacks: { type: 'boolean', description: 'Enable fallback mechanism' },
          },
          required: ['toolName', 'toolParams'],
        },
      },
    ];
  }

  /**
   * Enhanced task assignment logic with MCP tool prioritization
   */
  async assignTask(taskDescription: string, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<string> {
    // Check and refresh tools if needed
    await this.checkAndRefreshToolsIfNeeded();

    const taskId = `task_${Date.now()}`;
    const agentType = this.determineAgentType(taskDescription);
    const optimalTools = this.selectOptimalMcpTools(this.extractTaskType(taskDescription), [taskDescription]);

    const tool = this.tools.get('assign_task');
    await tool?.execute({
      taskId,
      agentType,
      context: {
        description: taskDescription,
        priority,
        recommendedMcpTools: optimalTools.map((t) => t.name),
        toolPriorities: optimalTools.map((t) => ({
          name: t.name,
          priority: this.toolPriorities.get(t.name) || 10,
        })),
      },
    });

    return taskId;
  }

  /**
   * Select optimal MCP tools based on task requirements with priority consideration
   */
  private selectOptimalMcpTools(taskType: string, requirements: string[]): McpTool[] {
    if (!this.availableMcpTools.size) return [];

    const relevantTools: Array<{ tool: McpTool; score: number; priority: number }> = [];

    // Analyze task requirements and match with available tools
    this.availableMcpTools.forEach((tool, name) => {
      const relevanceScore = this.calculateRelevanceScore(tool, taskType, requirements);
      const priority = this.toolPriorities.get(name) || 10;

      if (relevanceScore > 0) {
        relevantTools.push({ tool, score: relevanceScore, priority });
      }
    });

    // Sort by priority first (lower number = higher priority), then by relevance score
    relevantTools.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority; // Higher priority first
      }
      return b.score - a.score; // Higher score first
    });

    // Return top 5 tools
    return relevantTools.slice(0, 5).map((item) => item.tool);
  }

  private calculateRelevanceScore(tool: McpTool, taskType: string, requirements: string[]): number {
    let score = 0;
    const description = tool.description.toLowerCase();
    const toolName = tool.name.toLowerCase();
    const taskTypeLower = taskType.toLowerCase();

    // Base score based on project type
    if (tool.project.includes('base') && (taskTypeLower.includes('table') || taskTypeLower.includes('record'))) {
      score += 10;
    }
    if (tool.project.includes('im') && (taskTypeLower.includes('message') || taskTypeLower.includes('chat'))) {
      score += 10;
    }
    if (tool.project.includes('docs') && (taskTypeLower.includes('document') || taskTypeLower.includes('file'))) {
      score += 10;
    }
    if (tool.project.includes('calendar') && (taskTypeLower.includes('calendar') || taskTypeLower.includes('event'))) {
      score += 10;
    }

    // Additional score based on requirement matching
    requirements.forEach((req) => {
      const reqLower = req.toLowerCase();
      if (description.includes(reqLower) || toolName.includes(reqLower)) {
        score += 5;
      }
    });

    // Bonus for Lark tools
    if (tool.project.startsWith('lark') || toolName.includes('lark')) {
      score += 3;
    }

    return score;
  }

  private extractTaskType(description: string): string {
    const lower = description.toLowerCase();

    if (lower.includes('base') || lower.includes('table') || lower.includes('record')) {
      return 'base_operation';
    }
    if (lower.includes('message') || lower.includes('chat') || lower.includes('im')) {
      return 'messaging';
    }
    if (lower.includes('document') || lower.includes('doc') || lower.includes('file')) {
      return 'document_operation';
    }
    if (lower.includes('calendar') || lower.includes('event') || lower.includes('meeting')) {
      return 'calendar_operation';
    }

    return 'general';
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

  /**
   * Execute MCP tool with priority consideration
   */
  private async executeMcpToolWithPriority(toolName: string, toolParams: any, priority?: string): Promise<any> {
    if (!this.mcpTool) {
      return {
        success: false,
        error: 'MCP tool not initialized',
      };
    }

    // Find the tool in available tools
    const tool = this.availableMcpTools.get(toolName);
    if (!tool) {
      return {
        success: false,
        error: `Tool ${toolName} not found in available tools`,
        toolName,
      };
    }

    const toolPriority = this.toolPriorities.get(toolName) || 10;
    const startTime = Date.now();

    try {
      // Get Lark client from MCP tool (assuming it has a getter method)
      const larkClient = (this.mcpTool as any).client;

      if (!larkClient) {
        throw new Error('Lark client not available');
      }

      // Execute the tool's custom handler or default handler
      let result;
      if (tool.customHandler) {
        result = await tool.customHandler(larkClient, toolParams, {
          userAccessToken: (this.mcpTool as any).userAccessToken,
          tool,
        });
      } else {
        // Use the SDK name to call the appropriate method
        if (tool.sdkName) {
          result = await this.callLarkSdkMethod(larkClient, tool.sdkName, toolParams);
        } else {
          throw new Error('No handler available for tool');
        }
      }

      const executionTime = Date.now() - startTime;

      // Record execution history
      const historyEntry = {
        toolName,
        priority: toolPriority,
        executionTime,
        timestamp: new Date().toISOString(),
        success: true,
        params: toolParams,
      };

      if (!this.toolExecutionHistory.has(toolName)) {
        this.toolExecutionHistory.set(toolName, []);
      }
      this.toolExecutionHistory.get(toolName)?.push(historyEntry);

      return {
        success: true,
        toolName,
        priority: toolPriority,
        executionTime: `${executionTime}ms`,
        result: result?.data || result,
        toolDescription: tool.description,
        executedAt: new Date().toISOString(),
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Record failed execution
      const historyEntry = {
        toolName,
        priority: toolPriority,
        executionTime,
        timestamp: new Date().toISOString(),
        success: false,
        error: String(error),
        params: toolParams,
      };

      if (!this.toolExecutionHistory.has(toolName)) {
        this.toolExecutionHistory.set(toolName, []);
      }
      this.toolExecutionHistory.get(toolName)?.push(historyEntry);

      return {
        success: false,
        error: `Failed to execute tool ${toolName}: ${error}`,
        toolName,
        priority: toolPriority,
        executionTime: `${executionTime}ms`,
      };
    }
  }

  /**
   * Call Lark SDK method dynamically
   */
  private async callLarkSdkMethod(client: any, sdkName: string, params: any): Promise<any> {
    const chain = sdkName.split('.');
    let func: any = client;

    for (const element of chain) {
      func = func[element];
      if (!func) {
        throw new Error(`SDK method ${sdkName} not found`);
      }
    }

    if (typeof func !== 'function') {
      throw new Error(`${sdkName} is not a function`);
    }

    return await func(params);
  }

  /**
   * Get tool execution metrics
   */
  public getToolExecutionMetrics(): any {
    const metrics: any = {};

    this.toolExecutionHistory.forEach((history, toolName) => {
      const successfulExecutions = history.filter((h) => h.success);
      const failedExecutions = history.filter((h) => !h.success);
      const avgExecutionTime = history.reduce((sum, h) => sum + h.executionTime, 0) / history.length;

      metrics[toolName] = {
        totalExecutions: history.length,
        successCount: successfulExecutions.length,
        failureCount: failedExecutions.length,
        successRate: ((successfulExecutions.length / history.length) * 100).toFixed(2) + '%',
        avgExecutionTime: avgExecutionTime.toFixed(2) + 'ms',
        priority: this.toolPriorities.get(toolName) || 10,
        lastExecution: history[history.length - 1]?.timestamp,
      };
    });

    return metrics;
  }

  /**
   * Refresh available MCP tools
   */
  private async refreshAvailableTools(force: boolean = false): Promise<{
    success: boolean;
    refreshed: boolean;
    totalTools: number;
    newTools: string[];
    removedTools: string[];
    message: string;
  }> {
    const now = new Date();
    const timeSinceLastRefresh = now.getTime() - this.lastToolRefresh.getTime();

    // Check if refresh is needed
    if (!force && timeSinceLastRefresh < this.toolRefreshInterval) {
      return {
        success: true,
        refreshed: false,
        totalTools: this.availableMcpTools.size,
        newTools: [],
        removedTools: [],
        message: `Tools were recently refreshed ${Math.floor(timeSinceLastRefresh / 1000)}s ago. Use force=true to refresh anyway.`,
      };
    }

    if (!this.mcpTool) {
      return {
        success: false,
        refreshed: false,
        totalTools: 0,
        newTools: [],
        removedTools: [],
        message: 'MCP tool not initialized',
      };
    }

    try {
      // Get current tool names
      const oldToolNames = new Set(this.availableMcpTools.keys());

      // Clear and reload tools
      this.availableMcpTools.clear();
      this.loadAvailableMcpTools();

      // Get new tool names
      const newToolNames = new Set(this.availableMcpTools.keys());

      // Calculate differences
      const newTools: string[] = [];
      const removedTools: string[] = [];

      newToolNames.forEach((name) => {
        if (!oldToolNames.has(name)) {
          newTools.push(name);
        }
      });

      oldToolNames.forEach((name) => {
        if (!newToolNames.has(name)) {
          removedTools.push(name);
        }
      });

      // Re-apply priorities for all tools
      this.setupToolPriorities();

      // Update last refresh time
      this.lastToolRefresh = now;

      return {
        success: true,
        refreshed: true,
        totalTools: this.availableMcpTools.size,
        newTools,
        removedTools,
        message: `Successfully refreshed tools. Found ${newTools.length} new tools and removed ${removedTools.length} tools.`,
      };
    } catch (error) {
      return {
        success: false,
        refreshed: false,
        totalTools: this.availableMcpTools.size,
        newTools: [],
        removedTools: [],
        message: `Failed to refresh tools: ${error}`,
      };
    }
  }

  /**
   * Get tools organized by priority
   */
  private getToolsByPriority(): Record<number, string[]> {
    const toolsByPriority: Record<number, string[]> = {};

    this.toolPriorities.forEach((priority, toolName) => {
      if (!toolsByPriority[priority]) {
        toolsByPriority[priority] = [];
      }
      toolsByPriority[priority].push(toolName);
    });

    return toolsByPriority;
  }

  /**
   * Check if tools need refresh and refresh if necessary
   */
  private async checkAndRefreshToolsIfNeeded(): Promise<void> {
    const now = new Date();
    const timeSinceLastRefresh = now.getTime() - this.lastToolRefresh.getTime();

    if (timeSinceLastRefresh >= this.toolRefreshInterval) {
      await this.refreshAvailableTools(false);
    }
  }

  /**
   * Execute MCP tool with fallback mechanism
   */
  private async executeMcpToolWithFallback(
    toolName: string,
    toolParams: any,
    useFallbacks: boolean = true,
  ): Promise<any> {
    const attemptedTools: string[] = [toolName];
    let lastError: any = null;

    // Try primary tool with retries
    for (let attempt = 1; attempt <= this.maxRetryAttempts; attempt++) {
      const result = await this.executeMcpToolWithPriority(toolName, toolParams);

      if (result.success) {
        return {
          ...result,
          attemptedTools,
          retriesUsed: attempt - 1,
          fallbackUsed: false,
        };
      }

      lastError = result.error;

      // Wait before retry (exponential backoff)
      if (attempt < this.maxRetryAttempts) {
        await this.delay(this.retryDelay * Math.pow(2, attempt - 1));
      }
    }

    // If primary tool failed and fallbacks are enabled
    if (!useFallbacks) {
      return {
        success: false,
        error: lastError,
        toolName,
        attemptedTools,
        retriesUsed: this.maxRetryAttempts,
        fallbackUsed: false,
      };
    }

    // Try fallback tools
    const fallbackTools = this.toolFallbackMap.get(toolName) || [];

    for (const fallbackTool of fallbackTools) {
      // Check if fallback tool is available
      if (!this.availableMcpTools.has(fallbackTool)) {
        continue;
      }

      attemptedTools.push(fallbackTool);

      // Try fallback tool with single retry
      for (let attempt = 1; attempt <= 2; attempt++) {
        const result = await this.executeMcpToolWithPriority(fallbackTool, toolParams);

        if (result.success) {
          return {
            ...result,
            originalTool: toolName,
            fallbackTool: fallbackTool,
            attemptedTools,
            fallbackUsed: true,
            message: `Successfully executed using fallback tool: ${fallbackTool}`,
          };
        }

        lastError = result.error;

        if (attempt < 2) {
          await this.delay(this.retryDelay);
        }
      }
    }

    // All attempts failed
    return {
      success: false,
      error: `All execution attempts failed. Last error: ${lastError}`,
      originalTool: toolName,
      attemptedTools,
      fallbacksAvailable: fallbackTools.length,
      fallbackUsed: true,
    };
  }

  /**
   * Delay helper for retry mechanism
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get tool reliability metrics
   */
  public getToolReliabilityMetrics(): any {
    const metrics: any = {};

    this.toolExecutionHistory.forEach((history, toolName) => {
      const totalExecutions = history.length;
      const successfulExecutions = history.filter((h) => h.success).length;
      const failedExecutions = history.filter((h) => !h.success).length;

      // Calculate reliability score (success rate with recent bias)
      const recentHistory = history.slice(-10); // Last 10 executions
      const recentSuccessRate = recentHistory.filter((h) => h.success).length / recentHistory.length;
      const overallSuccessRate = successfulExecutions / totalExecutions;
      const reliabilityScore = (recentSuccessRate * 0.7 + overallSuccessRate * 0.3) * 100;

      metrics[toolName] = {
        totalExecutions,
        successCount: successfulExecutions,
        failureCount: failedExecutions,
        reliabilityScore: reliabilityScore.toFixed(2) + '%',
        fallbackTools: this.toolFallbackMap.get(toolName) || [],
        hasFallbacks: this.toolFallbackMap.has(toolName),
      };
    });

    return metrics;
  }
}

/**
 * Create and register Coordinator Agent with MCP support
 */
export async function createCoordinator(mcpOptions?: LarkMcpToolOptions): Promise<string> {
  const capabilities: AgentCapability[] = [
    {
      name: 'task_coordination',
      description: 'Coordinate tasks across multiple agents with MCP tool priority support',
      category: 'system',
    },
    {
      name: 'workflow_management',
      description: 'Manage complex workflows and dependencies',
      category: 'system',
    },
    {
      name: 'mcp_tool_selection',
      description: 'Select optimal MCP tools based on priority (Lark > Chrome)',
      category: 'system',
    },
    {
      name: 'priority_management',
      description: 'Manage tool priorities and execution order',
      category: 'system',
    },
  ];

  const metadata: AgentMetadata = {
    id: `coordinator_${Date.now()}`,
    name: 'Task Coordinator with MCP Priority',
    type: 'coordinator',
    capabilities,
    status: 'idle',
    maxConcurrentTasks: 10,
    currentTasks: 0,
    lastHeartbeat: new Date(),
    version: '2.0.0',
  };

  const registered = await globalRegistry.registerAgent(metadata);
  if (registered) {
    console.log('✅ Enhanced Coordinator Agent with MCP priority support registered successfully');
    return metadata.id;
  } else {
    throw new Error('Failed to register Enhanced Coordinator Agent');
  }
}

/**
 * Create Coordinator Agent instance with MCP configuration
 */
export function createCoordinatorInstance(mcpOptions?: LarkMcpToolOptions): CoordinatorAgent {
  return new CoordinatorAgent(
    {
      name: 'Enhanced Task Coordinator',
      instructions: `
Enhanced task coordination with MCP tool priority management.
- Prioritize Lark MCP tools over Chrome MCP tools for Lark-related operations
- Use intelligent tool selection based on task requirements and priorities
- Manage complex workflows with optimal tool assignment
- Monitor and optimize task execution efficiency
`,
      model: 'gpt-4',
      temperature: 0.2,
      maxTokens: 4000,
      language: 'en',
    },
    mcpOptions,
  );
}
