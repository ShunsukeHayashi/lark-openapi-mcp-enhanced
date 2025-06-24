import { McpTool } from '../../../../types';
import { z } from 'zod';
import { Agent, AgentConfig, AgentRunner, AgentTool } from '../../../../../agents/agent';

export type LarkChatAgentToolName = 
  | 'system.agent.chat'
  | 'system.agent.create'
  | 'system.agent.status';

/**
 * Lark Chat Agent - Main conversational AI interface
 */
export const larkChatAgentTool: McpTool = {
  project: 'system',
  name: 'system.agent.chat',
  accessTokens: ['tenant'],
  description: '[Lark Chat Agent] - Intelligent conversational AI for Lark users',
  schema: {
    data: z.object({
      user_message: z.string().describe('User message to process'),
      chat_id: z.string().describe('Lark chat ID'),
      user_id: z.string().optional().describe('User ID for personalization'),
      conversation_id: z.string().optional().describe('Conversation ID for context'),
      agent_name: z.string().optional().describe('Specific agent to use (default: LarkAssistant)'),
      language: z.enum(['en', 'ja', 'zh']).optional().describe('Response language'),
      context: z.record(z.any()).optional().describe('Additional context')
    })
  },
  customHandler: async (client, params): Promise<any> => {
    try {
      const { 
        user_message, 
        chat_id, 
        user_id, 
        conversation_id,
        agent_name = 'LarkAssistant',
        language = 'ja',
        context = {}
      } = params.data;

      // Get or create agent
      const agent = await getOrCreateAgent(agent_name, language, client);
      
      // Prepare agent tools
      const agentTools = createAgentTools(client);
      
      // Add tools to agent
      for (const tool of agentTools) {
        agent.tools.set(tool.name, tool);
      }

      // Run agent
      const result = await AgentRunner.run(agent, user_message, {
        chatId: chat_id,
        userId: user_id,
        conversationId: conversation_id,
        metadata: { ...context, larkClient: client }
      });

      // Send response to Lark if successful
      if (result.success) {
        await client.request({
          method: 'POST',
          url: '/open-apis/im/v1/messages',
          params: { receive_id_type: 'chat_id' },
          data: {
            receive_id: chat_id,
            msg_type: 'text',
            content: JSON.stringify({ text: result.response })
          }
        });
      }

      return {
        content: [{
          type: 'text' as const,
          text: `Agent response sent: "${result.response.substring(0, 100)}${result.response.length > 100 ? '...' : ''}"`
        }]
      };

    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text' as const,
          text: `Agent chat failed: ${error}`
        }]
      };
    }
  }
};

/**
 * Create Agent - Dynamic agent creation tool
 */
export const larkAgentCreateTool: McpTool = {
  project: 'system',
  name: 'system.agent.create',
  accessTokens: ['tenant'],
  description: '[Lark Chat Agent] - Create custom agent with specific instructions',
  schema: {
    data: z.object({
      agent_name: z.string().describe('Name for the new agent'),
      instructions: z.string().describe('Agent instructions and behavior'),
      chat_id: z.string().describe('Chat ID to send confirmation'),
      language: z.enum(['en', 'ja', 'zh']).optional().describe('Agent language'),
      tools: z.array(z.string()).optional().describe('Tool names to include'),
      temperature: z.number().min(0).max(2).optional().describe('Response creativity (0-2)'),
      system_prompt: z.string().optional().describe('Custom system prompt')
    })
  },
  customHandler: async (client, params): Promise<any> => {
    try {
      const { 
        agent_name, 
        instructions, 
        chat_id,
        language = 'ja',
        tools = [],
        temperature = 0.7,
        system_prompt
      } = params.data;

      // Create agent configuration
      const config: AgentConfig = {
        name: agent_name,
        instructions,
        language,
        temperature,
        systemPrompt: system_prompt,
        tools: []
      };

      // Create agent
      const agent = new Agent(config);
      
      // Store agent (in real implementation, use persistent storage)
      agentStore.set(agent_name, agent);

      // Send confirmation
      const confirmationMessage = `✅ **エージェント作成完了**

🤖 **名前**: ${agent_name}
📝 **指示**: ${instructions}
🌐 **言語**: ${language}
🛠️ **ツール**: ${tools.length}個
🎯 **Temperature**: ${temperature}

エージェントが作成されました！「${agent_name}」として会話を開始できます。`;

      await client.request({
        method: 'POST',
        url: '/open-apis/im/v1/messages',
        params: { receive_id_type: 'chat_id' },
        data: {
          receive_id: chat_id,
          msg_type: 'text',
          content: JSON.stringify({ text: confirmationMessage })
        }
      });

      return {
        content: [{
          type: 'text' as const,
          text: `Agent "${agent_name}" created successfully`
        }]
      };

    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text' as const,
          text: `Failed to create agent: ${error}`
        }]
      };
    }
  }
};

/**
 * Agent Status - Check agent system status
 */
