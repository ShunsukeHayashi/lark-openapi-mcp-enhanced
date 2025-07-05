/**
 * Redis Backend for Distributed Task Queue
 * Provides persistence and multi-instance support
 */

import { TaskQueueBackend, QueuedTask, QueueStats, TaskPriority } from './task-queue';

interface ProcessingTask extends QueuedTask {
  processingStarted?: number;
  visibilityTimeout?: number;
}

// Mock Redis client interface (actual implementation would use ioredis)
interface RedisClient {
  zadd(key: string, score: number, value: string): Promise<number>;
  zrange(key: string, start: number, stop: number): Promise<string[]>;
  zrem(key: string, member: string): Promise<number>;
  zcard(key: string): Promise<number>;
  hset(key: string, field: string, value: string): Promise<number>;
  hget(key: string, field: string): Promise<string | null>;
  hdel(key: string, field: string): Promise<number>;
  hgetall(key: string): Promise<Record<string, string>>;
  del(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  incr(key: string): Promise<number>;
  lpush(key: string, value: string): Promise<number>;
  llen(key: string): Promise<number>;
  ltrim(key: string, start: number, stop: number): Promise<string>;
}

/**
 * Redis-backed task queue implementation
 */
export class RedisQueueBackend extends TaskQueueBackend {
  private client: RedisClient;
  private keyPrefix: string;
  private visibilityTimeout: number;

  constructor(client: RedisClient, keyPrefix: string = 'taskqueue', visibilityTimeout: number = 30000) {
    super();
    this.client = client;
    this.keyPrefix = keyPrefix;
    this.visibilityTimeout = visibilityTimeout;
  }

  private getKey(suffix: string): string {
    return `${this.keyPrefix}:${suffix}`;
  }

  async enqueue(task: QueuedTask): Promise<void> {
    const taskData = JSON.stringify(task);
    const score = this.getPriorityScore(task.priority, task.queuedAt);
    
    // Add to priority queue
    await this.client.zadd(
      this.getKey(`queue:${task.priority}`),
      score,
      task.id
    );
    
    // Store task data
    await this.client.hset(
      this.getKey('tasks'),
      task.id,
      taskData
    );
    
    // Update metrics
    await this.client.incr(this.getKey('metrics:enqueued'));
  }

  async dequeue(priority?: TaskPriority): Promise<QueuedTask | null> {
    const priorities: TaskPriority[] = priority 
      ? [priority] 
      : ['urgent', 'high', 'medium', 'low'];

    for (const p of priorities) {
      const queueKey = this.getKey(`queue:${p}`);
      
      // Get next task ID
      const taskIds = await this.client.zrange(queueKey, 0, 0);
      if (taskIds.length === 0) continue;
      
      const taskId = taskIds[0];
      
      // Remove from queue
      const removed = await this.client.zrem(queueKey, taskId);
      if (removed === 0) continue; // Already taken by another worker
      
      // Get task data
      const taskData = await this.client.hget(this.getKey('tasks'), taskId);
      if (!taskData) continue;
      
      const task = JSON.parse(taskData) as QueuedTask;
      
      // Move to processing
      await this.client.hset(
        this.getKey('processing'),
        taskId,
        JSON.stringify({
          ...task,
          processingStarted: Date.now(),
          visibilityTimeout: Date.now() + this.visibilityTimeout,
        })
      );
      
      // Set visibility timeout
      await this.client.expire(
        this.getKey(`processing:${taskId}`),
        Math.ceil(this.visibilityTimeout / 1000)
      );
      
      // Update metrics
      await this.client.incr(this.getKey('metrics:dequeued'));
      
      // Record wait time
      const waitTime = Date.now() - new Date(task.queuedAt).getTime();
      await this.recordMetric('wait_times', waitTime);
      
      return task;
    }

    return null;
  }

  async peek(count: number): Promise<QueuedTask[]> {
    const tasks: QueuedTask[] = [];
    const priorities: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];

