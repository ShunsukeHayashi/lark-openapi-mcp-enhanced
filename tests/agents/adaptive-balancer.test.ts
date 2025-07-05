/**
 * Test Adaptive Load Balancer
 */

import { AdaptiveLoadBalancer } from '../../src/agents/load-balancing/adaptive-balancer';
import { PerformanceMonitor } from '../../src/agents/monitoring/performance-monitor';
import { Agent, AgentConfig } from '../../src/agents/agent';
import { Task, AgentCapability } from '../../src/agents/types';
import { globalRegistry } from '../../src/agents/registry';

// Create test capabilities
const BASE_CAPABILITY: AgentCapability = {
  name: 'base-operations',
  description: 'Base operations capability',
  category: 'base',
};

const MESSAGING_CAPABILITY: AgentCapability = {
  name: 'messaging',
  description: 'Messaging operations capability',
  category: 'im',
};

const DOCUMENT_CAPABILITY: AgentCapability = {
  name: 'document-management',
  description: 'Document management capability',
  category: 'docs',
};

// Mock agent class for testing
class MockAgent extends Agent {
  private capabilities: string[];
  private agentCapabilities: AgentCapability[];
  private id: string;

  constructor(config: AgentConfig, capabilities: string[] = []) {
    super(config);
    this.capabilities = capabilities;
    this.id = `agent_${Date.now()}_${Math.random()}`;
    
    // Map string capabilities to AgentCapability objects
    this.agentCapabilities = capabilities.map(cap => {
      switch(cap) {
        case 'base-operations': return BASE_CAPABILITY;
        case 'messaging': return MESSAGING_CAPABILITY;
        case 'document-management': return DOCUMENT_CAPABILITY;
        default: return { name: cap, description: cap, category: 'custom' };
      }
    });
  }

  async execute(context: { task: Task }): Promise<any> {
    return { success: true };
  }

  getCapabilities(): string[] {
    return this.capabilities;
  }
  
  getAgentCapabilities(): AgentCapability[] {
    return this.agentCapabilities;
  }

  getId(): string {
    return this.id;
  }
}

