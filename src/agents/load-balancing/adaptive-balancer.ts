/**
 * Adaptive Load Balancer for Agent Distribution
 * Dynamically distributes tasks based on agent performance and load
 */

import { EventEmitter } from 'events';
import { Agent } from '../agent';
import { Task, AgentCapability } from '../types';
import { PerformanceMonitor, AgentMetrics } from '../monitoring/performance-monitor';

export interface LoadBalancerConfig {
  algorithm: 'round-robin' | 'least-loaded' | 'weighted' | 'adaptive';
  adaptiveThreshold: number;
  loadUpdateInterval: number;
  maxTasksPerAgent: number;
  rebalanceInterval: number;
  enableAutoScaling: boolean;
}

export interface AgentLoad {
  agentId: string;
  currentTasks: number;
  cpuUsage: number;
  memoryUsage: number;
  averageResponseTime: number;
  successRate: number;
  capacity: number;
  weight: number;
  lastUpdated: Date;
}

export interface LoadBalancerMetrics {
  totalTasks: number;
  distributedTasks: number;
  queuedTasks: number;
  averageLoadPerAgent: number;
  loadVariance: number;
  rebalanceCount: number;
  lastRebalance: Date;
}

export class AdaptiveLoadBalancer extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private agentLoads: Map<string, AgentLoad> = new Map();
  private taskAssignments: Map<string, string> = new Map(); // taskId -> agentId
  private pendingTasks: Task[] = [];
  private config: LoadBalancerConfig;
  private monitor: PerformanceMonitor;
  private currentIndex: number = 0;
  private loadUpdateTimer?: NodeJS.Timeout;
  private rebalanceTimer?: NodeJS.Timeout;
  private metrics: LoadBalancerMetrics;

  constructor(monitor: PerformanceMonitor, config: Partial<LoadBalancerConfig> = {}) {
    super();
    
    this.monitor = monitor;
    this.config = {
      algorithm: 'adaptive',
      adaptiveThreshold: 0.8,
      loadUpdateInterval: 5000,
      maxTasksPerAgent: 10,
      rebalanceInterval: 30000,
      enableAutoScaling: true,
      ...config,
    };

    this.metrics = {
      totalTasks: 0,
      distributedTasks: 0,
      queuedTasks: 0,
      averageLoadPerAgent: 0,
      loadVariance: 0,
      rebalanceCount: 0,
      lastRebalance: new Date(),
    };

    this.startMonitoring();
  }

  /**
   * Register an agent with the load balancer
   */
  registerAgent(agent: any): void {
    // Handle both Agent instances and objects with getId() method
    const agentId = typeof agent.getId === 'function' ? agent.getId() : agent.name || `agent_${Date.now()}`;
    this.agents.set(agentId, agent);
    
    // Initialize agent load
    this.agentLoads.set(agentId, {
      agentId,
      currentTasks: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      averageResponseTime: 0,
      successRate: 1.0,
      capacity: this.config.maxTasksPerAgent,
      weight: 1.0,
      lastUpdated: new Date(),
    });

    this.emit('agent:registered', { agentId });
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
    this.agentLoads.delete(agentId);
    
    // Reassign tasks from this agent
    const tasksToReassign: Task[] = [];
    for (const [taskId, assignedAgentId] of this.taskAssignments) {
      if (assignedAgentId === agentId) {
        this.taskAssignments.delete(taskId);
        // Would need to get task from somewhere
      }
    }

    this.emit('agent:unregistered', { agentId });
  }

  /**
   * Assign a task to an agent
   */
  async assignTask(task: Task): Promise<string> {
    const agentId = await this.selectAgent(task);
    
    if (!agentId) {
      // Queue the task if no agent available
      this.pendingTasks.push(task);
      this.metrics.queuedTasks++;
      this.emit('task:queued', { taskId: task.id });
      throw new Error('No available agent for task');
    }

    // Update assignment
    this.taskAssignments.set(task.id, agentId);
    const load = this.agentLoads.get(agentId)!;
    load.currentTasks++;
    
    // Update metrics
    this.metrics.totalTasks++;
    this.metrics.distributedTasks++;
    
    this.emit('task:assigned', { taskId: task.id, agentId });
    
    return agentId;
  }

  /**
   * Select an agent based on the configured algorithm
   */
  private async selectAgent(task: Task): Promise<string | null> {
    const availableAgents = this.getAvailableAgents(task);
    
    if (availableAgents.length === 0) {
      return null;
    }

    switch (this.config.algorithm) {
      case 'round-robin':
        return this.roundRobinSelect(availableAgents);
      
      case 'least-loaded':
        return this.leastLoadedSelect(availableAgents);
      
      case 'weighted':
        return this.weightedSelect(availableAgents);
      
      case 'adaptive':
        return this.adaptiveSelect(availableAgents, task);
      
      default:
        return availableAgents[0];
    }
  }

  /**
   * Get available agents for a task
   */
  private getAvailableAgents(task: Task): string[] {
    const availableAgents: string[] = [];
    
    for (const [agentId, agent] of this.agents) {
      const load = this.agentLoads.get(agentId);
      if (!load) continue;
      
      // Check capacity
      if (load.currentTasks >= load.capacity) continue;
      
      // Check capabilities
      if (!this.hasRequiredCapabilities(agent, task)) continue;
      
      // Check load threshold
      const loadRatio = load.currentTasks / load.capacity;
      if (loadRatio >= this.config.adaptiveThreshold && availableAgents.length > 0) {
        continue;
      }
      
      availableAgents.push(agentId);
    }
    
    return availableAgents;
  }

  /**
   * Round-robin selection
   */
  private roundRobinSelect(agents: string[]): string {
    const selected = agents[this.currentIndex % agents.length];
    this.currentIndex++;
    return selected;
  }

  /**
   * Least-loaded selection
   */
  private leastLoadedSelect(agents: string[]): string {
    let minLoad = Infinity;
    let selectedAgent = agents[0];
    
    for (const agentId of agents) {
      const load = this.agentLoads.get(agentId)!;
      const loadScore = load.currentTasks / load.capacity;
      
      if (loadScore < minLoad) {
        minLoad = loadScore;
        selectedAgent = agentId;
      }
    }
    
    return selectedAgent;
  }

  /**
   * Weighted selection based on agent performance
   */
  private weightedSelect(agents: string[]): string {
    const weights: number[] = [];
    let totalWeight = 0;
    
    for (const agentId of agents) {
      const load = this.agentLoads.get(agentId)!;
      const weight = load.weight * (1 - load.currentTasks / load.capacity);
      weights.push(weight);
      totalWeight += weight;
    }
    
    // Random weighted selection
    const random = Math.random() * totalWeight;
    let cumulative = 0;
    
    for (let i = 0; i < agents.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return agents[i];
      }
    }
    
    return agents[agents.length - 1];
  }

  /**
   * Adaptive selection based on task characteristics and agent performance
   */
  private adaptiveSelect(agents: string[], task: Task): string {
    let bestScore = -Infinity;
    let selectedAgent = agents[0];
    
    for (const agentId of agents) {
      const score = this.calculateAgentScore(agentId, task);
      if (score > bestScore) {
        bestScore = score;
        selectedAgent = agentId;
      }
    }
    
    return selectedAgent;
  }

  /**
   * Calculate agent score for adaptive selection
   */
  private calculateAgentScore(agentId: string, task: Task): number {
    const load = this.agentLoads.get(agentId)!;
    const agent = this.agents.get(agentId)!;
    
    // Load factor (lower is better)
    const loadFactor = 1 - (load.currentTasks / load.capacity);
    
    // Performance factor
    const performanceFactor = load.successRate * (1 / (1 + load.averageResponseTime / 1000));
    
    // Capability match factor
    const capabilityScore = this.calculateCapabilityMatch(agent, task);
    
    // Resource usage factor
    const resourceFactor = 1 - (load.cpuUsage + load.memoryUsage) / 2;
    
    // Recent performance from monitor
    const agentMetrics = this.getAgentMetricsFromMonitor(agentId);
    const recentPerformance = agentMetrics ? agentMetrics.successRate : 1.0;
    
    // Combined score with weights
    const score = 
      loadFactor * 0.3 +
      performanceFactor * 0.25 +
      capabilityScore * 0.2 +
      resourceFactor * 0.15 +
      recentPerformance * 0.1;
    
    return score;
  }

  /**
   * Calculate capability match score
   */
  private calculateCapabilityMatch(agent: any, task: Task): number {
    const agentCapabilities = typeof agent.getCapabilities === 'function' ? agent.getCapabilities() : [];
    const requiredCapabilities = task.requiredCapabilities;
    
    if (requiredCapabilities.length === 0) return 1.0;
    
    let matchCount = 0;
    for (const required of requiredCapabilities) {
      if (agentCapabilities.includes(required)) {
        matchCount++;
      }
    }
    
    return matchCount / requiredCapabilities.length;
  }

  /**
   * Check if agent has required capabilities
   */
  private hasRequiredCapabilities(agent: any, task: Task): boolean {
    const agentCapabilities = typeof agent.getCapabilities === 'function' ? agent.getCapabilities() : [];
    return task.requiredCapabilities.every(cap => agentCapabilities.includes(cap));
  }

  /**
   * Complete a task
   */
  completeTask(taskId: string, success: boolean, metrics?: {
    executionTime: number;
    resourceUsage?: { cpu: number; memory: number };
  }): void {
    const agentId = this.taskAssignments.get(taskId);
    if (!agentId) return;
    
    // Update agent load
    const load = this.agentLoads.get(agentId);
    if (load) {
      load.currentTasks = Math.max(0, load.currentTasks - 1);
      
      // Update performance metrics
      if (metrics) {
        // Update average response time
        const alpha = 0.2; // Exponential moving average factor
        load.averageResponseTime = 
          alpha * metrics.executionTime + (1 - alpha) * load.averageResponseTime;
        
        // Update resource usage if provided
        if (metrics.resourceUsage) {
          load.cpuUsage = metrics.resourceUsage.cpu;
          load.memoryUsage = metrics.resourceUsage.memory;
        }
      }
      
      // Update success rate
      const totalTasks = this.metrics.distributedTasks;
      load.successRate = (load.successRate * (totalTasks - 1) + (success ? 1 : 0)) / totalTasks;
    }
    
    // Remove assignment
    this.taskAssignments.delete(taskId);
    
    // Try to assign pending tasks
    this.processPendingTasks();
    
    this.emit('task:completed', { taskId, agentId, success });
  }

  /**
   * Process pending tasks
   */
  private processPendingTasks(): void {
    const tasksToProcess = [...this.pendingTasks];
    this.pendingTasks = [];
    
    for (const task of tasksToProcess) {
      this.assignTask(task).catch(() => {
        // Task remains in pending queue
      });
    }
  }

  /**
   * Start monitoring and rebalancing
   */
  private startMonitoring(): void {
    // Update load metrics
    this.loadUpdateTimer = setInterval(() => {
      this.updateLoadMetrics();
    }, this.config.loadUpdateInterval);
    
    // Rebalance periodically
    if (this.config.algorithm === 'adaptive') {
      this.rebalanceTimer = setInterval(() => {
        this.rebalance();
      }, this.config.rebalanceInterval);
    }
  }

  /**
   * Update load metrics from performance monitor
   */
  private updateLoadMetrics(): void {
    const dashboardData = this.monitor.getDashboardData();
    
    // Update agent metrics
    for (const agentMetrics of dashboardData.agents) {
      const load = this.agentLoads.get(agentMetrics.agentId);
      if (load) {
        load.averageResponseTime = agentMetrics.averageTaskDuration;
        load.successRate = agentMetrics.successRate;
        load.cpuUsage = agentMetrics.resourceUsage.cpu;
        load.memoryUsage = agentMetrics.resourceUsage.memory;
        load.lastUpdated = new Date();
        
        // Update weight based on performance
        load.weight = this.calculateAgentWeight(load);
      }
    }
    
    // Calculate load distribution metrics
    this.calculateLoadDistribution();
    
    this.emit('metrics:updated', this.getMetrics());
  }

  /**
   * Calculate agent weight for weighted algorithms
   */
  private calculateAgentWeight(load: AgentLoad): number {
    // Higher success rate = higher weight
    const successWeight = load.successRate;
    
    // Lower response time = higher weight
    const responseWeight = 1 / (1 + load.averageResponseTime / 1000);
    
    // Lower resource usage = higher weight
    const resourceWeight = 1 - (load.cpuUsage + load.memoryUsage) / 2;
    
    return (successWeight * 0.5 + responseWeight * 0.3 + resourceWeight * 0.2);
  }

  /**
   * Calculate load distribution metrics
   */
  private calculateLoadDistribution(): void {
    const loads = Array.from(this.agentLoads.values());
    if (loads.length === 0) return;
    
    // Average load
    const totalLoad = loads.reduce((sum, load) => sum + load.currentTasks, 0);
    this.metrics.averageLoadPerAgent = totalLoad / loads.length;
    
    // Load variance
    const variance = loads.reduce((sum, load) => {
      const diff = load.currentTasks - this.metrics.averageLoadPerAgent;
      return sum + diff * diff;
    }, 0) / loads.length;
    
    this.metrics.loadVariance = Math.sqrt(variance);
  }

  /**
   * Rebalance tasks across agents
   */
  private async rebalance(): Promise<void> {
    if (!this.shouldRebalance()) return;
    
    const loads = Array.from(this.agentLoads.values());
    const averageLoad = this.metrics.averageLoadPerAgent;
    
    // Find overloaded and underloaded agents
    const overloaded = loads.filter(l => l.currentTasks > averageLoad * 1.5);
    const underloaded = loads.filter(l => l.currentTasks < averageLoad * 0.5);
    
    if (overloaded.length === 0 || underloaded.length === 0) return;
    
    // Move tasks from overloaded to underloaded
    let rebalanced = 0;
    for (const over of overloaded) {
      const tasksToMove = Math.floor((over.currentTasks - averageLoad) / 2);
      
      for (let i = 0; i < tasksToMove && underloaded.length > 0; i++) {
        // Find best target
        const target = underloaded.reduce((best, current) => 
          current.currentTasks < best.currentTasks ? current : best
        );
        
        // Simulate task movement (in real implementation would actually move tasks)
        over.currentTasks--;
        target.currentTasks++;
        rebalanced++;
        
        if (target.currentTasks >= averageLoad) {
          underloaded.splice(underloaded.indexOf(target), 1);
        }
      }
    }
    
    this.metrics.rebalanceCount++;
    this.metrics.lastRebalance = new Date();
    
    this.emit('rebalance:completed', { tasksRebalanced: rebalanced });
  }

  /**
   * Check if rebalancing is needed
   */
  private shouldRebalance(): boolean {
    // Don't rebalance if variance is low
    if (this.metrics.loadVariance < 2) return false;
    
    // Don't rebalance too frequently
    const timeSinceLastRebalance = Date.now() - this.metrics.lastRebalance.getTime();
    if (timeSinceLastRebalance < this.config.rebalanceInterval / 2) return false;
    
    return true;
  }

  /**
   * Get agent metrics from monitor
   */
  private getAgentMetricsFromMonitor(agentId: string): AgentMetrics | null {
    const dashboardData = this.monitor.getDashboardData();
    return dashboardData.agents.find(a => a.agentId === agentId) || null;
  }

  /**
   * Get current metrics
   */
  getMetrics(): LoadBalancerMetrics {
    return { ...this.metrics };
  }

  /**
   * Get agent loads
   */
  getAgentLoads(): AgentLoad[] {
    return Array.from(this.agentLoads.values());
  }

  /**
   * Stop the load balancer
   */
  stop(): void {
    if (this.loadUpdateTimer) {
      clearInterval(this.loadUpdateTimer);
    }
    if (this.rebalanceTimer) {
      clearInterval(this.rebalanceTimer);
    }
    this.removeAllListeners();
  }

  /**
   * Enable/disable auto-scaling
   */
  setAutoScaling(enabled: boolean): void {
    this.config.enableAutoScaling = enabled;
    this.emit('autoscaling:changed', { enabled });
  }

  /**
   * Update algorithm
   */
  setAlgorithm(algorithm: LoadBalancerConfig['algorithm']): void {
    this.config.algorithm = algorithm;
    this.emit('algorithm:changed', { algorithm });
  }
}