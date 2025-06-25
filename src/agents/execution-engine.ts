/**
 * Concurrent Task Execution Engine with Dependency Management
 * Based on AIstudio's concurrent execution patterns with enhanced dependency handling
 */

import { EventEmitter } from 'events';
import { Task, WorkflowState, TaskAssignment } from './types';
import { globalRegistry } from './registry';
import { globalCommBus } from './communication';

export interface ExecutionNode {
  taskId: string;
  task: Task;
  dependencies: Set<string>;
  dependents: Set<string>;
  status: 'waiting' | 'ready' | 'executing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  executionStartTime?: Date;
  executionEndTime?: Date;
  retryCount: number;
  maxRetries: number;
}

export interface ExecutionPlan {
  id: string;
  name: string;
  nodes: Map<string, ExecutionNode>;
  parallelGroups: string[][];
  criticalPath: string[];
  estimatedDuration: number;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'paused';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ConcurrencyConfig {
  maxConcurrentTasks: number;
  dependencyTimeout: number;
  retryDelay: number;
  enableAdaptiveConcurrency: boolean;
}

export class ExecutionEngine extends EventEmitter {
  private plans: Map<string, ExecutionPlan> = new Map();
  private activeExecutions: Map<string, Promise<any>> = new Map();
  private config: ConcurrencyConfig;
  
  // Inspired by AIstudio's CONCURRENT_TASK_LIMIT
  private readonly DEFAULT_MAX_CONCURRENT = 3;
  private readonly DEPENDENCY_TIMEOUT_MS = 300000; // 5 minutes
  private readonly RETRY_DELAY_MS = 5000; // 5 seconds

  constructor(config: Partial<ConcurrencyConfig> = {}) {
    super();
    
    this.config = {
      maxConcurrentTasks: config.maxConcurrentTasks || this.DEFAULT_MAX_CONCURRENT,
      dependencyTimeout: config.dependencyTimeout || this.DEPENDENCY_TIMEOUT_MS,
      retryDelay: config.retryDelay || this.RETRY_DELAY_MS,
      enableAdaptiveConcurrency: config.enableAdaptiveConcurrency || true
    };
  }

  /**
   * Create execution plan from tasks with dependency analysis
   */
  async createExecutionPlan(
    name: string,
    tasks: Task[],
    options: {
      maxRetries?: number;
      timeoutMs?: number;
    } = {}
  ): Promise<string> {
    const planId = this.generatePlanId();
    
    // Create execution nodes
    const nodes = new Map<string, ExecutionNode>();
    
    for (const task of tasks) {
      const node: ExecutionNode = {
        taskId: task.id,
        task,
        dependencies: new Set(task.dependencies || []),
        dependents: new Set(),
        status: 'waiting',
        retryCount: 0,
        maxRetries: options.maxRetries || 3
      };
      
      nodes.set(task.id, node);
    }

    // Build dependency graph
    this.buildDependencyGraph(nodes);

    // Analyze parallel execution groups
    const parallelGroups = this.analyzeParallelGroups(nodes);
    const criticalPath = this.calculateCriticalPath(nodes);
    const estimatedDuration = this.estimateExecutionTime(nodes, criticalPath);

    const plan: ExecutionPlan = {
      id: planId,
      name,
      nodes,
      parallelGroups,
      criticalPath,
      estimatedDuration,
      status: 'pending',
      createdAt: new Date()
    };

    this.plans.set(planId, plan);
    this.emit('plan_created', plan);

    console.log(`📋 Execution plan created: ${name} (${tasks.length} tasks, ${parallelGroups.length} groups)`);
    return planId;
  }

