/**
 * LLM Agent System for Lark MCP Integration
 * OpenAI Agents パターンを参考にしたAgent実装
 */

import { McpTool } from '../mcp-tool/types';

export interface AgentConfig {
  name: string;
  instructions: string;
  tools?: AgentTool[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  language?: 'en' | 'ja' | 'zh';
}

export interface AgentTool {
  name: string;
  description: string;
  execute: (params: any) => Promise<any>;
  schema?: any;
}

export interface RunContext {
  agent: Agent;
  conversationId: string;
  userId?: string;
  chatId: string;
  history: ConversationMessage[];
  metadata: Record<string, any>;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  metadata?: Record<string, any>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: any;
  result?: any;
  error?: string;
}

export interface AgentResult {
  success: boolean;
  response: string;
  toolCalls?: ToolCall[];
  context: RunContext;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
}

/**
 * Core Agent Class
 */
export class Agent {
  public readonly name: string;
  public readonly instructions: string;
  public readonly tools: Map<string, AgentTool>;
  public readonly config: AgentConfig;
  
  private conversations: Map<string, ConversationMessage[]> = new Map();

  constructor(config: AgentConfig) {
    this.name = config.name;
    this.instructions = config.instructions;
    this.config = config;
    
    // Initialize tools
    this.tools = new Map();
    if (config.tools) {
      for (const tool of config.tools) {
        this.tools.set(tool.name, tool);
      }
    }
  }

