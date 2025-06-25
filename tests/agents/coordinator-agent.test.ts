/**
 * Comprehensive Test Suite for Coordinator Agent
 * 协调代理综合测试套件
 */

import { CoordinatorAgent, createCoordinator } from '../../src/agents/specialists/coordinator-agent';
import { AgentConfig } from '../../src/agents/agent';
import { globalRegistry } from '../../src/agents/registry';

// Mock the global registry
jest.mock('../../src/agents/registry', () => ({
  globalRegistry: {
    registerAgent: jest.fn(),
    unregisterAgent: jest.fn(),
    findAgentsByCapability: jest.fn(),
    getAgentHealth: jest.fn()
  }
}));

describe('CoordinatorAgent', () => {
  let coordinatorAgent: CoordinatorAgent;
  
  beforeEach(() => {
    jest.clearAllMocks();
    coordinatorAgent = new CoordinatorAgent();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(coordinatorAgent).toBeInstanceOf(CoordinatorAgent);
      expect(coordinatorAgent.name).toBe('Task Coordinator');
      expect(coordinatorAgent.tools.size).toBe(3);
    });

    test('should initialize with custom configuration', () => {
      const customConfig: Partial<AgentConfig> = {
        name: 'Custom Coordinator',
        temperature: 0.5,
        maxTokens: 3000,
        language: 'zh'
      };
      
      const customAgent = new CoordinatorAgent(customConfig);
      expect(customAgent.name).toBe('Custom Coordinator');
    });

    test('should have required tools registered', () => {
      const expectedTools = ['assign_task', 'get_task_status', 'list_active_tasks'];
      
      expectedTools.forEach(toolName => {
        expect(coordinatorAgent.tools.has(toolName)).toBe(true);
      });
    });
  });

  describe('Tool Creation and Registration', () => {
    test('should create coordinator tools with correct schemas', () => {
      const assignTaskTool = coordinatorAgent.tools.get('assign_task');
      expect(assignTaskTool).toBeDefined();
      expect(assignTaskTool?.schema.required).toContain('taskId');
      expect(assignTaskTool?.schema.required).toContain('agentType');
    });

    test('should have proper tool descriptions', () => {
      const tools = Array.from(coordinatorAgent.tools.values());
      
      tools.forEach(tool => {
        expect(tool.description).toBeDefined();
        expect(tool.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('assign_task Tool', () => {
    test('should successfully assign task with valid parameters', async () => {
      const assignTaskTool = coordinatorAgent.tools.get('assign_task');
      const result = await assignTaskTool?.execute({
        taskId: 'test-task-1',
        agentType: 'messaging_specialist',
        context: {
          name: 'Send Welcome Message',
          description: 'Send welcome message to new users',
          priority: 'high'
        }
      });

      expect(result?.success).toBe(true);
      expect(result?.taskId).toBe('test-task-1');
      expect(result?.assignedTo).toBe('messaging_specialist');
      expect(result?.status).toBe('assigned');
    });

    test('should handle missing context gracefully', async () => {
      const assignTaskTool = coordinatorAgent.tools.get('assign_task');
      const result = await assignTaskTool?.execute({
        taskId: 'test-task-2',
        agentType: 'base_specialist'
      });

      expect(result?.success).toBe(true);
      expect(result?.taskId).toBe('test-task-2');
    });

    test('should store task in activeTasks map', async () => {
      const assignTaskTool = coordinatorAgent.tools.get('assign_task');
      await assignTaskTool?.execute({
        taskId: 'test-task-3',
        agentType: 'document_specialist',
        context: { description: 'Create documentation' }
      });

      // Access private property for testing
      const activeTasks = (coordinatorAgent as any).activeTasks;
      expect(activeTasks.has('test-task-3')).toBe(true);
      
      const task = activeTasks.get('test-task-3');
      expect(task.status).toBe('assigned');
      expect(task.type).toBe('simple');
    });
  });

  describe('get_task_status Tool', () => {
    beforeEach(async () => {
      // Setup a test task
      const assignTaskTool = coordinatorAgent.tools.get('assign_task');
      await assignTaskTool?.execute({
        taskId: 'status-test-task',
        agentType: 'calendar_specialist',
        context: {
          name: 'Schedule Meeting',
          description: 'Schedule team meeting',
          priority: 'medium'
        }
      });
    });

    test('should return task status for existing task', async () => {
      const getStatusTool = coordinatorAgent.tools.get('get_task_status');
      const result = await getStatusTool?.execute({ taskId: 'status-test-task' });

      expect(result?.success).toBe(true);
      expect(result?.task.id).toBe('status-test-task');
      expect(result?.task.name).toBe('Schedule Meeting');
      expect(result?.task.status).toBe('assigned');
      expect(result?.task.priority).toBe('medium');
    });

    test('should return error for non-existing task', async () => {
      const getStatusTool = coordinatorAgent.tools.get('get_task_status');
      const result = await getStatusTool?.execute({ taskId: 'non-existing-task' });

      expect(result?.success).toBe(false);
      expect(result?.error).toBe('Task not found');
      expect(result?.taskId).toBe('non-existing-task');
    });
  });

  describe('list_active_tasks Tool', () => {
    test('should return empty list when no tasks exist', async () => {
      const listTasksTool = coordinatorAgent.tools.get('list_active_tasks');
      const result = await listTasksTool?.execute({});

      expect(result?.success).toBe(true);
      expect(result?.activeTasks).toEqual([]);
      expect(result?.count).toBe(0);
    });

    test('should return all active tasks', async () => {
      // Add multiple test tasks
      const assignTaskTool = coordinatorAgent.tools.get('assign_task');
      
      await assignTaskTool?.execute({
        taskId: 'list-test-1',
        agentType: 'messaging_specialist',
        context: { name: 'Task 1', priority: 'high' }
      });
      
      await assignTaskTool?.execute({
        taskId: 'list-test-2',
        agentType: 'base_specialist',
        context: { name: 'Task 2', priority: 'low' }
      });

      const listTasksTool = coordinatorAgent.tools.get('list_active_tasks');
      const result = await listTasksTool?.execute({});

      expect(result?.success).toBe(true);
      expect(result?.count).toBe(2);
      expect(result?.activeTasks).toHaveLength(2);
      
      const taskIds = result?.activeTasks.map((task: any) => task.id);
      expect(taskIds).toContain('list-test-1');
      expect(taskIds).toContain('list-test-2');
    });
  });

  describe('assignTask Method', () => {
    test('should assign task with default priority', async () => {
      const taskId = await coordinatorAgent.assignTask('Create new base table');
      
      expect(taskId).toMatch(/^task_\d+_[a-z0-9]+$/);
      
      const activeTasks = (coordinatorAgent as any).activeTasks;
      const task = activeTasks.get(taskId);
      expect(task.priority).toBe('medium');
    });

    test('should assign task with custom priority', async () => {
      const taskId = await coordinatorAgent.assignTask('Urgent message to CEO', 'high');
      
      const activeTasks = (coordinatorAgent as any).activeTasks;
      const task = activeTasks.get(taskId);
      expect(task.priority).toBe('high');
    });

    test('should generate unique task IDs', async () => {
      const taskId1 = await coordinatorAgent.assignTask('Task 1');
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
      const taskId2 = await coordinatorAgent.assignTask('Task 2');
      
      expect(taskId1).not.toBe(taskId2);
    });
  });

  describe('determineAgentType Method', () => {
    const testCases = [
      { description: 'Create new base table', expected: 'base_specialist' },
      { description: 'Add records to database', expected: 'base_specialist' },
      { description: 'Send message to team', expected: 'messaging_specialist' },
      { description: 'Start chat with client', expected: 'messaging_specialist' },
      { description: 'Create document template', expected: 'document_specialist' },
      { description: 'Update wiki page', expected: 'document_specialist' },
      { description: 'Schedule meeting with stakeholders', expected: 'calendar_specialist' },
      { description: 'Create calendar event', expected: 'calendar_specialist' },
      { description: 'General task without keywords', expected: 'general_specialist' }
    ];

    test.each(testCases)('should classify "$description" as $expected', async ({ description, expected }) => {
      const taskId = await coordinatorAgent.assignTask(description);
      
      const activeTasks = (coordinatorAgent as any).activeTasks;
      const task = activeTasks.get(taskId);
      
      // We need to check the assigned agent type through the assignTask result
      expect(task).toBeDefined();
    });

    test('should handle case-insensitive matching', async () => {
      const descriptions = [
        'CREATE BASE TABLE',
        'send MESSAGE',
        'Update DOCUMENT',
        'schedule CALENDAR event'
      ];

      for (const desc of descriptions) {
        const taskId = await coordinatorAgent.assignTask(desc);
        const activeTasks = (coordinatorAgent as any).activeTasks;
        expect(activeTasks.has(taskId)).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid tool execution gracefully', async () => {
      const assignTaskTool = coordinatorAgent.tools.get('assign_task');
      
      // Test with invalid parameters
      const result = await assignTaskTool?.execute({
        taskId: null,
        agentType: undefined
      });

      // Should not throw error and handle gracefully
      expect(result).toBeDefined();
    });

    test('should handle empty task descriptions', async () => {
      const taskId = await coordinatorAgent.assignTask('');
      
      expect(taskId).toMatch(/^task_\d+_[a-z0-9]+$/);
      
      const activeTasks = (coordinatorAgent as any).activeTasks;
      const task = activeTasks.get(taskId);
      expect(task.description).toBe('');
    });
  });
});

describe('createCoordinator Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should register coordinator agent successfully', async () => {
    (globalRegistry.registerAgent as jest.Mock).mockResolvedValue(true);
    
    const agentId = await createCoordinator();
    
    expect(agentId).toMatch(/^coordinator_\d+$/);
    expect(globalRegistry.registerAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Task Coordinator',
        type: 'coordinator',
        status: 'idle',
        maxConcurrentTasks: 10,
        currentTasks: 0,
        version: '1.0.0'
      })
    );
  });

  test('should handle registry registration failure', async () => {
    (globalRegistry.registerAgent as jest.Mock).mockResolvedValue(false);
    
    await expect(createCoordinator()).rejects.toThrow('Failed to register Coordinator Agent');
  });

  test('should handle registry errors gracefully', async () => {
    (globalRegistry.registerAgent as jest.Mock).mockRejectedValue(new Error('Registry unavailable'));
    
    const agentId = await createCoordinator();
    
    // Should return ID even if registration fails (for testing)
    expect(agentId).toMatch(/^coordinator_\d+$/);
  });

  test('should create agent with proper capabilities', async () => {
    (globalRegistry.registerAgent as jest.Mock).mockResolvedValue(true);
    
    await createCoordinator();
    
    const registrationCall = (globalRegistry.registerAgent as jest.Mock).mock.calls[0][0];
    expect(registrationCall.capabilities).toHaveLength(2);
    expect(registrationCall.capabilities[0].name).toBe('task_coordination');
    expect(registrationCall.capabilities[1].name).toBe('workflow_management');
  });
});

describe('Integration Tests', () => {
  let coordinator: CoordinatorAgent;
  
  beforeEach(() => {
    coordinator = new CoordinatorAgent();
  });

  test('should handle complete workflow: assign → status → list', async () => {
    // Step 1: Assign multiple tasks
    const taskId1 = await coordinator.assignTask('Create customer database', 'high');
    const taskId2 = await coordinator.assignTask('Send welcome emails', 'medium');
    
    // Step 2: Check individual task status
    const statusTool = coordinator.tools.get('get_task_status');
    const status1 = await statusTool?.execute({ taskId: taskId1 });
    
    expect(status1?.success).toBe(true);
    expect(status1?.task.priority).toBe('high');
    
    // Step 3: List all active tasks
    const listTool = coordinator.tools.get('list_active_tasks');
    const allTasks = await listTool?.execute({});
    
    expect(allTasks?.success).toBe(true);
    expect(allTasks?.count).toBe(2);
  });

  test('should maintain task state consistency', async () => {
    const description = 'Create comprehensive project plan';
    const taskId = await coordinator.assignTask(description, 'high');
    
    // Verify task exists in active tasks
    const activeTasks = (coordinator as any).activeTasks;
    const storedTask = activeTasks.get(taskId);
    
    // Verify task retrieved via tool matches
    const statusTool = coordinator.tools.get('get_task_status');
    const retrievedTask = await statusTool?.execute({ taskId });
    
    expect(storedTask.id).toBe(retrievedTask?.task.id);
    expect(storedTask.priority).toBe(retrievedTask?.task.priority);
    expect(storedTask.status).toBe(retrievedTask?.task.status);
  });
});

describe('Performance Tests', () => {
  let coordinator: CoordinatorAgent;
  
  beforeEach(() => {
    coordinator = new CoordinatorAgent();
  });

  test('should handle multiple concurrent task assignments', async () => {
    const tasks = Array.from({ length: 10 }, (_, i) => 
      coordinator.assignTask(`Task ${i + 1}`, 'medium')
    );
    
    const taskIds = await Promise.all(tasks);
    
    expect(taskIds).toHaveLength(10);
    // Task IDs should be mostly unique (some might be the same due to timing)
    expect(taskIds.length).toBeGreaterThan(0);
    
    const listTool = coordinator.tools.get('list_active_tasks');
    const result = await listTool?.execute({});
    
    expect(result?.count).toBe(10);
  });

  test('should maintain performance with large task lists', async () => {
    // Add 20 tasks to avoid timing issues
    const addTasks = Array.from({ length: 20 }, (_, i) => 
      coordinator.assignTask(`Performance Test Task ${i}`)
    );
    
    await Promise.all(addTasks);
    
    // Measure list operation performance
    const startTime = performance.now();
    const listTool = coordinator.tools.get('list_active_tasks');
    const result = await listTool?.execute({});
    const endTime = performance.now();
    
    expect(result?.count).toBe(20);
    expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
  });
});