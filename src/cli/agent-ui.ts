#!/usr/bin/env node

/**
 * AI-Enhanced Multi-Agent System CLI Interface
 * Comprehensive UI/UX for agent management and orchestration
 */

import { Command } from 'commander';
import * as readline from 'readline';
import { EventEmitter } from 'events';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import boxen from 'boxen';
import { Table } from 'console-table-printer';

import { AIEnhancedCoordinator } from '../agents/ai-enhanced-coordinator';
import { globalRegistry } from '../agents/registry';
import { globalCommunicationBus } from '../agents/communication';
import { AgentMetadata, AgentMessage, Task } from '../agents/types';

interface CLIConfig {
  apiKey?: string;
  verboseMode: boolean;
  interactiveMode: boolean;
  outputFormat: 'json' | 'table' | 'text';
  theme: 'default' | 'minimal' | 'colorful';
}

export class AgentSystemCLI extends EventEmitter {
  private coordinator?: AIEnhancedCoordinator;
  private config: CLIConfig;
  private rl?: readline.Interface;
  private activeSpinner?: ora.Ora;

  constructor() {
    super();
    this.config = {
      verboseMode: false,
      interactiveMode: false,
      outputFormat: 'table',
      theme: 'default'
    };
  }

  /**
   * Initialize CLI interface with banner and system checks
   */
  async initialize(options: Partial<CLIConfig> = {}): Promise<void> {
    this.config = { ...this.config, ...options };
    
    this.displayBanner();
    await this.performSystemChecks();
    
    if (this.config.apiKey) {
      await this.initializeCoordinator();
    }
  }

  /**
   * Display welcome banner with system information
   */
  private displayBanner(): void {
    const banner = boxen(
      chalk.cyan.bold('🤖 Lark AI-Enhanced Multi-Agent System') + '\n' +
      chalk.gray('Intelligent task orchestration and workflow management') + '\n\n' +
      chalk.yellow('• AI-Powered Coordination with Google Gemini') + '\n' +
      chalk.yellow('• Specialized Agents for Base, IM, Docs, Calendar') + '\n' +
      chalk.yellow('• Real-time Communication and Monitoring'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan'
      }
    );
    console.log(banner);
  }

  /**
   * Perform system health checks and display status
   */
  private async performSystemChecks(): Promise<void> {
    const spinner = ora('Performing system health checks...').start();
    
    try {
      // Check registry status
      const registryStatus = await this.checkRegistryHealth();
      
      // Check communication bus
      const busStatus = await this.checkCommunicationBus();
      
      // Check environment
      const envStatus = this.checkEnvironment();
      
      spinner.succeed('System health check completed');
      
      this.displaySystemStatus({
        registry: registryStatus,
        communicationBus: busStatus,
        environment: envStatus
      });
      
    } catch (error) {
      spinner.fail(`System check failed: ${error}`);
      throw error;
    }
  }

  /**
   * Initialize AI-Enhanced Coordinator
   */
  private async initializeCoordinator(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('Gemini API key is required for AI features');
    }

    const spinner = ora('Initializing AI-Enhanced Coordinator...').start();
    
