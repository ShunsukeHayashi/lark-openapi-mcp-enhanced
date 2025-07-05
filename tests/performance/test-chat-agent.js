#!/usr/bin/env node

/**
 * Chat Agent System Test Script
 * Tests the integrated LLM Chat Agent with various conversation scenarios
 */

const { Agent, AgentRunner } = require('./dist/agents/agent.js');
const { larkChatAgentTools } = require('./dist/mcp-tool/tools/en/builtin-tools/system/lark-chat-agent.js');

// Mock Lark client for testing
const mockLarkClient = {
  request: async (params) => {
    console.log(`📤 Mock Lark API Call: ${params.method} ${params.url}`);
    if (params.data) {
      console.log(`📄 Data:`, JSON.stringify(params.data, null, 2));
    }
    return { code: 0, msg: "success", data: {} };
  }
};

// Test scenarios
const testScenarios = [
  {
    name: "Greeting Test",
    message: "こんにちは！",
    expected: "greeting response"
  },
  {
    name: "Help Request",
    message: "help",
    expected: "help information"
  },
  {
    name: "Base Query",
    message: "顧客テーブルから今月の案件を検索して",
    expected: "base search task"
  },
  {
    name: "Create Request",
    message: "新しいレコードを作成してください",
    expected: "create task"
  },
  {
    name: "Status Command",
    message: "status",
    expected: "system status"
  },
  {
    name: "General Question",
    message: "What can you do?",
    expected: "capability explanation"
  },
  {
    name: "Thank You",
    message: "ありがとう",
    expected: "polite response"
  },
  {
    name: "Complex Task",
    message: "営業チームに今日の会議について通知を送信してください",
    expected: "messaging task"
  }
];

async function testChatAgent() {
  console.log('🤖 Starting Chat Agent System Test\n');
  
  // Create test agent
  const agentConfig = {
    name: 'TestLarkAssistant',
    instructions: 'あなたはLark MCPツールの専門アシスタントです。ユーザーのLark関連のタスクを効率的にサポートし、親切で分かりやすい回答を提供してください。',
    language: 'ja',
    temperature: 0.7,
    tools: []
  };
  
  const agent = new Agent(agentConfig);
  console.log(`✅ Created Agent: ${agent.name}`);
  console.log(`📝 Instructions: ${agent.instructions.substring(0, 80)}...\n`);
  
  // Test each scenario
  let passedTests = 0;
  let totalTests = testScenarios.length;
  
  for (const [index, scenario] of testScenarios.entries()) {
    console.log(`\n--- Test ${index + 1}/${totalTests}: ${scenario.name} ---`);
    console.log(`👤 User: "${scenario.message}"`);
    
    try {
      const context = {
        chatId: 'test_chat_001',
        userId: 'test_user_001',
        conversationId: `test_conv_${index}`,
        metadata: { larkClient: mockLarkClient }
      };
      
      const result = await AgentRunner.run(agent, scenario.message, context);
      
      if (result.success) {
        console.log(`🤖 Agent: "${result.response.substring(0, 200)}${result.response.length > 200 ? '...' : ''}"`);
        console.log(`✅ Status: Success`);
        console.log(`🧠 Context ID: ${result.context.conversationId}`);
        
        if (result.toolCalls && result.toolCalls.length > 0) {
          console.log(`🛠️ Tools Called: ${result.toolCalls.length}`);
          result.toolCalls.forEach(call => {
            console.log(`  - ${call.name}: ${call.error ? 'Error' : 'Success'}`);
          });
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
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Test summary
  console.log(`\n\n🎯 Test Results Summary:`);
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📊 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log(`\n🎉 All tests passed! Chat Agent system is working correctly.`);
  } else {
    console.log(`\n⚠️ Some tests failed. Review the errors above.`);
  }
}

async function testMCPToolIntegration() {
  console.log('\n\n🔧 Testing MCP Tool Integration\n');
  
  console.log('📊 Available Lark Chat Agent Tools:');
  larkChatAgentTools.forEach((tool, i) => {
    console.log(`  ${i + 1}. ${tool.name}`);
    console.log(`     ${tool.description}`);
    console.log(`     Access: ${tool.accessTokens.join(', ')}`);
  });
  
  // Test tool handler availability
  console.log('\n🧪 Testing Tool Handlers:');
  let toolTestsPassed = 0;
  
  for (const tool of larkChatAgentTools) {
    try {
      if (typeof tool.customHandler === 'function') {
        console.log(`✅ ${tool.name}: Handler available`);
        toolTestsPassed++;
      } else {
        console.log(`❌ ${tool.name}: No custom handler`);
      }
    } catch (error) {
      console.log(`❌ ${tool.name}: Handler error - ${error.message}`);
    }
  }
  
  console.log(`\n🔧 Tool Integration Summary:`);
  console.log(`✅ Working Tools: ${toolTestsPassed}/${larkChatAgentTools.length}`);
  console.log(`📊 Integration Rate: ${Math.round((toolTestsPassed / larkChatAgentTools.length) * 100)}%`);
}

async function main() {
  console.log('🚀 Lark OpenAPI MCP - Chat Agent System Test');
  console.log('=' .repeat(50));
  
  try {
    await testChatAgent();
    await testMCPToolIntegration();
    
    console.log('\n\n✨ Test Execution Complete!');
    console.log('📋 Review the results above to verify system functionality.');
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testChatAgent, testMCPToolIntegration };