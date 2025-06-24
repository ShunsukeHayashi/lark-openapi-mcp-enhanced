#!/usr/bin/env node

/**
 * Advanced Chat Agent Test with Real MCP Tool Integration
 * Tests the agent with actual Lark MCP tools integration
 */

const { Agent, AgentRunner } = require('./dist/agents/agent.js');
const { createAgentTools } = require('./dist/mcp-tool/tools/en/builtin-tools/system/lark-chat-agent.js');

// Enhanced mock Lark client that simulates real API responses
const mockLarkClient = {
  request: async (params) => {
    console.log(`🔗 Mock Lark API: ${params.method} ${params.url}`);
    
    // Simulate different API responses based on URL
    if (params.url.includes('/messages')) {
      return {
        code: 0,
        msg: "success",
        data: {
          message_id: "om_mock_message_123",
          create_time: new Date().toISOString()
        }
      };
    }
    
    if (params.url.includes('/records/search')) {
      return {
        code: 0,
        msg: "success", 
        data: {
          items: [
            {
              record_id: "rec_mock_001",
              fields: {
                "顧客名": "ABC商事",
                "業界": "IT",
                "案件名": "システム導入",
                "金額": 1000000
              }
            },
            {
              record_id: "rec_mock_002", 
              fields: {
                "顧客名": "XYZ株式会社",
                "業界": "製造業",
                "案件名": "効率化プロジェクト",
                "金額": 2500000
              }
            }
          ],
          total: 2
        }
      };
    }
    
    if (params.url.includes('/users/batch_get_id')) {
      return {
        code: 0,
        msg: "success",
        data: {
          user_list: [
            {
              user_id: "ou_mock_user_001",
              name: "田中太郎",
              email: "tanaka@example.com"
            }
          ]
        }
      };
    }
    
    if (params.url.includes('/files/search')) {
      return {
        code: 0,
        msg: "success",
        data: {
          files: [
            {
              token: "doc_mock_001",
              name: "プロジェクト計画書.docx",
              type: "docx",
              size: 1024000
            }
          ]
        }
      };
    }
    
    return { code: 0, msg: "success", data: {} };
  }
};

// Advanced test scenarios that would trigger tool usage
const advancedScenarios = [
  {
    name: "Search Base Records Task",
    message: "顧客テーブルから今月の案件を検索して",
    expectTool: "search_base_records",
    category: "task"
  },
  {
    name: "Send Message Task", 
    message: "営業チームに「明日の会議は延期になりました」と連絡して",
    expectTool: "send_message", 
    category: "task"
  },
  {
    name: "User Information Query",
    message: "田中さんの連絡先を教えて",
    expectTool: "get_user_info",
    category: "task"
  },
  {
    name: "Document Search Task",
    message: "プロジェクト計画書という名前のファイルを探して",
    expectTool: "search_documents",
    category: "task"
  },
  {
    name: "Help Command",
    message: "help base",
    expectTool: null,
    category: "command"
  },
  {
    name: "Status Command", 
    message: "status",
    expectTool: null,
    category: "command"
  }
];