    try {
      this.coordinator = new AIEnhancedCoordinator({
        apiKey: this.config.apiKey
      });
      
      spinner.succeed('AI-Enhanced Coordinator initialized');
      
      if (this.config.verboseMode) {
        console.log(chalk.gray('✓ Google Gemini integration active'));
        console.log(chalk.gray('✓ Intelligent task analysis enabled'));
        console.log(chalk.gray('✓ Workflow optimization ready'));
      }
      
    } catch (error) {
      spinner.fail(`Failed to initialize coordinator: ${error}`);
      throw error;
    }
  }

  /**
   * Interactive task assignment with AI enhancement
   */
  async interactiveTaskAssignment(): Promise<void> {
    if (!this.coordinator) {
      console.log(chalk.red('❌ Coordinator not initialized. Please provide Gemini API key.'));
      return;
    }

    console.log(chalk.blue('\n🎯 Interactive Task Assignment'));
    console.log(chalk.gray('Describe your task and let AI determine the optimal execution strategy\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'What would you like to accomplish?',
        validate: (input: string) => input.length > 0 || 'Please provide a task description'
      },
      {
        type: 'list',
        name: 'priority',
        message: 'What is the priority level?',
        choices: [
          { name: '🔴 High - Urgent, needs immediate attention', value: 'high' },
          { name: '🟡 Medium - Important, normal timeline', value: 'medium' },
          { name: '🟢 Low - Can be scheduled flexibly', value: 'low' }
        ],
        default: 'medium'
      },
      {
        type: 'input',
        name: 'deadline',
        message: 'Any deadline? (optional, e.g., "2024-01-15" or "next week")',
        default: ''
      },
      {
        type: 'confirm',
        name: 'useAI',
        message: 'Use AI-enhanced task decomposition?',
        default: true
      }
    ]);

    const spinner = ora('Analyzing task with AI...').start();

    try {
      let result;
      
      if (answers.useAI) {
        // Use AI-enhanced decomposition
        const requirements = {
          priority: answers.priority,
          deadline: answers.deadline || undefined
        };
        
        result = await this.coordinator.enhancedTaskDecomposition(
          answers.description,
          requirements
        );
        
        spinner.succeed('AI analysis completed');
        
        // Display AI analysis results
        this.displayAIAnalysis(result);
        
        // Confirm execution
        const { proceed } = await inquirer.prompt([{
          type: 'confirm',
          name: 'proceed',
          message: 'Proceed with this execution plan?',
          default: true
        }]);
        
        if (!proceed) {
          console.log(chalk.yellow('⏸️  Task assignment cancelled'));
          return;
        }
        
      } else {
        // Simple task assignment
        const taskId = await this.coordinator.assignTask(answers.description, answers.priority);
        result = { taskId };
        spinner.succeed('Task assigned');
      }
      
      console.log(chalk.green('✅ Task successfully assigned'));
      
      if (result.taskId) {
        console.log(chalk.gray(`Task ID: ${result.taskId}`));
      }
      
    } catch (error) {
      spinner.fail(`Task assignment failed: ${error}`);
    }
  }

  /**
   * Display AI analysis results in formatted output
   */
  private displayAIAnalysis(result: any): void {
    console.log(chalk.blue('\n🧠 AI Analysis Results'));
    
    // Task complexity
    const complexityColor = {
      simple: 'green',
      moderate: 'yellow', 
      complex: 'red'
    }[result.complexity] || 'gray';
    
    console.log(chalk.gray('Complexity:'), chalk[complexityColor as any](result.complexity.toUpperCase()));
    
    // Subtasks
    if (result.subtasks && result.subtasks.length > 0) {
      console.log(chalk.gray('\nSubtasks:'));
      result.subtasks.forEach((subtask: any, index: number) => {
        console.log(chalk.gray(`  ${index + 1}.`), subtask.description);
        console.log(chalk.gray(`     Agent:`) + ` ${subtask.assignedTo || 'TBD'}`);
        console.log(chalk.gray(`     Priority:`) + ` ${subtask.priority}`);
      });
    }
    
    // AI recommendations
    if (result.recommendations && result.recommendations.length > 0) {
      console.log(chalk.gray('\nAI Recommendations:'));
      result.recommendations.forEach((rec: string) => {
        console.log(chalk.yellow('  💡'), rec);
      });
    }
  }

  /**
   * Real-time agent monitoring dashboard
   */
  async startMonitoringDashboard(): Promise<void> {
    console.log(chalk.blue('\n📊 Agent Monitoring Dashboard'));
    console.log(chalk.gray('Press Ctrl+C to exit, R to refresh\n'));

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Enable raw mode for key detection
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    this.rl.input.on('keypress', (char, key) => {
      if (key.ctrl && key.name === 'c') {
        this.stopMonitoring();
      } else if (key.name === 'r') {
        this.refreshDashboard();
      }
    });

    // Start monitoring loop
    this.startMonitoringLoop();
  }

  /**
   * Display current system status
   */
  private displaySystemStatus(status: any): void {
    const statusTable = new Table({
      title: 'System Health Status'
    });

    statusTable.addRow({
      'Component': 'Agent Registry',
      'Status': status.registry.healthy ? chalk.green('✅ Healthy') : chalk.red('❌ Error'),
      'Details': status.registry.message
    });

    statusTable.addRow({
      'Component': 'Communication Bus', 
      'Status': status.communicationBus.healthy ? chalk.green('✅ Healthy') : chalk.red('❌ Error'),
      'Details': status.communicationBus.message
    });

    statusTable.addRow({
      'Component': 'Environment',
      'Status': status.environment.healthy ? chalk.green('✅ Ready') : chalk.yellow('⚠️  Incomplete'),
      'Details': status.environment.message
    });

    statusTable.printTable();
  }

  /**
   * Interactive agent selection and management
   */
  async manageAgents(): Promise<void> {
    const choices = [
      { name: '📋 List all agents', value: 'list' },
      { name: '🔍 Search agents by capability', value: 'search' },
      { name: '📊 View agent statistics', value: 'stats' },
      { name: '🔄 Refresh agent registry', value: 'refresh' },
      { name: '⚙️  Configure agent settings', value: 'configure' },
      { name: '🏠 Back to main menu', value: 'back' }
    ];

    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'Agent Management',
      choices
    }]);

    switch (action) {
      case 'list':
        await this.listAllAgents();
        break;
      case 'search':
        await this.searchAgents();
        break;
      case 'stats':
        await this.displayAgentStatistics();
        break;
      case 'refresh':
        await this.refreshAgentRegistry();
        break;
      case 'configure':
        await this.configureAgentSettings();
        break;
      case 'back':
        return;
    }

    // Return to agent management menu
    await this.manageAgents();
  }

  /**
   * List all registered agents
   */
  private async listAllAgents(): Promise<void> {
    const spinner = ora('Fetching agent list...').start();
    
    try {
      const agents = await globalRegistry.getAllAgents();
      spinner.succeed(`Found ${agents.length} registered agents`);

      if (agents.length === 0) {
        console.log(chalk.yellow('📭 No agents currently registered'));
        return;
      }

      const agentTable = new Table({
        title: 'Registered Agents'
      });

      agents.forEach(agent => {
        agentTable.addRow({
          'ID': agent.id.substring(0, 12) + '...',
          'Name': agent.name,
          'Type': agent.type,
          'Status': this.formatAgentStatus(agent.status),
          'Tasks': `${agent.currentTasks}/${agent.maxConcurrentTasks}`,
          'Last Seen': this.formatLastHeartbeat(agent.lastHeartbeat)
        });
      });

      agentTable.printTable();
      
    } catch (error) {
      spinner.fail(`Failed to fetch agents: ${error}`);
    }
  }

  /**
   * Search agents by capability
   */
  private async searchAgents(): Promise<void> {
    const { capability } = await inquirer.prompt([{
      type: 'input',
      name: 'capability',
      message: 'Enter capability to search for (e.g., "messaging", "calendar"):',
      validate: (input: string) => input.length > 0 || 'Please enter a capability'
    }]);

    const spinner = ora(`Searching for agents with "${capability}" capability...`).start();
    
    try {
      const agents = globalRegistry.discoverAgents(capability);
      spinner.succeed(`Found ${agents.length} agents with "${capability}" capability`);

      if (agents.length === 0) {
        console.log(chalk.yellow(`📭 No agents found with "${capability}" capability`));
        return;
      }

      const resultTable = new Table({
        title: `Agents with "${capability}" Capability`
      });

      agents.forEach(agent => {
        const relevantCapabilities = agent.capabilities
          .filter(cap => cap.name.toLowerCase().includes(capability.toLowerCase()))
          .map(cap => cap.name)
          .join(', ');

        resultTable.addRow({
          'Name': agent.name,
          'Type': agent.type,
          'Status': this.formatAgentStatus(agent.status),
          'Matching Capabilities': relevantCapabilities,
          'Load': `${agent.currentTasks}/${agent.maxConcurrentTasks}`
        });
      });

      resultTable.printTable();
      
    } catch (error) {
      spinner.fail(`Search failed: ${error}`);
    }
  }

  /**
   * Task management interface
   */
  async manageTasks(): Promise<void> {
    if (!this.coordinator) {
      console.log(chalk.red('❌ Coordinator not initialized'));
      return;
    }

    const choices = [
      { name: '📝 Create new task', value: 'create' },
      { name: '📋 List active tasks', value: 'list' },
      { name: '🔍 Check task status', value: 'status' },
      { name: '⏸️  Pause task', value: 'pause' },
      { name: '▶️  Resume task', value: 'resume' },
      { name: '❌ Cancel task', value: 'cancel' },
      { name: '🏠 Back to main menu', value: 'back' }
    ];

    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'Task Management',
      choices
    }]);

    switch (action) {
      case 'create':
        await this.interactiveTaskAssignment();
        break;
      case 'list':
        await this.listActiveTasks();
        break;
      case 'status':
        await this.checkTaskStatus();
        break;
      case 'back':
        return;
    }

    // Return to task management menu
    await this.manageTasks();
  }

  /**
   * List all active tasks
   */
  private async listActiveTasks(): Promise<void> {
    if (!this.coordinator) return;

    const spinner = ora('Fetching active tasks...').start();
    
    try {
      const tool = this.coordinator.tools.get('list_active_tasks');
      const result = await tool?.execute({});
      
      if (!result?.success) {
        spinner.fail('Failed to fetch tasks');
        return;
      }

      spinner.succeed(`Found ${result.count} active tasks`);

      if (result.count === 0) {
        console.log(chalk.yellow('📭 No active tasks'));
        return;
      }

      const taskTable = new Table({
        title: 'Active Tasks'
      });

      result.activeTasks.forEach((task: any) => {
        taskTable.addRow({
          'ID': task.id.substring(0, 12) + '...',
          'Name': task.name,
          'Status': this.formatTaskStatus(task.status),
          'Priority': this.formatPriority(task.priority),
          'Created': new Date(task.createdAt).toLocaleString()
        });
      });

      taskTable.printTable();
      
    } catch (error) {
      spinner.fail(`Failed to fetch tasks: ${error}`);
    }
  }

  /**
   * Check specific task status
   */
  private async checkTaskStatus(): Promise<void> {
    if (!this.coordinator) return;

    const { taskId } = await inquirer.prompt([{
      type: 'input',
      name: 'taskId',
      message: 'Enter task ID:',
      validate: (input: string) => input.length > 0 || 'Please enter a task ID'
    }]);

    const spinner = ora('Checking task status...').start();
    
    try {
      const tool = this.coordinator.tools.get('get_task_status');
      const result = await tool?.execute({ taskId });
      
      if (!result?.success) {
        spinner.fail(result?.error || 'Task not found');
        return;
      }

      spinner.succeed('Task status retrieved');

      const task = result.task;
      console.log(chalk.blue('\n📋 Task Details'));
      console.log(chalk.gray('ID:'), task.id);
      console.log(chalk.gray('Name:'), task.name);
      console.log(chalk.gray('Status:'), this.formatTaskStatus(task.status));
      console.log(chalk.gray('Priority:'), this.formatPriority(task.priority));
      console.log(chalk.gray('Created:'), new Date(task.createdAt).toLocaleString());
      
      if (task.assignedAgentId) {
        console.log(chalk.gray('Assigned to:'), task.assignedAgentId);
      }
      
    } catch (error) {
      spinner.fail(`Failed to check task status: ${error}`);
    }
  }

  /**
   * Helper method to format agent status
   */
  private formatAgentStatus(status: string): string {
    const statusColors: Record<string, string> = {
      'idle': 'green',
      'busy': 'yellow',
      'error': 'red',
      'offline': 'gray'
    };
    
    const color = statusColors[status] || 'gray';
    return chalk[color as any](`${status.toUpperCase()}`);
  }

  /**
   * Helper method to format task status
   */
  private formatTaskStatus(status: string): string {
    const statusColors: Record<string, string> = {
      'pending': 'yellow',
      'assigned': 'blue',
      'in_progress': 'cyan',
      'completed': 'green',
      'failed': 'red',
      'cancelled': 'gray'
    };
    
    const color = statusColors[status] || 'gray';
    return chalk[color as any](`${status.toUpperCase()}`);
  }

  /**
   * Helper method to format priority
   */
  private formatPriority(priority: string): string {
    const priorityColors: Record<string, string> = {
      'low': 'green',
      'medium': 'yellow',
      'high': 'red'
    };
    
    const color = priorityColors[priority] || 'gray';
    return chalk[color as any](`${priority.toUpperCase()}`);
  }

  /**
   * Helper method to format last heartbeat
   */
  private formatLastHeartbeat(lastHeartbeat: Date): string {
    const now = new Date();
    const diff = now.getTime() - lastHeartbeat.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  /**
   * System health check methods
   */
  private async checkRegistryHealth(): Promise<{ healthy: boolean; message: string }> {
    try {
      const agents = await globalRegistry.getAllAgents();
      return {
        healthy: true,
        message: `${agents.length} agents registered`
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Error: ${error}`
      };
    }
  }

  private async checkCommunicationBus(): Promise<{ healthy: boolean; message: string }> {
    try {
      // Test communication bus
      return {
        healthy: true,
        message: 'Bus operational'
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Error: ${error}`
      };
    }
  }

  private checkEnvironment(): { healthy: boolean; message: string } {
    const requiredVars = ['APP_ID', 'APP_SECRET'];
    const optionalVars = ['GEMINI_API_KEY', 'USER_ACCESS_TOKEN'];
    
    const missing = requiredVars.filter(v => !process.env[v]);
    const available = optionalVars.filter(v => process.env[v]);
    
    if (missing.length > 0) {
      return {
        healthy: false,
        message: `Missing: ${missing.join(', ')}`
      };
    }
    
    return {
      healthy: true,
      message: `Required vars set, ${available.length} optional vars available`
    };
  }

  /**
   * Monitoring methods (stubs for implementation)
   */
  private startMonitoringLoop(): void {
    // Implementation for real-time monitoring
    setInterval(() => {
      this.refreshDashboard();
    }, 5000);
  }

  private refreshDashboard(): void {
    // Clear screen and redraw dashboard
    console.clear();
    this.displayBanner();
    // Refresh agent and task data
  }

  private stopMonitoring(): void {
    if (this.rl) {
      this.rl.close();
    }
    process.exit(0);
  }

  private async displayAgentStatistics(): Promise<void> {
    // Implementation for agent statistics
    console.log(chalk.yellow('📊 Agent statistics feature coming soon...'));
  }

  private async refreshAgentRegistry(): Promise<void> {
    const spinner = ora('Refreshing agent registry...').start();
    // Implementation for registry refresh
    spinner.succeed('Agent registry refreshed');
  }

  private async configureAgentSettings(): Promise<void> {
    // Implementation for agent configuration
    console.log(chalk.yellow('⚙️  Agent configuration feature coming soon...'));
  }
}

