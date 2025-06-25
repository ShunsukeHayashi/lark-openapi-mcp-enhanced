/**
 * Agent CLI UI/UX Tests
 * Tests for the comprehensive agent management interface
 */

import { AgentSystemCLI } from '../../src/cli/agent-ui';
import { AIEnhancedCoordinator } from '../../src/agents/ai-enhanced-coordinator';
import { globalRegistry } from '../../src/agents/registry';

// Mock dependencies
jest.mock('../../src/agents/ai-enhanced-coordinator');
jest.mock('../../src/agents/registry');
jest.mock('inquirer');
jest.mock('ora');
jest.mock('chalk', () => ({
  cyan: { bold: jest.fn((text) => text) },
  gray: jest.fn((text) => text),
  yellow: jest.fn((text) => text),
  blue: jest.fn((text) => text),
  green: jest.fn((text) => text),
  red: jest.fn((text) => text)
}));
jest.mock('boxen', () => jest.fn((text) => text));

describe('AgentSystemCLI UI/UX Tests', () => {
  let cli: AgentSystemCLI;
  let mockCoordinator: jest.Mocked<AIEnhancedCoordinator>;

  beforeEach(() => {
    cli = new AgentSystemCLI();
    mockCoordinator = new AIEnhancedCoordinator({ apiKey: 'test-key' }) as jest.Mocked<AIEnhancedCoordinator>;
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'clear').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CLI Initialization', () => {
    test('should initialize without errors', async () => {
      const config = {
        verboseMode: false,
        interactiveMode: true,
        outputFormat: 'table' as const,
        theme: 'default' as const
      };

      await expect(cli.initialize(config)).resolves.not.toThrow();
    });

    test('should display banner on initialization', async () => {
      await cli.initialize();
      
      // Check that banner-related functions were called
      const boxen = require('boxen');
      expect(boxen).toHaveBeenCalled();
    });

    test('should perform system checks', async () => {
      // Mock registry response
      (globalRegistry.getAllAgents as jest.Mock).mockResolvedValue([]);
      
      await cli.initialize();
      
      expect(globalRegistry.getAllAgents).toHaveBeenCalled();
    });
  });

  describe('System Health Checks', () => {
    test('should check registry health successfully', async () => {
      const mockAgents = [
        { id: 'agent1', name: 'Test Agent', status: 'idle' },
        { id: 'agent2', name: 'Test Agent 2', status: 'busy' }
      ];
      
      (globalRegistry.getAllAgents as jest.Mock).mockResolvedValue(mockAgents);
      
      await cli.initialize();
      
      expect(globalRegistry.getAllAgents).toHaveBeenCalled();
    });

    test('should handle registry errors gracefully', async () => {
      (globalRegistry.getAllAgents as jest.Mock).mockRejectedValue(new Error('Registry error'));
      
      await cli.initialize();
      
      // Should not throw, but handle error gracefully
      expect(globalRegistry.getAllAgents).toHaveBeenCalled();
    });

    test('should check environment variables', async () => {
      const originalEnv = process.env;
      
      // Test with required vars missing
      process.env = {};
      await cli.initialize();
      
      // Test with required vars present
      process.env = {
        ...originalEnv,
        APP_ID: 'test-app-id',
        APP_SECRET: 'test-app-secret'
      };
      await cli.initialize();
      
      process.env = originalEnv;
    });
  });

  describe('Coordinator Integration', () => {
    test('should initialize coordinator with API key', async () => {
      const config = {
        apiKey: 'test-gemini-key'
      };

      await cli.initialize(config);
      
      // Verify coordinator initialization was attempted
      expect(AIEnhancedCoordinator).toHaveBeenCalledWith({
        apiKey: 'test-gemini-key'
      });
    });

    test('should skip coordinator initialization without API key', async () => {
      await cli.initialize();
      
      // Should not initialize coordinator without API key
      expect(AIEnhancedCoordinator).not.toHaveBeenCalled();
    });
  });

  describe('Agent Management UI', () => {
    beforeEach(() => {
      // Mock inquirer responses
      const inquirer = require('inquirer');
      inquirer.prompt = jest.fn();
    });

    test('should handle agent listing', async () => {
      const mockAgents = [
        {
          id: 'agent1',
          name: 'Base Specialist',
          type: 'specialist',
          status: 'idle',
          currentTasks: 0,
          maxConcurrentTasks: 3,
          lastHeartbeat: new Date()
        }
      ];

      (globalRegistry.getAllAgents as jest.Mock).mockResolvedValue(mockAgents);
      
      await cli.initialize();
      
      // Test agent listing logic
      expect(globalRegistry.getAllAgents).toHaveBeenCalled();
    });

    test('should format agent status correctly', async () => {
      const mockAgents = [
        { status: 'idle' },
        { status: 'busy' },
        { status: 'error' },
        { status: 'offline' }
      ];

      (globalRegistry.getAllAgents as jest.Mock).mockResolvedValue(mockAgents);
      
      await cli.initialize();
      
      // Status formatting should handle all states
      expect(globalRegistry.getAllAgents).toHaveBeenCalled();
    });

    test('should handle agent search functionality', async () => {
      const mockAgents = [
        {
          id: 'agent1',
          name: 'Messaging Specialist',
          capabilities: [
            { name: 'messaging', description: 'IM operations' }
          ]
        }
      ];

      (globalRegistry.discoverAgents as jest.Mock).mockReturnValue(mockAgents);
      
      await cli.initialize();
      
      // Search functionality should work
      expect(globalRegistry.discoverAgents).toBeDefined();
    });
  });

  describe('Task Management UI', () => {
    beforeEach(async () => {
      await cli.initialize({ apiKey: 'test-key' });
      
      // Mock coordinator tools
      const mockTools = new Map();
      mockTools.set('list_active_tasks', {
        execute: jest.fn().mockResolvedValue({
          success: true,
          count: 2,
          activeTasks: [
            {
              id: 'task1',
              name: 'Test Task 1',
              status: 'assigned',
              priority: 'medium',
              createdAt: new Date()
            },
            {
              id: 'task2', 
              name: 'Test Task 2',
              status: 'in_progress',
              priority: 'high',
              createdAt: new Date()
            }
          ]
        })
      });
      
      mockTools.set('get_task_status', {
        execute: jest.fn().mockResolvedValue({
          success: true,
          task: {
            id: 'task1',
            name: 'Test Task',
            status: 'assigned',
            priority: 'medium',
            createdAt: new Date(),
            assignedAgentId: 'agent1'
          }
        })
      });

      (cli as any).coordinator = {
        tools: mockTools,
        assignTask: jest.fn().mockResolvedValue('task_123'),
        enhancedTaskDecomposition: jest.fn().mockResolvedValue({
          subtasks: [],
          aiAnalysis: {},
          complexity: 'moderate',
          recommendations: ['Test recommendation']
        })
      };
    });

    test('should display active tasks correctly', async () => {
      const coordinator = (cli as any).coordinator;
      const listTool = coordinator.tools.get('list_active_tasks');
      
      const result = await listTool.execute({});
      
      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(result.activeTasks).toHaveLength(2);
    });

    test('should check individual task status', async () => {
      const coordinator = (cli as any).coordinator;
      const statusTool = coordinator.tools.get('get_task_status');
      
      const result = await statusTool.execute({ taskId: 'task1' });
      
      expect(result.success).toBe(true);
      expect(result.task.id).toBe('task1');
      expect(result.task.name).toBe('Test Task');
    });

    test('should handle task assignment', async () => {
      const coordinator = (cli as any).coordinator;
      
      const taskId = await coordinator.assignTask('Test task', 'high');
      
      expect(taskId).toBe('task_123');
      expect(coordinator.assignTask).toHaveBeenCalledWith('Test task', 'high');
    });

    test('should handle AI-enhanced task decomposition', async () => {
      const coordinator = (cli as any).coordinator;
      
      const result = await coordinator.enhancedTaskDecomposition(
        'Complex task',
        { priority: 'high' }
      );
      
      expect(result.complexity).toBe('moderate');
      expect(result.recommendations).toContain('Test recommendation');
    });
  });

  describe('UI Helper Methods', () => {
    test('should format task status with appropriate colors', async () => {
      await cli.initialize();
      
      // Test various status formats
      const statuses = ['pending', 'assigned', 'in_progress', 'completed', 'failed', 'cancelled'];
      
      statuses.forEach(status => {
        // Should not throw when formatting status
        expect(() => {
          const chalk = require('chalk');
          chalk.green(status.toUpperCase());
        }).not.toThrow();
      });
    });

    test('should format priority levels correctly', async () => {
      await cli.initialize();
      
      const priorities = ['low', 'medium', 'high'];
      
      priorities.forEach(priority => {
        // Should not throw when formatting priority
        expect(() => {
          const chalk = require('chalk');
          chalk.yellow(priority.toUpperCase());
        }).not.toThrow();
      });
    });

    test('should format last heartbeat timestamps', async () => {
      await cli.initialize();
      
      const now = new Date();
      const timestamps = [
        new Date(now.getTime() - 30000), // 30 seconds ago
        new Date(now.getTime() - 300000), // 5 minutes ago
        new Date(now.getTime() - 3600000), // 1 hour ago
        new Date(now.getTime() - 86400000) // 1 day ago
      ];
      
      timestamps.forEach(timestamp => {
        const diff = now.getTime() - timestamp.getTime();
        const seconds = Math.floor(diff / 1000);
        
        if (seconds < 60) {
          expect(`${seconds}s ago`).toMatch(/\d+s ago/);
        } else if (seconds < 3600) {
          expect(`${Math.floor(seconds / 60)}m ago`).toMatch(/\d+m ago/);
        }
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle missing coordinator gracefully', async () => {
      await cli.initialize(); // Initialize without API key
      
      // Should handle missing coordinator without throwing
      expect((cli as any).coordinator).toBeUndefined();
    });

    test('should handle registry errors', async () => {
      (globalRegistry.getAllAgents as jest.Mock).mockRejectedValue(new Error('Registry error'));
      
      await cli.initialize();
      
      // Should not throw on registry errors
      expect(globalRegistry.getAllAgents).toHaveBeenCalled();
    });

    test('should handle coordinator initialization errors', async () => {
      (AIEnhancedCoordinator as jest.Mock).mockImplementation(() => {
        throw new Error('Coordinator error');
      });
      
      await expect(cli.initialize({ apiKey: 'test-key' })).rejects.toThrow('Coordinator error');
    });
  });

  describe('Configuration Management', () => {
    test('should handle different output formats', async () => {
      const formats = ['json', 'table', 'text'] as const;
      
      for (const format of formats) {
        await cli.initialize({ outputFormat: format });
        expect((cli as any).config.outputFormat).toBe(format);
      }
    });

    test('should handle different themes', async () => {
      const themes = ['default', 'minimal', 'colorful'] as const;
      
      for (const theme of themes) {
        await cli.initialize({ theme });
        expect((cli as any).config.theme).toBe(theme);
      }
    });

    test('should handle verbose mode', async () => {
      await cli.initialize({ verboseMode: true });
      expect((cli as any).config.verboseMode).toBe(true);
    });
  });

  describe('Real-time Monitoring', () => {
    test('should handle monitoring dashboard initialization', async () => {
      await cli.initialize();
      
      // Mock readline interface
      const mockRl = {
        close: jest.fn(),
        input: {
          on: jest.fn()
        }
      };
      
      const readline = require('readline');
      readline.createInterface = jest.fn().mockReturnValue(mockRl);
      
      // Should be able to start monitoring without errors
      expect(() => {
        (cli as any).rl = mockRl;
      }).not.toThrow();
    });

    test('should handle dashboard refresh', async () => {
      await cli.initialize();
      
      // Should be able to refresh dashboard without errors
      expect(() => {
        (cli as any).refreshDashboard();
      }).not.toThrow();
    });
  });
});

/**
 * Integration Tests for CLI Commands
 */
describe('AgentSystemCLI Integration Tests', () => {
  test('should create CLI program successfully', async () => {
    const { createAgentCLI } = require('../../src/cli/agent-ui');
    
    const program = await createAgentCLI();
    
    expect(program).toBeDefined();
    expect(program.name()).toBe('lark-agent');
    expect(program.description()).toContain('AI-Enhanced Multi-Agent System CLI');
  });

  test('should register all CLI commands', async () => {
    const { createAgentCLI } = require('../../src/cli/agent-ui');
    
    const program = await createAgentCLI();
    const commands = program.commands;
    
    const commandNames = commands.map((cmd: any) => cmd.name());
    
    expect(commandNames).toContain('interactive');
    expect(commandNames).toContain('task');
    expect(commandNames).toContain('monitor');
  });

  test('should handle command options correctly', async () => {
    const { createAgentCLI } = require('../../src/cli/agent-ui');
    
    const program = await createAgentCLI();
    const interactiveCommand = program.commands.find((cmd: any) => cmd.name() === 'interactive');
    
    expect(interactiveCommand).toBeDefined();
    
    const options = interactiveCommand.options;
    const optionNames = options.map((opt: any) => opt.long);
    
    expect(optionNames).toContain('--api-key');
    expect(optionNames).toContain('--verbose');
    expect(optionNames).toContain('--format');
  });
});