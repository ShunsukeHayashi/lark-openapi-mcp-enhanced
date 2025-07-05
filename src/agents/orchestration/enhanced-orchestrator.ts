/**
 * Enhanced Agent Orchestrator with Multilingual E5 Embeddings
 * Replaces the basic orchestration with AI-powered task distribution
 */

import { Agent, AgentConfig, AgentTool } from '../agent';
import { AgentCapability, AgentMetadata, Task, TaskAssignment } from '../types';
import { globalRegistry } from '../registry';
import { MultilingualE5Client } from '../embedding/multilingual-e5-client';

export interface OrchestratorConfig extends Partial<AgentConfig> {
  embeddingModel?: 'multilingual-e5-small' | 'multilingual-e5-base';
  embeddingBaseURL?: string;
  embeddingAPIKey?: string;
  maxConcurrentTasks?: number;
  taskTimeout?: number;
  retryAttempts?: number;
  preferredLanguage?: 'en' | 'zh' | 'ja';
  testMode?: boolean; // Disable background processes for testing
}

export interface TaskContext {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: Date;
  requiredCapabilities: string[];
  preferredLanguage: 'en' | 'zh' | 'ja';
  complexity: 'simple' | 'moderate' | 'complex';
  dependencies: string[];
  metadata: Record<string, any>;
}

export interface TaskResult {
  taskId: string;
  agentId: string;
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
  tokensUsed: number;
}

export class EnhancedOrchestrator extends Agent {
  private embeddingClient: MultilingualE5Client;
  private activeTasks: Map<string, Task & TaskContext> = new Map();
  private taskResults: Map<string, TaskResult> = new Map();
  private agentCapabilities: Map<string, number[]> = new Map(); // Agent embeddings
  private taskQueue: Array<Task & TaskContext> = [];
  private taskProcessorInterval?: NodeJS.Timeout;
  private performanceMonitorInterval?: NodeJS.Timeout;

  constructor(config: OrchestratorConfig = {}) {
    const orchestratorConfig: AgentConfig = {
      name: 'Enhanced Orchestrator',
      instructions: `
Advanced multi-agent orchestrator with AI-powered task distribution.
Uses multilingual E5 embeddings for intelligent agent selection and task optimization.
Supports English, Chinese, and Japanese for global operations.

Key capabilities:
- Semantic task-agent matching using embeddings
- Dynamic load balancing and optimization
- Multi-language task processing
- Intelligent retry and error recovery
- Performance monitoring and adaptation
`,
      tools: [],
      model: 'gpt-4',
      temperature: 0.2,
      maxTokens: 4000,
      language: config.preferredLanguage || 'en',
      ...config,
    };

    super(orchestratorConfig);

    // Initialize embedding client
    this.embeddingClient = new MultilingualE5Client({
      baseURL: config.embeddingBaseURL,
      apiKey: config.embeddingAPIKey,
      defaultModel: config.embeddingModel || 'multilingual-e5-small',
    });

    // Initialize orchestrator tools
    this.config.tools = this.createOrchestratorTools();
    for (const tool of this.config.tools) {
      this.tools.set(tool.name, tool);
    }

    // Start background processes (only if not in test mode)
    if (!config.testMode) {
      this.startTaskProcessor();
      this.startPerformanceMonitor();
    }
  }

  private createOrchestratorTools(): AgentTool[] {
    return [
      {
        name: 'assign_smart_task',
        description: 'Intelligently assign task to best-matched agent using embeddings',
        execute: async (params: any) => {
          const { description, context, options } = params;
          return await this.smartTaskAssignment(description, context, options);
        },
        schema: {
          type: 'object',
          properties: {
            description: { type: 'string', description: 'Task description in natural language' },
            context: { type: 'object', description: 'Task context and requirements' },
            options: { type: 'object', description: 'Execution options and preferences' },
          },
          required: ['description'],
        },
      },

      {
        name: 'analyze_task_complexity',
        description: 'Analyze task complexity and suggest optimal execution strategy',
        execute: async (params: any) => {
          const { description, requirements } = params;
          return await this.analyzeTaskComplexity(description, requirements);
        },
        schema: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            requirements: { type: 'array', items: { type: 'string' } },
          },
          required: ['description'],
        },
      },