describe('Adaptive Load Balancer', () => {
  let monitor: PerformanceMonitor;
  let balancer: AdaptiveLoadBalancer;
  let agents: MockAgent[];

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    balancer = new AdaptiveLoadBalancer(monitor, {
      algorithm: 'adaptive',
      maxTasksPerAgent: 5,
      rebalanceInterval: 1000,
    });

    // Create mock agents
    agents = [
      new MockAgent({
        name: 'Agent 1',
        instructions: 'Test agent 1',
        tools: [],
        model: 'gpt-4',
      }, ['base-operations']),
      new MockAgent({
        name: 'Agent 2',
        instructions: 'Test agent 2',
        tools: [],
        model: 'gpt-4',
      }, ['messaging', 'base-operations']),
      new MockAgent({
        name: 'Agent 3',
        instructions: 'Test agent 3',
        tools: [],
        model: 'gpt-4',
      }, ['document-management']),
    ];

    // Register agents with registry using metadata
    agents.forEach(agent => {
      globalRegistry.registerAgent({
        id: agent.getId(),
        name: agent.config.name,
        type: 'specialist',
        capabilities: agent.getAgentCapabilities(),
        status: 'idle',
        maxConcurrentTasks: 5,
        currentTasks: 0,
        lastHeartbeat: new Date(),
        version: '1.0.0',
      });
      balancer.registerAgent(agent);
    });
  });

  afterEach(() => {
    balancer.stop();
    monitor.stop();
    agents.forEach(agent => {
      globalRegistry.unregisterAgent(agent.getId());
    });
  });

  const createTask = (id: string, capabilities: string[] = []): Task => ({
    id,
    name: `Test task ${id}`,
    description: `Description for task ${id}`,
    type: 'simple',
    requiredCapabilities: capabilities,
    priority: 'medium',
    context: {},
    status: 'pending',
    createdAt: new Date(),
  });

  test('should register and unregister agents', () => {
    const loads = balancer.getAgentLoads();
    expect(loads).toHaveLength(3);
    
    balancer.unregisterAgent(agents[0].getId());
    expect(balancer.getAgentLoads()).toHaveLength(2);
  });

  test('should assign task to available agent', async () => {
    const task = createTask('task1', ['base-operations']);
    
    const agentId = await balancer.assignTask(task);
    expect(agentId).toBeDefined();
    
    const loads = balancer.getAgentLoads();
    const assignedLoad = loads.find(l => l.agentId === agentId);
    expect(assignedLoad?.currentTasks).toBe(1);
  });

  test('should respect capability requirements', async () => {
    const task = createTask('task1', ['messaging']);
    
    const agentId = await balancer.assignTask(task);
    // Only Agent 2 has messaging capability
    expect(agentId).toBe(agents[1].getId());
  });

  test('should queue task when no agents available', async () => {
    // Fill up all agents
    const tasks: Task[] = [];
    for (let i = 0; i < 15; i++) { // 3 agents * 5 max tasks
      tasks.push(createTask(`task${i}`, ['base-operations']));
    }

    // Assign tasks to fill capacity
    for (let i = 0; i < 10; i++) { // First 10 should succeed (agents 1&2 have base-operations)
      await balancer.assignTask(tasks[i]);
    }

    // Next task should be queued
    await expect(balancer.assignTask(tasks[10])).rejects.toThrow('No available agent');
    
    const metrics = balancer.getMetrics();
    expect(metrics.queuedTasks).toBe(1);
  });

  test('should complete tasks and update metrics', async () => {
    const task = createTask('task1');
    
    await balancer.assignTask(task);
    balancer.completeTask('task1', true, {
      executionTime: 100,
      resourceUsage: { cpu: 0.5, memory: 0.3 },
    });

    const loads = balancer.getAgentLoads();
    const updatedLoad = loads.find(l => l.currentTasks === 0);
    expect(updatedLoad).toBeDefined();
    // The averageResponseTime uses exponential moving average with alpha=0.2
    // First update: 0.2 * 100 + 0.8 * 0 = 20
    expect(updatedLoad?.averageResponseTime).toBeCloseTo(20);
  });

  test('should support different algorithms', async () => {
    // Test round-robin
    balancer.setAlgorithm('round-robin');
    
    const tasks = [
      createTask('task1', ['base-operations']),
      createTask('task2', ['base-operations']),
    ];

    const agent1 = await balancer.assignTask(tasks[0]);
    const agent2 = await balancer.assignTask(tasks[1]);
    
    // Should assign to different agents in round-robin
    expect(agent1).not.toBe(agent2);
  });

  test('should select least loaded agent', async () => {
    balancer.setAlgorithm('least-loaded');
    
    // Assign a task to agent 1
    const task1 = createTask('task1', ['base-operations']);
    const firstAgent = await balancer.assignTask(task1);
    
    // Next task should go to a different agent
    const task2 = createTask('task2', ['base-operations']);
    const secondAgent = await balancer.assignTask(task2);
    
    expect(secondAgent).not.toBe(firstAgent);
  });

  test('should calculate agent scores for adaptive selection', async () => {
    balancer.setAlgorithm('adaptive');
    
    // Update agent metrics to influence selection
    monitor.updateAgentMetrics(agents[0].getId(), {
      agentName: 'Agent 1',
      tasksCompleted: 10,
      tasksFailed: 2,
      successRate: 0.83,
      averageTaskDuration: 200,
    });
    
    monitor.updateAgentMetrics(agents[1].getId(), {
      agentName: 'Agent 2',
      tasksCompleted: 15,
      tasksFailed: 1,
      successRate: 0.94,
      averageTaskDuration: 150,
    });
    
    const task = createTask('task1', ['base-operations']);
    const agentId = await balancer.assignTask(task);
    
    // Should prefer agent 2 due to better performance
    expect(agentId).toBe(agents[1].getId());
  });

  test('should emit events', (done) => {
    const task = createTask('task1');
    
    balancer.once('task:assigned', ({ taskId, agentId }) => {
      expect(taskId).toBe('task1');
      expect(agentId).toBeDefined();
      done();
    });
    
    balancer.assignTask(task);
  });

  test('should get metrics', () => {
    const metrics = balancer.getMetrics();
    
    expect(metrics).toHaveProperty('totalTasks');
    expect(metrics).toHaveProperty('distributedTasks');
    expect(metrics).toHaveProperty('queuedTasks');
    expect(metrics).toHaveProperty('averageLoadPerAgent');
    expect(metrics).toHaveProperty('loadVariance');
    expect(metrics).toHaveProperty('rebalanceCount');
    expect(metrics).toHaveProperty('lastRebalance');
  });

  test('should toggle auto-scaling', () => {
    const eventHandler = jest.fn();
    balancer.on('autoscaling:changed', eventHandler);
    
    balancer.setAutoScaling(false);
    expect(eventHandler).toHaveBeenCalledWith({ enabled: false });
    
    balancer.setAutoScaling(true);
    expect(eventHandler).toHaveBeenCalledWith({ enabled: true });
  });
});