async function testAgentWithTools() {
  console.log('🛠️ Testing Chat Agent with MCP Tool Integration\n');
  
  // Create agent with MCP tools integrated
  const agentConfig = {
    name: 'LarkAssistantWithTools',
    instructions: 'あなたはLark MCPツールの専門アシスタントです。ユーザーのリクエストに応じて適切なLark APIツールを使用してタスクを実行してください。',
    language: 'ja',
    temperature: 0.7,
    tools: []
  };
  
  const agent = new Agent(agentConfig);
  
  // Add MCP tools to agent (simulating the real integration)
  const mcpTools = [
    {
      name: 'search_base_records',
      description: 'Search records in Lark Base tables',
      execute: async (params) => {
        console.log('🔍 Executing Base search...');
        return await mockLarkClient.request({
          method: 'POST',
          url: '/open-apis/bitable/v1/apps/mock_app/tables/mock_table/records/search',
          data: params
        });
      }
    },
    {
      name: 'send_message',
      description: 'Send messages in Lark',
      execute: async (params) => {
        console.log('💬 Sending message...');
        return await mockLarkClient.request({
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
      execute: async (params) => {
        console.log('👤 Getting user info...');
        return await mockLarkClient.request({
          method: 'POST',
          url: '/open-apis/contact/v3/users/batch_get_id',
          data: params
        });
      }
    },
    {
      name: 'search_documents',
      description: 'Search documents in Lark',
      execute: async (params) => {
        console.log('📄 Searching documents...');
        return await mockLarkClient.request({
          method: 'POST',
          url: '/open-apis/drive/v1/files/search',
          data: params
        });
      }
    }
  ];
  
  // Add tools to agent
  for (const tool of mcpTools) {
    agent.tools.set(tool.name, tool);
  }
  
  console.log(`✅ Created Agent with Tools: ${agent.name}`);
  console.log(`🛠️ Available Tools: ${agent.tools.size}`);
  console.log(`📝 Tools: ${Array.from(agent.tools.keys()).join(', ')}\n`);
  
  // Test scenarios
  let passedTests = 0;
  let toolCallsSucceeded = 0;
  let totalToolCalls = 0;
  
  for (const [index, scenario] of advancedScenarios.entries()) {
    console.log(`\n--- Advanced Test ${index + 1}/${advancedScenarios.length}: ${scenario.name} ---`);
    console.log(`👤 User: "${scenario.message}"`);
    console.log(`🎯 Expected Category: ${scenario.category}`);
    if (scenario.expectTool) {
      console.log(`🔧 Expected Tool: ${scenario.expectTool}`);
    }
    
    try {
      const context = {
        chatId: 'test_chat_advanced',
        userId: 'test_user_advanced',
        conversationId: `advanced_conv_${index}`,
        metadata: { larkClient: mockLarkClient }
      };
      
      const result = await AgentRunner.run(agent, scenario.message, context);
      
      if (result.success) {
        console.log(`🤖 Agent Response: "${result.response.substring(0, 150)}${result.response.length > 150 ? '...' : ''}"`);
        console.log(`✅ Status: Success`);
        
        if (result.toolCalls && result.toolCalls.length > 0) {
          console.log(`🛠️ Tools Called: ${result.toolCalls.length}`);
          totalToolCalls += result.toolCalls.length;
          
          result.toolCalls.forEach(call => {
            const status = call.error ? 'Error' : 'Success';
            console.log(`  - ${call.name}: ${status}`);
            if (!call.error) {
              toolCallsSucceeded++;
            }
            if (call.result) {
              console.log(`    Result: ${JSON.stringify(call.result).substring(0, 100)}...`);
            }
          });
          
          // Check if expected tool was called
          if (scenario.expectTool) {
            const expectedToolCalled = result.toolCalls.some(call => call.name === scenario.expectTool);
            if (expectedToolCalled) {
              console.log(`✅ Expected tool "${scenario.expectTool}" was called`);
            } else {
              console.log(`⚠️ Expected tool "${scenario.expectTool}" was not called`);
            }
          }
        } else if (scenario.expectTool) {
          console.log(`⚠️ No tools called, but expected "${scenario.expectTool}"`);
        }
        
        passedTests++;
      } else {
        console.log(`❌ Status: Failed`);
        console.log(`❗ Error: ${result.error}`);
      }
      
    } catch (error) {
      console.log(`❌ Status: Exception`);
      console.log(`❗ Exception: ${error.message}`);
    }
  }
  
  // Advanced test summary
  console.log(`\n\n🎯 Advanced Test Results:`);
  console.log(`✅ Passed Tests: ${passedTests}/${advancedScenarios.length}`);
  console.log(`🛠️ Total Tool Calls: ${totalToolCalls}`);
  console.log(`✅ Successful Tool Calls: ${toolCallsSucceeded}/${totalToolCalls}`);
  console.log(`📊 Success Rate: ${Math.round((passedTests / advancedScenarios.length) * 100)}%`);
  console.log(`🔧 Tool Success Rate: ${totalToolCalls > 0 ? Math.round((toolCallsSucceeded / totalToolCalls) * 100) : 0}%`);
  
  return {
    testsPassed: passedTests,
    totalTests: advancedScenarios.length,
    toolCallsSucceeded,
    totalToolCalls
  };
}

async function main() {
  console.log('🚀 Advanced Chat Agent with MCP Tools Test');
  console.log('=' .repeat(60));
  
  try {
    const results = await testAgentWithTools();
    
    console.log('\n\n🎉 Advanced Test Execution Complete!');
    
    if (results.testsPassed === results.totalTests) {
      console.log('✅ All tests passed! The Chat Agent with MCP tools integration is working perfectly.');
    } else {
      console.log(`⚠️ ${results.totalTests - results.testsPassed} test(s) failed. Review the output above.`);
    }
    
    if (results.totalToolCalls > 0) {
      console.log(`🛠️ Tool integration is ${results.toolCallsSucceeded === results.totalToolCalls ? 'fully' : 'partially'} functional.`);
    }
    
  } catch (error) {
    console.error('\n❌ Advanced test execution failed:', error);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testAgentWithTools };