/**
 * Lark Workspace Integration Configuration
 * 特定のLarkワークスペースとBaseに最適化された設定
 */

import { Client } from '@larksuiteoapi/node-sdk';
import { Agent, AgentRunner } from './dist/agents/agent';

// ワークスペース固有の設定
export const WORKSPACE_CONFIG = {
  // Lark Workspace URL: https://f82jyx0mblu.jp.larksuite.com
  domain: 'f82jyx0mblu.jp.larksuite.com',
  
  // Base Configuration
  base: {
    appToken: 'FXdlb6PpNatocgsv6rcjFmmFpKb',
    tableId: 'tblY8xdYPEmG65ou',
    viewId: 'vewfMxGkiC'
  },
  
  // Wiki Configuration  
  wiki: {
    nodeToken: 'DgH0w39GMiS2LVkhpsOjdpCDp0g'
  },
  
  // Bot Configuration
  bot: {
    name: 'MCP AI Assistant',
    description: 'Intelligent AI assistant for workspace automation',
    language: 'ja',
    timezone: 'Asia/Tokyo'
  }
};

// Lark クライアント初期化（日本のLarkSuite用）
export function createLarkClient(): Client {
  return new Client({
    appId: process.env.APP_ID!,
    appSecret: process.env.APP_SECRET!,
    domain: 'larksuite.com', // 日本版LarkSuite
    loggerLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
  });
}

// ワークスペース専用エージェント設定
export function createWorkspaceAgent(): Agent {
  return new Agent({
    name: 'WorkspaceAssistant',
    instructions: `あなたは${WORKSPACE_CONFIG.domain}ワークスペース専用のAIアシスタントです。
    
主な機能:
1. Base ${WORKSPACE_CONFIG.base.appToken} のデータ操作とクエリ
2. Wiki ${WORKSPACE_CONFIG.wiki.nodeToken} のコンテンツ検索と参照
3. ワークスペース内のメンバーとのコミュニケーション支援
4. タスク管理とプロジェクト進捗の追跡
5. 日本語でのフレンドリーなサポート

常にワークスペースのコンテキストを考慮し、具体的で実用的な回答を提供してください。`,
    
    language: 'ja',
    temperature: 0.7,
    tools: [] // MCP tools will be added dynamically
  });
}

// Base専用ツール設定
export const BASE_TOOLS = {
  // レコード検索
  searchRecords: {
    name: 'workspace_base_search',
    description: 'ワークスペースのBaseからレコードを検索',
    execute: async (params: any) => {
      const client = createLarkClient();
      
      return await client.bitable.appTableRecord.search({
        path: {
          app_token: WORKSPACE_CONFIG.base.appToken,
          table_id: WORKSPACE_CONFIG.base.tableId
        },
        data: {
          filter: params.filter,
          sort: params.sort,
          field_names: params.fields,
          page_size: params.limit || 20
        }
      });
    }
  },
  
  // レコード作成
  createRecord: {
    name: 'workspace_base_create',
    description: 'ワークスペースのBaseにレコードを作成',
    execute: async (params: any) => {
      const client = createLarkClient();
      
      return await client.bitable.appTableRecord.create({
        path: {
          app_token: WORKSPACE_CONFIG.base.appToken,
          table_id: WORKSPACE_CONFIG.base.tableId
        },
        data: {
          fields: params.fields
        }
      });
    }
  },
  
  // レコード更新
  updateRecord: {
    name: 'workspace_base_update',
    description: 'ワークスペースのBaseのレコードを更新',
    execute: async (params: any) => {
      const client = createLarkClient();
      
      return await client.bitable.appTableRecord.update({
        path: {
          app_token: WORKSPACE_CONFIG.base.appToken,
          table_id: WORKSPACE_CONFIG.base.tableId,
          record_id: params.recordId
        },
        data: {
          fields: params.fields
        }
      });
    }
  }
};

// Wiki専用ツール設定
export const WIKI_TOOLS = {
  // Wiki検索
  searchWiki: {
    name: 'workspace_wiki_search',
    description: 'ワークスペースのWikiコンテンツを検索',
    execute: async (params: any) => {
      const client = createLarkClient();
      
      // Wiki ノードの子要素を取得
      const children = await client.wiki.spaceNode.list({
        path: {
          space_id: WORKSPACE_CONFIG.wiki.nodeToken
        },
        params: {
          page_size: 50
        }
      });
      
      // 検索キーワードに基づいてフィルタリング
      if (params.keyword) {
        const filtered = children.data?.items?.filter(item => 
          item.title?.includes(params.keyword) || 
          item.node_token?.includes(params.keyword)
        );
        return { data: { items: filtered } };
      }
      
      return children;
    }
  },
  
  // Wiki内容取得
  getWikiContent: {
    name: 'workspace_wiki_content',
    description: 'ワークスペースのWikiページ内容を取得',
    execute: async (params: any) => {
      const client = createLarkClient();
      
      return await client.wiki.spaceNode.get({
        path: {
          space_id: WORKSPACE_CONFIG.wiki.nodeToken,
          node_token: params.nodeToken
        }
      });
    }
  }
};