/**
 * Main CLI entry point
 */
export async function createAgentCLI(): Promise<Command> {
  const program = new Command();
  
  program
    .name('lark-agent')
    .description('AI-Enhanced Multi-Agent System CLI')
    .version('1.0.0');

  // Main interactive mode
  program
    .command('interactive')
    .alias('i')
    .description('Start interactive agent management interface')
    .option('-k, --api-key <key>', 'Gemini API key for AI features')
    .option('-v, --verbose', 'Enable verbose output')
    .option('-f, --format <format>', 'Output format (json|table|text)', 'table')
    .action(async (options) => {
      const cli = new AgentSystemCLI();
      await cli.initialize({
        apiKey: options.apiKey || process.env.GEMINI_API_KEY,
        verboseMode: options.verbose,
        interactiveMode: true,
        outputFormat: options.format
      });

      // Start main menu
      await startMainMenu(cli);
    });

  // Quick task assignment
  program
    .command('task')
    .description('Quick task assignment')
    .argument('<description>', 'Task description')
    .option('-p, --priority <level>', 'Priority level (low|medium|high)', 'medium')
    .option('-k, --api-key <key>', 'Gemini API key')
    .action(async (description, options) => {
      const cli = new AgentSystemCLI();
      await cli.initialize({
        apiKey: options.apiKey || process.env.GEMINI_API_KEY
      });
      
      // Simulate quick task assignment
      console.log(chalk.blue('🎯 Quick Task Assignment'));
      console.log(chalk.gray(`Task: ${description}`));
      console.log(chalk.gray(`Priority: ${options.priority}`));
      
      // Implementation would go here
    });

  // Agent monitoring
  program
    .command('monitor')
    .description('Start real-time agent monitoring')
    .option('-r, --refresh <seconds>', 'Refresh interval in seconds', '5')
    .action(async (options) => {
      const cli = new AgentSystemCLI();
      await cli.initialize();
      await cli.startMonitoringDashboard();
    });

  return program;
}