    for (const priority of priorities) {
      const taskIds = await this.client.zrange(
        this.getKey(`queue:${priority}`),
        0,
        count - tasks.length - 1
      );
      
      for (const taskId of taskIds) {
        const taskData = await this.client.hget(this.getKey('tasks'), taskId);
        if (taskData) {
          tasks.push(JSON.parse(taskData));
          if (tasks.length >= count) return tasks;
        }
      }
    }

    return tasks;
  }

  async acknowledge(taskId: string): Promise<void> {
    // Get task from processing
    const processingData = await this.client.hget(this.getKey('processing'), taskId);
    if (!processingData) {
      throw new Error(`Task ${taskId} not found in processing queue`);
    }

    const task = JSON.parse(processingData) as ProcessingTask;
    
    // Remove from processing
    await this.client.hdel(this.getKey('processing'), taskId);
    
    // Move to completed
    await this.client.hset(
      this.getKey('completed'),
      taskId,
      JSON.stringify({
        ...task,
        completedAt: new Date(),
      })
    );
    
    // Update metrics
    await this.client.incr(this.getKey('metrics:completed'));
    
    // Record processing time
    if (task.processingStarted) {
      const processingTime = Date.now() - task.processingStarted;
      await this.recordMetric('processing_times', processingTime);
    }
  }

  async fail(taskId: string, error: string): Promise<void> {
    // Get task from processing
    const processingData = await this.client.hget(this.getKey('processing'), taskId);
    if (!processingData) {
      throw new Error(`Task ${taskId} not found in processing queue`);
    }

    const task = JSON.parse(processingData) as ProcessingTask;
    
    // Remove from processing
    await this.client.hdel(this.getKey('processing'), taskId);
    
    // Move to failed
    await this.client.hset(
      this.getKey('failed'),
      taskId,
      JSON.stringify({
        ...task,
        status: 'failed',
        error,
        failedAt: new Date(),
      })
    );
    
    // Update metrics
    await this.client.incr(this.getKey('metrics:failed'));
  }

  async retry(taskId: string, delay: number): Promise<void> {
    // Get task data
    let taskData = await this.client.hget(this.getKey('processing'), taskId);
    if (!taskData) {
      taskData = await this.client.hget(this.getKey('failed'), taskId);
    }
    
    if (!taskData) {
      throw new Error(`Task ${taskId} not found`);
    }

    const task = JSON.parse(taskData) as QueuedTask;
    task.attempts++;
    task.retryAfter = new Date(Date.now() + delay);
    task.status = 'pending';
    
    // Remove from current location
    await this.client.hdel(this.getKey('processing'), taskId);
    await this.client.hdel(this.getKey('failed'), taskId);
    
    // Re-enqueue with delay
    const score = this.getPriorityScore(task.priority, task.retryAfter);
    await this.client.zadd(
      this.getKey(`queue:${task.priority}`),
      score,
      taskId
    );
    
    // Update task data
    await this.client.hset(
      this.getKey('tasks'),
      taskId,
      JSON.stringify(task)
    );
  }

  async remove(taskId: string): Promise<void> {
    const priorities: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];
    
    // Remove from all possible locations
    for (const priority of priorities) {
      await this.client.zrem(this.getKey(`queue:${priority}`), taskId);
    }
    
