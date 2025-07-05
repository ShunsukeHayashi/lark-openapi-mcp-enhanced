/**
 * Real-time Performance Monitoring System
 * Tracks and visualizes agent and tool performance metrics
 */

import { EventEmitter } from 'events';
import { Task } from '../types';
import { QueueStats } from '../queue/task-queue';
import { CircuitStats } from '../ml/circuit-breaker';

export interface PerformanceMetric {
  timestamp: Date;
  type: 'task' | 'tool' | 'agent' | 'system';
  name: string;
  value: number;
  unit: string;
  metadata?: Record<string, any>;
}

export interface AgentMetrics {
  agentId: string;
  agentName: string;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksFailed: number;
  averageTaskDuration: number;
  successRate: number;
  lastActive: Date;
  resourceUsage: {
    cpu: number;
    memory: number;
    activeConnections: number;
  };
}

export interface ToolMetrics {
  toolName: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
  averageExecutionTime: number;
  p95ExecutionTime: number;
  p99ExecutionTime: number;
  errorRate: number;
  lastExecution: Date;
  circuitBreakerStatus?: string;
}

export interface SystemMetrics {
  timestamp: Date;
  totalAgents: number;
  activeAgents: number;
  totalTasks: number;
  tasksPerMinute: number;
  averageResponseTime: number;
  systemLoad: number;
  queueMetrics: QueueStats;
  alertsActive: number;
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  source: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: Record<string, any>;
}

export interface DashboardConfig {
  refreshInterval: number;
  retentionPeriod: number;
  aggregationInterval: number;
  alertThresholds: {
    errorRate: number;
    responseTime: number;
    queueDepth: number;
    circuitBreakerOpen: boolean;
  };
}