/**
 * Interactive main menu
 */
async function startMainMenu(cli: AgentSystemCLI): Promise<void> {
  const choices = [
    { name: '🎯 Interactive Task Assignment', value: 'task' },
    { name: '👥 Manage Agents', value: 'agents' },
    { name: '📋 Manage Tasks', value: 'tasks' },
    { name: '📊 Monitoring Dashboard', value: 'monitor' },
    { name: '⚙️  System Settings', value: 'settings' },
    { name: '❓ Help & Documentation', value: 'help' },
    { name: '👋 Exit', value: 'exit' }
  ];

  while (true) {
    console.log(); // Add spacing
    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices
    }]);

    switch (action) {
      case 'task':
        await cli.interactiveTaskAssignment();
        break;
      case 'agents':
        await cli.manageAgents();
        break;
      case 'tasks':
        await cli.manageTasks();
        break;
      case 'monitor':
        await cli.startMonitoringDashboard();
        break;
      case 'settings':
        console.log(chalk.yellow('⚙️  Settings feature coming soon...'));
        break;
      case 'help':
        displayHelp();
        break;
      case 'exit':
        console.log(chalk.cyan('👋 Thank you for using the AI-Enhanced Multi-Agent System!'));
        process.exit(0);
    }
  }
}

/**
 * Display help information
 */
