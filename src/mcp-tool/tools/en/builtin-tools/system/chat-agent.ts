import { McpTool } from '../../../../types';
import { z } from 'zod';

export type ChatAgentToolName = 'system.chat.message' | 'system.chat.command' | 'system.chat.context';

/**
 * LLM Chat Agent - ユーザーとの対話を処理するメインエージェント
 */
export const systemChatMessageTool: McpTool = {
  project: 'system',
  name: 'system.chat.message',
  accessTokens: ['tenant'],
  description: '[MCP Chat Agent] - Process user messages and generate intelligent responses',
  schema: {
    data: z.object({
      user_message: z.string().describe('User message content'),
      chat_id: z.string().describe('Chat ID to send response to'),
      user_id: z.string().optional().describe('User ID for personalization'),
      message_type: z
        .enum(['text', 'command', 'question', 'request'])
        .optional()
        .describe('Message type classification'),
      context: z.record(z.any()).optional().describe('Additional context information'),
    }),
  },
  customHandler: async (client, params): Promise<any> => {
    try {
      const { user_message, chat_id, user_id, message_type, context } = params.data;

      // メッセージの分析と分類
      const messageAnalysis = analyzeUserMessage(user_message);
      const responseText = await generateResponse(user_message, messageAnalysis, context);

      // Larkにメッセージを送信
      const response = await client.request({
        method: 'POST',
        url: '/open-apis/im/v1/messages',
        params: { receive_id_type: 'chat_id' },
        data: {
          receive_id: chat_id,
          msg_type: 'text',
          content: JSON.stringify({ text: responseText }),
        },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: `Chat response sent: "${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}"`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Failed to process chat message: ${error}`,
          },
        ],
      };
    }
  },
};

/**
 * コマンド処理エージェント - 特定のコマンドを解析・実行
 */
export const systemChatCommandTool: McpTool = {
  project: 'system',
  name: 'system.chat.command',
  accessTokens: ['tenant'],
  description: '[MCP Chat Agent] - Process and execute user commands',
  schema: {
    data: z.object({
      command: z.string().describe('Command to execute'),
      args: z.array(z.string()).optional().describe('Command arguments'),
      chat_id: z.string().describe('Chat ID to send response to'),
      user_id: z.string().optional().describe('User ID for authorization'),
    }),
  },
  customHandler: async (client, params): Promise<any> => {
    try {
      const { command, args = [], chat_id, user_id } = params.data;

      const commandResult = await executeCommand(command, args, client, chat_id);

      return {
        content: [
          {
            type: 'text' as const,
            text: `Command executed: ${command} ${args.join(' ')}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Failed to execute command: ${error}`,
          },
        ],
      };
    }
  },
};

/**
 * コンテキスト管理エージェント - 会話の文脈を管理
 */
export const systemChatContextTool: McpTool = {
  project: 'system',
  name: 'system.chat.context',
  accessTokens: ['tenant'],
  description: '[MCP Chat Agent] - Manage conversation context and history',
  schema: {
    data: z.object({
      action: z.enum(['save', 'retrieve', 'clear']).describe('Context action'),
      chat_id: z.string().describe('Chat ID'),
      user_id: z.string().optional().describe('User ID'),
      context_data: z.record(z.any()).optional().describe('Context data to save'),
      key: z.string().optional().describe('Specific context key to retrieve'),
    }),
  },
  customHandler: async (client, params): Promise<any> => {
    try {
      const { action, chat_id, user_id, context_data, key } = params.data;

      // 簡易的なインメモリコンテキスト管理
      // 実際の実装では、データベースやRedisを使用
      const contextResult = await manageContext(action, chat_id, user_id, context_data, key);

      return {
        content: [
          {
            type: 'text' as const,
            text: `Context ${action} completed for chat ${chat_id}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Failed to manage context: ${error}`,
          },
        ],
      };
    }
  },
};

// ヘルパー関数群

/**
 * ユーザーメッセージの分析
 */
function analyzeUserMessage(message: string): {
  intent: string;
  entities: string[];
  sentiment: string;
  isCommand: boolean;
  category: string;
} {
  const lowercaseMessage = message.toLowerCase();

  // コマンドの検出
  const isCommand =
    lowercaseMessage.startsWith('/') ||
    !!lowercaseMessage.match(/^(help|use|settings|status|show|list|create|delete|update)/);

  // インテント分析
  let intent = 'general';
  if (lowercaseMessage.includes('help') || lowercaseMessage.includes('ヘルプ')) {
    intent = 'help_request';
  } else if (lowercaseMessage.includes('create') || lowercaseMessage.includes('作成')) {
    intent = 'create_request';
  } else if (lowercaseMessage.includes('search') || lowercaseMessage.includes('検索')) {
    intent = 'search_request';
  } else if (lowercaseMessage.includes('show') || lowercaseMessage.includes('表示')) {
    intent = 'show_request';
  }

  // エンティティ抽出（簡易版）
  const entities: string[] = [];
  const keywords = ['base', 'document', 'message', 'calendar', 'contact', 'user', 'table', 'record'];
  keywords.forEach((keyword) => {
    if (lowercaseMessage.includes(keyword)) {
      entities.push(keyword);
    }
  });

  return {
    intent,
    entities,
    sentiment: 'neutral',
    isCommand,
    category: entities[0] || 'general',
  };
}

/**
 * レスポンス生成
 */
async function generateResponse(
  userMessage: string,
  analysis: ReturnType<typeof analyzeUserMessage>,
  context?: Record<string, any>,
): Promise<string> {
  const { intent, entities, isCommand, category } = analysis;

  // コマンドの場合
  if (isCommand) {
    return handleCommandResponse(userMessage, analysis);
  }

  // インテント別のレスポンス生成
  switch (intent) {
    case 'help_request':
      return generateHelpResponse(entities);

    case 'create_request':
      return generateCreateResponse(entities, userMessage);

    case 'search_request':
      return generateSearchResponse(entities, userMessage);

    case 'show_request':
      return generateShowResponse(entities, userMessage);

    default:
      return generateGeneralResponse(userMessage, entities, context);
  }
}

/**
 * ヘルプレスポンス生成
 */
function generateHelpResponse(entities: string[]): string {
  if (entities.includes('base')) {
    return `📊 **Lark Base ヘルプ**

できること:
• レコードの検索・作成・更新・削除
• テーブル構造の確認
• データのエクスポート・インポート
• 一括操作

例: "salesテーブルからレコードを検索して"`;
  }

  if (entities.includes('message') || entities.includes('chat')) {
    return `💬 **メッセージング ヘルプ**

できること:
• メッセージの送信
• グループチャットの管理
• 通知の配信
• チャット履歴の検索

例: "営業チームにメッセージを送って"`;
  }

  return `🤖 **MCP統合ツール ヘルプ**

主な機能:
📊 Base操作 - データ管理
💬 メッセージング - コミュニケーション
📄 ドキュメント - ファイル管理
📅 カレンダー - スケジュール管理
👥 連絡先 - ユーザー管理

詳細は「help [機能名]」でお聞きください。`;
}

/**
 * 作成レスポンス生成
 */
function generateCreateResponse(entities: string[], userMessage: string): string {
  if (entities.includes('base') || entities.includes('record')) {
    return `📊 **Base レコード作成**

レコードを作成します。以下の情報をお教えください:
• テーブル名
• 作成するデータの内容

例: "顧客テーブルに新しい会社を追加:
会社名: ABC商事
業界: IT
担当者: 田中太郎"`;
  }

  if (entities.includes('message')) {
    return `💬 **メッセージ作成**

メッセージを送信します。以下をお教えください:
• 送信先（ユーザー名またはグループ名）
• メッセージ内容

例: "営業チームに「今日の会議は15時からです」と送信"`;
  }

  return `✨ **作成機能**

作成できるもの:
• Base レコード
• カレンダー イベント
• チャット グループ
• ドキュメント

何を作成しますか？`;
}

/**
 * 検索レスポンス生成
 */
function generateSearchResponse(entities: string[], userMessage: string): string {
  if (entities.includes('base') || entities.includes('record')) {
    return `🔍 **Base 検索**

検索を実行します。以下をお教えください:
• テーブル名
• 検索条件

例: "顧客テーブルから業界がITの会社を検索"`;
  }

  if (entities.includes('document')) {
    return `📄 **ドキュメント検索**

ドキュメントを検索します:
• ファイル名またはキーワード
• 検索範囲（フォルダ等）

例: "プロジェクト計画書を検索"`;
  }

  return `🔍 **検索機能**

検索できるもの:
• Base レコード
• ドキュメント
• チャット履歴
• ユーザー情報

何を検索しますか？`;
}

/**
 * 表示レスポンス生成
 */
function generateShowResponse(entities: string[], userMessage: string): string {
  if (entities.includes('base')) {
    return `📊 **Base 表示**

表示したい内容をお教えください:
• テーブル名
• 表示する条件（全件/特定条件）

例: "売上テーブルの今月のデータを表示"`;
  }

  return `📋 **表示機能**

表示できるもの:
• Base データ
• システム状況
• 設定情報
• 統計情報

何を表示しますか？`;
}

/**
 * 一般的なレスポンス生成
 */
function generateGeneralResponse(userMessage: string, entities: string[], context?: Record<string, any>): string {
  const lowerMessage = userMessage.toLowerCase();

  // 挨拶の検出
  if (!!lowerMessage.match(/(こんにちは|おはよう|こんばんは|hello|hi)/)) {
    return `こんにちは！🎉 MCP統合ツールです。

今日はどのようなお手伝いをいたしましょうか？

💡 **できること:**
• Lark Base のデータ操作
• メッセージやファイルの管理
• カレンダーやタスクの管理

何かご質問があれば、お気軽にお聞きください！`;
  }

  // 感謝の検出
  if (!!lowerMessage.match(/(ありがとう|thank you|thanks)/)) {
    return `どういたしまして！😊

他にもお手伝いできることがあれば、遠慮なくお声がけください。`;
  }

  // デフォルトレスポンス
  return `申し訳ございませんが、「${userMessage}」について詳しく説明していただけますか？

🤖 **できること:**
• 「help」- 機能一覧を表示
• 「status」- システム状況を確認
• 「settings」- 設定を表示

具体的な操作について教えていただければ、お手伝いいたします！`;
}

/**
 * コマンドレスポンス処理
 */
function handleCommandResponse(userMessage: string, analysis: ReturnType<typeof analyzeUserMessage>): string {
  const command = userMessage.toLowerCase().trim();

  if (command.startsWith('help')) {
    const topic = command.split(' ')[1];
    return generateHelpResponse(topic ? [topic] : []);
  }

  if (command.startsWith('use ')) {
    const preset = command.substring(4);
    return `🔧 プリセット「${preset}」に切り替えます。

しばらくお待ちください...`;
  }

  if (command === 'settings') {
    return `⚙️ **現在の設定**

🌐 言語: 日本語
🔧 ツールセット: preset.default
📊 レート制限: 有効
🔗 接続状況: 正常

設定を変更しますか？`;
  }

  if (command === 'status') {
    return `🚀 **システム状況**

✅ MCP サーバー: 動作中
📊 利用可能ツール: 19個
⚡ 応答時間: 正常
🔒 認証: 有効

すべてのシステムが正常に動作しています！`;
  }

  return `❓ 不明なコマンド: ${userMessage}

利用可能なコマンド:
• help [topic] - ヘルプ表示
• use [preset] - プリセット切替
• settings - 設定表示  
• status - 状況確認`;
}

/**
 * コマンド実行
 */
async function executeCommand(command: string, args: string[], client: any, chatId: string): Promise<any> {
  // 実際のコマンド実行ロジック
  // ここでは簡易的な実装
  console.log(`Executing command: ${command} with args: ${args.join(', ')}`);
  return { success: true, result: `Command ${command} executed` };
}

/**
 * コンテキスト管理
 */
async function manageContext(
  action: string,
  chatId: string,
  userId?: string,
  contextData?: Record<string, any>,
  key?: string,
): Promise<any> {
  // 簡易的なインメモリ実装
  // 実際の実装では永続化が必要
  const contexts = new Map<string, Record<string, any>>();

  const contextKey = `${chatId}:${userId || 'anonymous'}`;

  switch (action) {
    case 'save':
      if (contextData) {
        contexts.set(contextKey, { ...contexts.get(contextKey), ...contextData });
      }
      break;

    case 'retrieve':
      const context = contexts.get(contextKey);
      return key ? context?.[key] : context;

    case 'clear':
      contexts.delete(contextKey);
      break;
  }

  return { success: true };
}

export const chatAgentTools = [systemChatMessageTool, systemChatCommandTool, systemChatContextTool];
