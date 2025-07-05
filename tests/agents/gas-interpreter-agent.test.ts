/**
 * GAS Interpreter Agent Test Suite
 */

import { GASInterpreterAgent, createGASInterpreter } from '../../src/agents/specialists/gas-interpreter-agent';
import { globalRegistry } from '../../src/agents/registry';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GAS Interpreter Agent', () => {
  let agent: GASInterpreterAgent;
  let agentId: string;

  beforeEach(async () => {
    // Clear registry
    jest.clearAllMocks();
    
    // Create agent
    agent = new GASInterpreterAgent();
    agentId = await createGASInterpreter();
  });

  afterEach(async () => {
    // Cleanup
    await globalRegistry.unregisterAgent(agentId);
  });

  describe('Agent Creation', () => {
    it('should create GAS interpreter agent with correct configuration', () => {
      expect(agent).toBeDefined();
      expect(agent.config.name).toBe('GAS Interpreter');
      expect(agent.config.language).toBe('ja');
    });

    it('should register agent in global registry', async () => {
      const registeredAgent = await globalRegistry.getAgent(agentId);
      expect(registeredAgent).toBeDefined();
      expect(registeredAgent?.name).toBe('GAS Interpreter');
      expect(registeredAgent?.type).toBe('specialist');
    });

    it('should have all required capabilities', async () => {
      const registeredAgent = await globalRegistry.getAgent(agentId);
      const capabilities = registeredAgent?.capabilities.map(c => c.name) || [];
      
      expect(capabilities).toContain('gas_execution');
      expect(capabilities).toContain('code_generation');
      expect(capabilities).toContain('google_services');
      expect(capabilities).toContain('error_recovery');
    });
  });

  describe('Code Generation', () => {
    it('should generate email send code', async () => {
      const tool = agent.tools.get('generateGASCode');
      const result = await tool?.execute({
        intent: 'メールを送信したい',
        context: {
          recipient: 'test@example.com',
          subject: 'テストメール',
          body: 'これはテストです'
        }
      });

      expect(result?.success).toBe(true);
      expect(result?.code).toContain('GmailApp.sendEmail');
      expect(result?.code).toContain('test@example.com');
      expect(result?.title).toBe('メール送信');
    });

    it('should generate spreadsheet creation code', async () => {
      const tool = agent.tools.get('generateGASCode');
      const result = await tool?.execute({
        intent: 'スプレッドシートを作成',
        context: {
          name: 'テストシート',
          data: [['名前', '年齢'], ['田中', '30']]
        }
      });

      expect(result?.success).toBe(true);
      expect(result?.code).toContain('SpreadsheetApp.create');
      expect(result?.code).toContain('テストシート');
    });

    it('should generate calendar event code', async () => {
      const tool = agent.tools.get('generateGASCode');
      const result = await tool?.execute({
        intent: 'カレンダーにイベントを追加'
      });

      expect(result?.success).toBe(true);
      expect(result?.code).toContain('CalendarApp');
      expect(result?.code).toContain('createEvent');
    });

    it('should generate drive search code', async () => {
      const tool = agent.tools.get('generateGASCode');
      const result = await tool?.execute({
        intent: 'ドライブでAIに関するファイルを検索',
        context: {
          searchTerm: 'AI'
        }
      });

      expect(result?.success).toBe(true);
      expect(result?.code).toContain('DriveApp.searchFiles');
      expect(result?.code).toContain('AI');
    });
  });

  describe('Script Execution', () => {
    it('should execute script successfully', async () => {
      // Mock successful API response
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          success: true,
          result: 'Email sent successfully'
        }
      });

      const tool = agent.tools.get('executeScript');
      const result = await tool?.execute({
        title: 'Test Script',
        script: 'return "Hello World";'
      });

      expect(result?.success).toBe(true);
      expect(result?.result).toBe('Email sent successfully');
      expect(result?.executionId).toBeDefined();
    });

    it('should handle execution errors', async () => {
      // Mock error response
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      const tool = agent.tools.get('executeScript');
      const result = await tool?.execute({
        title: 'Error Script',
        script: 'invalid code'
      });

      expect(result?.success).toBe(false);
      expect(result?.error).toContain('Network error');
      expect(result?.suggestion).toBeDefined();
    });

    it('should save execution history', async () => {
      // Mock successful execution
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          success: true,
          result: 'Script executed'
        }
      });

      const executeTool = agent.tools.get('executeScript');
      await executeTool?.execute({
        title: 'History Test',
        script: 'return "test";'
      });

      const historyTool = agent.tools.get('getExecutionHistory');
      const history = await historyTool?.execute({ limit: 5 });

      expect(history?.success).toBe(true);
      expect(history?.history).toHaveLength(1);
      expect(history?.history[0].title).toBe('History Test');
    });
  });

  describe('Task Execution', () => {
    it('should execute task from natural language', async () => {
      // Mock successful execution
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          success: true,
          result: 'Email sent'
        }
      });

      const result = await agent.executeTask('送信してメールを test@example.com に');

      expect(result?.success).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          apiKey: '45966720-6681-4517-ab97-9e1e22a818b3'
        }),
        expect.any(Object)
      );
    });

    it('should retry with fixed code on failure', async () => {
      // Mock failed execution that returns error in result
      const executeTool = agent.tools.get('executeScript');
      const executeOriginal = executeTool!.execute;
      
      let callCount = 0;
      executeTool!.execute = jest.fn().mockImplementation(async (params) => {
        callCount++;
        if (callCount === 1) {
          // First call fails
          return {
            success: false,
            error: 'undefined is not a function'
          };
        } else {
          // Second call succeeds (retry)
          return {
            success: true,
            result: 'Fixed and executed',
            executionId: 'exec_retry'
          };
        }
      });

      const result = await agent.executeTask('スプレッドシートを操作');

      expect(result?.success).toBe(true);
      expect(executeTool!.execute).toHaveBeenCalledTimes(2);
      
      // Restore original
      executeTool!.execute = executeOriginal;
    });
  });

  describe('Error Handling', () => {
    it('should generate appropriate error suggestions', async () => {
      // Mock timeout error with correct case
      mockedAxios.post.mockRejectedValueOnce({ 
        message: 'Request timeout'
      });

      const tool = agent.tools.get('executeScript');
      const result = await tool?.execute({
        title: 'Timeout Test',
        script: 'long running script'
      });

      expect(result?.suggestion).toContain('実行時間が長すぎます');
    });

    it('should handle permission errors', async () => {
      // Mock permission error with correct case
      mockedAxios.post.mockRejectedValueOnce({ 
        message: 'Permission denied'
      });

      const tool = agent.tools.get('executeScript');
      const result = await tool?.execute({
        title: 'Permission Test', 
        script: 'restricted operation'
      });

      expect(result?.suggestion).toContain('権限エラー');
    });

    it('should handle syntax errors', async () => {
      // Mock syntax error with correct case
      mockedAxios.post.mockRejectedValueOnce({ 
        message: 'Syntax error in script'
      });

      const tool = agent.tools.get('executeScript');
      const result = await tool?.execute({
        title: 'Syntax Test',
        script: 'invalid syntax'
      });

      expect(result?.suggestion).toContain('構文エラー');
    });
  });
});