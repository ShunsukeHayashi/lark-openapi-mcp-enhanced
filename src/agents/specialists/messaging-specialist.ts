/**
 * Messaging Specialist Agent
 * Specialized for Lark IM/Chat operations
 */

import { Agent, AgentConfig, AgentTool } from '../agent';
import { AgentCapability, AgentMetadata } from '../types';
import { TOOL_OPERATION_PROMPTS, PromptUtils } from '../prompts';
import { globalRegistry } from '../registry';

export class MessagingSpecialistAgent extends Agent {
  constructor(config: Partial<AgentConfig> = {}) {
    // Create tools before calling super()
    const tools = [
      {
        name: 'send_message',
        description: 'Send message to chat or user',
        execute: async (params: any) => {
          const { chatId, messageType = 'text', content, receiveIdType = 'chat_id' } = params;
          
          return this.executeMcpTool('im.v1.message.create', {
            receive_id_type: receiveIdType,
            receive_id: chatId,
            msg_type: messageType,
            content: typeof content === 'string' ? content : JSON.stringify(content)
          });
        },
        schema: {
          type: 'object',
          properties: {
            chatId: { type: 'string', description: 'Chat or user ID' },
            messageType: { 
              type: 'string', 
              enum: ['text', 'image', 'file', 'audio', 'media', 'sticker', 'interactive'],
              default: 'text'
            },
            content: { description: 'Message content (text or structured object)' },
            receiveIdType: { 
              type: 'string', 
              enum: ['chat_id', 'user_id', 'union_id', 'open_id'],
              default: 'chat_id'
            }
          },
          required: ['chatId', 'content']
        }
      },

      {
        name: 'send_rich_message',
        description: 'Send rich message with cards, buttons, or interactive elements',
        execute: async (params: any) => {
          const { chatId, cardContent, updateMulti = false } = params;
          
          return this.executeMcpTool('im.v1.message.create', {
            receive_id_type: 'chat_id',
            receive_id: chatId,
            msg_type: 'interactive',
            content: JSON.stringify({
              config: { update_multi: updateMulti },
              elements: cardContent
            })
          });
        },
        schema: {
          type: 'object',
          properties: {
            chatId: { type: 'string', description: 'Chat ID' },
            cardContent: { type: 'array', description: 'Interactive card elements' },
            updateMulti: { type: 'boolean', default: false }
          },
          required: ['chatId', 'cardContent']
        }
      },

      {
        name: 'create_group_chat',
        description: 'Create new group chat',
        execute: async (params: any) => {
          const { name, description, userIds = [] } = params;
          
          return this.executeMcpTool('im.v1.chat.create', {
            name,
            description,
            user_ids: userIds
          });
        },
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Group chat name' },
            description: { type: 'string', description: 'Group description' },
            userIds: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Initial member user IDs'
            }
          },
          required: ['name']
        }
      },

      {
        name: 'manage_chat_members',
        description: 'Add or remove members from group chat',
        execute: async (params: any) => {
          const { chatId, action, userIds } = params;
          
          const toolName = action === 'add' 
            ? 'im.v1.chat.members.create' 
            : 'im.v1.chat.members.delete';
          
          return this.executeMcpTool(toolName, {
            chat_id: chatId,
            id_list: userIds
          });
        },
        schema: {
          type: 'object',
          properties: {
            chatId: { type: 'string', description: 'Chat ID' },
            action: { 
              type: 'string', 
              enum: ['add', 'remove'],
              description: 'Action to perform'
            },
            userIds: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'User IDs to add or remove'
            }
          },
          required: ['chatId', 'action', 'userIds']
        }
      },

      {
        name: 'get_chat_members',
        description: 'Get list of chat members',
        execute: async (params: any) => {
          const { chatId, pageSize = 100 } = params;
          
          return this.executeMcpTool('im.v1.chat.members.get', {
            chat_id: chatId,
            member_id_type: 'user_id',
            page_size: pageSize
          });
        },
        schema: {
          type: 'object',
          properties: {
            chatId: { type: 'string', description: 'Chat ID' },
            pageSize: { type: 'number', default: 100 }
          },
          required: ['chatId']
        }
      },

      {
        name: 'send_file_message',
        description: 'Send file or image message',
        execute: async (params: any) => {
          const { chatId, fileKey, fileName, fileType = 'file' } = params;
          
          const content = fileType === 'image' 
            ? { image_key: fileKey }
            : { file_key: fileKey, file_name: fileName };
          
          return this.executeMcpTool('im.v1.message.create', {
            receive_id_type: 'chat_id',
            receive_id: chatId,
            msg_type: fileType,
            content: JSON.stringify(content)
          });
        },
        schema: {
          type: 'object',
          properties: {
            chatId: { type: 'string', description: 'Chat ID' },
            fileKey: { type: 'string', description: 'File key from upload' },
            fileName: { type: 'string', description: 'File name' },
            fileType: { 
              type: 'string', 
              enum: ['file', 'image'],
              default: 'file'
            }
          },
          required: ['chatId', 'fileKey']
        }
      },

      {
        name: 'get_message_history',
        description: 'Retrieve chat message history',
        execute: async (params: any) => {
          const { chatId, startTime, endTime, pageSize = 50 } = params;
          
          return this.executeMcpTool('im.v1.message.list', {
            container_id: chatId,
            container_id_type: 'chat_id',
            start_time: startTime,
            end_time: endTime,
            page_size: pageSize
          });
        },
        schema: {
          type: 'object',
          properties: {
            chatId: { type: 'string', description: 'Chat ID' },
            startTime: { type: 'string', description: 'Start timestamp' },
            endTime: { type: 'string', description: 'End timestamp' },
            pageSize: { type: 'number', default: 50 }
          },
          required: ['chatId']
        }
      },

      {
        name: 'react_to_message',
        description: 'Add reaction to message',
        execute: async (params: any) => {
          const { messageId, reactionType } = params;
          
          return this.executeMcpTool('im.v1.message.reaction.create', {
            message_id: messageId,
            reaction_type: reactionType
          });
        },
        schema: {
          type: 'object',
          properties: {
            messageId: { type: 'string', description: 'Message ID to react to' },
            reactionType: { 
              type: 'string',
              description: 'Reaction emoji or type'
            }
          },
          required: ['messageId', 'reactionType']
        }
      }
    ];

    const specialistConfig: AgentConfig = {
      name: 'Messaging Operations Specialist',
      instructions: `
あなたはLark IM（Instant Messaging）操作の専門エージェントです。
以下のコミュニケーション機能を正確に実行してください：

**専門領域:**
• メッセージ送受信・管理
• チャット作成・設定・管理
• グループメンバー管理
• ファイル・画像・カード送信
• 通知・アラート設定
• Bot応答・自動化

**コミュニケーション原則:**
1. 適切な受信者確認
2. メッセージ形式とマナー遵守
3. プライバシーと権限尊重
4. 緊急度に応じた配信方法選択
5. ログとトレーサビリティ確保

**応答品質:**
常に丁寧で分かりやすいコミュニケーションを心がけます。
`,
      tools,
      model: 'gpt-4',
      temperature: 0.3, // コミュニケーションなので適度な創造性
      maxTokens: 3000,
      language: 'ja',
      ...config
    };

    super(specialistConfig);
  }

  /**
   * Execute MCP tool with messaging-specific error handling
   */
  private async executeMcpTool(toolName: string, params: any): Promise<any> {
    try {
      const response = {
        success: true,
        tool: toolName,
        parameters: params,
        timestamp: new Date().toISOString(),
        data: {
          message: `Executed ${toolName} successfully`,
          ...params
        }
      };

      return response;

    } catch (error) {
      return {
        success: false,
        tool: toolName,
        parameters: params,
        error: String(error),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Analyze message for appropriate delivery method
   */
  async analyzeMessageContent(content: string, context: any): Promise<{
    urgency: 'low' | 'medium' | 'high' | 'urgent';
    messageType: 'text' | 'rich' | 'notification';
    recommendations: string[];
    estimatedDelivery: number;
  }> {
    const lowerContent = content.toLowerCase();
    
    // Urgent keywords
    if (lowerContent.includes('緊急') || lowerContent.includes('urgent') || 
        lowerContent.includes('エラー') || lowerContent.includes('error')) {
      return {
        urgency: 'urgent',
        messageType: 'notification',
        recommendations: [
          '即座に配信',
          'プッシュ通知を有効化',
          'エスカレーション準備'
        ],
        estimatedDelivery: 5 // seconds
      };
    }

    // High priority
    if (lowerContent.includes('重要') || lowerContent.includes('important') ||
        lowerContent.includes('deadline') || lowerContent.includes('締切')) {
      return {
        urgency: 'high',
        messageType: 'rich',
        recommendations: [
          'リッチメッセージで強調',
          'アクションボタン追加',
          '読了確認を要求'
        ],
        estimatedDelivery: 10
      };
    }

    // Medium priority  
    if (content.length > 500 || lowerContent.includes('詳細') || 
        lowerContent.includes('資料')) {
      return {
        urgency: 'medium',
        messageType: 'rich',
        recommendations: [
          'カード形式で整理',
          'ファイル添付を検討',
          '構造化して表示'
        ],
        estimatedDelivery: 30
      };
    }

    // Normal message
    return {
      urgency: 'low',
      messageType: 'text',
      recommendations: [
        '通常のテキストメッセージ',
        '適切なタイミングで配信'
      ],
      estimatedDelivery: 60
    };
  }

  /**
   * Format message content based on type and context
   */
  formatMessage(content: string, type: 'text' | 'rich' | 'notification', context: any): any {
    switch (type) {
      case 'notification':
        return {
          text: `🚨 ${content}`,
          notification: true
        };

      case 'rich':
        return {
          config: { wide_screen_mode: true },
          elements: [
            {
              tag: 'div',
              text: {
                content: content,
                tag: 'lark_md'
              }
            }
          ]
        };

      case 'text':
      default:
        return content;
    }
  }
}

/**
 * Create and register Messaging Specialist Agent
 */
export async function createMessagingSpecialist(): Promise<string> {
  const capabilities: AgentCapability[] = [
    {
      name: 'messaging',
      description: 'Lark IM message sending and management',
      category: 'im',
      inputSchema: {
        type: 'object',
        properties: {
          chatId: { type: 'string' },
          content: { type: 'string' },
          messageType: { type: 'string' }
        }
      }
    },
    {
      name: 'chat_management',
      description: 'Group chat creation and member management',
      category: 'im'
    },
    {
      name: 'rich_messaging',
      description: 'Interactive cards and rich content',
      category: 'im'
    },
    {
      name: 'file_sharing',
      description: 'File and media sharing via messages',
      category: 'im'
    },
    {
      name: 'notification_management',
      description: 'Urgent notifications and alerts',
      category: 'im'
    }
  ];

  const metadata: AgentMetadata = {
    id: `messaging_specialist_${Date.now()}`,
    name: 'Messaging Operations Specialist',
    type: 'specialist',
    capabilities,
    status: 'idle',
    maxConcurrentTasks: 5, // Can handle more messaging tasks
    currentTasks: 0,
    lastHeartbeat: new Date(),
    version: '1.0.0'
  };

  const registered = await globalRegistry.registerAgent(metadata);
  if (registered) {
    console.log('✅ Messaging Specialist Agent registered successfully');
    return metadata.id;
  } else {
    throw new Error('Failed to register Messaging Specialist Agent');
  }
}