  /**
   * Process user message and generate response
   */
  async processMessage(
    userMessage: string,
    context: Partial<RunContext>
  ): Promise<AgentResult> {
    try {
      const conversationId = context.conversationId || this.generateConversationId();
      const fullContext: RunContext = {
        agent: this,
        conversationId,
        userId: context.userId,
        chatId: context.chatId || 'default',
        history: this.conversations.get(conversationId) || [],
        metadata: context.metadata || {}
      };

      // Add user message to history
      const userMsg: ConversationMessage = {
        id: this.generateMessageId(),
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      };
      fullContext.history.push(userMsg);

      // Analyze message and determine response strategy
      const strategy = await this.analyzeMessage(userMessage, fullContext);
      
      // Generate response based on strategy
      const result = await this.generateResponse(strategy, fullContext);
      
      // Add assistant response to history
      const assistantMsg: ConversationMessage = {
        id: this.generateMessageId(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
        toolCalls: result.toolCalls
      };
      fullContext.history.push(assistantMsg);

      // Save conversation
      this.conversations.set(conversationId, fullContext.history);

      return {
        ...result,
        context: fullContext
      };

    } catch (error) {
      return {
        success: false,
        response: `エラーが発生しました: ${error}`,
        context: context as RunContext,
        error: String(error)
      };
    }
  }

  /**
   * Analyze user message to determine response strategy
   */
  private async analyzeMessage(
    message: string,
    context: RunContext
  ): Promise<ResponseStrategy> {
    const lowerMessage = message.toLowerCase();
    
    // Command detection
    if (lowerMessage.startsWith('/') || lowerMessage.match(/^(help|use|settings|status)/)) {
      return {
        type: 'command',
        intent: this.extractCommand(message),
        confidence: 0.9,
        toolsRequired: this.getRequiredTools(message)
      };
    }

    // Question detection
    if (lowerMessage.includes('?') || lowerMessage.match(/^(what|how|when|where|why|who)/)) {
      return {
        type: 'question',
        intent: this.extractIntent(message),
        confidence: 0.8,
        toolsRequired: this.getRequiredTools(message)
      };
    }

    // Task request detection - enhanced patterns for Japanese
    if (lowerMessage.match(/^(create|make|build|generate|search|find|show|list)/) ||
        lowerMessage.includes('検索') || lowerMessage.includes('探し') ||
        lowerMessage.includes('送信') || lowerMessage.includes('連絡') ||
        lowerMessage.includes('作成') || lowerMessage.includes('表示') ||
        lowerMessage.includes('教えて') || lowerMessage.includes('してください') ||
        lowerMessage.includes('を探して') || lowerMessage.includes('から') ||
        lowerMessage.includes('に連絡') || lowerMessage.includes('に送信')) {
      return {
        type: 'task',
        intent: this.extractIntent(message),
        confidence: 0.8,
        toolsRequired: this.getRequiredTools(message)
      };
    }

    // Conversational
    return {
      type: 'conversation',
      intent: 'general',
      confidence: 0.6,
      toolsRequired: []
    };
  }

  /**
   * Generate response based on strategy
   */
  private async generateResponse(
    strategy: ResponseStrategy,
    context: RunContext
  ): Promise<AgentResult> {
    switch (strategy.type) {
      case 'command':
        return this.handleCommand(strategy, context);
      
      case 'task':
        return this.handleTask(strategy, context);
      
      case 'question':
        return this.handleQuestion(strategy, context);
      
      case 'conversation':
      default:
        return this.handleConversation(strategy, context);
    }
  }

  /**
   * Handle command execution
   */
  private async handleCommand(
    strategy: ResponseStrategy,
    context: RunContext
  ): Promise<AgentResult> {
    const toolCalls: ToolCall[] = [];
    
    for (const toolName of strategy.toolsRequired) {
      const tool = this.tools.get(toolName);
      if (tool) {
        try {
          const toolCall: ToolCall = {
            id: this.generateToolCallId(),
            name: toolName,
            arguments: this.extractToolArguments(strategy.intent, context),
            result: await tool.execute({
              context,
              message: context.history[context.history.length - 1].content
            })
          };
          toolCalls.push(toolCall);
        } catch (error) {
          toolCalls.push({
            id: this.generateToolCallId(),
            name: toolName,
            arguments: {},
            error: String(error)
          });
        }
      }
    }

    const response = this.formatCommandResponse(strategy.intent, toolCalls);
    
    return {
      success: true,
      response,
      toolCalls,
      context
    };
  }

  /**
   * Handle task execution
   */
  private async handleTask(
    strategy: ResponseStrategy,
    context: RunContext
  ): Promise<AgentResult> {
    const message = context.history[context.history.length - 1].content;
    const toolCalls: ToolCall[] = [];
    
    // Execute tools based on message content and strategy
    if (strategy.toolsRequired.length > 0) {
      for (const toolName of strategy.toolsRequired) {
        const tool = this.tools.get(toolName);
        if (tool) {
          try {
            const toolCall: ToolCall = {
              id: this.generateToolCallId(),
              name: toolName,
              arguments: this.extractToolArguments(strategy.intent, context),
              result: await tool.execute({
                context,
                message: context.history[context.history.length - 1].content
              })
            };
            toolCalls.push(toolCall);
          } catch (error) {
            toolCalls.push({
              id: this.generateToolCallId(),
              name: toolName,
              arguments: {},
              error: String(error)
            });
          }
        }
      }
    }
    
    // Determine what task to perform
    if (message.includes('search') || message.includes('検索')) {
      return this.executeSearchTask(message, context, toolCalls);
    }
    
    if (message.includes('create') || message.includes('作成')) {
      return this.executeCreateTask(message, context, toolCalls);
    }
    
    if (message.includes('show') || message.includes('表示')) {
      return this.executeShowTask(message, context, toolCalls);
    }
    
    if (message.includes('連絡') || message.includes('送信') || message.includes('message')) {
      return this.executeMessageTask(message, context, toolCalls);
    }
    
    if (message.includes('ユーザー') || message.includes('連絡先') || message.includes('user')) {
      return this.executeUserTask(message, context, toolCalls);
    }
    
    if (message.includes('ファイル') || message.includes('document') || message.includes('ドキュメント')) {
      return this.executeDocumentTask(message, context, toolCalls);
    }

    return {
      success: true,
      response: `タスク「${strategy.intent}」を実行します。詳細を教えてください。`,
      toolCalls,
      context
    };
  }

  /**
   * Handle question answering
   */
  private async handleQuestion(
    strategy: ResponseStrategy,
    context: RunContext
  ): Promise<AgentResult> {
    const message = context.history[context.history.length - 1].content;
    
    // Knowledge-based responses
    const knowledgeResponse = this.getKnowledgeResponse(message);
    if (knowledgeResponse) {
      return {
        success: true,
        response: knowledgeResponse,
        context
      };
    }

    // Tool-assisted responses
    if (strategy.toolsRequired.length > 0) {
      return this.handleTask(strategy, context);
    }

    return {
      success: true,
      response: this.generateHelpfulResponse(message),
      context
    };
  }

  /**
   * Handle general conversation
   */
  private async handleConversation(
    strategy: ResponseStrategy,
    context: RunContext
  ): Promise<AgentResult> {
    const message = context.history[context.history.length - 1].content.toLowerCase();
    
    // Greetings
    if (message.match(/(こんにちは|おはよう|こんばんは|hello|hi)/)) {
      return {
        success: true,
        response: `こんにちは！🎉 ${this.name}です。\n\n今日はどのようなお手伝いをいたしましょうか？\n\n💡 **できること:**\n• Lark Base のデータ操作\n• メッセージやファイルの管理\n• カレンダーやタスクの管理\n\n何かご質問があれば、お気軽にお聞きください！`,
        context
      };
    }

    // Thanks
    if (message.match(/(ありがとう|thank you|thanks)/)) {
      return {
        success: true,
        response: `どういたしまして！😊\n\n他にもお手伝いできることがあれば、遠慮なくお声がけください。`,
        context
      };
    }

    // Default conversational response
    return {
      success: true,
      response: `申し訳ございませんが、もう少し詳しく教えていただけますか？\n\n🤖 **ヘルプ:**\n• 「help」- 機能一覧を表示\n• 「status」- システム状況を確認\n• 「settings」- 設定を表示\n\n具体的な操作について教えていただければ、お手伝いいたします！`,
      context
    };
  }

  // Helper methods
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateToolCallId(): string {
    return `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractCommand(message: string): string {
    const match = message.match(/^\/?([\w\.]+)/);
    return match ? match[1] : 'unknown';
  }

  private extractIntent(message: string): string {
    // Simple intent extraction - in real implementation, use NLP
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('search') || lowerMessage.includes('検索')) return 'search';
    if (lowerMessage.includes('create') || lowerMessage.includes('作成')) return 'create';
    if (lowerMessage.includes('show') || lowerMessage.includes('表示')) return 'show';
    if (lowerMessage.includes('help') || lowerMessage.includes('ヘルプ')) return 'help';
    
    return 'general';
  }

  private getRequiredTools(message: string): string[] {
    const tools: string[] = [];
    const lowerMessage = message.toLowerCase();
    
    // Base/Table operations
    if (lowerMessage.includes('テーブル') || lowerMessage.includes('base') || 
        lowerMessage.includes('table') || lowerMessage.includes('検索') ||
        lowerMessage.includes('search') || lowerMessage.includes('案件') ||
        lowerMessage.includes('顧客') || lowerMessage.includes('レコード')) {
      tools.push('search_base_records');
    }
    
    // Messaging operations  
    if (lowerMessage.includes('連絡') || lowerMessage.includes('送信') ||
        lowerMessage.includes('message') || lowerMessage.includes('chat') ||
        lowerMessage.includes('メッセージ') || lowerMessage.includes('通知')) {
      tools.push('send_message');
    }
    
    // User operations
    if (lowerMessage.includes('ユーザー') || lowerMessage.includes('連絡先') ||
        lowerMessage.includes('user') || lowerMessage.includes('さん') ||
        lowerMessage.includes('田中') || lowerMessage.includes('info')) {
      tools.push('get_user_info');
    }
    
    // Document operations
    if (lowerMessage.includes('ファイル') || lowerMessage.includes('document') || 
        lowerMessage.includes('ドキュメント') || lowerMessage.includes('計画書') ||
        lowerMessage.includes('file') || lowerMessage.includes('探して')) {
      tools.push('search_documents');
    }
    
    // Calendar operations
    if (lowerMessage.includes('calendar') || lowerMessage.includes('schedule') ||
        lowerMessage.includes('カレンダー') || lowerMessage.includes('スケジュール')) {
      tools.push('calendar_tools');
    }
    
    return tools;
  }

  private extractToolArguments(intent: string, context: RunContext): any {
    // Extract relevant arguments based on intent and context
    return {
      intent,
      chatId: context.chatId,
      userId: context.userId,
      message: context.history[context.history.length - 1].content
    };
  }

  private formatCommandResponse(intent: string, toolCalls: ToolCall[]): string {
    if (toolCalls.length === 0) {
      return `コマンド「${intent}」を実行しましたが、利用可能なツールがありません。`;
    }

    const results = toolCalls.map(call => {
      if (call.error) {
        return `❌ ${call.name}: ${call.error}`;
      }
      return `✅ ${call.name}: 実行完了`;
    });

    return `🔧 **コマンド実行結果**\n\n${results.join('\n')}`;
  }

  private async executeSearchTask(message: string, context: RunContext, toolCalls: ToolCall[] = []): Promise<AgentResult> {
    // Check if we have search results from tools
    const searchResults = toolCalls.find(call => call.name === 'search_base_records');
    
    if (searchResults && !searchResults.error) {
      const data = searchResults.result?.data;
      if (data?.items && data.items.length > 0) {
        const results = data.items.map((item: any, index: number) => 
          `${index + 1}. ${Object.entries(item.fields).map(([key, value]) => `${key}: ${value}`).join(', ')}`
        ).join('\n');
        
        return {
          success: true,
          response: `🔍 **検索結果**\n\n${data.items.length}件のレコードが見つかりました:\n\n${results}\n\n他に検索したいものはありますか？`,
          toolCalls,
          context
        };
      }
    }
    
    return {
      success: true,
      response: `🔍 **検索タスク**\n\n「${message}」の検索を実行します。\n\n検索条件を詳しく教えてください。`,
      toolCalls,
      context
    };
  }

  private async executeCreateTask(message: string, context: RunContext, toolCalls: ToolCall[] = []): Promise<AgentResult> {
    return {
      success: true,
      response: `✨ **作成タスク**\n\n「${message}」の作成を開始します。\n\n作成する内容の詳細を教えてください。`,
      toolCalls,
      context
    };
  }

  private async executeShowTask(message: string, context: RunContext, toolCalls: ToolCall[] = []): Promise<AgentResult> {
    return {
      success: true,
      response: `📊 **表示タスク**\n\n「${message}」の表示を準備中です。\n\n表示したい具体的な内容を教えてください。`,
      toolCalls,
      context
    };
  }

  private async executeMessageTask(message: string, context: RunContext, toolCalls: ToolCall[] = []): Promise<AgentResult> {
    const messageResult = toolCalls.find(call => call.name === 'send_message');
    
    if (messageResult && !messageResult.error) {
      return {
        success: true,
        response: `💬 **メッセージ送信完了**\n\nメッセージを正常に送信しました！\n\n送信内容: 「${message}」`,
        toolCalls,
        context
      };
    }
    
    return {
      success: true,
      response: `💬 **メッセージ送信**\n\n「${message}」のメッセージを送信します。\n\n送信先と内容を確認してください。`,
      toolCalls,
      context
    };
  }

  private async executeUserTask(message: string, context: RunContext, toolCalls: ToolCall[] = []): Promise<AgentResult> {
    const userResult = toolCalls.find(call => call.name === 'get_user_info');
    
    if (userResult && !userResult.error) {
      const data = userResult.result?.data;
      if (data?.user_list && data.user_list.length > 0) {
        const users = data.user_list.map((user: any) => 
          `👤 **${user.name}**\n📧 ${user.email}\n🆔 ${user.user_id}`
        ).join('\n\n');
        
        return {
          success: true,
          response: `👥 **ユーザー情報**\n\n${users}`,
          toolCalls,
          context
        };
      }
    }
    
    return {
      success: true,
      response: `👥 **ユーザー検索**\n\n「${message}」のユーザー情報を検索しています。\n\nユーザー名やメールアドレスを教えてください。`,
      toolCalls,
      context
    };
  }

  private async executeDocumentTask(message: string, context: RunContext, toolCalls: ToolCall[] = []): Promise<AgentResult> {
    const docResult = toolCalls.find(call => call.name === 'search_documents');
    
    if (docResult && !docResult.error) {
      const data = docResult.result?.data;
      if (data?.files && data.files.length > 0) {
        const files = data.files.map((file: any) => 
          `📄 **${file.name}**\n📁 タイプ: ${file.type}\n💾 サイズ: ${Math.round(file.size / 1024)}KB`
        ).join('\n\n');
        
        return {
          success: true,
          response: `📄 **ドキュメント検索結果**\n\n${data.files.length}件のファイルが見つかりました:\n\n${files}`,
          toolCalls,
          context
        };
      }
    }
    
    return {
      success: true,
      response: `📄 **ドキュメント検索**\n\n「${message}」のファイルを検索しています。\n\nファイル名やキーワードを教えてください。`,
      toolCalls,
      context
    };
  }

  private getKnowledgeResponse(message: string): string | null {
    const lowerMessage = message.toLowerCase();
    
    // FAQ responses
    if (lowerMessage.includes('what can you do') || lowerMessage.includes('何ができる')) {
      return `🤖 **MCPツールの機能**\n\n• 📊 **Lark Base**: データの検索・作成・更新・削除\n• 💬 **メッセージング**: チャット・通知の送信\n• 📄 **ドキュメント**: ファイルの管理・検索\n• 📅 **カレンダー**: イベントの作成・管理\n• 👥 **連絡先**: ユーザー情報の取得\n\n具体的な操作について聞いてください！`;
    }

    return null;
  }

  private generateHelpfulResponse(message: string): string {
    return `🤔 「${message}」について、もう少し詳しく教えていただけますか？\n\n以下のような情報があると、より具体的にお手伝いできます：\n\n• 何をしたいか\n• どのデータ・ツールを使いたいか\n• 期待する結果\n\n例: 「営業テーブルから今月の案件を検索して」`;
  }
}

/**
 * Response Strategy Interface
 */
interface ResponseStrategy {
  type: 'command' | 'task' | 'question' | 'conversation';
  intent: string;
  confidence: number;
  toolsRequired: string[];
}

/**
 * Agent Runner - executes agents with context management
 */
export class AgentRunner {
  static async run(
    agent: Agent,
    userMessage: string,
    context: Partial<RunContext> = {}
  ): Promise<AgentResult> {
    return agent.processMessage(userMessage, context);
  }

  static async runWithLarkClient(
    agent: Agent,
    userMessage: string,
    chatId: string,
    larkClient: any,
    userId?: string
  ): Promise<AgentResult> {
    const context: Partial<RunContext> = {
      chatId,
      userId,
      metadata: { larkClient }
    };

    const result = await agent.processMessage(userMessage, context);

    // Send response to Lark
    if (result.success && larkClient) {
      try {
        await larkClient.request({
          method: 'POST',
          url: '/open-apis/im/v1/messages',
          params: { receive_id_type: 'chat_id' },
          data: {
            receive_id: chatId,
            msg_type: 'text',
            content: JSON.stringify({ text: result.response })
          }
        });
      } catch (error) {
        console.error('Failed to send message to Lark:', error);
      }
    }

    return result;
  }
}

// Interfaces exported above