/**
 * Tests for Genesis Prompt Engine
 * 7段階コマンドスタック処理システムのテスト
 */

import { 
  GenesisPromptEngine, 
  COMMAND_STACK, 
  ExecutionContext,
  PromptEngineConfig
} from '@/genesis/core/prompt-engine';
import { GeminiClient } from '@/genesis/utils/gemini-client';

// Mock GeminiClient
jest.mock('@/genesis/utils/gemini-client');

// Mock console
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

describe('GenesisPromptEngine', () => {
  let mockGeminiClient: jest.Mocked<GeminiClient>;
  let engine: GenesisPromptEngine;
  let config: PromptEngineConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock GeminiClient implementation
    mockGeminiClient = {
      generateStructuredContent: jest.fn()
    } as any;
    
    (GeminiClient as jest.Mock).mockImplementation(() => mockGeminiClient);
    
    config = {
      geminiApiKey: 'test-api-key',
      maxRetries: 3,
      timeoutMs: 30000,
      enableLogging: true
    };
    
    engine = new GenesisPromptEngine(config);
  });

  describe('コンストラクタ', () => {
    test('設定が正しく初期化される', () => {
      expect(GeminiClient).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        maxRetries: 3,
        timeoutMs: 30000
      });
    });

    test('ロギングが無効の場合', () => {
      const configNoLog = { ...config, enableLogging: false };
      const engineNoLog = new GenesisPromptEngine(configNoLog);
      
      // executeSpecificCommandを使ってログメソッドをテスト
      engineNoLog.getExecutionStatus({ 
        requirements: 'test',
        currentLevel: 1,
        results: {},
        metadata: {
          projectId: 'test',
          timestamp: Date.now(),
          version: '1.0.0'
        }
      });
      
      // ログが出力されないことを確認（他のメソッドからのログは除外）
      expect(mockConsoleLog).not.toHaveBeenCalledWith(
        expect.stringContaining('[GenesisPromptEngine]')
      );
    });
  });

  describe('executeCommandStack', () => {
    test('全てのコマンドが順次実行される', async () => {
      // 各コマンドの応答をモック
      const mockResponses = COMMAND_STACK.map((cmd, index) => ({
        [`${cmd.id}_data`]: `Result for ${cmd.id}`
      }));
      
      mockGeminiClient.generateStructuredContent
        .mockImplementation(async (prompt, schema, options) => {
          const commandIndex = mockGeminiClient.generateStructuredContent.mock.calls.length - 1;
          return mockResponses[commandIndex];
        });
      
      const requirements = 'CRMシステムを構築したい';
      const result = await engine.executeCommandStack(requirements);
      
      // 全てのコマンドが実行されたか確認
      expect(mockGeminiClient.generateStructuredContent).toHaveBeenCalledTimes(COMMAND_STACK.length);
      
      // コンテキストの確認
      expect(result.requirements).toBe(requirements);
      expect(result.currentLevel).toBe(COMMAND_STACK.length);
      expect(Object.keys(result.results)).toHaveLength(COMMAND_STACK.length);
      
      // 各コマンドの結果が保存されているか確認
      COMMAND_STACK.forEach((cmd, index) => {
        expect(result.results[cmd.id]).toEqual(mockResponses[index]);
      });
      
      // メタデータの確認
      expect(result.metadata).toHaveProperty('projectId');
      expect(result.metadata).toHaveProperty('timestamp');
      expect(result.metadata.version).toBe('1.0.0');
    });

    test('コマンド実行中のエラーハンドリング', async () => {
      // 3番目のコマンドでエラーを発生させる
      mockGeminiClient.generateStructuredContent
        .mockResolvedValueOnce({ C1_data: 'Success' })
        .mockResolvedValueOnce({ C2_data: 'Success' })
        .mockRejectedValueOnce(new Error('API Error'));
      
      await expect(engine.executeCommandStack('test requirements'))
        .rejects
        .toThrow('Command C3 failed: Error: API Error');
      
      // エラー前のコマンドは実行されている
      expect(mockGeminiClient.generateStructuredContent).toHaveBeenCalledTimes(3);
    });

    test('ログ出力の確認', async () => {
      mockGeminiClient.generateStructuredContent.mockResolvedValue({ test: 'data' });
      
      await engine.executeCommandStack('test');
      
      // 各コマンドの開始と完了ログ
      COMMAND_STACK.forEach(cmd => {
        expect(mockConsoleLog).toHaveBeenCalledWith(
          expect.stringContaining(`Executing ${cmd.id}: ${cmd.name}`)
        );
        expect(mockConsoleLog).toHaveBeenCalledWith(
          expect.stringContaining(`Completed ${cmd.id} successfully`)
        );
      });
    });
  });

  describe('executeSpecificCommand', () => {
    test('特定のコマンドのみ実行', async () => {
      const mockResponse = { base_structure: 'test' };
      mockGeminiClient.generateStructuredContent.mockResolvedValue(mockResponse);
      
      const context: ExecutionContext = {
        requirements: 'test requirements',
        currentLevel: 2,
        results: {
          C1: { projectTitle: 'Test Project' },
          C2: { entities: [] }
        },
        metadata: {
          projectId: 'test-id',
          timestamp: Date.now(),
          version: '1.0.0'
        }
      };
      
      const result = await engine.executeSpecificCommand('C3', context);
      
      expect(result).toEqual(mockResponse);
      expect(mockGeminiClient.generateStructuredContent).toHaveBeenCalledTimes(1);
    });

    test('存在しないコマンドIDの場合', async () => {
      const context = {
        requirements: 'test',
        currentLevel: 0,
        results: {},
        metadata: {
          projectId: 'test',
          timestamp: Date.now(),
          version: '1.0.0'
        }
      };
      
      await expect(engine.executeSpecificCommand('INVALID', context))
        .rejects
        .toThrow('Command INVALID not found');
    });

    test('依存関係が満たされていない場合', async () => {
      const context: ExecutionContext = {
        requirements: 'test',
        currentLevel: 1,
        results: {
          C1: { data: 'test' }
          // C2が欠落
        },
        metadata: {
          projectId: 'test',
          timestamp: Date.now(),
          version: '1.0.0'
        }
      };
      
      // C3はC2に依存している
      await expect(engine.executeSpecificCommand('C3', context))
        .rejects
        .toThrow('Dependency C2 not found for command C3');
    });
  });

  describe('getExecutionStatus', () => {
    test('実行状況の正確な計算', () => {
      const context: ExecutionContext = {
        requirements: 'test',
        currentLevel: 3,
        results: {
          C1: { data: 'result1' },
          C2: { data: 'result2' },
          C3: { data: 'result3' }
        },
        metadata: {
          projectId: 'test',
          timestamp: Date.now(),
          version: '1.0.0'
        }
      };
      
      const status = engine.getExecutionStatus(context);
      
      expect(status).toEqual({
        progress: (3 / COMMAND_STACK.length) * 100,
        currentLevel: 3,
        completedCommands: ['C1', 'C2', 'C3'],
        nextCommand: 'C4',
        isComplete: false
      });
    });

    test('全コマンド完了時の状態', () => {
      const completedResults: Record<string, any> = {};
      COMMAND_STACK.forEach(cmd => {
        completedResults[cmd.id] = { data: `${cmd.id} result` };
      });
      
      const context: ExecutionContext = {
        requirements: 'test',
        currentLevel: COMMAND_STACK.length,
        results: completedResults,
        metadata: {
          projectId: 'test',
          timestamp: Date.now(),
          version: '1.0.0'
        }
      };
      
      const status = engine.getExecutionStatus(context);
      
      expect(status).toEqual({
        progress: 100,
        currentLevel: COMMAND_STACK.length,
        completedCommands: COMMAND_STACK.map(cmd => cmd.id),
        nextCommand: null,
        isComplete: true
      });
    });

    test('初期状態の確認', () => {
      const context: ExecutionContext = {
        requirements: 'test',
        currentLevel: 0,
        results: {},
        metadata: {
          projectId: 'test',
          timestamp: Date.now(),
          version: '1.0.0'
        }
      };
      
      const status = engine.getExecutionStatus(context);
      
      expect(status).toEqual({
        progress: 0,
        currentLevel: 0,
        completedCommands: [],
        nextCommand: 'C1',
        isComplete: false
      });
    });
  });

  describe('プロンプト処理', () => {
    test('依存関係の結果がプロンプトに注入される', async () => {
      const context: ExecutionContext = {
        requirements: 'Build a CRM',
        currentLevel: 2,
        results: {
          C1: { projectTitle: 'CRM System', domain: 'Sales' }
        },
        metadata: {
          projectId: 'test',
          timestamp: Date.now(),
          version: '1.0.0'
        }
      };
      
      mockGeminiClient.generateStructuredContent.mockResolvedValue({ entities: [] });
      
      await engine.executeSpecificCommand('C2', context);
      
      // プロンプトに依存関係の結果が含まれているか確認
      const callArgs = mockGeminiClient.generateStructuredContent.mock.calls[0];
      const prompt = callArgs[0];
      
      expect(prompt).toContain(JSON.stringify(context.results.C1, null, 2));
    });

    test('要求仕様がプロンプトに注入される', async () => {
      const requirements = 'Create an inventory management system';
      mockGeminiClient.generateStructuredContent.mockResolvedValue({ data: 'result' });
      
      await engine.executeCommandStack(requirements);
      
      // 最初のコマンド（C1）のプロンプトに要求仕様が含まれているか
      const firstCall = mockGeminiClient.generateStructuredContent.mock.calls[0];
      const prompt = firstCall[0];
      
      expect(prompt).toContain(requirements);
    });

    test('Gemini API呼び出しのパラメータ確認', async () => {
      mockGeminiClient.generateStructuredContent.mockResolvedValue({ data: 'test' });
      
      const context: ExecutionContext = {
        requirements: 'test',
        currentLevel: 0,
        results: {},
        metadata: {
          projectId: 'test',
          timestamp: Date.now(),
          version: '1.0.0'
        }
      };
      
      await engine.executeSpecificCommand('C1', context);
      
      expect(mockGeminiClient.generateStructuredContent).toHaveBeenCalledWith(
        expect.any(String), // prompt
        COMMAND_STACK[0].outputSchema, // schema
        {
          temperature: 0.1,
          maxOutputTokens: 4096
        }
      );
    });
  });

  describe('エラーケース', () => {
    test('Gemini APIエラーの伝播', async () => {
      const apiError = new Error('Gemini API rate limit exceeded');
      mockGeminiClient.generateStructuredContent.mockRejectedValue(apiError);
      
      await expect(engine.executeCommandStack('test'))
        .rejects
        .toThrow('Command C1 failed: Error: Gemini API rate limit exceeded');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Gemini API error: Error: Gemini API rate limit exceeded')
      );
    });

    test('複数の依存関係チェック', async () => {
      // C7は多くの依存関係を持つ
      const context: ExecutionContext = {
        requirements: 'test',
        currentLevel: 6,
        results: {
          C1: { data: 'test' },
          C2: { data: 'test' },
          C3: { data: 'test' },
          C4: { data: 'test' },
          C5: { data: 'test' }
          // C6が欠落
        },
        metadata: {
          projectId: 'test',
          timestamp: Date.now(),
          version: '1.0.0'
        }
      };
      
      await expect(engine.executeSpecificCommand('C7', context))
        .rejects
        .toThrow('Dependency C6 not found for command C7');
    });
  });

  describe('COMMAND_STACK定義の検証', () => {
    test('全てのコマンドに必要なプロパティがある', () => {
      COMMAND_STACK.forEach(cmd => {
        expect(cmd).toHaveProperty('id');
        expect(cmd).toHaveProperty('name');
        expect(cmd).toHaveProperty('description');
        expect(cmd).toHaveProperty('prompt');
        expect(cmd).toHaveProperty('outputSchema');
      });
    });

    test('依存関係が正しい順序で定義されている', () => {
      COMMAND_STACK.forEach((cmd, index) => {
        if (cmd.dependencies) {
          cmd.dependencies.forEach(dep => {
            const depIndex = COMMAND_STACK.findIndex(c => c.id === dep);
            expect(depIndex).toBeGreaterThanOrEqual(0);
            expect(depIndex).toBeLessThan(index);
          });
        }
      });
    });

    test('コマンドIDが一意である', () => {
      const ids = COMMAND_STACK.map(cmd => cmd.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});