  /**
   * Execute plan with concurrent processing and dependency management
   */
  async executePlan(planId: string): Promise<boolean> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Execution plan not found: ${planId}`);
    }

    if (plan.status !== 'pending') {
      throw new Error(`Plan is not in pending status: ${plan.status}`);
    }

    plan.status = 'executing';
    plan.startedAt = new Date();
    this.emit('plan_started', plan);

    console.log(`🚀 Starting execution plan: ${plan.name}`);

    try {
      // Execute parallel groups sequentially, tasks within groups concurrently
      for (let groupIndex = 0; groupIndex < plan.parallelGroups.length; groupIndex++) {
        const group = plan.parallelGroups[groupIndex];
        console.log(`⚡ Executing group ${groupIndex + 1}/${plan.parallelGroups.length} (${group.length} tasks)`);

        // Wait for all tasks in current group to complete
        await this.executeTaskGroup(plan, group);

        // Check for failures that should stop execution
        const failedTasks = group.filter(taskId => {
          const node = plan.nodes.get(taskId);
          return node?.status === 'failed';
        });

        if (failedTasks.length > 0) {
          throw new Error(`Critical tasks failed in group ${groupIndex + 1}: ${failedTasks.join(', ')}`);
        }
      }

      // All groups completed successfully
      plan.status = 'completed';
      plan.completedAt = new Date();
      this.emit('plan_completed', plan);

      console.log(`🎉 Execution plan completed: ${plan.name}`);
      return true;

    } catch (error) {
      plan.status = 'failed';
      plan.completedAt = new Date();
      this.emit('plan_failed', plan, error);

      console.error(`💥 Execution plan failed: ${plan.name} - ${error}`);
      return false;
    }
  }

  /**
   * Execute a group of tasks concurrently with dependency checking
   */
  private async executeTaskGroup(plan: ExecutionPlan, taskIds: string[]): Promise<void> {
    const readyTasks = taskIds.filter(taskId => {
      const node = plan.nodes.get(taskId);
      return node && this.isTaskReady(node, plan.nodes);
    });

    if (readyTasks.length === 0) {
      throw new Error('No ready tasks found in group');
    }

    // Execute tasks with concurrency control
    const executionPromises: Promise<any>[] = [];
    const semaphore = new Semaphore(this.config.maxConcurrentTasks);

    for (const taskId of readyTasks) {
      const promise = semaphore.acquire().then(async (release) => {
        try {
          await this.executeTask(plan, taskId);
        } finally {
          release();
        }
      });

      executionPromises.push(promise);
    }

    // Wait for all tasks in group to complete
    await Promise.all(executionPromises);
  }

  /**
   * Execute single task with retry logic
   */
  private async executeTask(plan: ExecutionPlan, taskId: string): Promise<void> {
    const node = plan.nodes.get(taskId);
    if (!node) {
      throw new Error(`Task node not found: ${taskId}`);
    }

    console.log(`🔧 Executing task: ${node.task.name} (${taskId})`);

    for (let attempt = 0; attempt <= node.maxRetries; attempt++) {
      try {
        node.status = 'executing';
        node.executionStartTime = new Date();
        this.emit('task_started', node);

        // Find best agent for task
        const agent = this.findBestAgentForTask(node.task);
        if (!agent) {
          throw new Error('No available agent for task');
        }

        // Execute task via agent
        const result = await this.executeTaskWithAgent(node.task, agent);

        // Task completed successfully
        node.status = 'completed';
        node.result = result;
        node.executionEndTime = new Date();
        this.emit('task_completed', node);

        console.log(`✅ Task completed: ${node.task.name}`);
        return;

      } catch (error) {
        node.retryCount = attempt + 1;
        
        if (attempt < node.maxRetries) {
          console.warn(`⚠️ Task failed, retrying (${attempt + 1}/${node.maxRetries}): ${node.task.name} - ${error}`);
          await this.delay(this.config.retryDelay);
        } else {
          node.status = 'failed';
          node.error = String(error);
          node.executionEndTime = new Date();
          this.emit('task_failed', node);
          
          console.error(`❌ Task failed permanently: ${node.task.name} - ${error}`);
          throw error;
        }
      }
    }
  }

  /**
   * Execute task with specific agent
   */
  private async executeTaskWithAgent(task: Task, agent: any): Promise<any> {
    // Create task assignment message
    const assignment: TaskAssignment = {
      taskId: task.id,
      assignedAgentId: agent.id,
      assignedAgentType: agent.type,
      recommendedTools: this.getRecommendedTools(task),
      priority: task.priority,
      context: task.context
    };

    // Send task to agent via communication bus
    const message = {
      id: this.generateMessageId(),
      from: 'execution_engine',
      to: agent.id,
      type: 'request' as const,
      payload: { assignment, task },
      timestamp: new Date(),
      priority: task.priority
    };

    await globalCommBus.sendMessage(message);

    // Wait for task completion with timeout
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Task execution timeout'));
      }, this.config.dependencyTimeout);

      // Listen for task completion
      const onComplete = (completedTask: any) => {
        if (completedTask.taskId === task.id) {
          clearTimeout(timeout);
          globalCommBus.off('task_result', onComplete);
          resolve(completedTask.result);
        }
      };

      const onFailed = (failedTask: any) => {
        if (failedTask.taskId === task.id) {
          clearTimeout(timeout);
          globalCommBus.off('task_result', onComplete);
          globalCommBus.off('task_error', onFailed);
          reject(new Error(failedTask.error));
        }
      };

      globalCommBus.on('task_result', onComplete);
      globalCommBus.on('task_error', onFailed);
    });
  }

  /**
   * Check if task is ready for execution (all dependencies completed)
   */
  private isTaskReady(node: ExecutionNode, allNodes: Map<string, ExecutionNode>): boolean {
    if (node.status !== 'waiting') {
      return false;
    }

    for (const depId of node.dependencies) {
      const depNode = allNodes.get(depId);
      if (!depNode || depNode.status !== 'completed') {
        return false;
      }
    }

    return true;
  }

  /**
   * Build dependency graph by connecting dependents
   */
  private buildDependencyGraph(nodes: Map<string, ExecutionNode>): void {
    for (const [taskId, node] of nodes) {
      for (const depId of node.dependencies) {
        const depNode = nodes.get(depId);
        if (depNode) {
          depNode.dependents.add(taskId);
        }
      }
    }
  }

  /**
   * Analyze parallel execution groups using topological sorting
   */
  private analyzeParallelGroups(nodes: Map<string, ExecutionNode>): string[][] {
    const groups: string[][] = [];
    const visited = new Set<string>();
    const nodesArray = Array.from(nodes.values());

    while (visited.size < nodesArray.length) {
      const currentGroup: string[] = [];

      // Find all nodes with no unvisited dependencies
      for (const node of nodesArray) {
        if (visited.has(node.taskId)) continue;

        const hasUnvisitedDeps = Array.from(node.dependencies).some(depId => !visited.has(depId));
        if (!hasUnvisitedDeps) {
          currentGroup.push(node.taskId);
        }
      }

      if (currentGroup.length === 0) {
        throw new Error('Circular dependency detected in task graph');
      }

      groups.push(currentGroup);
      currentGroup.forEach(taskId => visited.add(taskId));
    }

    return groups;
  }

  /**
   * Calculate critical path for execution time estimation
   */
  private calculateCriticalPath(nodes: Map<string, ExecutionNode>): string[] {
    // Simplified critical path calculation
    const path: string[] = [];
    const longestPaths = new Map<string, number>();

    // Calculate longest path to each node
    const calculateLongestPath = (nodeId: string): number => {
      if (longestPaths.has(nodeId)) {
        return longestPaths.get(nodeId)!;
      }

      const node = nodes.get(nodeId)!;
      const taskDuration = node.task.estimatedDuration || 60; // Default 1 minute

      if (node.dependencies.size === 0) {
        longestPaths.set(nodeId, taskDuration);
        return taskDuration;
      }

      const maxDepPath = Math.max(
        ...Array.from(node.dependencies).map(depId => calculateLongestPath(depId))
      );

      const totalPath = maxDepPath + taskDuration;
      longestPaths.set(nodeId, totalPath);
      return totalPath;
    };

    // Calculate paths for all nodes
    for (const nodeId of nodes.keys()) {
      calculateLongestPath(nodeId);
    }

    // Find the longest path
    let maxPath = 0;
    let criticalEndNode = '';

    for (const [nodeId, pathLength] of longestPaths) {
      if (pathLength > maxPath) {
        maxPath = pathLength;
        criticalEndNode = nodeId;
      }
    }

    // Reconstruct critical path
    const reconstructPath = (nodeId: string): string[] => {
      const node = nodes.get(nodeId)!;
      if (node.dependencies.size === 0) {
        return [nodeId];
      }

      const criticalDep = Array.from(node.dependencies)
        .reduce((max, depId) => {
          const maxPath = longestPaths.get(max) || 0;
          const depPath = longestPaths.get(depId) || 0;
          return depPath > maxPath ? depId : max;
        });

      return [...reconstructPath(criticalDep), nodeId];
    };

    return reconstructPath(criticalEndNode);
  }

  /**
   * Estimate total execution time based on critical path
   */
  private estimateExecutionTime(nodes: Map<string, ExecutionNode>, criticalPath: string[]): number {
    return criticalPath.reduce((total, taskId) => {
      const node = nodes.get(taskId);
      return total + (node?.task.estimatedDuration || 60);
    }, 0);
  }

  /**
   * Find best available agent for task
   */
  private findBestAgentForTask(task: Task) {
    for (const capability of task.requiredCapabilities) {
      const agent = globalRegistry.findBestAgent(capability);
      if (agent) return agent;
    }
    return null;
  }

  /**
   * Get recommended tools for task
   */
  private getRecommendedTools(task: Task): string[] {
    const tools: string[] = [];
    
    for (const capability of task.requiredCapabilities) {
      switch (capability) {
        case 'base_operations':
          tools.push('bitable.v1.app.table.record.search');
          break;
        case 'messaging':
          tools.push('im.v1.message.create');
          break;
        case 'document_management':
          tools.push('docs.v1.document.get');
          break;
      }
    }

    return tools;
  }

  /**
   * Get execution plan by ID
   */
  getExecutionPlan(planId: string): ExecutionPlan | undefined {
    return this.plans.get(planId);
  }

  /**
   * Get execution statistics
   */
  getStatistics() {
    const plans = Array.from(this.plans.values());
    const activeExecutions = this.activeExecutions.size;

    return {
      totalPlans: plans.length,
      activePlans: plans.filter(p => p.status === 'executing').length,
      completedPlans: plans.filter(p => p.status === 'completed').length,
      failedPlans: plans.filter(p => p.status === 'failed').length,
      activeExecutions,
      averageExecutionTime: this.calculateAverageExecutionTime(plans)
    };
  }

  private calculateAverageExecutionTime(plans: ExecutionPlan[]): number {
    const completedPlans = plans.filter(p => p.status === 'completed' && p.startedAt && p.completedAt);
    if (completedPlans.length === 0) return 0;

    const totalTime = completedPlans.reduce((sum, plan) => {
      return sum + (plan.completedAt!.getTime() - plan.startedAt!.getTime());
    }, 0);

    return totalTime / completedPlans.length;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generatePlanId(): string {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Semaphore for concurrency control
 */
class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      if (this.permits > 0) {
        this.permits--;
        resolve(() => this.release());
      } else {
        this.queue.push(() => {
          this.permits--;
          resolve(() => this.release());
        });
      }
    });
  }

  private release(): void {
    this.permits++;
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      next();
    }
  }
}

// Global execution engine instance
export const globalExecutionEngine = new ExecutionEngine();