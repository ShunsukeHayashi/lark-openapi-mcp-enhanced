/**
 * GAS Interpreter Agent - Google Apps Script Execution Specialist
 * Executes JavaScript code in Google Apps Script environment via API
 */

import { Agent, AgentConfig, AgentTool } from '../agent';
import { AgentCapability, AgentMetadata } from '../types';
import { globalRegistry } from '../registry';
import axios from 'axios';

interface ExecuteScriptRequest {
  title: string;
  script: string;
  apiKey: string;
}

interface ExecuteScriptResponse {
  success: boolean;
  result?: string;
  error?: string;
}

export class GASInterpreterAgent extends Agent {
  private readonly API_URL =
    'https://script.google.com/macros/s/AKfycbxfSYtQ1HoeY8uH1G9-M9kPv7sn-zNT0yKbsU0tnBx6wDNsF6yww8rXtPDIXC5VYAeYAQ/exec';
  private readonly API_KEY = '45966720-6681-4517-ab97-9e1e22a818b3';
  private executionHistory: Map<string, any> = new Map();

  constructor(config: Partial<AgentConfig> = {}) {
    const gasConfig: AgentConfig = {
      name: 'GAS Interpreter',
      instructions: `
あなたはGoogle Apps Script環境内でJavaScriptコードを実行するGAS Interpreter APIを使いこなすユーザー専属の秘書です。
ユーザーのGmailやCalendar、DriveApp、YouTube などのGoogleサービスにアクセスし、さまざまなタスクを実行します。

主要な仕事:
- ユーザーの意図を理解し、Google Apps Scriptをコーディング
- executeScriptツールを使用してコードを実行
- エラーが発生した場合は自動的に修正して再実行

コーディング規約:
- 必須のreturn文で終了
- function文は含めない
- 情報量の多い返答を心がける
`,
      tools: [],
      model: 'gpt-4',
      temperature: 0.3,
      maxTokens: 2000,
      language: 'ja',
      ...config,
    };

    super(gasConfig);

    // Initialize tools after parent constructor
    const gasTools = this.createGASTools();
    this.config.tools = gasTools;

    // Re-initialize tools map
    for (const tool of gasTools) {
      this.tools.set(tool.name, tool);
    }
  }

  private createGASTools(): AgentTool[] {
    return [
      {
        name: 'executeScript',
        description: 'Execute JavaScript code in Google Apps Script environment',
        execute: async (params: any) => {
          const { title, script } = params;

          try {
            const request: ExecuteScriptRequest = {
              title,
              script,
              apiKey: this.API_KEY,
            };

            const response = await axios.post<ExecuteScriptResponse>(this.API_URL, request, {
              headers: {
                'Content-Type': 'application/json',
              },
              timeout: 30000, // 30 seconds timeout
            });

            const executionId = `exec_${Date.now()}`;
            this.executionHistory.set(executionId, {
              title,
              script,
              result: response.data,
              timestamp: new Date().toISOString(),
            });

            return {
              success: response.data.success,
              result: response.data.result || response.data.error,
              executionId,
            };
          } catch (error: any) {
            console.error('GAS execution error:', error);

            return {
              success: false,
              error: error.message || 'Script execution failed',
              suggestion: this.generateErrorSuggestion(error, script),
            };
          }
        },
        schema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Short title of the script' },
            script: { type: 'string', description: 'JavaScript code to execute' },
          },
          required: ['title', 'script'],
        },
      },