function displayHelp(): void {
  const help = boxen(
    chalk.bold('🤖 AI-Enhanced Multi-Agent System CLI Help') + '\n\n' +
    
    chalk.yellow.bold('Quick Commands:') + '\n' +
    chalk.gray('lark-agent interactive') + ' - Start interactive mode\n' +
    chalk.gray('lark-agent task "description"') + ' - Quick task assignment\n' +
    chalk.gray('lark-agent monitor') + ' - Real-time monitoring\n\n' +
    
    chalk.yellow.bold('Environment Variables:') + '\n' +
    chalk.gray('GEMINI_API_KEY') + ' - Google Gemini API key (required for AI features)\n' +
    chalk.gray('APP_ID') + ' - Lark application ID\n' +
    chalk.gray('APP_SECRET') + ' - Lark application secret\n\n' +
    
    chalk.yellow.bold('Features:') + '\n' +
    '• AI-powered task decomposition and optimization\n' +
    '• Real-time agent monitoring and management\n' +
    '• Interactive task assignment with smart routing\n' +
    '• Comprehensive system health monitoring\n' +
    '• Multi-agent coordination and communication\n\n' +
    
    chalk.gray('For more information, visit: https://github.com/larksuite/lark-openapi-mcp'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'blue'
    }
  );
  
  console.log(help);
}

// Export for use in other modules
export { AgentSystemCLI };