export const larkAgentStatusTool: McpTool = {
  project: 'system',
  name: 'system.agent.status',
  accessTokens: ['tenant'],
  description: '[Lark Chat Agent] - Check agent system status and available agents',
  schema: {
    data: z.object({
      chat_id: z.string().describe('Chat ID to send status to'),
      detailed: z.boolean().optional().describe('Include detailed status information')
    })
  },
  customHandler: async (client, params): Promise<any> => {
    try {
      const { chat_id, detailed = false } = params.data;

      const agentCount = agentStore.size;
      const conversationCount = Array.from(agentStore.values())
        .reduce((total, agent) => total + (agent as any).conversations?.size || 0, 0);

      let statusMessage = `🤖 **Agent System Status**

✅ **システム**: 稼働中
👥 **利用可能エージェント**: ${agentCount}個
💬 **アクティブ会話**: ${conversationCount}件
🛠️ **MCPツール**: 統合済み
🔗 **Lark API**: 接続中

**デフォルトエージェント**:
• LarkAssistant - 汎用AIアシスタント
• BaseExpert - Lark Base専門家
• MessageBot - メッセージング専門

新しいエージェントを作成するには「create agent」とお声がけください！`;

      if (detailed) {
        const agentList = Array.from(agentStore.entries())
          .map(([name, agent]) => `• ${name}: ${(agent as Agent).instructions.substring(0, 50)}...`)
          .join('\n');

        statusMessage += `\n\n**詳細情報**:\n${agentList}`;
      }

      await client.request({
        method: 'POST',
        url: '/open-apis/im/v1/messages',
        params: { receive_id_type: 'chat_id' },
        data: {
          receive_id: chat_id,
          msg_type: 'text',
          content: JSON.stringify({ text: statusMessage })
        }
      });

      return {
        content: [{
          type: 'text' as const,
          text: `Agent status sent to chat ${chat_id}`
        }]
      };

    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text' as const,
          text: `Failed to get agent status: ${error}`
        }]
      };
    }
  }
};

// Agent storage (in real implementation, use database)
const agentStore = new Map<string, Agent>();

/**
 * Get or create agent by name
 */
async function getOrCreateAgent(name: string, language: string, client: any): Promise<Agent> {
  let agent = agentStore.get(name);
  
  if (!agent) {
    const config = getDefaultAgentConfig(name, language);
    agent = new Agent(config);
    agentStore.set(name, agent);
  }
  
  return agent;
}

/**
 * Get default agent configuration
 */
function getDefaultAgentConfig(name: string, language: string): AgentConfig {
  const configs: Record<string, AgentConfig> = {
    'LarkAssistant': {
      name: 'LarkAssistant',
      instructions: language === 'ja' 
        ? 'あなたはLark MCPツールの専門アシスタントです。ユーザーのLark関連のタスクを効率的にサポートし、親切で分かりやすい回答を提供してください。'
        : 'You are a Lark MCP tools specialist assistant. Help users efficiently with Lark-related tasks and provide helpful, clear responses.',
      language: language as 'en' | 'ja' | 'zh',
      temperature: 0.7,
      tools: []
    },
    'BaseExpert': {
      name: 'BaseExpert', 
      instructions: language === 'ja'
        ? 'あなたはLark Baseのエキスパートです。データベース操作、テーブル設計、レコード管理に特化して、技術的で正確なサポートを提供してください。'
        : 'You are a Lark Base expert. Specialize in database operations, table design, and record management with technical and accurate support.',
      language: language as 'en' | 'ja' | 'zh',
      temperature: 0.3,
      tools: []
    },
    'MessageBot': {
      name: 'MessageBot',
      instructions: language === 'ja'
        ? 'あなたはメッセージング専門のボットです。チャット管理、通知送信、コミュニケーション最適化に特化してサポートしてください。'
        : 'You are a messaging specialist bot. Focus on chat management, notification sending, and communication optimization.',
      language: language as 'en' | 'ja' | 'zh', 
      temperature: 0.5,
      tools: []
    }
  };

  return configs[name] || configs['LarkAssistant'];
}

/**
 * Create agent tools that integrate with MCP tools
 */
function createAgentTools(client: any): AgentTool[] {
  return [
    {
      name: 'search_base_records',
      description: 'Search records in Lark Base tables',
      execute: async (params: any) => {
        // Call actual MCP tool
        return client.request({
          method: 'POST',
          url: '/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/search',
          data: params
        });
      }
    },
    {
      name: 'send_message',
      description: 'Send messages in Lark',
      execute: async (params: any) => {
        return client.request({
          method: 'POST',
          url: '/open-apis/im/v1/messages',
          params: { receive_id_type: 'chat_id' },
          data: params
        });
      }
    },
    {
      name: 'get_user_info',
      description: 'Get user information',
      execute: async (params: any) => {
        return client.request({
          method: 'POST',
          url: '/open-apis/contact/v3/users/batch_get_id',
          data: params
        });
      }
    },
    {
      name: 'search_documents',
      description: 'Search documents in Lark',
      execute: async (params: any) => {
        return client.request({
          method: 'POST',
          url: '/open-apis/drive/v1/files/search',
          data: params
        });
      }
    }
  ];
}

export const larkChatAgentTools = [
  larkChatAgentTool,
  larkAgentCreateTool,
  larkAgentStatusTool
];