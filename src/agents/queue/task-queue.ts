/**
 * Distributed Task Queue System
 * Supports both Redis and in-memory backends for flexibility
 */

import { EventEmitter } from 'events';
import { Task } from '../types';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface QueuedTask extends Task {
  queuedAt: Date;
  attempts: number;
  lastAttempt?: Date;
  retryAfter?: Date;
  metadata?: Record<string, any>;
}

export interface TaskQueueConfig {
  maxRetries: number;
  retryDelay: number;
  visibilityTimeout: number;
  maxConcurrency: number;
  priorityLevels: number;
  staleTimeout: number;
  enablePersistence: boolean;
  backendType: 'memory' | 'redis';
  redisUrl?: string;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  retrying: number;
  averageWaitTime: number;
  averageProcessingTime: number;
  throughput: number;
  queueDepth: Record<string, number>;
}

export abstract class TaskQueueBackend {
  abstract enqueue(task: QueuedTask): Promise<void>;
  abstract dequeue(priority?: TaskPriority): Promise<QueuedTask | null>;
  abstract peek(count: number): Promise<QueuedTask[]>;
  abstract acknowledge(taskId: string): Promise<void>;
  abstract fail(taskId: string, error: string): Promise<void>;
  abstract retry(taskId: string, delay: number): Promise<void>;
  abstract remove(taskId: string): Promise<void>;
  abstract size(): Promise<number>;
  abstract clear(): Promise<void>;
  abstract getTask(taskId: string): Promise<QueuedTask | null>;
  abstract updateTask(taskId: string, updates: Partial<QueuedTask>): Promise<void>;
  abstract getStats(): Promise<QueueStats>;
}

/**
 * In-memory implementation of task queue
 */
export class InMemoryQueueBackend extends TaskQueueBackend {
  private queues: Map<string, QueuedTask[]> = new Map();
  private processing: Map<string, QueuedTask> = new Map();
  private completed: Map<string, QueuedTask> = new Map();
  private failed: Map<string, QueuedTask> = new Map();
  private taskIndex: Map<string, QueuedTask> = new Map();
  private metrics: {
    totalEnqueued: number;
    totalDequeued: number;
    totalCompleted: number;
    totalFailed: number;
    waitTimes: number[];
    processingTimes: number[];
  } = {
    totalEnqueued: 0,
    totalDequeued: 0,
    totalCompleted: 0,
    totalFailed: 0,
    waitTimes: [],
    processingTimes: [],
  };

  constructor() {
    super();
    // Initialize priority queues based on Task priority types
    this.queues.set('urgent', []);
    this.queues.set('high', []);
    this.queues.set('medium', []);
    this.queues.set('low', []);
  }

  async enqueue(task: QueuedTask): Promise<void> {
    const queue = this.queues.get(task.priority);
    if (!queue) {
      throw new Error(`Invalid priority: ${task.priority}`);
    }

    task.queuedAt = new Date();
    queue.push(task);
    this.taskIndex.set(task.id, task);
    this.metrics.totalEnqueued++;

    // Sort by priority and queued time
    queue.sort((a, b) => {
      return a.queuedAt.getTime() - b.queuedAt.getTime();
    });
  }

  async dequeue(priority?: TaskPriority): Promise<QueuedTask | null> {
    const priorities: TaskPriority[] = priority 
      ? [priority] 
      : ['urgent', 'high', 'medium', 'low'];

    for (const p of priorities) {
      const queue = this.queues.get(p);
      if (queue && queue.length > 0) {
        const task = queue.shift();
        if (task) {
          this.processing.set(task.id, task);
          this.metrics.totalDequeued++;
          
          // Calculate wait time
          const waitTime = Date.now() - task.queuedAt.getTime();
          this.metrics.waitTimes.push(waitTime);
          
          // Keep only last 100 wait times
          if (this.metrics.waitTimes.length > 100) {
            this.metrics.waitTimes.shift();
          }
          
          return task;
        }
      }
    }

    return null;
  }

  async peek(count: number): Promise<QueuedTask[]> {
    const tasks: QueuedTask[] = [];
    const priorities: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];

    for (const priority of priorities) {
      const queue = this.queues.get(priority);
      if (queue) {
        tasks.push(...queue.slice(0, count - tasks.length));
        if (tasks.length >= count) break;
      }
    }

