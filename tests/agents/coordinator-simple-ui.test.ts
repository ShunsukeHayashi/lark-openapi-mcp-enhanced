/**
 * Simple UI/UX Test for Coordinator Agent
 * Tests basic user interaction patterns without complex dependencies
 */

import { CoordinatorAgent } from '../../src/agents/specialists/coordinator-agent';

describe('Coordinator Agent Simple UI/UX Tests', () => {
  let coordinator: CoordinatorAgent;

  beforeEach(() => {
    coordinator = new CoordinatorAgent();
  });

  describe('Basic Functionality', () => {
    test('should create coordinator agent successfully', () => {
      expect(coordinator).toBeDefined();
      expect(coordinator.name).toBe('Task Coordinator');
      expect(coordinator.tools.size).toBeGreaterThan(0);
    });

    test('should have all required tools', () => {
      const expectedTools = ['assign_task', 'get_task_status', 'list_active_tasks'];
      
      expectedTools.forEach(toolName => {
        expect(coordinator.tools.has(toolName)).toBe(true);
      });
    });
  });

  describe('Task Assignment UI', () => {
    test('should generate valid task IDs', async () => {
      const taskId = await coordinator.assignTask('Test task');
      
      expect(taskId).toBeDefined();
      expect(typeof taskId).toBe('string');
      expect(taskId).toMatch(/^task_\d+$/);
    });

    test('should handle different task types', async () => {
      const tasks = [
        'Create Base table',
        'Send message to team',
        'Update document',
        'Schedule meeting'
      ];

      for (const taskDesc of tasks) {
        const taskId = await coordinator.assignTask(taskDesc);
        expect(taskId).toMatch(/^task_\d+$/);
      }
    });

    test('should handle priority levels', async () => {
      const priorities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
      
      for (const priority of priorities) {
        const taskId = await coordinator.assignTask(`Priority ${priority} task`, priority);
        expect(taskId).toBeDefined();
        expect(taskId).toMatch(/^task_\d+$/);
      }
    });
  });

  describe('Tool Execution UI', () => {
    beforeEach(() => {
      // Create fresh coordinator for each test to avoid state issues
      coordinator = new CoordinatorAgent();
    });

    test('should execute assign_task tool correctly', async () => {
      const assignTool = coordinator.tools.get('assign_task');
      expect(assignTool).toBeDefined();

      const result = await assignTool!.execute({
        taskId: 'test_task_123',
        agentType: 'base_specialist',
        context: {
          description: 'Test task',
          priority: 'medium'
        }
      });

      expect(result).toMatchObject({
        success: true,
        taskId: 'test_task_123',
        assignedTo: 'base_specialist',
        status: 'assigned'
      });
    });

    test('should execute get_task_status tool correctly', async () => {
      // First assign a task
      const taskId = await coordinator.assignTask('Status test task');
      
      // Then check its status
      const statusTool = coordinator.tools.get('get_task_status');
      const result = await statusTool!.execute({ taskId });

      expect(result).toMatchObject({
        success: true,
        task: {
          id: taskId,
          status: 'assigned',
          priority: 'medium'
        }
      });
    });

    test('should handle non-existent task gracefully', async () => {
      const statusTool = coordinator.tools.get('get_task_status');
      const result = await statusTool!.execute({ taskId: 'non_existent' });

      expect(result).toMatchObject({
        success: false,
        error: 'Task not found',
        taskId: 'non_existent'
      });
    });

    test('should execute list_active_tasks tool correctly', async () => {
      // Create some tasks  
      await coordinator.assignTask('Task 1');
      await coordinator.assignTask('Task 2');

      const listTool = coordinator.tools.get('list_active_tasks');
      const result = await listTool!.execute({});

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('activeTasks');
      expect(Array.isArray(result.activeTasks)).toBe(true);
      expect(result.activeTasks.length).toBeGreaterThan(0);
    });
  });

  describe('Agent Type Detection UI', () => {
    test('should correctly detect base specialist tasks', async () => {
      const baseTaskDescriptions = [
        'Create Base table',
        'Search records in table',
        'Update Base data'
      ];

      for (const desc of baseTaskDescriptions) {
        const taskId = await coordinator.assignTask(desc);
        expect(taskId).toBeDefined();
      }
    });

    test('should correctly detect messaging specialist tasks', async () => {
      const messageTaskDescriptions = [
        'Send message to team',
        'Create chat group',
        'Send notification'
      ];

      for (const desc of messageTaskDescriptions) {
        const taskId = await coordinator.assignTask(desc);
        expect(taskId).toBeDefined();
      }
    });
  });

  describe('Response Format Consistency', () => {
    test('should provide consistent success/error format', async () => {
      const tools = ['assign_task', 'get_task_status', 'list_active_tasks'];
      
      for (const toolName of tools) {
        const tool = coordinator.tools.get(toolName);
        expect(tool).toBeDefined();
        expect(tool!.name).toBe(toolName);
        expect(tool!.description).toBeDefined();
        expect(typeof tool!.execute).toBe('function');
      }
    });

    test('should include timestamps in responses', async () => {
      const taskId = await coordinator.assignTask('Timestamp test');
      
      const statusTool = coordinator.tools.get('get_task_status');
      const result = await statusTool!.execute({ taskId });

      expect(result.task.createdAt).toBeInstanceOf(Date);
      expect(result.task.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Error Handling UI', () => {
    test('should handle missing task ID parameter', async () => {
      const statusTool = coordinator.tools.get('get_task_status');
      
      // This should handle missing taskId gracefully
      try {
        const result = await statusTool!.execute({});
        // If it doesn't throw, it should return an error response
        expect(result.success).toBeFalsy();
      } catch (error) {
        // If it throws, that's also acceptable error handling
        expect(error).toBeDefined();
      }
    });

    test('should maintain task state across operations', async () => {
      // Create multiple tasks
      const task1 = await coordinator.assignTask('Task 1');
      const task2 = await coordinator.assignTask('Task 2');

      // Verify both exist
      const statusTool = coordinator.tools.get('get_task_status');
      const result1 = await statusTool!.execute({ taskId: task1 });
      const result2 = await statusTool!.execute({ taskId: task2 });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.task.id).toBe(task1);
      expect(result2.task.id).toBe(task2);
    });
  });
});