      {
        name: 'optimize_agent_selection',
        description: 'Find optimal agent for task based on capabilities and current load',
        execute: async (params: any) => {
          const { taskEmbedding, requirements, excludeAgents } = params;
          return await this.optimizeAgentSelection(taskEmbedding, requirements, excludeAgents);
        },
        schema: {
          type: 'object',
          properties: {
            taskEmbedding: { type: 'array', items: { type: 'number' } },
            requirements: { type: 'array', items: { type: 'string' } },
            excludeAgents: { type: 'array', items: { type: 'string' } },
          },
          required: ['taskEmbedding'],
        },
      },

      {
        name: 'execute_parallel_tasks',
        description: 'Execute multiple tasks in parallel with dependency management',
        execute: async (params: any) => {
          const { tasks, maxConcurrency, timeout } = params;
          return await this.executeParallelTasks(tasks, maxConcurrency, timeout);
        },
        schema: {
          type: 'object',
          properties: {
            tasks: { type: 'array', items: { type: 'object' } },
            maxConcurrency: { type: 'number', default: 5 },
            timeout: { type: 'number', default: 300000 },
          },
          required: ['tasks'],
        },
      },

      {
        name: 'monitor_task_performance',
        description: 'Monitor and analyze task execution performance',
        execute: async (params: any) => {
          const { timeWindow, agentId, taskType } = params;
          return await this.monitorTaskPerformance(timeWindow, agentId, taskType);
        },
        schema: {
          type: 'object',
          properties: {
            timeWindow: { type: 'number', description: 'Time window in minutes' },
            agentId: { type: 'string', description: 'Specific agent to monitor' },
            taskType: { type: 'string', description: 'Type of tasks to analyze' },
          },
        },
      },