// メッセージハンドラー（ワークスペース専用）
export async function handleWorkspaceMessage(event: any) {
  const message = event.message;
  const sender = event.sender;
  
  console.log(`[${WORKSPACE_CONFIG.domain}] Processing message:`, {
    chatId: message.chat_id,
    userId: sender.sender_id?.user_id,
    text: message.content?.text?.substring(0, 100)
  });
  
  try {
    // ワークスペース専用エージェント取得
    const agent = createWorkspaceAgent();
    
    // ワークスペース専用ツールを追加
    Object.values(BASE_TOOLS).forEach(tool => {
      agent.tools.set(tool.name, tool);
    });
    
    Object.values(WIKI_TOOLS).forEach(tool => {
      agent.tools.set(tool.name, tool);
    });
    
    // メッセージ処理
    const result = await AgentRunner.run(agent, message.content?.text || '', {
      chatId: message.chat_id,
      userId: sender.sender_id?.user_id,
      metadata: {
        workspace: WORKSPACE_CONFIG.domain,
        baseToken: WORKSPACE_CONFIG.base.appToken,
        wikiToken: WORKSPACE_CONFIG.wiki.nodeToken
      }
    });
    
    // レスポンス送信
    if (result.success) {
      const client = createLarkClient();
      
      await client.im.message.create({
        params: { receive_id_type: 'chat_id' },
        data: {
          receive_id: message.chat_id,
          msg_type: 'text',
          content: JSON.stringify({
            text: result.response
          })
        }
      });
      
      console.log(`[${WORKSPACE_CONFIG.domain}] Response sent successfully`);
    } else {
      console.error(`[${WORKSPACE_CONFIG.domain}] Agent processing failed:`, result.error);
    }
    
  } catch (error) {
    console.error(`[${WORKSPACE_CONFIG.domain}] Message handling error:`, error);
    
    // エラー通知
    const client = createLarkClient();
    await client.im.message.create({
      params: { receive_id_type: 'chat_id' },
      data: {
        receive_id: message.chat_id,
        msg_type: 'text',
        content: JSON.stringify({
          text: '申し訳ございません。処理中にエラーが発生しました。しばらく後でもう一度お試しください。'
        })
      }
    });
  }
}

// リッチメッセージテンプレート
export const MESSAGE_TEMPLATES = {
  // Base検索結果
  baseSearchResult: (records: any[]) => ({
    msg_type: 'interactive',
    card: {
      elements: [
        {
          tag: 'div',
          text: {
            content: `🔍 **検索結果** (${records.length}件)`,
            tag: 'lark_md'
          }
        },
        ...records.map((record, index) => ({
          tag: 'div',
          text: {
            content: `**${index + 1}.** ${Object.entries(record.fields)
              .map(([key, value]) => `${key}: ${value}`)
              .join(' | ')}`,
            tag: 'lark_md'
          }
        }))
      ]
    }
  }),
  
  // Wiki検索結果
  wikiSearchResult: (pages: any[]) => ({
    msg_type: 'interactive',
    card: {
      elements: [
        {
          tag: 'div',
          text: {
            content: `📚 **Wiki検索結果** (${pages.length}件)`,
            tag: 'lark_md'
          }
        },
        ...pages.map((page, index) => ({
          tag: 'div',
          text: {
            content: `**${index + 1}.** [${page.title}](${WORKSPACE_CONFIG.domain}/wiki/${page.node_token})`,
            tag: 'lark_md'
          }
        }))
      ]
    }
  }),
  
  // エラーメッセージ
  errorMessage: (error: string) => ({
    msg_type: 'text',
    content: JSON.stringify({
      text: `❌ エラー: ${error}\n\n💡 「help」と入力すると使用方法を確認できます。`
    })
  }),
  
  // ヘルプメッセージ
  helpMessage: () => ({
    msg_type: 'interactive',
    card: {
      elements: [
        {
          tag: 'div',
          text: {
            content: '🤖 **MCP AI Assistant ヘルプ**',
            tag: 'lark_md'
          }
        },
        {
          tag: 'hr'
        },
        {
          tag: 'div',
          text: {
            content: `📊 **Base操作**
• "レコードを検索" - データベース検索
• "新しいレコードを作成" - データ追加
• "レコードを更新" - データ修正

📚 **Wiki操作**
• "Wikiを検索" - ドキュメント検索
• "ページ内容を表示" - ページ詳細取得

💬 **一般的な質問**
• "何ができますか？" - 機能一覧
• "ステータス" - システム状況
• "設定" - 現在の設定`,
            tag: 'lark_md'
          }
        }
      ]
    }
  })
};

// 使用例とテスト関数
export async function testWorkspaceIntegration() {
  console.log('🧪 Testing workspace integration...');
  
  // Base検索テスト
  try {
    const searchResult = await BASE_TOOLS.searchRecords.execute({
      filter: {},
      limit: 5
    });
    console.log('✅ Base search test passed:', searchResult.data?.items?.length || 0, 'records found');
  } catch (error) {
    console.error('❌ Base search test failed:', error);
  }
  
  // Wiki検索テスト
  try {
    const wikiResult = await WIKI_TOOLS.searchWiki.execute({
      keyword: ''
    });
    console.log('✅ Wiki search test passed:', wikiResult.data?.items?.length || 0, 'pages found');
  } catch (error) {
    console.error('❌ Wiki search test failed:', error);
  }
}

export default {
  WORKSPACE_CONFIG,
  createLarkClient,
  createWorkspaceAgent,
  handleWorkspaceMessage,
  MESSAGE_TEMPLATES,
  testWorkspaceIntegration
};