    return tasks;
  }

  async acknowledge(taskId: string): Promise<void> {
    const task = this.processing.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found in processing queue`);
    }

    this.processing.delete(taskId);
    this.completed.set(taskId, task);
    this.metrics.totalCompleted++;

    // Calculate processing time
    if (task.startedAt) {
      const processingTime = Date.now() - task.startedAt.getTime();
      this.metrics.processingTimes.push(processingTime);
      
      // Keep only last 100 processing times
      if (this.metrics.processingTimes.length > 100) {
        this.metrics.processingTimes.shift();
      }
    }
  }

  async fail(taskId: string, error: string): Promise<void> {
    const task = this.processing.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found in processing queue`);
    }

    task.error = error;
    task.status = 'failed';
    this.processing.delete(taskId);
    this.failed.set(taskId, task);
    this.metrics.totalFailed++;
  }

  async retry(taskId: string, delay: number): Promise<void> {
    const task = this.processing.get(taskId) || this.failed.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.attempts++;
    task.retryAfter = new Date(Date.now() + delay);
    task.status = 'pending';
    
    // Remove from current location
    this.processing.delete(taskId);
    this.failed.delete(taskId);
    
    // Re-enqueue
    await this.enqueue(task);
  }

  async remove(taskId: string): Promise<void> {
    // Remove from all possible locations
    for (const queue of this.queues.values()) {
      const index = queue.findIndex(t => t.id === taskId);
      if (index !== -1) {
        queue.splice(index, 1);
        break;
      }
    }
    
    this.processing.delete(taskId);
    this.completed.delete(taskId);
    this.failed.delete(taskId);
    this.taskIndex.delete(taskId);
  }

  async size(): Promise<number> {
    let total = 0;
    for (const queue of this.queues.values()) {
      total += queue.length;
    }
    return total;
  }

  async clear(): Promise<void> {
    for (const queue of this.queues.values()) {
      queue.length = 0;
    }
    this.processing.clear();
    this.completed.clear();
    this.failed.clear();
    this.taskIndex.clear();
    
    // Reset metrics
    this.metrics = {
      totalEnqueued: 0,
      totalDequeued: 0,
      totalCompleted: 0,
      totalFailed: 0,
      waitTimes: [],
      processingTimes: [],
    };
  }

  async getTask(taskId: string): Promise<QueuedTask | null> {
    return this.taskIndex.get(taskId) || null;
  }

  async updateTask(taskId: string, updates: Partial<QueuedTask>): Promise<void> {
    const task = this.taskIndex.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    Object.assign(task, updates);
  }

  async getStats(): Promise<QueueStats> {
    const queueDepth: Record<string, number> = {
      urgent: this.queues.get('urgent')?.length || 0,
      high: this.queues.get('high')?.length || 0,
      medium: this.queues.get('medium')?.length || 0,
      low: this.queues.get('low')?.length || 0,
    };

    const avgWaitTime = this.metrics.waitTimes.length > 0
      ? this.metrics.waitTimes.reduce((a, b) => a + b, 0) / this.metrics.waitTimes.length
      : 0;

    const avgProcessingTime = this.metrics.processingTimes.length > 0
      ? this.metrics.processingTimes.reduce((a, b) => a + b, 0) / this.metrics.processingTimes.length
      : 0;

    const throughput = this.metrics.totalCompleted / (Date.now() / 1000 / 60); // per minute

    return {
      pending: await this.size(),
      processing: this.processing.size,
      completed: this.completed.size,
      failed: this.failed.size,
      retrying: 0, // Calculate from queues with retryAfter
      averageWaitTime: avgWaitTime,
      averageProcessingTime: avgProcessingTime,
      throughput: throughput,
      queueDepth: queueDepth,
    };
  }
}

/**
 * Main Task Queue implementation
 */
export class TaskQueue extends EventEmitter {
  private backend: TaskQueueBackend;
  private config: TaskQueueConfig;
  private workers: Map<string, Worker> = new Map();
  private isRunning: boolean = false;
  private processInterval?: NodeJS.Timeout;

  constructor(config: Partial<TaskQueueConfig> = {}) {
    super();
    
    this.config = {
      maxRetries: 3,
      retryDelay: 5000,
      visibilityTimeout: 30000,
      maxConcurrency: 10,
      priorityLevels: 4,
      staleTimeout: 300000, // 5 minutes
      enablePersistence: false,
      backendType: 'memory',
      ...config,
    };

    // Initialize backend
    if (this.config.backendType === 'memory') {
      this.backend = new InMemoryQueueBackend();
    } else {
      throw new Error('Redis backend not implemented yet');
    }
  }

  /**
   * Enqueue a task
   */
  async enqueue(task: Task, options: {
    dependencies?: string[];
    metadata?: Record<string, any>;
  } = {}): Promise<void> {
    const queuedTask: QueuedTask = {
      ...task,
      queuedAt: new Date(),
      attempts: 0,
      dependencies: options.dependencies,
      metadata: options.metadata,
    };

    await this.backend.enqueue(queuedTask);
    this.emit('task:enqueued', queuedTask);
  }

