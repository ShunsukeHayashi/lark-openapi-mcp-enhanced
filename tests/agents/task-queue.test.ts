/**
 * Test Distributed Task Queue System
 */

import { 
  TaskQueue, 
  QueuedTask, 
  InMemoryQueueBackend, 
  PriorityQueueManager 
} from '../../src/agents/queue/task-queue';
import { CoordinatorAgent, createCoordinatorInstance } from '../../src/agents/specialists/coordinator-agent';
import { LarkMcpToolOptions } from '../../src/mcp-tool/types';
import { Task } from '../../src/agents/types';

// Helper function to create test tasks
function createTestTask(overrides: Partial<Task> = {}): Task {
  return {
    id: `task_${Date.now()}_${Math.random()}`,
    name: 'Test task',
    description: 'Test task description',
    type: 'simple',
    priority: 'medium',
    requiredCapabilities: [],
    context: {},
    status: 'pending',
    createdAt: new Date(),
    ...overrides,
  };
}

function createQueuedTask(overrides: Partial<QueuedTask> = {}): QueuedTask {
  const task = createTestTask(overrides);
  return {
    ...task,
    queuedAt: new Date(),
    attempts: 0,
    ...overrides,
  };
}

describe('Task Queue System', () => {
  describe('InMemoryQueueBackend', () => {
    let backend: InMemoryQueueBackend;

    beforeEach(() => {
      backend = new InMemoryQueueBackend();
    });

    test('should enqueue and dequeue tasks by priority', async () => {
      const lowTask: QueuedTask = {
        id: 'task1',
        name: 'Low priority task',
        description: 'Low priority task',
        type: 'simple',
        priority: 'low',
        requiredCapabilities: [],
        context: {},
        status: 'pending',
        createdAt: new Date(),
        queuedAt: new Date(),
        attempts: 0,
      };

      const highTask: QueuedTask = {
        id: 'task2',
        name: 'High priority task',
        description: 'High priority task',
        type: 'simple',
        priority: 'high',
        requiredCapabilities: [],
        context: {},
        status: 'pending',
        createdAt: new Date(),
        queuedAt: new Date(),
        attempts: 0,
      };

      const urgentTask: QueuedTask = {
        id: 'task3',
        name: 'Urgent task',
        description: 'Urgent task',
        type: 'simple',
        priority: 'urgent',
        requiredCapabilities: [],
        context: {},
        status: 'pending',
        createdAt: new Date(),
        queuedAt: new Date(),
        attempts: 0,
      };

      // Enqueue in order: low, high, urgent
      await backend.enqueue(lowTask);
      await backend.enqueue(highTask);
      await backend.enqueue(urgentTask);

      // Should dequeue in priority order
      const first = await backend.dequeue();
      expect(first?.priority).toBe('urgent');

      const second = await backend.dequeue();
      expect(second?.priority).toBe('high');

      const third = await backend.dequeue();
      expect(third?.priority).toBe('low');

      const fourth = await backend.dequeue();
      expect(fourth).toBeNull();
    });

    test('should handle task acknowledgment and failure', async () => {
      const task = createQueuedTask({ id: 'task1', description: 'Test task' });

      await backend.enqueue(task);
      const dequeued = await backend.dequeue();
      expect(dequeued).toBeDefined();

      // Acknowledge success
      await backend.acknowledge(task.id);
      const stats = await backend.getStats();
      expect(stats.completed).toBe(1);

      // Test failure
      const task2 = createQueuedTask({ id: 'task2', description: 'Test task 2' });
      await backend.enqueue(task2);
      await backend.dequeue();
      await backend.fail(task2.id, 'Test error');
      
      const stats2 = await backend.getStats();
      expect(stats2.failed).toBe(1);
    });

    test('should handle task retry', async () => {
      const task = createQueuedTask({ id: 'task1', description: 'Retry task' });

      await backend.enqueue(task);
      await backend.dequeue();
      
      // Retry with delay
      await backend.retry(task.id, 1000);
      
      const retryTask = await backend.getTask(task.id);
      expect(retryTask?.attempts).toBe(1);
      expect(retryTask?.retryAfter).toBeDefined();
    });

    test('should calculate queue statistics', async () => {
      // Add multiple tasks
      for (let i = 0; i < 5; i++) {
        await backend.enqueue(createQueuedTask({
          id: `task${i}`,
          description: `Task ${i}`,
          priority: i < 2 ? 'high' : 'medium',
        }));
      }

      const stats = await backend.getStats();
      expect(stats.pending).toBe(5);
      expect(stats.queueDepth.high).toBe(2);
      expect(stats.queueDepth.medium).toBe(3);
    });
  });

  describe('TaskQueue', () => {
    let queue: TaskQueue;

    beforeEach(() => {
      queue = new TaskQueue({
        maxRetries: 2,
        retryDelay: 100,
        maxConcurrency: 2,
      });
    });

    afterEach(() => {
      queue.stop();
    });

    test('should process tasks with event emissions', async () => {
      const events: string[] = [];
      
      queue.on('task:enqueued', () => events.push('enqueued'));
      queue.on('task:started', () => events.push('started'));
      queue.on('task:completed', () => events.push('completed'));

      const task = createTestTask({ id: 'test1', description: 'Test task' });

      await queue.enqueue(task);
      queue.start();

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      expect(events).toContain('enqueued');
      expect(events).toContain('started');
      expect(events).toContain('completed');
    });

    test('should handle task dependencies', async () => {
      const task1 = createTestTask({ id: 'dep1', description: 'Dependency task' });
      const task2 = createTestTask({ id: 'main1', description: 'Main task' });

      // Enqueue with dependency
      await queue.enqueue(task1);
      await queue.enqueue(task2, { dependencies: ['dep1'] });

      const pendingTasks = await queue.getPendingTasks(10);
      expect(pendingTasks).toHaveLength(2);
    });

    test('should update task priority', async () => {
      const task = createTestTask({ id: 'priority1', description: 'Priority test' });

      await queue.enqueue(task);
      await queue.updateTaskPriority('priority1', 'urgent');

      const pendingTasks = await queue.getPendingTasks(1);
      expect(pendingTasks[0]?.priority).toBe('urgent');
    });
  });

  describe('PriorityQueueManager', () => {
    let manager: PriorityQueueManager;

    beforeEach(() => {
      manager = new PriorityQueueManager();
    });

    afterEach(() => {
      // Clean up all queues
      manager.getAllQueues().forEach(queue => queue.stop());
    });

    test('should create and manage named queues', () => {
      const queue1 = manager.getQueue('tasks');
      const queue2 = manager.getQueue('notifications');
      const queue1Again = manager.getQueue('tasks');

      expect(queue1).toBe(queue1Again);
      expect(queue1).not.toBe(queue2);
      expect(manager.getAllQueues().size).toBe(2);
    });

    test('should get combined stats', async () => {
      const queue1 = manager.getQueue('queue1');
      const queue2 = manager.getQueue('queue2');

      await queue1.enqueue(createTestTask({ 
        id: 'q1t1', 
        description: 'Queue 1 task',
        priority: 'medium'
      }));

      await queue2.enqueue(createTestTask({ 
        id: 'q2t1', 
        description: 'Queue 2 task',
        priority: 'high'
      }));

      const stats = await manager.getCombinedStats();
      expect(Object.keys(stats)).toHaveLength(2);
      expect(stats.queue1.pending).toBe(1);
      expect(stats.queue2.pending).toBe(1);
    });
  });

  describe('Coordinator Integration', () => {
    let coordinator: CoordinatorAgent;

    beforeEach(() => {
      const mcpOptions: LarkMcpToolOptions = {
        appId: 'test-app-id',
        appSecret: 'test-app-secret',
        toolsOptions: {
          language: 'en',
          allowTools: ['bitable.v1.appTableRecord.search', 'im.v1.message.create']
        }
      };

      coordinator = createCoordinatorInstance(mcpOptions);
    });

    afterEach(() => {
      if (coordinator && typeof coordinator.cleanup === 'function') {
        coordinator.cleanup();
      }
    });

    test('should enqueue task via coordinator tool', async () => {
      const tool = coordinator.tools.get('enqueue_task');
      expect(tool).toBeDefined();

      const result = await tool?.execute({
        description: 'Process customer data',
        priority: 'high',
        dependencies: [],
        metadata: { source: 'test' },
      });

      expect(result.success).toBe(true);
      expect(result.taskId).toBeDefined();
      expect(result.priority).toBe('high');
    });

    test('should get queue status', async () => {
      // Enqueue some tasks first
      const enqueueTool = coordinator.tools.get('enqueue_task');
      await enqueueTool?.execute({
        description: 'Task 1',
        priority: 'medium',
      });
      await enqueueTool?.execute({
        description: 'Task 2',
        priority: 'high',
      });

      const statusTool = coordinator.tools.get('get_queue_status');
      const result = await statusTool?.execute({});

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats.pending).toBeGreaterThanOrEqual(0);
      expect(result.pendingTasks).toBeDefined();
      expect(result.activeTasks).toBeDefined();
    });

    test('should manage queue operations', async () => {
      const tool = coordinator.tools.get('manage_queue');
      
      // Stop queue
      let result = await tool?.execute({ action: 'stop' });
      expect(result.success).toBe(true);
      expect(result.message).toContain('stopped');

      // Start queue
      result = await tool?.execute({ action: 'start' });
      expect(result.success).toBe(true);
      expect(result.message).toContain('started');

      // Clear queue
      result = await tool?.execute({ action: 'clear' });
      expect(result.success).toBe(true);
      expect(result.message).toContain('cleared');
    });

    test('should update task priority', async () => {
      // Enqueue a task
      const enqueueTool = coordinator.tools.get('enqueue_task');
      const enqueueResult = await enqueueTool?.execute({
        description: 'Test task',
        priority: 'medium',
      });

      const taskId = enqueueResult.taskId;

      // Update priority
      const updateTool = coordinator.tools.get('update_task_priority');
      const result = await updateTool?.execute({
        taskId,
        priority: 'urgent',
      });

      expect(result.success).toBe(true);
      expect(result.newPriority).toBe('urgent');
    });

    test('should create named queues', async () => {
      const tool = coordinator.tools.get('create_named_queue');
      
      const result = await tool?.execute({
        name: 'analytics',
        config: {
          maxRetries: 5,
          maxConcurrency: 3,
        },
      });

      expect(result.success).toBe(true);
      expect(result.queueName).toBe('analytics');
      expect(result.config.maxRetries).toBe(5);
    });

    test('should get all queues status', async () => {
      // Create some named queues
      const createTool = coordinator.tools.get('create_named_queue');
      await createTool?.execute({ name: 'queue1' });
      await createTool?.execute({ name: 'queue2' });

      const statusTool = coordinator.tools.get('get_all_queues_status');
      const result = await statusTool?.execute({});

      expect(result.success).toBe(true);
      expect(result.totalQueues).toBeGreaterThanOrEqual(2);
      expect(result.queues).toBeDefined();
    });
  });
});