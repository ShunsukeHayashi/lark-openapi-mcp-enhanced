#!/usr/bin/env node

/**
 * Activate All MCP Tools Example
 * This script demonstrates how to activate and use all available MCP tools
 */

const { LarkMcpTool } = require('./dist/mcp-tool/mcp-tool');
const { createCoordinatorInstance } = require('./dist/agents/specialists/coordinator-agent');

async function activateAllTools() {
  console.log('🚀 Activating all MCP tools...\n');

  // Configuration with all tools activated
  const options = {
    appId: process.env.APP_ID || 'your_app_id',
    appSecret: process.env.APP_SECRET || 'your_app_secret',
    toolsOptions: {
      language: 'en',
      // Method 1: Use wildcard to activate all tools
      allowTools: ['*'],
      // Method 2: Use complete preset (uncomment to use)
      // allowTools: ['preset.complete.all'],
    },
    rateLimiting: {
      enabled: true,
      rateLimits: {
        default: { capacity: 200, tokensPerInterval: 100, intervalMs: 60000 },
        read: { capacity: 300, tokensPerInterval: 150, intervalMs: 60000 },
        write: { capacity: 50, tokensPerInterval: 25, intervalMs: 60000 },
      }
    }
  };

  try {
    // Initialize MCP Tool with all tools
    const mcpTool = new LarkMcpTool(options);
    
    // Get all available tools
    const allTools = mcpTool.getTools();
    console.log(`✅ Successfully activated ${allTools.length} tools!\n`);

    // Display tools by category
    const toolsByCategory = {};
    allTools.forEach(tool => {
      const category = tool.name.split('.')[0];
      if (!toolsByCategory[category]) {
        toolsByCategory[category] = [];
      }
      toolsByCategory[category].push(tool.name);
    });

    console.log('📦 Tools by Category:');
    Object.entries(toolsByCategory).forEach(([category, tools]) => {
      console.log(`\n${category.toUpperCase()} (${tools.length} tools):`);
      tools.slice(0, 5).forEach(tool => console.log(`  - ${tool}`));
      if (tools.length > 5) {
        console.log(`  ... and ${tools.length - 5} more`);
      }
    });

    // Initialize Coordinator with all tools for ML recommendations
    console.log('\n🤖 Initializing AI Coordinator...');
    const coordinator = createCoordinatorInstance(options);
    
    // Example: Get tool recommendations for a task
    console.log('\n📊 Getting AI tool recommendations for a sample task...');
    const recommendations = await coordinator.tools.get('get_tool_recommendations').execute({
      task: 'Create a weekly report in Lark Base with data from multiple sources',
      topK: 5
    });

    if (recommendations.success) {
      console.log('\n🎯 Recommended tools for the task:');
      recommendations.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.tool} (confidence: ${rec.confidence})`);
        console.log(`   Reason: ${rec.reason}`);
      });
    }

    // Display ML model metrics
    const mlMetrics = await coordinator.tools.get('get_ml_model_metrics').execute({});
    if (mlMetrics.success) {
      console.log('\n📈 ML Model Status:');
      console.log(`- ML Enabled: ${mlMetrics.modelMetrics.mlEnabled}`);
      console.log(`- Total Training Samples: ${mlMetrics.modelMetrics.totalTrainingSamples}`);
      console.log(`- Active Circuit Breakers: ${mlMetrics.modelMetrics.circuitBreakerStats.activeBreakers}`);
    }

    // Example tool execution (commented out to prevent actual API calls)
    console.log('\n💡 Example tool usage:');
    console.log('// Search for users');
    console.log("await mcpTool.execute('contact.v3.user.batchGetId', { emails: ['user@example.com'] });");
    console.log('\n// Create a message');
    console.log("await mcpTool.execute('im.v1.message.create', { receive_id: 'chat_id', msg_type: 'text', content: '{\"text\":\"Hello!\"}' });");
    console.log('\n// Search Bitable records');
    console.log("await mcpTool.execute('bitable.v1.appTableRecord.search', { app_token: 'app_xxx', table_id: 'tbl_xxx' });");

    // Cleanup
    if (coordinator.cleanup) {
      coordinator.cleanup();
    }

    console.log('\n✨ All tools are ready to use!');
    console.log('\n📚 For more information, see MCP_ALL_TOOLS_ACTIVATION.md');

  } catch (error) {
    console.error('❌ Error activating tools:', error.message);
    console.error('\nMake sure you have:');
    console.error('1. Valid APP_ID and APP_SECRET');
    console.error('2. Built the project: yarn build');
    console.error('3. Proper permissions for your Lark/Feishu app');
  }
}

// Run if called directly
if (require.main === module) {
  activateAllTools().catch(console.error);
}

module.exports = { activateAllTools };