  /**
   * Start processing tasks
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.processInterval = setInterval(() => {
      this.processTasks();
    }, 100);
    
    this.emit('queue:started');
  }

  /**
   * Stop processing tasks
   */
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.processInterval) {
      clearInterval(this.processInterval);
    }
    
    this.emit('queue:stopped');
  }

  /**
   * Process pending tasks
   */
  private async processTasks(): Promise<void> {
    // Check if we can process more tasks
    if (this.workers.size >= this.config.maxConcurrency) {
      return;
    }

    // Dequeue next task
    const task = await this.backend.dequeue();
    if (!task) return;

    // Check dependencies
    if (task.dependencies && task.dependencies.length > 0) {
      const allDepsCompleted = await this.checkDependencies(task.dependencies);
      if (!allDepsCompleted) {
        // Re-enqueue task
        await this.backend.enqueue(task);
        return;
      }
    }

    // Create worker
    const worker = new Worker(task, this);
    this.workers.set(task.id, worker);
    
    // Start processing
    this.emit('task:started', task);
    
    try {
      await worker.process();
      await this.backend.acknowledge(task.id);
      this.emit('task:completed', task);
    } catch (error) {
      await this.handleTaskError(task, error);
    } finally {
      this.workers.delete(task.id);
    }
  }

  /**
   * Handle task error
   */
  private async handleTaskError(task: QueuedTask, error: any): Promise<void> {
    task.attempts++;
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (task.attempts < this.config.maxRetries) {
      // Retry with exponential backoff
      const delay = this.config.retryDelay * Math.pow(2, task.attempts - 1);
      await this.backend.retry(task.id, delay);
      this.emit('task:retrying', task, delay);
    } else {
      // Max retries exceeded
      await this.backend.fail(task.id, errorMessage);
      this.emit('task:failed', task, errorMessage);
    }
  }

  /**
   * Check if all dependencies are completed
   */
  private async checkDependencies(dependencies: string[]): Promise<boolean> {
    for (const depId of dependencies) {
      const depTask = await this.backend.getTask(depId);
      if (!depTask || depTask.status !== 'completed') {
        return false;
      }
    }
    return true;
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    return this.backend.getStats();
  }

  /**
   * Clear the queue
   */
  async clear(): Promise<void> {
    await this.backend.clear();
    this.emit('queue:cleared');
  }

  /**
   * Get pending tasks
   */
  async getPendingTasks(count: number = 10): Promise<QueuedTask[]> {
    return this.backend.peek(count);
  }

  /**
   * Remove a specific task
   */
  async removeTask(taskId: string): Promise<void> {
    await this.backend.remove(taskId);
    this.emit('task:removed', taskId);
  }

  /**
   * Update task priority
   */
  async updateTaskPriority(taskId: string, priority: TaskPriority): Promise<void> {
    const task = await this.backend.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Remove and re-enqueue with new priority
    await this.backend.remove(taskId);
    task.priority = priority;
    await this.backend.enqueue(task);
    
    this.emit('task:priority_changed', taskId, priority);
  }
}

/**
 * Worker class for processing tasks
 */
class Worker {
  constructor(
    private task: QueuedTask,
    private queue: TaskQueue
  ) {}

  async process(): Promise<void> {
    // Update task status
    this.task.status = 'in_progress';
    this.task.startedAt = new Date();
    
    // Simulate processing (this would be replaced with actual task execution)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mark as completed
    this.task.status = 'completed';
    this.task.completedAt = new Date();
  }
}

/**
 * Priority Queue Manager
 */
export class PriorityQueueManager {
  private queues: Map<string, TaskQueue> = new Map();

  /**
   * Get or create a queue
   */
  getQueue(name: string, config?: Partial<TaskQueueConfig>): TaskQueue {
    let queue = this.queues.get(name);
    
    if (!queue) {
      queue = new TaskQueue(config);
      this.queues.set(name, queue);
    }
    
    return queue;
  }

  /**
   * Remove a queue
   */
  removeQueue(name: string): void {
    const queue = this.queues.get(name);
    if (queue) {
      queue.stop();
      this.queues.delete(name);
    }
  }

  /**
   * Get all queues
   */
  getAllQueues(): Map<string, TaskQueue> {
    return new Map(this.queues);
  }

  /**
   * Get combined stats for all queues
   */
  async getCombinedStats(): Promise<Record<string, QueueStats>> {
    const stats: Record<string, QueueStats> = {};
    
    for (const [name, queue] of this.queues) {
      stats[name] = await queue.getStats();
    }
    
    return stats;
  }
}