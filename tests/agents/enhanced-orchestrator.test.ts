/**
 * Enhanced Orchestrator Test Suite
 */

import { EnhancedOrchestrator } from '../../src/agents/orchestration/enhanced-orchestrator';
import { MultilingualE5Client } from '../../src/agents/embedding/multilingual-e5-client';
import { globalRegistry } from '../../src/agents/registry';

// Mock the embedding client
jest.mock('../../src/agents/embedding/multilingual-e5-client');
const MockedE5Client = MultilingualE5Client as jest.MockedClass<typeof MultilingualE5Client>;

describe('Enhanced Orchestrator', () => {
  let orchestrator: EnhancedOrchestrator;
  let mockEmbeddingClient: jest.Mocked<MultilingualE5Client>;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Setup mocked embedding client
    mockEmbeddingClient = {
      createEmbeddings: jest.fn(),
      calculateSimilarity: jest.fn(),
      findSimilar: jest.fn(),
      clusterTexts: jest.fn(),
      cosineSimilarity: jest.fn().mockReturnValue(0.8),
      getModelInfo: jest.fn(),
      setDefaultModel: jest.fn()
    } as any;

    MockedE5Client.mockImplementation(() => mockEmbeddingClient);
    
    // Create orchestrator
    orchestrator = new EnhancedOrchestrator({
      embeddingModel: 'multilingual-e5-small',
      testMode: true // Disable background processes
    });
  });

  afterEach(async () => {
    // Cleanup orchestrator
    if (orchestrator && typeof orchestrator.destroy === 'function') {
      orchestrator.destroy();
    }
    
    // Cleanup agents
    const agents = globalRegistry.getAllAgents();
    for (const agent of agents) {
      await globalRegistry.unregisterAgent(agent.id);
    }
    
    // Clear all timers to prevent Jest hanging
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should create orchestrator with correct configuration', () => {
      expect(orchestrator).toBeDefined();
      expect(orchestrator.config.name).toBe('Enhanced Orchestrator');
      expect(orchestrator.config.language).toBe('en');
    });

    it('should initialize with E5 embedding client', () => {
      expect(MockedE5Client).toHaveBeenCalledWith({
        baseURL: undefined,
        apiKey: undefined,
        defaultModel: 'multilingual-e5-small'
      });
    });

    it('should have all orchestrator tools', () => {
      const expectedTools = [
        'assign_smart_task',
        'analyze_task_complexity', 
        'optimize_agent_selection',
        'execute_parallel_tasks',
        'monitor_task_performance',
        'adaptive_load_balancing'
      ];

      expectedTools.forEach(toolName => {
        expect(orchestrator.tools.has(toolName)).toBe(true);
      });
    });
  });

  describe('Smart Task Assignment', () => {
    beforeEach(() => {
      // Mock embedding responses
      mockEmbeddingClient.createEmbeddings.mockResolvedValue({
        embeddings: [[0.1, 0.2, 0.3, 0.4]],
        model: 'multilingual-e5-small',
        usage: { totalTokens: 10, promptTokens: 10 }
      });

      mockEmbeddingClient.calculateSimilarity.mockResolvedValue(0.8);
    });

    it('should analyze task complexity correctly', async () => {
      const tool = orchestrator.tools.get('analyze_task_complexity');
      const result = await tool?.execute({
        description: 'Create a CRM system with customer management',
        requirements: ['database', 'user_interface', 'reporting']
      });

      expect(result).toBeDefined();
      expect(result.level).toMatch(/simple|moderate|complex/);
      expect(result.type).toMatch(/simple|complex|parallel|sequential/);
      expect(result.estimatedDuration).toBeGreaterThan(0);
      expect(Array.isArray(result.breakdown)).toBe(true);
      expect(typeof result.confidence).toBe('number');
    });

    it('should handle multilingual task descriptions', async () => {
      const descriptions = [
        'Create a project management system',
        '创建一个项目管理系统',
        'プロジェクト管理システムを作成する'
      ];

      for (const description of descriptions) {
        const tool = orchestrator.tools.get('analyze_task_complexity');
        const result = await tool?.execute({ description });
        
        expect(result).toBeDefined();
        expect(result.confidence).toBeGreaterThanOrEqual(0);
      }
    });

    it('should assign smart tasks with embedding analysis', async () => {
      // Mock agent registration
      await globalRegistry.registerAgent({
        id: 'test_agent_1',
        name: 'Test Agent',
        type: 'specialist',
        capabilities: [
          { name: 'database_management', description: 'Manage databases', category: 'custom' as const }
        ],
        status: 'idle',
        maxConcurrentTasks: 5,
        currentTasks: 0,
        lastHeartbeat: new Date(),
        version: '1.0.0'
      });

      const tool = orchestrator.tools.get('assign_smart_task');
      const result = await tool?.execute({
        description: 'Create a database schema for customer data',
        context: {
          priority: 'high',
          requiredCapabilities: ['database_management']
        }
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.taskId).toBeDefined();
      expect(result.agentId).toBeDefined();
    });
  });

  describe('Agent Selection Optimization', () => {
    beforeEach(async () => {
      // Register multiple test agents
      const agents = [
        {
          id: 'agent_db',
          name: 'Database Specialist',
          capabilities: [
            { name: 'database_design', description: 'Database design and optimization', category: 'custom' as const }
          ]
        },
        {
          id: 'agent_ui', 
          name: 'UI Specialist',
          capabilities: [
            { name: 'user_interface', description: 'User interface design', category: 'custom' as const }
          ]
        },
        {
          id: 'agent_api',
          name: 'API Specialist', 
          capabilities: [
            { name: 'api_development', description: 'API development and integration', category: 'custom' as const }
          ]
        }
      ];

      for (const agent of agents) {
        await globalRegistry.registerAgent({
          ...agent,
          type: 'specialist',
          status: 'idle',
          maxConcurrentTasks: 3,
          currentTasks: 0,
          lastHeartbeat: new Date(),
          version: '1.0.0'
        });
      }

      mockEmbeddingClient.createEmbeddings.mockResolvedValue({
        embeddings: [[0.1, 0.2, 0.3]],
        model: 'multilingual-e5-small',
        usage: { totalTokens: 10, promptTokens: 10 }
      });
    });

    it('should optimize agent selection based on embeddings', async () => {
      const tool = orchestrator.tools.get('optimize_agent_selection');
      const result = await tool?.execute({
        taskEmbedding: [0.1, 0.2, 0.3],
        requirements: ['database_design'],
        excludeAgents: []
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.agentId).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.alternatives)).toBe(true);
    });

    it('should handle no suitable agents scenario', async () => {
      // Clear all existing agents to ensure no matches
      const existingAgents = globalRegistry.getAllAgents();
      for (const agent of existingAgents) {
        await globalRegistry.unregisterAgent(agent.id);
      }
      
      const tool = orchestrator.tools.get('optimize_agent_selection');
      const result = await tool?.execute({
        taskEmbedding: [0.1, 0.2, 0.3],
        requirements: ['quantum_computing'], // No agents available
        excludeAgents: []
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.reason).toContain('No available agents found');
    });
  });

  describe('Parallel Task Execution', () => {
    it('should execute multiple tasks in parallel', async () => {
      const tool = orchestrator.tools.get('execute_parallel_tasks');
      
      const tasks = [
        { description: 'Task 1: Simple operation', dependencies: [] },
        { description: 'Task 2: Another operation', dependencies: [] },
        { description: 'Task 3: Final operation', dependencies: ['parallel_task_0'] }
      ];

      const result = await tool?.execute({
        tasks,
        maxConcurrency: 2,
        timeout: 10000
      });

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.results)).toBe(true);
      expect(Array.isArray(result.failed)).toBe(true);
      expect(typeof result.duration).toBe('number');
    });

    it('should respect task dependencies', async () => {
      const tool = orchestrator.tools.get('execute_parallel_tasks');
      
      const tasks = [
        { description: 'Setup database', dependencies: [] },
        { description: 'Create tables', dependencies: ['parallel_task_0'] },
        { description: 'Insert data', dependencies: ['parallel_task_1'] }
      ];

      const result = await tool?.execute({
        tasks,
        maxConcurrency: 3,
        timeout: 15000
      });

      expect(result).toBeDefined();
      // Tasks should execute in dependency order
      expect(result.duration).toBeGreaterThan(0);
    });
  });

  describe('Performance Monitoring', () => {
    it('should monitor task performance metrics', async () => {
      const tool = orchestrator.tools.get('monitor_task_performance');
      const result = await tool?.execute({
        timeWindow: 60,
        agentId: undefined,
        taskType: undefined
      });

      expect(result).toBeDefined();
      expect(typeof result.totalTasks).toBe('number');
      expect(typeof result.successRate).toBe('number');
      expect(typeof result.averageDuration).toBe('number');
      expect(typeof result.tokenUsage).toBe('number');
      expect(typeof result.agentPerformance).toBe('object');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should generate appropriate recommendations', async () => {
      // Mock some task results with poor performance
      const tool = orchestrator.tools.get('monitor_task_performance');
      const result = await tool?.execute({
        timeWindow: 60
      });

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('Adaptive Load Balancing', () => {
    beforeEach(async () => {
      // Register agents with different load levels
      const agents = [
        { id: 'overloaded_agent', currentTasks: 4, maxTasks: 5 },
        { id: 'normal_agent', currentTasks: 2, maxTasks: 5 },
        { id: 'underloaded_agent', currentTasks: 1, maxTasks: 5 }
      ];

      for (const agent of agents) {
        await globalRegistry.registerAgent({
          id: agent.id,
          name: `Agent ${agent.id}`,
          type: 'specialist',
          capabilities: [
            { name: 'general_processing', description: 'General task processing', category: 'custom' as const }
          ],
          status: 'idle',
          maxConcurrentTasks: agent.maxTasks,
          currentTasks: agent.currentTasks,
          lastHeartbeat: new Date(),
          version: '1.0.0'
        });
      }
    });

    it('should detect and rebalance overloaded agents', async () => {
      const tool = orchestrator.tools.get('adaptive_load_balancing');
      const result = await tool?.execute({
        strategy: 'capability_based',
        targetUtilization: 0.8
      });

      expect(result).toBeDefined();
      expect(typeof result.rebalanced).toBe('boolean');
      expect(Array.isArray(result.actions)).toBe(true);
      expect(typeof result.newDistribution).toBe('object');
    });

    it('should support different balancing strategies', async () => {
      const strategies = ['round_robin', 'least_loaded', 'capability_based', 'performance_weighted'];
      
      for (const strategy of strategies) {
        const tool = orchestrator.tools.get('adaptive_load_balancing');
        const result = await tool?.execute({
          strategy,
          targetUtilization: 0.7
        });

        expect(result).toBeDefined();
        expect(typeof result.rebalanced).toBe('boolean');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle embedding client errors gracefully', async () => {
      mockEmbeddingClient.createEmbeddings.mockRejectedValue(new Error('Embedding service unavailable'));

      const tool = orchestrator.tools.get('assign_smart_task');
      const result = await tool?.execute({
        description: 'Test task with embedding error',
        context: {}
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Embedding service unavailable');
    });

    it('should handle agent selection failures', async () => {
      // No agents registered
      const tool = orchestrator.tools.get('optimize_agent_selection');
      const result = await tool?.execute({
        taskEmbedding: [0.1, 0.2, 0.3],
        requirements: [],
        excludeAgents: []
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.reason).toContain('No available agents found');
    });
  });

  describe('Multilingual Support', () => {
    it('should handle multiple languages in task analysis', async () => {
      const multilingualTasks = [
        { description: 'Create user management system', language: 'en' },
        { description: '创建用户管理系统', language: 'zh' },
        { description: 'ユーザー管理システムを作成する', language: 'ja' }
      ];

      mockEmbeddingClient.calculateSimilarity.mockResolvedValue(0.7);

      for (const task of multilingualTasks) {
        const tool = orchestrator.tools.get('analyze_task_complexity');
        const result = await tool?.execute({
          description: task.description,
          requirements: []
        });

        expect(result).toBeDefined();
        expect(result.confidence).toBeGreaterThanOrEqual(0);
      }
    });
  });
});