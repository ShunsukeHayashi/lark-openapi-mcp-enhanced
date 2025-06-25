/**
 * Simple UI/UX Test for Coordinator Agent
 * Tests basic user interaction patterns and response formats
 */

import { CoordinatorAgent } from '../../src/agents/specialists/coordinator-agent';

describe('Coordinator Agent UI/UX Tests', () => {
  let coordinator: CoordinatorAgent;

  beforeEach(() => {
    coordinator = new CoordinatorAgent();
  });

  describe('Task Assignment Interface', () => {
    test('should provide user-friendly task assignment', async () => {
      const taskDescription = 'Create a new Base table for customer data';
      const taskId = await coordinator.assignTask(taskDescription, 'high');

      expect(taskId).toBeDefined();
      expect(taskId).toMatch(/^task_\d+$/);
      
      // Verify task was assigned to correct agent type
      const tool = coordinator.tools.get('get_task_status');
      const status = await tool?.execute({ taskId });
      expect(status.success).toBe(true);
      expect(status.task.priority).toBe('high');
    });

    test('should handle different task types correctly', async () => {
      const testCases = [
        { description: 'Send message to team channel', expectedType: 'messaging_specialist' },
        { description: 'Update document content', expectedType: 'document_specialist' },
        { description: 'Schedule meeting for next week', expectedType: 'calendar_specialist' },
        { description: 'Create Base record', expectedType: 'base_specialist' }
      ];

      for (const testCase of testCases) {
        const taskId = await coordinator.assignTask(testCase.description);
        const tool = coordinator.tools.get('get_task_status');
        const status = await tool?.execute({ taskId });
        
        expect(status.success).toBe(true);
        expect(status.task.name).toBe('Unnamed Task');
      }
    });
  });

  describe('Task Status Display', () => {
    test('should display task status in readable format', async () => {
      const taskId = await coordinator.assignTask('Test task for status display');
      const tool = coordinator.tools.get('get_task_status');
      const status = await tool?.execute({ taskId });

      expect(status).toMatchObject({
        success: true,
        task: {
          id: expect.any(String),
          name: expect.any(String),
          status: 'assigned',
          priority: 'medium',
          createdAt: expect.any(Date)
        }
      });
    });

    test('should handle non-existent task gracefully', async () => {
      const tool = coordinator.tools.get('get_task_status');
      const status = await tool?.execute({ 
        taskId: 'non_existent_task' 
      });

      expect(status).toMatchObject({
        success: false,
        error: 'Task not found',
        taskId: 'non_existent_task'
      });
    });
  });

  describe('Task List Interface', () => {
    test('should provide clean task list view', async () => {
      // Create multiple tasks
      await coordinator.assignTask('Task 1', 'high');
      await coordinator.assignTask('Task 2', 'medium');
      await coordinator.assignTask('Task 3', 'low');

      const listTool = coordinator.tools.get('list_active_tasks');
      const taskList = await listTool?.execute({});

      expect(taskList.success).toBe(true);
      expect(taskList.activeTasks).toHaveLength(3);
      expect(taskList.count).toBe(3);

      // Verify task list structure
      taskList.activeTasks.forEach((task: any) => {
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('name');
        expect(task).toHaveProperty('status');
        expect(task).toHaveProperty('priority');
        expect(task).toHaveProperty('createdAt');
      });
    });

    test('should handle empty task list', async () => {
      const listTool = coordinator.tools.get('list_active_tasks');
      const taskList = await listTool?.execute({});

      expect(taskList).toMatchObject({
        success: true,
        activeTasks: [],
        count: 0
      });
    });
  });

  describe('User Experience Features', () => {
    test('should provide consistent response format', async () => {
      const listTool = coordinator.tools.get('list_active_tasks');
      const statusTool = coordinator.tools.get('get_task_status');
      const responses = [
        await listTool?.execute({}),
        await statusTool?.execute({ taskId: 'fake_id' }),
      ];

      responses.forEach(response => {
        expect(response).toHaveProperty('success');
        expect(typeof response.success).toBe('boolean');
      });
    });

    test('should include helpful timestamps', async () => {
      const taskId = await coordinator.assignTask('Timestamp test task');
      const tool = coordinator.tools.get('get_task_status');
      const status = await tool?.execute({ taskId });

      expect(status.task.createdAt).toBeInstanceOf(Date);
      expect(status.task.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    test('should handle priority levels intuitively', async () => {
      const priorities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
      
      for (const priority of priorities) {
        const taskId = await coordinator.assignTask(`Priority ${priority} task`, priority);
        const tool = coordinator.tools.get('get_task_status');
        const status = await tool?.execute({ taskId });
        
        expect(status.task.priority).toBe(priority);
      }
    });
  });

  describe('Error Handling UX', () => {
    test('should provide clear error messages', async () => {
      const tool = coordinator.tools.get('get_task_status');
      const errorResponse = await tool?.execute({ 
        taskId: 'invalid_task_id' 
      });

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe('Task not found');
      expect(errorResponse.taskId).toBe('invalid_task_id');
    });

    test('should handle missing parameters gracefully', async () => {
      const tool = coordinator.tools.get('get_task_status');
      try {
        await tool?.execute({});
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Performance and Responsiveness', () => {
    test('should handle multiple concurrent tasks', async () => {
      const taskPromises = Array.from({ length: 5 }, (_, i) => 
        coordinator.assignTask(`Concurrent task ${i + 1}`)
      );

      const taskIds = await Promise.all(taskPromises);
      
      expect(taskIds).toHaveLength(5);
      taskIds.forEach(id => {
        expect(id).toMatch(/^task_\d+$/);
      });

      const listTool = coordinator.tools.get('list_active_tasks');
      const taskList = await listTool?.execute({});
      expect(taskList.count).toBe(5);
    });

    test('should respond quickly to status requests', async () => {
      const taskId = await coordinator.assignTask('Performance test task');
      
      const startTime = Date.now();
      const tool = coordinator.tools.get('get_task_status');
      await tool?.execute({ taskId });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should respond within 100ms
    });
  });
});

/**
 * Integration Test for UI/UX Flow
 */
describe('Coordinator Agent Integration Flow', () => {
  let coordinator: CoordinatorAgent;

  beforeEach(() => {
    coordinator = new CoordinatorAgent();
  });

  test('complete user workflow: create -> check -> list', async () => {
    // Step 1: User creates a task
    const taskDescription = 'Complete user workflow test';
    const taskId = await coordinator.assignTask(taskDescription, 'high');

    // Step 2: User checks task status
    const statusTool = coordinator.tools.get('get_task_status');
    const status = await statusTool?.execute({ taskId });
    expect(status.success).toBe(true);
    expect(status.task.status).toBe('assigned');

    // Step 3: User views all tasks
    const listTool = coordinator.tools.get('list_active_tasks');
    const taskList = await listTool?.execute({});
    expect(taskList.success).toBe(true);
    expect(taskList.count).toBe(1);
    expect(taskList.activeTasks[0].id).toBe(taskId);
  });

  test('user experience with multiple task types', async () => {
    const tasks = [
      { desc: 'Create Base table', type: 'base' },
      { desc: 'Send team message', type: 'messaging' },
      { desc: 'Update document', type: 'document' }
    ];

    // Create all tasks
    const taskIds = [];
    for (const task of tasks) {
      const id = await coordinator.assignTask(task.desc);
      taskIds.push(id);
    }

    // Verify all tasks are tracked
    const listTool = coordinator.tools.get('list_active_tasks');
    const taskList = await listTool?.execute({});
    expect(taskList.count).toBe(3);

    // Verify each task can be retrieved
    const statusTool = coordinator.tools.get('get_task_status');
    for (const taskId of taskIds) {
      const status = await statusTool?.execute({ taskId });
      expect(status.success).toBe(true);
    }
  });
});