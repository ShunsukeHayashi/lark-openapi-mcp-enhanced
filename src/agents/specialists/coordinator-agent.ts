/**
 * Coordinator Agent - Simplified Implementation
 * Manages task distribution and workflow coordination
 */

import { Agent, AgentConfig, AgentTool } from '../agent';
import { AgentCapability, AgentMetadata, Task, TaskAssignment } from '../types';
import { globalRegistry } from '../registry';
import { McpTool, LarkMcpToolOptions } from '../../mcp-tool/types';
import { LarkMcpTool } from '../../mcp-tool/mcp-tool';
import { ConfigManager, toolPriorityConfig } from '../config/config-manager';
import { ToolSelectionModel, TaskFeatures, ToolPerformanceData } from '../ml/tool-selection-model';
import { CircuitBreakerManager, CircuitState } from '../ml/circuit-breaker';
import { RecommendationEngine, RecommendationContext } from '../ml/recommendation-engine';
import { TaskQueue, QueuedTask, QueueStats, PriorityQueueManager } from '../queue/task-queue';
import { PerformanceMonitor } from '../monitoring/performance-monitor';
import { DashboardServer } from '../monitoring/dashboard-server';
import { AdaptiveLoadBalancer, LoadBalancerConfig } from '../load-balancing/adaptive-balancer';

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
  private configManager: ConfigManager = toolPriorityConfig;
  private configAutoReload: boolean = true;
  private mlModel: ToolSelectionModel = new ToolSelectionModel();
  private useMLSelection: boolean = true;
  private circuitBreakerManager: CircuitBreakerManager = new CircuitBreakerManager();
  private recommendationEngine: RecommendationEngine = new RecommendationEngine();
  private recentTasks: string[] = [];
  private taskQueue: TaskQueue;
  private queueManager: PriorityQueueManager = new PriorityQueueManager();
  private performanceMonitor: PerformanceMonitor;
  private dashboardServer?: DashboardServer;
  private monitoringEnabled: boolean = true;
  private loadBalancer: AdaptiveLoadBalancer;

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
    
    // Set up default priorities and fallbacks first
    this.setupToolPriorities();
    this.setupToolFallbacks();
    
    // Initialize task queue
    this.taskQueue = new TaskQueue({
      maxRetries: 3,
      retryDelay: 5000,
      maxConcurrency: 10,
      enablePersistence: false,
      backendType: 'memory',
    });
    
    // Set up task queue event handlers
    this.setupTaskQueueHandlers();
    
    // Initialize performance monitoring
    this.performanceMonitor = new PerformanceMonitor({
      refreshInterval: 1000,
      retentionPeriod: 3600000, // 1 hour
      aggregationInterval: 60000, // 1 minute
    });
    
    // Set up monitoring event handlers
    this.setupMonitoringHandlers();
    
    // Initialize load balancer
    this.loadBalancer = new AdaptiveLoadBalancer(this.performanceMonitor, {
      algorithm: 'adaptive',
      adaptiveThreshold: 0.8,
      maxTasksPerAgent: 10,
      rebalanceInterval: 30000,
      enableAutoScaling: true,
    });
    
    // Set up load balancer event handlers
    this.setupLoadBalancerHandlers();
    
    // Initialize MCP tools asynchronously
    if (mcpOptions) {
      this.mcpTool = new LarkMcpTool(mcpOptions);
      this.loadAvailableMcpTools();
      
      // Load configuration asynchronously
      this.loadConfigurationFromFile().catch((error) => {
        if (process.env.NODE_ENV !== 'test') {
          console.warn('Failed to load configuration:', error);
        }
      });
      
      // Watch for configuration changes
      if (this.configAutoReload && process.env.NODE_ENV !== 'test') {
        this.configManager.watchConfig(async (config) => {
          await this.applyConfiguration(config);
        });
      }
    }
    
    this.config.tools = this.createCoordinatorTools();

    // Add tools to the parent's tools map
    for (const tool of this.config.tools) {
      this.tools.set(tool.name, tool);
    }
    
    // Start task queue processing
    this.taskQueue.start();
  }

  // Remove the duplicate initializeMcpTools method since we moved the logic to constructor

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
    
    // Only set up default fallbacks if the map is empty
    if (this.toolFallbackMap.size === 0) {
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

      {
        name: 'reload_configuration',
        description: 'Reload tool priorities and fallbacks from configuration file',
        execute: async () => {
          try {
            await this.loadConfigurationFromFile();
            return {
              success: true,
              message: 'Configuration reloaded successfully',
              priorities: this.toolPriorities.size,
              fallbacks: this.toolFallbackMap.size,
              retryPolicy: {
                maxAttempts: this.maxRetryAttempts,
                baseDelay: this.retryDelay,
              },
            };
          } catch (error) {
            return {
              success: false,
              error: `Failed to reload configuration: ${error}`,
            };
          }
        },
        schema: {
          type: 'object',
          properties: {},
        },
      },

      {
        name: 'update_tool_priority',
        description: 'Update priority for a specific tool pattern',
        execute: async (params: any) => {
          const { pattern, priority, group = 'customTools' } = params;

          try {
            await this.configManager.updateToolPriority(pattern, priority, group);
            await this.loadConfigurationFromFile();

            return {
              success: true,
              pattern,
              priority,
              group,
              message: 'Tool priority updated and configuration reloaded',
            };
          } catch (error) {
            return {
              success: false,
              error: `Failed to update tool priority: ${error}`,
            };
          }
        },
        schema: {
          type: 'object',
          properties: {
            pattern: { type: 'string', description: 'Tool name pattern' },
            priority: { type: 'number', minimum: 1, maximum: 10, description: 'Priority level (1=highest)' },
            group: { type: 'string', description: 'Priority group name' },
          },
          required: ['pattern', 'priority'],
        },
      },

      {
        name: 'add_tool_fallback',
        description: 'Add or update fallback tools for a primary tool',
        execute: async (params: any) => {
          const { primaryTool, fallbackTools, description } = params;

          try {
            await this.configManager.addFallbackMapping(primaryTool, fallbackTools, description);
            await this.loadConfigurationFromFile();

            return {
              success: true,
              primaryTool,
              fallbackTools,
              description,
              message: 'Fallback mapping added and configuration reloaded',
            };
          } catch (error) {
            return {
              success: false,
              error: `Failed to add fallback mapping: ${error}`,
            };
          }
        },
        schema: {
          type: 'object',
          properties: {
            primaryTool: { type: 'string', description: 'Primary tool name' },
            fallbackTools: { type: 'array', items: { type: 'string' }, description: 'List of fallback tools' },
            description: { type: 'string', description: 'Mapping description' },
          },
          required: ['primaryTool', 'fallbackTools'],
        },
      },

      {
        name: 'toggle_config_auto_reload',
        description: 'Enable or disable automatic configuration reloading',
        execute: async (params: any) => {
          const { enabled } = params;

          this.configAutoReload = enabled;

          if (enabled) {
            this.configManager.watchConfig(async (config) => {
              await this.applyConfiguration(config);
            });
          } else {
            this.configManager.stopWatching();
          }

          return {
            success: true,
            autoReloadEnabled: this.configAutoReload,
            message: `Configuration auto-reload ${enabled ? 'enabled' : 'disabled'}`,
          };
        },
        schema: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', description: 'Enable auto-reload' },
          },
          required: ['enabled'],
        },
      },

      {
        name: 'toggle_ml_selection',
        description: 'Enable or disable ML-based tool selection',
        execute: async (params: any) => {
          const { enabled } = params;

          this.useMLSelection = enabled;

          return {
            success: true,
            mlEnabled: this.useMLSelection,
            message: `ML-based tool selection ${enabled ? 'enabled' : 'disabled'}`,
          };
        },
        schema: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', description: 'Enable ML selection' },
          },
          required: ['enabled'],
        },
      },

      {
        name: 'get_ml_model_metrics',
        description: 'Get ML model training metrics and statistics',
        execute: async () => {
          const metrics = this.getMLModelMetrics();
          const performanceByTool: any = {};

          // Calculate performance by tool
          this.toolExecutionHistory.forEach((history, toolName) => {
            const recentHistory = history.slice(-20);
            const successCount = recentHistory.filter(h => h.success).length;
            const avgTime = recentHistory.reduce((sum, h) => sum + h.executionTime, 0) / recentHistory.length;
            
            performanceByTool[toolName] = {
              recentSuccessRate: (successCount / recentHistory.length * 100).toFixed(1) + '%',
              avgExecutionTime: avgTime.toFixed(0) + 'ms',
              totalExecutions: history.length,
            };
          });

          return {
            success: true,
            modelMetrics: metrics,
            performanceByTool,
            summary: {
              mlEnabled: this.useMLSelection,
              totalToolsTracked: Object.keys(performanceByTool).length,
              totalExecutions: Object.values(this.toolExecutionHistory).reduce((sum: number, h: any[]) => sum + h.length, 0),
            },
          };
        },
        schema: {
          type: 'object',
          properties: {},
        },
      },

      {
        name: 'export_ml_model',
        description: 'Export ML model state for backup or analysis',
        execute: async () => {
          const modelState = this.mlModel.exportModel();

          return {
            success: true,
            modelState,
            exportedAt: new Date().toISOString(),
            size: new Blob([modelState]).size,
          };
        },
        schema: {
          type: 'object',
          properties: {},
        },
      },

      {
        name: 'import_ml_model',
        description: 'Import ML model state from backup',
        execute: async (params: any) => {
          const { modelState } = params;

          try {
            this.mlModel.importModel(modelState);
            
            return {
              success: true,
              message: 'ML model imported successfully',
              metrics: this.getMLModelMetrics(),
            };
          } catch (error) {
            return {
              success: false,
              error: `Failed to import ML model: ${error}`,
            };
          }
        },
        schema: {
          type: 'object',
          properties: {
            modelState: { type: 'string', description: 'Exported model state JSON' },
          },
          required: ['modelState'],
        },
      },

      {
        name: 'analyze_tool_selection',
        description: 'Analyze tool selection for a given task using ML',
        execute: async (params: any) => {
          const { taskDescription, showAlternatives = true } = params;

          // Extract features
          const taskType = this.extractTaskType(taskDescription);
          const requirements = [taskDescription];
          
          // Get both ML and rule-based selections for comparison
          const mlTools = this.selectOptimalMcpToolsWithML(taskType, requirements);
          const ruleTools = this.selectOptimalMcpToolsRuleBased(taskType, requirements);

          // Get detailed ML predictions
          const taskFeatures: TaskFeatures = {
            taskType,
            keywords: this.extractKeywords(requirements),
            priority: this.estimatePriority(requirements),
            estimatedComplexity: this.estimateComplexity(requirements),
            contextualFactors: new Map([
              ['time_of_day', new Date().getHours() / 24],
              ['tool_count', Array.from(this.availableMcpTools.values()).length / 100],
            ]),
          };

          const predictions = this.mlModel.predict(
            taskFeatures,
            Array.from(this.availableMcpTools.values()),
            showAlternatives ? 10 : 5
          );

          return {
            success: true,
            taskAnalysis: {
              taskType,
              keywords: taskFeatures.keywords,
              priority: taskFeatures.priority,
              complexity: taskFeatures.estimatedComplexity.toFixed(2),
            },
            mlSelection: mlTools.map(t => ({
              name: t.name,
              description: t.description,
            })),
            ruleBasedSelection: ruleTools.map(t => ({
              name: t.name,
              priority: this.toolPriorities.get(t.name) || 10,
            })),
            mlPredictions: predictions.map(p => ({
              tool: p.tool.name,
              score: p.score.toFixed(3),
              confidence: p.confidence.toFixed(3),
              reasoning: p.reasoning,
              alternatives: showAlternatives ? p.alternativeTools.map(a => ({
                tool: a.tool.name,
                score: a.score.toFixed(3),
              })) : undefined,
            })),
          };
        },
        schema: {
          type: 'object',
          properties: {
            taskDescription: { type: 'string', description: 'Task description to analyze' },
            showAlternatives: { type: 'boolean', description: 'Include alternative tool suggestions' },
          },
          required: ['taskDescription'],
        },
      },

      {
        name: 'get_circuit_breaker_status',
        description: 'Get circuit breaker status for all tools',
        execute: async () => {
          const summary = this.circuitBreakerManager.getSummary();
          
          return {
            success: true,
            circuitBreakers: summary.map(item => ({
              tool: item.tool,
              state: item.state,
              stats: {
                totalCalls: item.stats.totalCalls,
                failedCalls: item.stats.failedCalls,
                successRate: ((item.stats.successfulCalls / Math.max(1, item.stats.totalCalls)) * 100).toFixed(1) + '%',
                averageResponseTime: item.stats.averageResponseTime.toFixed(0) + 'ms',
                errorRate: (item.stats.errorRate * 100).toFixed(1) + '%',
                slowCallRate: (item.stats.slowCallRate * 100).toFixed(1) + '%',
              },
              timeUntilRetry: item.timeUntilRetry ? `${Math.ceil(item.timeUntilRetry / 1000)}s` : null,
            })),
            summary: {
              total: summary.length,
              open: summary.filter(s => s.state === CircuitState.OPEN).length,
              closed: summary.filter(s => s.state === CircuitState.CLOSED).length,
              halfOpen: summary.filter(s => s.state === CircuitState.HALF_OPEN).length,
            },
          };
        },
        schema: {
          type: 'object',
          properties: {},
        },
      },

      {
        name: 'reset_circuit_breaker',
        description: 'Reset circuit breaker for a specific tool or all tools',
        execute: async (params: any) => {
          const { toolName, resetAll = false } = params;

          if (resetAll) {
            this.circuitBreakerManager.resetAll();
            return {
              success: true,
              message: 'All circuit breakers have been reset',
              resetCount: this.circuitBreakerManager.getAllBreakers().size,
            };
          }

          if (toolName) {
            this.circuitBreakerManager.reset(toolName);
            return {
              success: true,
              message: `Circuit breaker for ${toolName} has been reset`,
              toolName,
            };
          }

          return {
            success: false,
            error: 'Either toolName or resetAll must be specified',
          };
        },
        schema: {
          type: 'object',
          properties: {
            toolName: { type: 'string', description: 'Tool name to reset circuit breaker for' },
            resetAll: { type: 'boolean', description: 'Reset all circuit breakers' },
          },
        },
      },

      {
        name: 'configure_circuit_breaker',
        description: 'Configure circuit breaker settings for a tool',
        execute: async (params: any) => {
          const { 
            toolName, 
            failureThreshold, 
            timeout, 
            errorRate,
            slowCallDuration,
            slowCallRateThreshold 
          } = params;

          if (!toolName) {
            return {
              success: false,
              error: 'Tool name is required',
            };
          }

          const config: any = {};
          if (failureThreshold !== undefined) config.failureThreshold = failureThreshold;
          if (timeout !== undefined) config.timeout = timeout;
          if (errorRate !== undefined) config.errorRate = errorRate;
          if (slowCallDuration !== undefined) config.slowCallDuration = slowCallDuration;
          if (slowCallRateThreshold !== undefined) config.slowCallRateThreshold = slowCallRateThreshold;

          // Get or create breaker with new config
          const breaker = this.circuitBreakerManager.getBreaker(toolName, config);

          return {
            success: true,
            message: `Circuit breaker configured for ${toolName}`,
            toolName,
            configuration: config,
            currentState: breaker.getState(),
          };
        },
        schema: {
          type: 'object',
          properties: {
            toolName: { type: 'string', description: 'Tool name to configure' },
            failureThreshold: { type: 'number', description: 'Number of failures before opening circuit' },
            timeout: { type: 'number', description: 'Time in ms before attempting recovery' },
            errorRate: { type: 'number', minimum: 0, maximum: 1, description: 'Error rate threshold (0-1)' },
            slowCallDuration: { type: 'number', description: 'Duration in ms to consider a call slow' },
            slowCallRateThreshold: { type: 'number', minimum: 0, maximum: 1, description: 'Slow call rate threshold (0-1)' },
          },
          required: ['toolName'],
        },
      },

      {
        name: 'force_circuit_breaker_state',
        description: 'Force a circuit breaker to open or closed state',
        execute: async (params: any) => {
          const { toolName, state } = params;

          const breaker = this.circuitBreakerManager.getBreaker(toolName);
          
          if (state === 'open') {
            breaker.forceOpen();
          } else if (state === 'closed') {
            breaker.forceClose();
          } else {
            return {
              success: false,
              error: 'State must be either "open" or "closed"',
            };
          }

          return {
            success: true,
            message: `Circuit breaker for ${toolName} forced to ${state} state`,
            toolName,
            newState: breaker.getState(),
            stats: breaker.getStats(),
          };
        },
        schema: {
          type: 'object',
          properties: {
            toolName: { type: 'string', description: 'Tool name' },
            state: { type: 'string', enum: ['open', 'closed'], description: 'State to force' },
          },
          required: ['toolName', 'state'],
        },
      },

      {
        name: 'get_tool_recommendations',
        description: 'Get tool recommendations based on task patterns',
        execute: async (params: any) => {
          const { task, includeRecentContext = true, topK = 5 } = params;

          const context: RecommendationContext = {
            currentTask: task,
            recentTasks: includeRecentContext ? this.recentTasks.slice(-5) : [],
            taskCategory: this.extractTaskType(task),
            timeOfDay: new Date().getHours() / 24,
          };

          const recommendations = this.recommendationEngine.recommendTools(
            context,
            Array.from(this.availableMcpTools.values()),
            topK
          );

          return {
            success: true,
            task,
            recommendations: recommendations.map(rec => ({
              tool: rec.tool.name,
              confidence: rec.confidence.toFixed(3),
              reason: rec.reason,
              patterns: rec.similarPatterns.map(p => ({
                id: p.id,
                description: p.description,
                usageCount: p.usageCount,
              })),
              alternatives: rec.alternativeTools.map(alt => ({
                tool: alt.tool.name,
                confidence: alt.confidence.toFixed(3),
              })),
              usageStats: rec.usageStats,
            })),
            context: {
              recentTasks: context.recentTasks,
              taskCategory: context.taskCategory,
            },
          };
        },
        schema: {
          type: 'object',
          properties: {
            task: { type: 'string', description: 'Task description to get recommendations for' },
            includeRecentContext: { type: 'boolean', description: 'Include recent task context' },
            topK: { type: 'number', description: 'Number of recommendations to return' },
          },
          required: ['task'],
        },
      },

      {
        name: 'view_task_patterns',
        description: 'View learned task patterns',
        execute: async () => {
          const patterns = this.recommendationEngine.getAllPatterns();

          return {
            success: true,
            patterns: patterns.map(pattern => ({
              id: pattern.id,
              pattern: pattern.pattern,
              description: pattern.description,
              category: pattern.category,
              keywords: pattern.keywords,
              usageCount: pattern.usageCount,
              lastUsed: pattern.lastUsed.toISOString(),
              commonTools: pattern.commonTools.slice(0, 3).map(t => ({
                tool: t.toolName,
                frequency: (t.frequency * 100).toFixed(1) + '%',
                successRate: (t.avgSuccessRate * 100).toFixed(1) + '%',
              })),
              exampleCount: pattern.examples.length,
            })),
            summary: {
              totalPatterns: patterns.length,
              customPatterns: patterns.filter(p => p.category === 'custom').length,
              totalUsage: patterns.reduce((sum, p) => sum + p.usageCount, 0),
            },
          };
        },
        schema: {
          type: 'object',
          properties: {},
        },
      },

      {
        name: 'export_recommendation_model',
        description: 'Export recommendation patterns for backup',
        execute: async () => {
          const modelData = this.recommendationEngine.exportPatterns();

          return {
            success: true,
            modelData,
            exportedAt: new Date().toISOString(),
            size: new Blob([modelData]).size,
            patternCount: this.recommendationEngine.getAllPatterns().length,
          };
        },
        schema: {
          type: 'object',
          properties: {},
        },
      },

      {
        name: 'import_recommendation_model',
        description: 'Import recommendation patterns from backup',
        execute: async (params: any) => {
          const { modelData } = params;

          try {
            this.recommendationEngine.importPatterns(modelData);
            
            return {
              success: true,
              message: 'Recommendation patterns imported successfully',
              patternCount: this.recommendationEngine.getAllPatterns().length,
            };
          } catch (error) {
            return {
              success: false,
              error: `Failed to import patterns: ${error}`,
            };
          }
        },
        schema: {
          type: 'object',
          properties: {
            modelData: { type: 'string', description: 'Exported pattern data JSON' },
          },
          required: ['modelData'],
        },
      },

      {
        name: 'analyze_task_patterns',
        description: 'Analyze task patterns for insights',
        execute: async () => {
          const patterns = this.recommendationEngine.getAllPatterns();
          
          // Analyze tool usage across patterns
          const toolUsage = new Map<string, number>();
          const categoryStats = new Map<string, number>();
          
          patterns.forEach(pattern => {
            categoryStats.set(pattern.category, (categoryStats.get(pattern.category) || 0) + pattern.usageCount);
            
            pattern.commonTools.forEach(tool => {
              toolUsage.set(tool.toolName, (toolUsage.get(tool.toolName) || 0) + pattern.usageCount * tool.frequency);
            });
          });

          // Get top tools
          const topTools = Array.from(toolUsage.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tool, usage]) => ({ tool, usage: usage.toFixed(1) }));

          // Get category distribution
          const categoryDistribution = Array.from(categoryStats.entries())
            .map(([category, count]) => ({
              category,
              count,
              percentage: ((count / patterns.reduce((sum, p) => sum + p.usageCount, 0)) * 100).toFixed(1) + '%',
            }));

          return {
            success: true,
            insights: {
              totalPatterns: patterns.length,
              totalUsage: patterns.reduce((sum, p) => sum + p.usageCount, 0),
              averageToolsPerPattern: (patterns.reduce((sum, p) => sum + p.commonTools.length, 0) / patterns.length).toFixed(1),
              mostUsedPattern: patterns.sort((a, b) => b.usageCount - a.usageCount)[0]?.description || 'None',
              topTools,
              categoryDistribution,
              recentActivity: {
                patternsUsedToday: patterns.filter(p => 
                  new Date().getTime() - p.lastUsed.getTime() < 24 * 60 * 60 * 1000
                ).length,
                newPatternsThisWeek: patterns.filter(p => 
                  new Date().getTime() - p.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000
                ).length,
              },
            },
          };
        },
        schema: {
          type: 'object',
          properties: {},
        },
      },

      // Task Queue Management Tools
      {
        name: 'enqueue_task',
        description: 'Add a task to the distributed queue with priority and dependencies',
        execute: async (params: any) => {
          const { description, priority = 'medium', dependencies = [], metadata = {} } = params;
          
          const task: Task = {
            id: `task_${Date.now()}`,
            name: description.substring(0, 50),
            description,
            type: 'simple',
            priority,
            status: 'pending',
            requiredCapabilities: [],
            context: {
              ...metadata,
              enqueueSource: 'manual',
            },
            createdAt: new Date(),
          };
          
          await this.taskQueue.enqueue(task, { dependencies, metadata });
          
          return {
            success: true,
            taskId: task.id,
            priority,
            dependencies,
            message: `Task ${task.id} added to queue`,
          };
        },
        schema: {
          type: 'object',
          properties: {
            description: { type: 'string', description: 'Task description' },
            priority: { type: 'string', enum: ['urgent', 'high', 'medium', 'low'], description: 'Task priority' },
            dependencies: { type: 'array', items: { type: 'string' }, description: 'Task IDs this task depends on' },
            metadata: { type: 'object', description: 'Additional task metadata' },
          },
          required: ['description'],
        },
      },

      {
        name: 'get_queue_status',
        description: 'Get current queue statistics and status',
        execute: async () => {
          const stats = await this.taskQueue.getStats();
          const pendingTasks = await this.taskQueue.getPendingTasks(10);
          
          return {
            success: true,
            stats: {
              ...stats,
              queueRunning: this.taskQueue['isRunning'],
            },
            pendingTasks: pendingTasks.map(task => ({
              id: task.id,
              description: task.description,
              priority: task.priority,
              attempts: task.attempts,
              queuedAt: task.queuedAt,
              dependencies: task.dependencies,
            })),
            activeTasks: Array.from(this.activeTasks.values()).map(task => ({
              id: task.id,
              description: task.description,
              status: task.status,
              startedAt: task.startedAt,
            })),
          };
        },
        schema: {
          type: 'object',
          properties: {},
        },
      },

      {
        name: 'manage_queue',
        description: 'Start, stop, or clear the task queue',
        execute: async (params: any) => {
          const { action } = params;
          
          switch (action) {
            case 'start':
              this.taskQueue.start();
              return { success: true, message: 'Task queue started' };
            
            case 'stop':
              this.taskQueue.stop();
              return { success: true, message: 'Task queue stopped' };
            
            case 'clear':
              await this.taskQueue.clear();
              return { success: true, message: 'Task queue cleared' };
            
            default:
              return { success: false, error: `Unknown action: ${action}` };
          }
        },
        schema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['start', 'stop', 'clear'], description: 'Queue management action' },
          },
          required: ['action'],
        },
      },

      {
        name: 'update_task_priority',
        description: 'Change the priority of a queued task',
        execute: async (params: any) => {
          const { taskId, priority } = params;
          
          try {
            await this.taskQueue.updateTaskPriority(taskId, priority);
            return {
              success: true,
              taskId,
              newPriority: priority,
              message: `Task ${taskId} priority updated to ${priority}`,
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Failed to update task priority',
            };
          }
        },
        schema: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'Task ID to update' },
            priority: { type: 'string', enum: ['urgent', 'high', 'medium', 'low'], description: 'New priority' },
          },
          required: ['taskId', 'priority'],
        },
      },

      {
        name: 'remove_task_from_queue',
        description: 'Remove a specific task from the queue',
        execute: async (params: any) => {
          const { taskId } = params;
          
          try {
            await this.taskQueue.removeTask(taskId);
            return {
              success: true,
              taskId,
              message: `Task ${taskId} removed from queue`,
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Failed to remove task',
            };
          }
        },
        schema: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'Task ID to remove' },
          },
          required: ['taskId'],
        },
      },

      {
        name: 'create_named_queue',
        description: 'Create a named queue with specific configuration',
        execute: async (params: any) => {
          const { name, config = {} } = params;
          
          const queue = this.queueManager.getQueue(name, config);
          queue.start();
          
          return {
            success: true,
            queueName: name,
            config,
            message: `Named queue '${name}' created and started`,
          };
        },
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Queue name' },
            config: {
              type: 'object',
              properties: {
                maxRetries: { type: 'number' },
                retryDelay: { type: 'number' },
                maxConcurrency: { type: 'number' },
              },
            },
          },
          required: ['name'],
        },
      },

      {
        name: 'get_all_queues_status',
        description: 'Get status of all named queues',
        execute: async () => {
          const allStats = await this.queueManager.getCombinedStats();
          
          return {
            success: true,
            queues: Object.entries(allStats).map(([name, stats]) => ({
              name,
              stats,
            })),
            totalQueues: Object.keys(allStats).length,
          };
        },
        schema: {
          type: 'object',
          properties: {},
        },
      },

      // Performance Monitoring Tools
      {
        name: 'start_monitoring_dashboard',
        description: 'Start the real-time performance monitoring dashboard',
        execute: async (params: any) => {
          const { port = 3001 } = params;
          
          try {
            await this.startDashboard(port);
            return {
              success: true,
              message: `Dashboard started on port ${port}`,
              url: `http://localhost:${port}`,
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Failed to start dashboard',
            };
          }
        },
        schema: {
          type: 'object',
          properties: {
            port: { type: 'number', description: 'Port for dashboard server' },
          },
        },
      },

      {
        name: 'stop_monitoring_dashboard',
        description: 'Stop the performance monitoring dashboard',
        execute: async () => {
          try {
            await this.stopDashboard();
            return {
              success: true,
              message: 'Dashboard stopped',
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Failed to stop dashboard',
            };
          }
        },
        schema: {
          type: 'object',
          properties: {},
        },
      },

      {
        name: 'get_performance_metrics',
        description: 'Get current performance metrics',
        execute: async () => {
          const data = this.performanceMonitor.getDashboardData();
          
          return {
            success: true,
            metrics: {
              agents: data.agents.length,
              activeAgents: data.agents.filter(a => 
                new Date().getTime() - a.lastActive.getTime() < 60000
              ).length,
              tools: data.tools.length,
              system: data.system,
              activeAlerts: data.alerts.length,
              recentMetrics: data.recentMetrics.length,
            },
            topTools: data.tools
              .sort((a, b) => b.executionCount - a.executionCount)
              .slice(0, 5)
              .map(t => ({
                name: t.toolName,
                executions: t.executionCount,
                errorRate: (t.errorRate * 100).toFixed(1) + '%',
                avgTime: t.averageExecutionTime.toFixed(0) + 'ms',
              })),
            alerts: data.alerts,
          };
        },
        schema: {
          type: 'object',
          properties: {},
        },
      },

      {
        name: 'get_performance_timeseries',
        description: 'Get time series data for a specific metric',
        execute: async (params: any) => {
          const { metricType, metricName, duration = 3600000 } = params;
          
          const timeseries = this.performanceMonitor.getTimeSeries(
            metricType,
            metricName,
            duration
          );
          
          return {
            success: true,
            metricType,
            metricName,
            duration,
            dataPoints: timeseries.length,
            timeseries: timeseries.slice(-100), // Last 100 points
          };
        },
        schema: {
          type: 'object',
          properties: {
            metricType: { type: 'string', description: 'Type of metric (task, tool, agent, system)' },
            metricName: { type: 'string', description: 'Name of the metric' },
            duration: { type: 'number', description: 'Duration in milliseconds' },
          },
          required: ['metricType', 'metricName'],
        },
      },

      {
        name: 'create_performance_alert',
        description: 'Create a performance alert',
        execute: async (params: any) => {
          const { type, source, message, metadata } = params;
          
          const alertId = this.performanceMonitor.createAlert(
            type,
            source,
            message,
            metadata
          );
          
          return {
            success: true,
            alertId,
            message: 'Alert created',
          };
        },
        schema: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['warning', 'error', 'critical'], description: 'Alert type' },
            source: { type: 'string', description: 'Source of the alert' },
            message: { type: 'string', description: 'Alert message' },
            metadata: { type: 'object', description: 'Additional alert metadata' },
          },
          required: ['type', 'source', 'message'],
        },
      },

      {
        name: 'resolve_performance_alert',
        description: 'Resolve a performance alert',
        execute: async (params: any) => {
          const { alertId } = params;
          
          this.performanceMonitor.resolveAlert(alertId);
          
          return {
            success: true,
            alertId,
            message: 'Alert resolved',
          };
        },
        schema: {
          type: 'object',
          properties: {
            alertId: { type: 'string', description: 'Alert ID to resolve' },
          },
          required: ['alertId'],
        },
      },

      {
        name: 'export_performance_metrics',
        description: 'Export performance metrics data',
        execute: async () => {
          const data = this.performanceMonitor.exportMetrics();
          
          return {
            success: true,
            data,
            size: data.length,
            message: 'Metrics exported',
          };
        },
        schema: {
          type: 'object',
          properties: {},
        },
      },

      {
        name: 'toggle_monitoring',
        description: 'Enable or disable performance monitoring',
        execute: async (params: any) => {
          const { enabled } = params;
          
          this.monitoringEnabled = enabled;
          
          return {
            success: true,
            monitoringEnabled: this.monitoringEnabled,
            message: `Monitoring ${enabled ? 'enabled' : 'disabled'}`,
          };
        },
        schema: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', description: 'Enable or disable monitoring' },
          },
          required: ['enabled'],
        },
      },

      // Load Balancer Tools
      {
        name: 'get_load_balancer_metrics',
        description: 'Get current load balancer metrics',
        execute: async () => {
          const metrics = this.loadBalancer.getMetrics();
          const loads = this.loadBalancer.getAgentLoads();
          
          return {
            success: true,
            metrics,
            agentLoads: loads,
          };
        },
        schema: {
          type: 'object',
          properties: {},
        },
      },

      {
        name: 'set_load_balancing_algorithm',
        description: 'Change the load balancing algorithm',
        execute: async (params: any) => {
          const { algorithm } = params;
          
          this.loadBalancer.setAlgorithm(algorithm);
          
          return {
            success: true,
            algorithm,
            message: `Algorithm changed to ${algorithm}`,
          };
        },
        schema: {
          type: 'object',
          properties: {
            algorithm: { 
              type: 'string', 
              enum: ['round-robin', 'least-loaded', 'weighted', 'adaptive'],
              description: 'Load balancing algorithm' 
            },
          },
          required: ['algorithm'],
        },
      },

      {
        name: 'toggle_auto_scaling',
        description: 'Enable or disable auto-scaling',
        execute: async (params: any) => {
          const { enabled } = params;
          
          this.loadBalancer.setAutoScaling(enabled);
          
          return {
            success: true,
            autoScalingEnabled: enabled,
            message: `Auto-scaling ${enabled ? 'enabled' : 'disabled'}`,
          };
        },
        schema: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', description: 'Enable or disable auto-scaling' },
          },
          required: ['enabled'],
        },
      },

      {
        name: 'register_agent_with_balancer',
        description: 'Register an agent with the load balancer',
        execute: async (params: any) => {
          const { agentId } = params;
          
          // Get agent from registry - returns AgentMetadata
          const agentMetadata = globalRegistry.getAgent(agentId);
          if (!agentMetadata) {
            return {
              success: false,
              error: `Agent ${agentId} not found in registry`,
            };
          }
          
          // Create a mock agent object for the load balancer
          const agentForBalancer = {
            getId: () => agentId,
            name: agentMetadata.name,
            getCapabilities: () => agentMetadata.capabilities || [],
          };
          
          this.loadBalancer.registerAgent(agentForBalancer);
          
          return {
            success: true,
            agentId,
            message: `Agent ${agentId} registered with load balancer`,
          };
        },
        schema: {
          type: 'object',
          properties: {
            agentId: { type: 'string', description: 'Agent ID to register' },
          },
          required: ['agentId'],
        },
      },

      {
        name: 'unregister_agent_from_balancer',
        description: 'Unregister an agent from the load balancer',
        execute: async (params: any) => {
          const { agentId } = params;
          
          this.loadBalancer.unregisterAgent(agentId);
          
          return {
            success: true,
            agentId,
            message: `Agent ${agentId} unregistered from load balancer`,
          };
        },
        schema: {
          type: 'object',
          properties: {
            agentId: { type: 'string', description: 'Agent ID to unregister' },
          },
          required: ['agentId'],
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

    // Track recent tasks
    this.recentTasks.push(taskDescription);
    if (this.recentTasks.length > 10) {
      this.recentTasks.shift();
    }

    const taskId = `task_${Date.now()}`;
    const agentType = this.determineAgentType(taskDescription);
    const taskType = this.extractTaskType(taskDescription);
    
    // Get ML-based tool selection
    const optimalTools = this.selectOptimalMcpTools(taskType, [taskDescription]);
    
    // Get recommendation-based tools
    const recommendationContext: RecommendationContext = {
      currentTask: taskDescription,
      recentTasks: this.recentTasks.slice(-5),
      taskCategory: taskType,
      timeOfDay: new Date().getHours() / 24,
    };
    
    const recommendations = this.recommendationEngine.recommendTools(
      recommendationContext,
      Array.from(this.availableMcpTools.values()),
      5
    );

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
        patternRecommendations: recommendations.map(r => ({
          tool: r.tool.name,
          confidence: r.confidence,
          reason: r.reason,
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

    // Use ML model if enabled
    if (this.useMLSelection) {
      return this.selectOptimalMcpToolsWithML(taskType, requirements);
    }

    // Fallback to rule-based selection
    return this.selectOptimalMcpToolsRuleBased(taskType, requirements);
  }

  /**
   * ML-based tool selection
   */
  private selectOptimalMcpToolsWithML(taskType: string, requirements: string[]): McpTool[] {
    const availableToolsArray = Array.from(this.availableMcpTools.values());
    
    // Extract task features
    const taskFeatures: TaskFeatures = {
      taskType,
      keywords: this.extractKeywords(requirements),
      priority: this.estimatePriority(requirements),
      estimatedComplexity: this.estimateComplexity(requirements),
      contextualFactors: new Map([
        ['time_of_day', new Date().getHours() / 24],
        ['tool_count', availableToolsArray.length / 100],
      ]),
    };

    // Get ML predictions
    const predictions = this.mlModel.predict(taskFeatures, availableToolsArray, 5);
    
    // Log predictions for monitoring
    if (process.env.NODE_ENV !== 'test') {
      console.log('ML Tool Selection:', predictions.map(p => ({
        tool: p.tool.name,
        score: p.score.toFixed(3),
        confidence: p.confidence.toFixed(3),
        reasoning: p.reasoning,
      })));
    }

    // Apply priority overrides from configuration
    const toolsWithConfigPriority = predictions.map(pred => {
      const configPriority = this.toolPriorities.get(pred.tool.name) || 10;
      // Combine ML score with config priority (70% ML, 30% config)
      const combinedScore = pred.score * 0.7 + (1 - configPriority / 10) * 0.3;
      return { tool: pred.tool, score: combinedScore };
    });

    // Sort by combined score and return tools
    toolsWithConfigPriority.sort((a, b) => b.score - a.score);
    return toolsWithConfigPriority.slice(0, 5).map(item => item.tool);
  }

  /**
   * Rule-based tool selection (fallback)
   */
  private selectOptimalMcpToolsRuleBased(taskType: string, requirements: string[]): McpTool[] {
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

  /**
   * Extract keywords from requirements
   */
  private extractKeywords(requirements: string[]): string[] {
    const keywords: Set<string> = new Set();
    
    for (const req of requirements) {
      // Extract important words (simple implementation)
      const words = req.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word.length > 3 && !this.isStopWord(word)) {
          keywords.add(word);
        }
      }
    }
    
    return Array.from(keywords);
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set(['the', 'and', 'for', 'with', 'from', 'this', 'that', 'these', 'those']);
    return stopWords.has(word);
  }

  /**
   * Estimate task priority from requirements
   */
  private estimatePriority(requirements: string[]): 'low' | 'medium' | 'high' | 'urgent' {
    const text = requirements.join(' ').toLowerCase();
    
    if (text.includes('urgent') || text.includes('asap') || text.includes('immediately')) {
      return 'urgent';
    }
    if (text.includes('high priority') || text.includes('important')) {
      return 'high';
    }
    if (text.includes('low priority') || text.includes('when possible')) {
      return 'low';
    }
    
    return 'medium';
  }

  /**
   * Estimate task complexity
   */
  private estimateComplexity(requirements: string[]): number {
    // Simple heuristic based on requirement count and length
    const totalLength = requirements.reduce((sum, req) => sum + req.length, 0);
    const avgLength = totalLength / Math.max(1, requirements.length);
    
    // Normalize to 0-1 range
    return Math.min(1, (requirements.length * avgLength) / 500);
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
   * Execute MCP tool with priority consideration and circuit breaker
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
    const circuitBreaker = this.circuitBreakerManager.getBreaker(toolName);

    // Check circuit breaker state first
    const breakerState = circuitBreaker.getState();
    if (breakerState === CircuitState.OPEN) {
      const timeUntilRetry = circuitBreaker.getTimeUntilRetry();
      return {
        success: false,
        error: `Tool ${toolName} is temporarily unavailable due to repeated failures. Retry in ${Math.ceil((timeUntilRetry || 0) / 1000)}s`,
        toolName,
        circuitBreakerState: breakerState,
        timeUntilRetry,
      };
    }

    const startTime = Date.now();

    try {
      // Execute through circuit breaker
      const result = await circuitBreaker.call(async () => {
        // Get Lark client from MCP tool
        const larkClient = (this.mcpTool as any).client;

        if (!larkClient) {
          throw new Error('Lark client not available');
        }

        // Execute the tool's custom handler or default handler
        if (tool.customHandler) {
          return await tool.customHandler(larkClient, toolParams, {
            userAccessToken: (this.mcpTool as any).userAccessToken,
            tool,
          });
        } else {
          // Use the SDK name to call the appropriate method
          if (tool.sdkName) {
            return await this.callLarkSdkMethod(larkClient, tool.sdkName, toolParams);
          } else {
            throw new Error('No handler available for tool');
          }
        }
      });

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
      
      // Record performance metrics
      this.performanceMonitor.recordMetric({
        type: 'tool',
        name: toolName,
        value: executionTime,
        unit: 'ms',
        metadata: {
          success: true,
          priority: toolPriority,
        },
      });
      
      this.performanceMonitor.updateToolMetrics(toolName, {
        success: true,
        executionTime,
      });

      if (!this.toolExecutionHistory.has(toolName)) {
        this.toolExecutionHistory.set(toolName, []);
      }
      this.toolExecutionHistory.get(toolName)?.push(historyEntry);

      // Train ML model with successful execution
      this.trainMLModel(toolName, 'success', executionTime);
      
      // Train recommendation engine
      const currentTask = Array.from(this.activeTasks.values()).find(t => t.status === 'in_progress');
      if (currentTask) {
        this.recommendationEngine.learnFromExecution(
          currentTask.description,
          [toolName],
          true,
          executionTime
        );
      }

      return {
        success: true,
        toolName,
        priority: toolPriority,
        executionTime: `${executionTime}ms`,
        result: result?.data || result,
        toolDescription: tool.description,
        executedAt: new Date().toISOString(),
        circuitBreakerState: circuitBreaker.getState(),
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
      
      // Record error metrics
      this.performanceMonitor.recordMetric({
        type: 'tool',
        name: toolName,
        value: executionTime,
        unit: 'ms',
        metadata: {
          success: false,
          error: String(error),
          priority: toolPriority,
        },
      });
      
      this.performanceMonitor.updateToolMetrics(toolName, {
        success: false,
        executionTime,
        error: String(error),
      });

      if (!this.toolExecutionHistory.has(toolName)) {
        this.toolExecutionHistory.set(toolName, []);
      }
      this.toolExecutionHistory.get(toolName)?.push(historyEntry);

      // Train ML model with failed execution
      this.trainMLModel(toolName, 'failure', executionTime);
      
      // Train recommendation engine
      const currentTask = Array.from(this.activeTasks.values()).find(t => t.status === 'in_progress');
      if (currentTask) {
        this.recommendationEngine.learnFromExecution(
          currentTask.description,
          [toolName],
          false,
          executionTime
        );
      }

      return {
        success: false,
        error: `Failed to execute tool ${toolName}: ${error}`,
        toolName,
        priority: toolPriority,
        executionTime: `${executionTime}ms`,
        circuitBreakerState: circuitBreaker.getState(),
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

  /**
   * Load configuration from file
   */
  private async loadConfigurationFromFile(): Promise<void> {
    try {
      const config = await this.configManager.loadConfig();
      await this.applyConfiguration(config);
    } catch (error) {
      console.error('Failed to load configuration from file:', error);
      // Fall back to default configuration
      this.setupToolPriorities();
      this.setupToolFallbacks();
    }
  }

  /**
   * Apply configuration
   */
  private async applyConfiguration(config: any): Promise<void> {
    // Clear existing priorities and fallbacks
    this.toolPriorities.clear();
    this.toolFallbackMap.clear();

    // Apply tool priorities
    const priorities = await this.configManager.getToolPriorities();
    priorities.forEach((priority, pattern) => {
      this.setToolPriorityByPattern(pattern, priority);
    });

    // Apply fallback mappings
    const fallbacks = await this.configManager.getToolFallbacks();
    fallbacks.forEach((fallbackTools, primaryTool) => {
      this.toolFallbackMap.set(primaryTool, fallbackTools);
    });

    // Apply retry policy
    const retryPolicy = await this.configManager.getRetryPolicy();
    this.maxRetryAttempts = retryPolicy.maxAttempts;
    this.retryDelay = retryPolicy.baseDelay;

    // Only log in development mode
    if (process.env.NODE_ENV !== 'test') {
      console.log(`Configuration applied: ${this.toolPriorities.size} priorities, ${this.toolFallbackMap.size} fallbacks`);
    }
  }

  /**
   * Setup task queue event handlers
   */
  private setupTaskQueueHandlers(): void {
    this.taskQueue.on('task:enqueued', (task: QueuedTask) => {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`Task ${task.id} enqueued with priority ${task.priority}`);
      }
    });

    this.taskQueue.on('task:started', (task: QueuedTask) => {
      this.activeTasks.set(task.id, task);
    });

    this.taskQueue.on('task:completed', (task: QueuedTask) => {
      this.activeTasks.delete(task.id);
      // Learn from successful execution
      if (task.metadata?.toolsUsed) {
        this.recommendationEngine.learnFromExecution(
          task.description,
          task.metadata.toolsUsed,
          true,
          task.metadata.executionTime || 0
        );
      }
    });

    this.taskQueue.on('task:failed', (task: QueuedTask, error: string) => {
      this.activeTasks.delete(task.id);
      if (process.env.NODE_ENV !== 'test') {
        console.error(`Task ${task.id} failed: ${error}`);
      }
    });

    this.taskQueue.on('task:retrying', (task: QueuedTask, delay: number) => {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`Task ${task.id} will retry in ${delay}ms`);
      }
    });
  }

  /**
   * Setup monitoring event handlers
   */
  private setupMonitoringHandlers(): void {
    // Update system metrics periodically
    setInterval(() => {
      if (this.monitoringEnabled) {
        this.updateSystemMetrics();
      }
    }, 5000); // Every 5 seconds
  }

  /**
   * Setup load balancer event handlers
   */
  private setupLoadBalancerHandlers(): void {
    // Handle task assignment events
    this.loadBalancer.on('task:assigned', ({ taskId, agentId }) => {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`Task ${taskId} assigned to agent ${agentId}`);
      }
    });

    // Handle task queued events
    this.loadBalancer.on('task:queued', ({ taskId }) => {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`Task ${taskId} queued - no available agents`);
      }
    });

    // Handle rebalancing events
    this.loadBalancer.on('rebalance:completed', ({ tasksRebalanced }) => {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`Load rebalancing completed: ${tasksRebalanced} tasks moved`);
      }
    });

    // Handle agent registration
    this.loadBalancer.on('agent:registered', ({ agentId }) => {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`Agent ${agentId} registered with load balancer`);
      }
    });

    // Handle agent unregistration
    this.loadBalancer.on('agent:unregistered', ({ agentId }) => {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`Agent ${agentId} unregistered from load balancer`);
      }
    });

    // Handle metrics updates
    this.loadBalancer.on('metrics:updated', (metrics) => {
      // Update performance monitor with load balancer metrics
      this.performanceMonitor.recordMetric({
        type: 'system',
        name: 'load_balancer.average_load',
        value: metrics.averageLoadPerAgent,
        unit: 'tasks',
      });

      this.performanceMonitor.recordMetric({
        type: 'system',
        name: 'load_balancer.load_variance',
        value: metrics.loadVariance,
        unit: 'tasks',
      });
    });
  }

  /**
   * Update system metrics
   */
  private async updateSystemMetrics(): Promise<void> {
    const queueStats = await this.taskQueue.getStats();
    
    // Calculate average response time from recent tool executions
    const recentExecutions = Array.from(this.toolExecutionHistory.values())
      .flat()
      .filter(exec => exec.timestamp && Date.now() - exec.timestamp < 60000); // Last minute
    
    const avgResponseTime = recentExecutions.length > 0
      ? recentExecutions.reduce((sum, exec) => sum + (exec.executionTime || 0), 0) / recentExecutions.length
      : 0;

    this.performanceMonitor.updateSystemMetrics({
      totalTasks: this.activeTasks.size + queueStats.completed + queueStats.failed,
      tasksPerMinute: queueStats.throughput,
      averageResponseTime: avgResponseTime,
      systemLoad: process.cpuUsage().system / 1000000, // Convert to percentage
      queueMetrics: queueStats,
    });
  }

  /**
   * Start dashboard server
   */
  public async startDashboard(port: number = 3001): Promise<void> {
    if (!this.dashboardServer) {
      this.dashboardServer = new DashboardServer(this.performanceMonitor, {
        port,
        host: '0.0.0.0',
      });
      await this.dashboardServer.start();
    }
  }

  /**
   * Stop dashboard server
   */
  public async stopDashboard(): Promise<void> {
    if (this.dashboardServer) {
      await this.dashboardServer.stop();
      this.dashboardServer = undefined;
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.configManager.stopWatching();
    this.taskQueue.stop();
    this.performanceMonitor.stop();
    this.loadBalancer.stop();
    if (this.dashboardServer) {
      this.stopDashboard();
    }
  }

  /**
   * Train ML model with execution data
   */
  private trainMLModel(toolName: string, result: 'success' | 'failure', executionTime: number): void {
    const task = Array.from(this.activeTasks.values()).find(t => t.status === 'in_progress');
    const taskType = task ? this.extractTaskType(task.description) : 'unknown';
    
    const performanceData: ToolPerformanceData = {
      toolName,
      taskType,
      successRate: result === 'success' ? 1 : 0,
      avgExecutionTime: executionTime,
      totalExecutions: 1,
      recentFailures: result === 'failure' ? 1 : 0,
      contextFeatures: new Map([
        ['time_of_day', new Date().getHours() / 24],
        ['day_of_week', new Date().getDay() / 7],
      ]),
      timestamp: new Date(),
    };
    
    this.mlModel.train(performanceData);
  }

  /**
   * Get ML model metrics
   */
  public getMLModelMetrics(): any {
    const history = this.toolExecutionHistory;
    const modelState = this.mlModel.exportModel();
    const modelData = JSON.parse(modelState);
    
    return {
      totalTrainingSamples: modelData.performanceHistory?.length || 0,
      totalToolsTracked: modelData.performanceHistory ? Object.keys(modelData.performanceHistory).length : 0,
      featureWeights: modelData.featureWeights || {},
      taskPatterns: modelData.taskPatterns ? Object.keys(modelData.taskPatterns).length : 0,
      mlEnabled: this.useMLSelection,
    };
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