      {
        name: 'getExecutionHistory',
        description: 'Get history of executed scripts',
        execute: async (params: any) => {
          const { limit = 10 } = params;

          const history = Array.from(this.executionHistory.entries())
            .slice(-limit)
            .map(([id, data]) => ({
              id,
              title: data.title,
              timestamp: data.timestamp,
              success: data.result?.success || false,
            }));

          return {
            success: true,
            history,
            count: history.length,
          };
        },
        schema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of recent executions to retrieve' },
          },
        },
      },

      {
        name: 'generateGASCode',
        description: 'Generate Google Apps Script code based on user intent',
        execute: async (params: any) => {
          const { intent, context } = params;

          const code = this.generateCodeFromIntent(intent, context);

          return {
            success: true,
            code,
            title: this.generateTitleFromIntent(intent),
          };
        },
        schema: {
          type: 'object',
          properties: {
            intent: { type: 'string', description: 'User intent in natural language' },
            context: { type: 'object', description: 'Additional context for code generation' },
          },
          required: ['intent'],
        },
      },
    ];
  }

  /**
   * Generate GAS code based on user intent
   */
  private generateCodeFromIntent(intent: string, context?: any): string {
    const lowerIntent = intent.toLowerCase();

    // Email related
    if (lowerIntent.includes('メール') || lowerIntent.includes('mail')) {
      if (lowerIntent.includes('送信') || lowerIntent.includes('send')) {
        return this.generateEmailSendCode(context);
      }
      if (lowerIntent.includes('検索') || lowerIntent.includes('search')) {
        return this.generateEmailSearchCode(context);
      }
    }

    // Spreadsheet related
    if (lowerIntent.includes('スプレッドシート') || lowerIntent.includes('spreadsheet')) {
      if (lowerIntent.includes('作成') || lowerIntent.includes('create')) {
        return this.generateSpreadsheetCreateCode(context);
      }
    }

    // Calendar related
    if (lowerIntent.includes('カレンダー') || lowerIntent.includes('calendar')) {
      if (lowerIntent.includes('イベント') || lowerIntent.includes('event')) {
        return this.generateCalendarEventCode(context);
      }
    }

    // Drive related
    if (lowerIntent.includes('ドライブ') || lowerIntent.includes('drive')) {
      if (lowerIntent.includes('検索') || lowerIntent.includes('search')) {
        return this.generateDriveSearchCode(context);
      }
    }

    // Default: return a generic template
    return `// ${intent}\nconst result = "Task completed";\nreturn result;`;
  }

  private generateEmailSendCode(context?: any): string {
    const recipient = context?.recipient || 'email@example.com';
    const subject = context?.subject || 'Test Email';
    const body = context?.body || 'This is a test email from GAS Interpreter';

    return `const recipient = "${recipient}";
const subject = "${subject}";
const body = "${body}";
GmailApp.sendEmail(recipient, subject, body);
return \`Email sent successfully to \${recipient} with subject: '\${subject}'\`;`;
  }

  private generateEmailSearchCode(context?: any): string {
    const query = context?.query || '';
    const limit = context?.limit || 5;

    return `const threads = GmailApp.search("${query}", 0, ${limit});
const emailDetails = threads.map(thread => {
  const messages = thread.getMessages();
  const lastMessage = messages[messages.length - 1];
  return {
    subject: lastMessage.getSubject(),
    from: lastMessage.getFrom(),
    date: lastMessage.getDate().toString(),
    snippet: lastMessage.getPlainBody().slice(0, 150)
  };
});
return JSON.stringify(emailDetails, null, 2);`;
  }

  private generateSpreadsheetCreateCode(context?: any): string {
    const name = context?.name || 'New Spreadsheet';
    const data = context?.data || [
      ['Column1', 'Column2'],
      ['Data1', 'Data2'],
    ];

    return `const spreadsheet = SpreadsheetApp.create("${name}");
const sheet = spreadsheet.getActiveSheet();
const data = ${JSON.stringify(data)};
sheet.getRange(1, 1, data.length, data[0].length).setValues(data);

const dataText = data.map(row => row.join(", ")).join("; ");
return \`Spreadsheet created: \${spreadsheet.getName()}\nData: \${dataText}\nURL: \${spreadsheet.getUrl()}\`;`;
  }

  private generateCalendarEventCode(context?: any): string {
    const title = context?.title || 'New Event';
    const start = context?.start || new Date();
    const end = context?.end || new Date(start.getTime() + 60 * 60 * 1000);

    return `const calendar = CalendarApp.getDefaultCalendar();
const title = "${title}";
const startTime = new Date("${start}");
const endTime = new Date("${end}");
const event = calendar.createEvent(title, startTime, endTime);
return \`Event created: \${event.getTitle()} on \${startTime.toDateString()} at \${startTime.toTimeString()}\`;`;
  }

  private generateDriveSearchCode(context?: any): string {
    const searchTerm = context?.searchTerm || 'document';

    return `const files = DriveApp.searchFiles('title contains "${searchTerm}"');
const fileList = [];
let count = 0;
while (files.hasNext() && count < 10) {
  const file = files.next();
  fileList.push({
    name: file.getName(),
    url: file.getUrl(),
    lastUpdated: file.getLastUpdated().toString()
  });
  count++;
}
return JSON.stringify(fileList, null, 2);`;
  }

  private generateTitleFromIntent(intent: string): string {
    const lowerIntent = intent.toLowerCase();

    if (lowerIntent.includes('メール') && lowerIntent.includes('送信')) return 'メール送信';
    if (lowerIntent.includes('メール') && lowerIntent.includes('検索')) return 'メール検索';
    if (lowerIntent.includes('スプレッドシート')) return 'スプレッドシート操作';
    if (lowerIntent.includes('カレンダー')) return 'カレンダーイベント';
    if (lowerIntent.includes('ドライブ')) return 'ドライブ検索';

    return 'GASスクリプト実行';
  }

  private generateErrorSuggestion(error: any, script: string): string {
    const errorMessage = error.message?.toLowerCase() || '';

    if (errorMessage.includes('timeout')) {
      return 'スクリプトの実行時間が長すぎます。処理を分割してください。';
    }

    if (errorMessage.includes('permission')) {
      return '権限エラーです。必要な権限が付与されているか確認してください。';
    }

    if (errorMessage.includes('syntax')) {
      return '構文エラーです。JavaScriptの構文を確認してください。';
    }

    return 'エラーが発生しました。スクリプトを確認して再度実行してください。';
  }

  /**
   * Execute a task based on natural language input
   */
  async executeTask(userIntent: string, context?: any): Promise<any> {
    // First, generate code from intent
    const codeGenTool = this.tools.get('generateGASCode');
    const codeResult = await codeGenTool?.execute({ intent: userIntent, context });

    if (!codeResult?.success) {
      return {
        success: false,
        error: 'Failed to generate code from intent',
      };
    }

    // Then execute the generated code
    const executeTool = this.tools.get('executeScript');
    const result = await executeTool?.execute({
      title: codeResult.title,
      script: codeResult.code,
    });

    // If execution failed, try to fix and retry
    if (!result?.success && result?.error) {
      console.log('First execution failed, attempting to fix...');

      // Generate fixed code based on error
      const fixedCode = this.attemptCodeFix(codeResult.code, result.error);

      const retryResult = await executeTool?.execute({
        title: codeResult.title + ' (Retry)',
        script: fixedCode,
      });

      return retryResult || { success: false, error: 'Failed to execute after retry' };
    }

    return result;
  }

  private attemptCodeFix(originalCode: string, error: string): string {
    // Simple error fixing logic - can be enhanced with more sophisticated patterns
    let fixedCode = originalCode;

    if (error.includes('undefined') || error.includes('null')) {
      // Add null checks
      fixedCode = fixedCode.replace(/(\w+)\.(\w+)/g, '$1 && $1.$2');
    }

    if (error.includes('is not a function')) {
      // Check for common method name mistakes
      fixedCode = fixedCode.replace(/getMail\(/g, 'getMessages(').replace(/getSheet\(/g, 'getActiveSheet(');
    }

    return fixedCode;
  }
}

/**
 * Create and register GAS Interpreter Agent
 */
export async function createGASInterpreter(): Promise<string> {
  const capabilities: AgentCapability[] = [
    {
      name: 'gas_execution',
      description: 'Execute Google Apps Script code',
      category: 'custom',
    },
    {
      name: 'code_generation',
      description: 'Generate GAS code from natural language',
      category: 'custom',
    },
    {
      name: 'google_services',
      description: 'Access Gmail, Calendar, Drive, Sheets, etc.',
      category: 'custom',
    },
    {
      name: 'error_recovery',
      description: 'Automatically fix and retry failed scripts',
      category: 'system',
    },
  ];

  const metadata: AgentMetadata = {
    id: `gas_interpreter_${Date.now()}`,
    name: 'GAS Interpreter',
    type: 'specialist',
    capabilities,
    status: 'idle',
    maxConcurrentTasks: 5,
    currentTasks: 0,
    lastHeartbeat: new Date(),
    version: '1.0.0',
  };

  const registered = await globalRegistry.registerAgent(metadata);
  if (registered) {
    console.log('✅ GAS Interpreter Agent registered successfully');
    return metadata.id;
  } else {
    throw new Error('Failed to register GAS Interpreter Agent');
  }
}