      {
        name: 'adaptive_load_balancing',
        description: 'Dynamically balance load across available agents',
        execute: async (params: any) => {
          const { strategy, targetUtilization } = params;
          return await this.adaptiveLoadBalancing(strategy, targetUtilization);
        },
        schema: {
          type: 'object',
          properties: {
            strategy: {
              type: 'string',
              enum: ['round_robin', 'least_loaded', 'capability_based', 'performance_weighted'],
              default: 'capability_based',
            },
            targetUtilization: { type: 'number', default: 0.8 },
          },
        },
      },
    ];
  }

  /**
   * Smart task assignment using embeddings and AI analysis
   */
  async smartTaskAssignment(
    description: string,
    context: Partial<TaskContext> = {},
    options: any = {},
  ): Promise<TaskResult> {
    try {
      // Generate task embedding
      const taskEmbedding = await this.embeddingClient.createEmbeddings(description, {
        model: options.embeddingModel || 'multilingual-e5-small',
      });

      // Analyze task complexity
      const complexity = await this.analyzeTaskComplexity(description, context.requiredCapabilities || []);

      // Find best agent match
      const agentMatch = await this.optimizeAgentSelection(
        taskEmbedding.embeddings[0],
        context.requiredCapabilities || [],
        options.excludeAgents || [],
      );

      if (!agentMatch.success) {
        throw new Error(`No suitable agent found: ${agentMatch.reason}`);
      }

      // Create task with full context
      const task: Task & TaskContext = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: description.slice(0, 50) + (description.length > 50 ? '...' : ''),
        description,
        type: complexity.type as any,
        priority: context.priority || 'medium',
        requiredCapabilities: context.requiredCapabilities || [],
        context: context.metadata || {},
        status: 'assigned',
        createdAt: new Date(),
        assignedAgentId: agentMatch.agentId,

        // Enhanced context
        deadline: context.deadline,
        preferredLanguage: context.preferredLanguage || 'en',
        complexity: complexity.level,
        dependencies: context.dependencies || [],
        metadata: {
          ...context.metadata,
          embeddingUsed: taskEmbedding.model,
          confidenceScore: agentMatch.confidence,
          estimatedDuration: complexity.estimatedDuration,
        },
      };

      // Add to active tasks
      this.activeTasks.set(task.id, task);

      // Execute task
      const result = await this.executeTask(task);

      return result;
    } catch (error: any) {
      console.error('Smart task assignment error:', error);
      return {
        taskId: 'error',
        agentId: 'none',
        success: false,
        error: error.message,
        duration: 0,
        tokensUsed: 0,
      };
    }
  }

  /**
   * Analyze task complexity using embeddings and NLP
   */
  async analyzeTaskComplexity(
    description: string,
    requirements: string[] = [],
  ): Promise<{
    level: 'simple' | 'moderate' | 'complex';
    type: 'simple' | 'complex' | 'parallel' | 'sequential';
    estimatedDuration: number;
    breakdown: string[];
    confidence: number;
  }> {
    try {
      // Define complexity patterns
      const complexityPatterns = {
        simple: [
          'get',
          'fetch',
          'show',
          'display',
          'list',
          'find',
          'search',
          'read',
          '単純',
          '取得',
          '表示',
          '検索',
          '読み込み',
        ],
        moderate: [
          'create',
          'update',
          'modify',
          'process',
          'analyze',
          'generate',
          'convert',
          '作成',
          '更新',
          '処理',
          '分析',
          '生成',
          '変換',
        ],
        complex: [
          'integrate',
          'orchestrate',
          'optimize',
          'coordinate',
          'automate',
          'workflow',
          '統合',
          '最適化',
          '調整',
          '自動化',
          'ワークフロー',
        ],
      };

      // Calculate embedding similarity with patterns
      const descriptionEmbedding = await this.embeddingClient.createEmbeddings(description);

      let maxComplexity = 'simple';
      let maxScore = 0;

      for (const [level, patterns] of Object.entries(complexityPatterns)) {
        const patternText = patterns.join(' ');
        const similarity = await this.embeddingClient.calculateSimilarity(description, patternText);

        if (similarity > maxScore) {
          maxScore = similarity;
          maxComplexity = level;
        }
      }

      // Analyze task type
      const hasParallelKeywords = /parallel|同時|並列|batch|bulk/.test(description.toLowerCase());
      const hasSequentialKeywords = /step|sequence|順番|workflow|then|after/.test(description.toLowerCase());

      let taskType: 'simple' | 'complex' | 'parallel' | 'sequential' = 'simple';
      if (hasParallelKeywords) taskType = 'parallel';
      else if (hasSequentialKeywords) taskType = 'sequential';
      else if (maxComplexity === 'complex') taskType = 'complex';

      // Estimate duration based on complexity and requirements
      const baseMinutes = {
        simple: 2,
        moderate: 10,
        complex: 30,
      };

      const durationModifier = 1 + requirements.length * 0.2;
      const estimatedDuration = baseMinutes[maxComplexity as keyof typeof baseMinutes] * durationModifier;

      // Break down task into components
      const breakdown = this.breakdownTask(description, taskType);

      return {
        level: maxComplexity as any,
        type: taskType,
        estimatedDuration,
        breakdown,
        confidence: maxScore,
      };
    } catch (error) {
      console.error('Task complexity analysis error:', error);
      return {
        level: 'moderate',
        type: 'simple',
        estimatedDuration: 10,
        breakdown: [description],
        confidence: 0.5,
      };
    }
  }

  /**
   * Optimize agent selection using embeddings and performance metrics
   */
  async optimizeAgentSelection(
    taskEmbedding: number[],
    requirements: string[] = [],
    excludeAgents: string[] = [],
  ): Promise<{
    success: boolean;
    agentId?: string;
    confidence?: number;
    reason?: string;
    alternatives?: Array<{ agentId: string; confidence: number }>;
  }> {
    try {
      // Get all available agents
      const availableAgents = globalRegistry.getAllAgents();
      const candidateAgents = availableAgents.filter(
        (agent: AgentMetadata) =>
          !excludeAgents.includes(agent.id) &&
          agent.status !== 'offline' &&
          agent.currentTasks < agent.maxConcurrentTasks,
      );

      if (candidateAgents.length === 0) {
        return {
          success: false,
          reason: 'No available agents found',
        };
      }

      // Generate agent capability embeddings if not cached
      for (const agent of candidateAgents) {
        if (!this.agentCapabilities.has(agent.id)) {
          const capabilityText = agent.capabilities
            .map((cap: AgentCapability) => `${cap.name}: ${cap.description}`)
            .join(' ');

          const embedding = await this.embeddingClient.createEmbeddings(capabilityText);
          this.agentCapabilities.set(agent.id, embedding.embeddings[0]);
        }
      }

      // Calculate agent-task matching scores
      const matches: Array<{ agentId: string; confidence: number; agent: AgentMetadata }> = [];

      for (const agent of candidateAgents) {
        const agentEmbedding = this.agentCapabilities.get(agent.id)!;
        const semanticSimilarity = this.embeddingClient['cosineSimilarity'](taskEmbedding, agentEmbedding);

        // Calculate capability match score
        const capabilityScore = this.calculateCapabilityMatch(agent.capabilities, requirements);

        // Calculate load factor (prefer less loaded agents)
        const loadFactor = 1 - agent.currentTasks / agent.maxConcurrentTasks;

        // Get historical performance score
        const performanceScore = await this.getAgentPerformanceScore(agent.id);

        // Combined confidence score
        const confidence = semanticSimilarity * 0.4 + capabilityScore * 0.3 + loadFactor * 0.2 + performanceScore * 0.1;

        matches.push({
          agentId: agent.id,
          confidence,
          agent,
        });
      }

      // Sort by confidence and select best match
      matches.sort((a, b) => b.confidence - a.confidence);

      if (matches.length === 0 || matches[0].confidence < 0.3) {
        return {
          success: false,
          reason: 'No agent meets minimum confidence threshold',
          alternatives: matches.slice(0, 3).map((m) => ({ agentId: m.agentId, confidence: m.confidence })),
        };
      }

      return {
        success: true,
        agentId: matches[0].agentId,
        confidence: matches[0].confidence,
        alternatives: matches.slice(1, 4).map((m) => ({ agentId: m.agentId, confidence: m.confidence })),
      };
    } catch (error: any) {
      console.error('Agent selection optimization error:', error);
      return {
        success: false,
        reason: `Selection error: ${error.message}`,
      };
    }
  }

  /**
   * Execute multiple tasks in parallel with dependency management
   */
  async executeParallelTasks(
    tasks: Array<{ description: string; context?: Partial<TaskContext>; dependencies?: string[] }>,
    maxConcurrency: number = 5,
    timeout: number = 300000,
  ): Promise<{
    success: boolean;
    results: TaskResult[];
    failed: Array<{ task: any; error: string }>;
    duration: number;
  }> {
    const startTime = Date.now();
    const results: TaskResult[] = [];
    const failed: Array<{ task: any; error: string }> = [];
    const executing = new Map<string, Promise<TaskResult>>();
    const completed = new Set<string>();

    try {
      // Create task graph with dependencies
      const taskMap = new Map<string, any>();
      tasks.forEach((task, index) => {
        const taskId = `parallel_task_${index}`;
        taskMap.set(taskId, { ...task, id: taskId });
      });

      // Execute tasks respecting dependencies and concurrency limits
      while (
        (completed.size < tasks.length && executing.size > 0) ||
        (completed.size < tasks.length && [...taskMap.values()].some((t) => this.canExecuteTask(t, completed)))
      ) {
        // Start new tasks if under concurrency limit
        while (executing.size < maxConcurrency) {
          const readyTask = [...taskMap.values()].find(
            (t) => !completed.has(t.id) && !executing.has(t.id) && this.canExecuteTask(t, completed),
          );

          if (!readyTask) break;

          const taskPromise = this.smartTaskAssignment(readyTask.description, readyTask.context || {}, {});

          executing.set(readyTask.id, taskPromise);
        }

        // Wait for at least one task to complete
        if (executing.size > 0) {
          const raceResult = await Promise.race([
            ...Array.from(executing.entries()).map(async ([taskId, promise]) => {
              try {
                const result = await promise;
                return { taskId, result, success: true };
              } catch (error) {
                return { taskId, error, success: false };
              }
            }),
          ]);

          executing.delete(raceResult.taskId);
          completed.add(raceResult.taskId);

          if (raceResult.success) {
            results.push(raceResult.result!);
          } else {
            const task = taskMap.get(raceResult.taskId);
            failed.push({ task, error: (raceResult.error as any).message });
          }
        }

        // Check timeout
        if (Date.now() - startTime > timeout) {
          // Cancel remaining tasks
          for (const [taskId] of executing) {
            const task = taskMap.get(taskId);
            failed.push({ task, error: 'Task timed out' });
          }
          break;
        }
      }

      return {
        success: failed.length === 0,
        results,
        failed,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      console.error('Parallel task execution error:', error);
      return {
        success: false,
        results,
        failed: [{ task: { description: 'Parallel execution' }, error: error.message }],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Monitor task execution performance and generate insights
   */
  async monitorTaskPerformance(
    timeWindowMinutes: number = 60,
    agentId?: string,
    taskType?: string,
  ): Promise<{
    totalTasks: number;
    successRate: number;
    averageDuration: number;
    tokenUsage: number;
    agentPerformance: Record<string, any>;
    trends: any;
    recommendations: string[];
  }> {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

    // Filter relevant task results
    const relevantResults = Array.from(this.taskResults.values()).filter((result) => {
      const task = this.activeTasks.get(result.taskId);
      if (!task || task.createdAt < cutoffTime) return false;
      if (agentId && result.agentId !== agentId) return false;
      if (taskType && task.type !== taskType) return false;
      return true;
    });

    const totalTasks = relevantResults.length;
    const successfulTasks = relevantResults.filter((r) => r.success).length;
    const successRate = totalTasks > 0 ? successfulTasks / totalTasks : 0;
    const averageDuration = totalTasks > 0 ? relevantResults.reduce((sum, r) => sum + r.duration, 0) / totalTasks : 0;
    const tokenUsage = relevantResults.reduce((sum, r) => sum + r.tokensUsed, 0);

    // Analyze agent performance
    const agentPerformance: Record<string, any> = {};
    const agentGroups = new Map<string, TaskResult[]>();

    for (const result of relevantResults) {
      if (!agentGroups.has(result.agentId)) {
        agentGroups.set(result.agentId, []);
      }
      agentGroups.get(result.agentId)!.push(result);
    }

    for (const [aid, results] of agentGroups) {
      const successful = results.filter((r) => r.success).length;
      agentPerformance[aid] = {
        tasks: results.length,
        successRate: successful / results.length,
        averageDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
        totalTokens: results.reduce((sum, r) => sum + r.tokensUsed, 0),
      };
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (successRate < 0.8) {
      recommendations.push('Consider reviewing task assignment criteria - success rate is below optimal');
    }
    if (averageDuration > 300000) {
      // > 5 minutes
      recommendations.push('Average task duration is high - consider task decomposition or agent optimization');
    }

    return {
      totalTasks,
      successRate,
      averageDuration,
      tokenUsage,
      agentPerformance,
      trends: this.analyzeTrends(relevantResults),
      recommendations,
    };
  }

  /**
   * Adaptive load balancing across agents
   */
  async adaptiveLoadBalancing(
    strategy: 'round_robin' | 'least_loaded' | 'capability_based' | 'performance_weighted' = 'capability_based',
    targetUtilization: number = 0.8,
  ): Promise<{
    rebalanced: boolean;
    actions: Array<{ action: string; agentId: string; details: any }>;
    newDistribution: Record<string, number>;
  }> {
    const agents = globalRegistry.getAllAgents();
    const actions: Array<{ action: string; agentId: string; details: any }> = [];

    // Calculate current load distribution
    const currentDistribution: Record<string, number> = {};
    for (const agent of agents) {
      currentDistribution[agent.id] = agent.currentTasks / agent.maxConcurrentTasks;
    }

    // Identify overloaded and underloaded agents
    const overloaded = agents.filter((a: any) => currentDistribution[a.id] > targetUtilization);
    const underloaded = agents.filter((a: any) => currentDistribution[a.id] < targetUtilization * 0.6);

    if (overloaded.length === 0) {
      return {
        rebalanced: false,
        actions: [],
        newDistribution: currentDistribution,
      };
    }

    // Implement rebalancing strategy
    for (const agent of overloaded) {
      const excessTasks = Math.floor(agent.currentTasks - agent.maxConcurrentTasks * targetUtilization);

      if (excessTasks > 0 && underloaded.length > 0) {
        // Find best target agent
        const targetAgent = underloaded.reduce((best: any, current: any) =>
          currentDistribution[current.id] < currentDistribution[best.id] ? current : best,
        );

        actions.push({
          action: 'redistribute_tasks',
          agentId: agent.id,
          details: {
            tasksToMove: excessTasks,
            targetAgent: targetAgent.id,
            reason: `Load balancing: ${agent.id} overloaded (${(currentDistribution[agent.id] * 100).toFixed(1)}%)`,
          },
        });

        // Update distribution prediction
        currentDistribution[agent.id] -= excessTasks / agent.maxConcurrentTasks;
        currentDistribution[targetAgent.id] += excessTasks / targetAgent.maxConcurrentTasks;
      }
    }

    return {
      rebalanced: actions.length > 0,
      actions,
      newDistribution: currentDistribution,
    };
  }

  // Helper methods
  private async executeTask(task: Task & TaskContext): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      const agent = await globalRegistry.getAgent(task.assignedAgentId!);
      if (!agent) {
        throw new Error(`Agent ${task.assignedAgentId} not found`);
      }

      // Execute task with the assigned agent
      // This is a simplified implementation - in practice, you'd need to
      // actually call the agent's processing methods
      const mockResult = {
        success: true,
        data: `Task completed: ${task.description}`,
      };

      const result: TaskResult = {
        taskId: task.id,
        agentId: task.assignedAgentId!,
        success: true,
        result: mockResult,
        duration: Date.now() - startTime,
        tokensUsed: Math.floor(Math.random() * 1000) + 100, // Mock token usage
      };

      this.taskResults.set(task.id, result);
      return result;
    } catch (error: any) {
      const result: TaskResult = {
        taskId: task.id,
        agentId: task.assignedAgentId || 'unknown',
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        tokensUsed: 0,
      };

      this.taskResults.set(task.id, result);
      return result;
    }
  }

  private canExecuteTask(task: any, completed: Set<string>): boolean {
    if (!task.dependencies) return true;
    return task.dependencies.every((dep: string) => completed.has(dep));
  }

  private calculateCapabilityMatch(agentCapabilities: AgentCapability[], requirements: string[]): number {
    if (requirements.length === 0) return 1.0;

    const agentCaps = agentCapabilities.map((cap) => cap.name.toLowerCase());
    const matches = requirements.filter((req) =>
      agentCaps.some((cap) => cap.includes(req.toLowerCase()) || req.toLowerCase().includes(cap)),
    );

    return matches.length / requirements.length;
  }

  private async getAgentPerformanceScore(agentId: string): Promise<number> {
    const agentResults = Array.from(this.taskResults.values()).filter((r) => r.agentId === agentId);

    if (agentResults.length === 0) return 0.5; // Neutral score for new agents

    const successRate = agentResults.filter((r) => r.success).length / agentResults.length;
    const avgDuration = agentResults.reduce((sum, r) => sum + r.duration, 0) / agentResults.length;

    // Normalize scores (lower duration is better, higher success rate is better)
    const durationScore = Math.max(0, 1 - avgDuration / 600000); // Normalize against 10 minutes

    return successRate * 0.7 + durationScore * 0.3;
  }

  private breakdownTask(description: string, taskType: string): string[] {
    // Simple task breakdown - could be enhanced with more sophisticated NLP
    const sentences = description.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    if (taskType === 'sequential') {
      return sentences.map((s, i) => `Step ${i + 1}: ${s.trim()}`);
    } else if (taskType === 'parallel') {
      return sentences.map((s, i) => `Parallel task ${i + 1}: ${s.trim()}`);
    } else {
      return [description];
    }
  }

  private analyzeTrends(results: TaskResult[]): any {
    // Simple trend analysis - could be enhanced with time series analysis
    const hourlyBuckets = new Map<number, TaskResult[]>();

    for (const result of results) {
      const task = this.activeTasks.get(result.taskId);
      if (task) {
        const hour = task.createdAt.getHours();
        if (!hourlyBuckets.has(hour)) {
          hourlyBuckets.set(hour, []);
        }
        hourlyBuckets.get(hour)!.push(result);
      }
    }

    const trends: any = {};
    for (const [hour, hourResults] of hourlyBuckets) {
      trends[hour] = {
        tasks: hourResults.length,
        successRate: hourResults.filter((r) => r.success).length / hourResults.length,
        avgDuration: hourResults.reduce((sum, r) => sum + r.duration, 0) / hourResults.length,
      };
    }

    return trends;
  }

  private startTaskProcessor(): void {
    // Background task processor - simplified implementation
    this.taskProcessorInterval = setInterval(() => {
      if (this.taskQueue.length > 0) {
        const task = this.taskQueue.shift();
        if (task) {
          this.smartTaskAssignment(task.description, task);
        }
      }
    }, 1000);
  }

  private startPerformanceMonitor(): void {
    // Background performance monitoring - simplified implementation
    this.performanceMonitorInterval = setInterval(async () => {
      const performance = await this.monitorTaskPerformance(15); // Last 15 minutes

      if (performance.successRate < 0.7) {
        console.warn('Low success rate detected:', performance.successRate);
        // Could trigger automatic optimizations here
      }
    }, 60000); // Check every minute
  }

  /**
   * Cleanup method to stop background processes
   */
  destroy(): void {
    if (this.taskProcessorInterval) {
      clearInterval(this.taskProcessorInterval);
    }
    if (this.performanceMonitorInterval) {
      clearInterval(this.performanceMonitorInterval);
    }
  }
}