export class PerformanceMonitor extends EventEmitter {
  private metrics: PerformanceMetric[] = [];
  private agentMetrics: Map<string, AgentMetrics> = new Map();
  private toolMetrics: Map<string, ToolMetrics> = new Map();
  private systemMetrics: SystemMetrics[] = [];
  private alerts: Map<string, Alert> = new Map();
  private config: DashboardConfig;
  private aggregationTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<DashboardConfig> = {}) {
    super();
    
    this.config = {
      refreshInterval: 1000, // 1 second
      retentionPeriod: 3600000, // 1 hour
      aggregationInterval: 60000, // 1 minute
      alertThresholds: {
        errorRate: 0.1, // 10%
        responseTime: 5000, // 5 seconds
        queueDepth: 100,
        circuitBreakerOpen: true,
      },
      ...config,
    };

    this.startAggregation();
    this.startCleanup();
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.metrics.push(fullMetric);
    this.emit('metric:recorded', fullMetric);

    // Update specific metric stores
    this.updateMetricStores(fullMetric);
  }

  /**
   * Update agent metrics
   */
  updateAgentMetrics(agentId: string, updates: Partial<AgentMetrics>): void {
    const existing = this.agentMetrics.get(agentId) || {
      agentId,
      agentName: updates.agentName || agentId,
      tasksCompleted: 0,
      tasksInProgress: 0,
      tasksFailed: 0,
      averageTaskDuration: 0,
      successRate: 0,
      lastActive: new Date(),
      resourceUsage: {
        cpu: 0,
        memory: 0,
        activeConnections: 0,
      },
    };

    const updated = { ...existing, ...updates, lastActive: new Date() };
    
    // Recalculate success rate
    const total = updated.tasksCompleted + updated.tasksFailed;
    if (total > 0) {
      updated.successRate = updated.tasksCompleted / total;
    }

    this.agentMetrics.set(agentId, updated);
    this.emit('agent:updated', updated);
  }

  /**
   * Update tool metrics
   */
  updateToolMetrics(toolName: string, execution: {
    success: boolean;
    executionTime: number;
    error?: string;
  }): void {
    const existing = this.toolMetrics.get(toolName) || {
      toolName,
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
      averageExecutionTime: 0,
      p95ExecutionTime: 0,
      p99ExecutionTime: 0,
      errorRate: 0,
      lastExecution: new Date(),
    };

    // Update counts
    existing.executionCount++;
    if (execution.success) {
      existing.successCount++;
    } else {
      existing.failureCount++;
    }

    // Update average execution time
    existing.averageExecutionTime = 
      (existing.averageExecutionTime * (existing.executionCount - 1) + execution.executionTime) / 
      existing.executionCount;

    // Update error rate
    existing.errorRate = existing.failureCount / existing.executionCount;

    // Update last execution
    existing.lastExecution = new Date();

    this.toolMetrics.set(toolName, existing);
    this.emit('tool:updated', existing);

    // Check for alerts
    this.checkToolAlerts(existing);
  }

  /**
   * Update system metrics
   */
  updateSystemMetrics(metrics: Partial<SystemMetrics>): void {
    const systemMetric: SystemMetrics = {
      timestamp: new Date(),
      totalAgents: this.agentMetrics.size,
      activeAgents: Array.from(this.agentMetrics.values()).filter(
        a => new Date().getTime() - a.lastActive.getTime() < 60000
      ).length,
      totalTasks: 0,
      tasksPerMinute: 0,
      averageResponseTime: 0,
      systemLoad: 0,
      queueMetrics: metrics.queueMetrics || {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        retrying: 0,
        averageWaitTime: 0,
        averageProcessingTime: 0,
        throughput: 0,
        queueDepth: {},
      },
      alertsActive: Array.from(this.alerts.values()).filter(a => !a.resolved).length,
      ...metrics,
    };

    this.systemMetrics.push(systemMetric);
    this.emit('system:updated', systemMetric);

    // Check system alerts
    this.checkSystemAlerts(systemMetric);
  }

  /**
   * Create an alert
   */
  createAlert(
    type: Alert['type'], 
    source: string, 
    message: string, 
    metadata?: Record<string, any>
  ): string {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random()}`,
      type,
      source,
      message,
      timestamp: new Date(),
      resolved: false,
      metadata,
    };

    this.alerts.set(alert.id, alert);
    this.emit('alert:created', alert);

    return alert.id;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      this.emit('alert:resolved', alert);
    }
  }

  /**
   * Get dashboard data
   */
  getDashboardData(): {
    agents: AgentMetrics[];
    tools: ToolMetrics[];
    system: SystemMetrics | null;
    alerts: Alert[];
    recentMetrics: PerformanceMetric[];
  } {
    const now = new Date().getTime();
    const retentionCutoff = now - this.config.retentionPeriod;

    return {
      agents: Array.from(this.agentMetrics.values()),
      tools: Array.from(this.toolMetrics.values()),
      system: this.systemMetrics[this.systemMetrics.length - 1] || null,
      alerts: Array.from(this.alerts.values()).filter(a => !a.resolved),
      recentMetrics: this.metrics.filter(
        m => m.timestamp.getTime() > retentionCutoff
      ).slice(-100), // Last 100 metrics
    };
  }

  /**
   * Get time series data for a specific metric
   */
  getTimeSeries(
    metricType: string, 
    metricName: string, 
    duration: number = 3600000
  ): Array<{ timestamp: Date; value: number }> {
    const cutoff = new Date().getTime() - duration;
    
    return this.metrics
      .filter(m => 
        m.type === metricType && 
        m.name === metricName && 
        m.timestamp.getTime() > cutoff
      )
      .map(m => ({ timestamp: m.timestamp, value: m.value }));
  }

  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics(interval: number = 60000): {
    timestamp: Date;
    avgResponseTime: number;
    throughput: number;
    errorRate: number;
    activeAgents: number;
  }[] {
    const now = new Date().getTime();
    const buckets = new Map<number, any[]>();

    // Group metrics by time bucket
    this.metrics.forEach(metric => {
      const bucket = Math.floor(metric.timestamp.getTime() / interval) * interval;
      if (!buckets.has(bucket)) {
        buckets.set(bucket, []);
      }
      buckets.get(bucket)!.push(metric);
    });

    // Calculate aggregates for each bucket
    return Array.from(buckets.entries())
      .map(([timestamp, metrics]) => {
        const responseTimeMetrics = metrics.filter(m => m.unit === 'ms');
        const errorMetrics = metrics.filter(m => m.type === 'tool' && m.metadata?.error);

        return {
          timestamp: new Date(timestamp),
          avgResponseTime: responseTimeMetrics.length > 0
            ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
            : 0,
          throughput: metrics.filter(m => m.type === 'task').length,
          errorRate: metrics.length > 0 ? errorMetrics.length / metrics.length : 0,
          activeAgents: this.getActiveAgentsAt(new Date(timestamp)),
        };
      })
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Start metric aggregation
   */
  private startAggregation(): void {
    this.aggregationTimer = setInterval(() => {
      this.performAggregation();
    }, this.config.aggregationInterval);
  }

  /**
   * Start cleanup process
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldData();
    }, 300000); // Every 5 minutes
  }

  /**
   * Perform metric aggregation
   */
  private performAggregation(): void {
    const aggregated = this.getAggregatedMetrics(this.config.aggregationInterval);
    if (aggregated.length > 0) {
      const latest = aggregated[aggregated.length - 1];
      this.emit('metrics:aggregated', latest);
    }
  }

  /**
   * Clean up old data
   */
  private cleanupOldData(): void {
    const cutoff = new Date().getTime() - this.config.retentionPeriod;

    // Clean metrics
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > cutoff);

    // Clean system metrics
    this.systemMetrics = this.systemMetrics.filter(m => m.timestamp.getTime() > cutoff);

    // Clean resolved alerts older than retention period
    Array.from(this.alerts.entries()).forEach(([id, alert]) => {
      if (alert.resolved && alert.timestamp.getTime() < cutoff) {
        this.alerts.delete(id);
      }
    });
  }

  /**
   * Update metric stores
   */
  private updateMetricStores(metric: PerformanceMetric): void {
    if (metric.type === 'agent' && metric.metadata?.agentId) {
      const updates: Partial<AgentMetrics> = {};
      
      switch (metric.name) {
        case 'task_completed':
          updates.tasksCompleted = (this.agentMetrics.get(metric.metadata.agentId)?.tasksCompleted || 0) + 1;
          break;
        case 'task_failed':
          updates.tasksFailed = (this.agentMetrics.get(metric.metadata.agentId)?.tasksFailed || 0) + 1;
          break;
        case 'task_duration':
          updates.averageTaskDuration = metric.value;
          break;
      }

      if (Object.keys(updates).length > 0) {
        this.updateAgentMetrics(metric.metadata.agentId, updates);
      }
    }
  }

  /**
   * Check tool alerts
   */
  private checkToolAlerts(metrics: ToolMetrics): void {
    // Check error rate
    if (metrics.errorRate > this.config.alertThresholds.errorRate) {
      this.createAlert(
        'warning',
        `tool:${metrics.toolName}`,
        `High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`,
        { errorRate: metrics.errorRate }
      );
    }

    // Check response time
    if (metrics.averageExecutionTime > this.config.alertThresholds.responseTime) {
      this.createAlert(
        'warning',
        `tool:${metrics.toolName}`,
        `Slow response time: ${metrics.averageExecutionTime.toFixed(0)}ms`,
        { responseTime: metrics.averageExecutionTime }
      );
    }
  }

  /**
   * Check system alerts
   */
  private checkSystemAlerts(metrics: SystemMetrics): void {
    // Check queue depth
    const totalQueueDepth = Object.values(metrics.queueMetrics.queueDepth).reduce((sum, depth) => sum + depth, 0);
    if (totalQueueDepth > this.config.alertThresholds.queueDepth) {
      this.createAlert(
        'warning',
        'system:queue',
        `High queue depth: ${totalQueueDepth} tasks pending`,
        { queueDepth: totalQueueDepth }
      );
    }

    // Check system response time
    if (metrics.averageResponseTime > this.config.alertThresholds.responseTime) {
      this.createAlert(
        'critical',
        'system:performance',
        `System response time degraded: ${metrics.averageResponseTime.toFixed(0)}ms`,
        { responseTime: metrics.averageResponseTime }
      );
    }
  }

  /**
   * Get active agents at a specific time
   */
  private getActiveAgentsAt(timestamp: Date): number {
    return Array.from(this.agentMetrics.values()).filter(
      agent => agent.lastActive >= timestamp
    ).length;
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.removeAllListeners();
  }

  /**
   * Export metrics data
   */
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      agents: Array.from(this.agentMetrics.entries()),
      tools: Array.from(this.toolMetrics.entries()),
      system: this.systemMetrics,
      alerts: Array.from(this.alerts.entries()),
      exported: new Date(),
    });
  }

  /**
   * Import metrics data
   */
  importMetrics(data: string): void {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.metrics) {
        this.metrics = parsed.metrics.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
      }

      if (parsed.agents) {
        this.agentMetrics = new Map(parsed.agents);
      }

      if (parsed.tools) {
        this.toolMetrics = new Map(parsed.tools);
      }

      if (parsed.system) {
        this.systemMetrics = parsed.system.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
      }

      if (parsed.alerts) {
        this.alerts = new Map(parsed.alerts);
      }
    } catch (error) {
      throw new Error(`Failed to import metrics: ${error}`);
    }
  }
}