    await this.client.hdel(this.getKey('tasks'), taskId);
    await this.client.hdel(this.getKey('processing'), taskId);
    await this.client.hdel(this.getKey('completed'), taskId);
    await this.client.hdel(this.getKey('failed'), taskId);
  }

  async size(): Promise<number> {
    const priorities: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];
    let total = 0;
    
    for (const priority of priorities) {
      const count = await this.client.zcard(this.getKey(`queue:${priority}`));
      total += count;
    }
    
    return total;
  }

  async clear(): Promise<void> {
    const keys = [
      'queue:urgent',
      'queue:high',
      'queue:medium',
      'queue:low',
      'tasks',
      'processing',
      'completed',
      'failed',
      'metrics:enqueued',
      'metrics:dequeued',
      'metrics:completed',
      'metrics:failed',
      'metrics:wait_times',
      'metrics:processing_times',
    ];
    
    for (const key of keys) {
      await this.client.del(this.getKey(key));
    }
  }

  async getTask(taskId: string): Promise<QueuedTask | null> {
    // Check all possible locations
    const locations = ['tasks', 'processing', 'completed', 'failed'];
    
    for (const location of locations) {
      const taskData = await this.client.hget(this.getKey(location), taskId);
      if (taskData) {
        return JSON.parse(taskData);
      }
    }
    
    return null;
  }

  async updateTask(taskId: string, updates: Partial<QueuedTask>): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const updatedTask = { ...task, ...updates };
    
    // Find current location and update
    const locations = ['tasks', 'processing', 'completed', 'failed'];
    for (const location of locations) {
      const exists = await this.client.hget(this.getKey(location), taskId);
      if (exists) {
        await this.client.hset(
          this.getKey(location),
          taskId,
          JSON.stringify(updatedTask)
        );
        break;
      }
    }
  }

  async getStats(): Promise<QueueStats> {
    // Get queue depths
    const queueDepth: Record<string, number> = {
      urgent: await this.client.zcard(this.getKey('queue:urgent')),
      high: await this.client.zcard(this.getKey('queue:high')),
      medium: await this.client.zcard(this.getKey('queue:medium')),
      low: await this.client.zcard(this.getKey('queue:low')),
    };

    // Get counts
    const processingCount = await this.client.hgetall(this.getKey('processing'));
    const completedCount = await this.client.hgetall(this.getKey('completed'));
    const failedCount = await this.client.hgetall(this.getKey('failed'));

    // Get metrics
    const metrics = await this.getMetrics();
    
    return {
      pending: await this.size(),
      processing: Object.keys(processingCount).length,
      completed: Object.keys(completedCount).length,
      failed: Object.keys(failedCount).length,
      retrying: 0, // Would need to calculate from tasks with retryAfter
      averageWaitTime: metrics.avgWaitTime,
      averageProcessingTime: metrics.avgProcessingTime,
      throughput: metrics.throughput,
      queueDepth,
    };
  }

  /**
   * Get priority score for sorted set
   */
  private getPriorityScore(priority: TaskPriority, time: Date): number {
    const priorityWeights: Record<TaskPriority, number> = {
      urgent: 0,
      high: 1000000000,
      medium: 2000000000,
      low: 3000000000,
    };
    
    return priorityWeights[priority] + time.getTime();
  }

  /**
   * Record a metric value
   */
  private async recordMetric(type: string, value: number): Promise<void> {
    const key = this.getKey(`metrics:${type}`);
    await this.client.lpush(key, value.toString());
    
    // Keep only last 100 values
    await this.client.ltrim(key, 0, 99);
  }

  /**
   * Get calculated metrics
   */
  private async getMetrics(): Promise<{
    avgWaitTime: number;
    avgProcessingTime: number;
    throughput: number;
  }> {
    // Get wait times
    const waitTimes = await this.client.llen(this.getKey('metrics:wait_times'));
    let avgWaitTime = 0;
    if (waitTimes > 0) {
      // In real implementation, would calculate average
      avgWaitTime = 5000; // Mock value
    }

    // Get processing times
    const processingTimes = await this.client.llen(this.getKey('metrics:processing_times'));
    let avgProcessingTime = 0;
    if (processingTimes > 0) {
      // In real implementation, would calculate average
      avgProcessingTime = 1000; // Mock value
    }

    // Calculate throughput
    const completed = parseInt(await this.client.hget(this.getKey('metrics:completed'), 'count') || '0');
    const throughput = completed / (Date.now() / 1000 / 60); // per minute

    return {
      avgWaitTime,
      avgProcessingTime,
      throughput,
    };
  }

  /**
   * Recover stale tasks from processing queue
   */
  async recoverStaleTasks(): Promise<number> {
    const processingTasks = await this.client.hgetall(this.getKey('processing'));
    let recovered = 0;
    
    for (const [taskId, taskData] of Object.entries(processingTasks)) {
      const task = JSON.parse(taskData);
      
      // Check if task has exceeded visibility timeout
      if (task.visibilityTimeout && Date.now() > task.visibilityTimeout) {
        // Move back to queue
        await this.client.hdel(this.getKey('processing'), taskId);
        await this.enqueue(task);
        recovered++;
      }
    }
    
    return recovered;
  }
}