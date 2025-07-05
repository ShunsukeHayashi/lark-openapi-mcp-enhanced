#!/usr/bin/env node

/**
 * Test script to verify Genesis MCP integration
 */

const { spawn } = require('child_process');

console.log('Testing Genesis MCP Integration...\n');

// Start MCP server with Genesis tools
const mcp = spawn('node', [
  'dist/cli.js', 
  'mcp',
  '--mode', 'stdio',
  '--app-id', 'test_app',
  '--app-secret', 'test_secret',
  '--tools', 'preset.genesis.default'
], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Send initialization message
const initMessage = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '1.0.0',
    capabilities: {},
    clientInfo: {
      name: 'genesis-test',
      version: '1.0.0'
    }
  }
};

mcp.stdin.write(JSON.stringify(initMessage) + '\n');

// Handle responses
mcp.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    // console.log('Received:', line);
    try {
      const response = JSON.parse(line);
      
      if (response.id === 1 && response.result) {
        console.log('✅ MCP Server initialized successfully');
        console.log('📋 Server capabilities:', JSON.stringify(response.result.capabilities, null, 2));
        
        // List available tools
        const listToolsMessage = {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list',
          params: {}
        };
        mcp.stdin.write(JSON.stringify(listToolsMessage) + '\n');
      }
      
      if (response.id === 2 && response.result) {
        console.log('\n🛠️ Available Genesis Tools:');
        const genesisTools = response.result.tools.filter(tool => tool.name.includes('genesis'));
        genesisTools.forEach(tool => {
          console.log(`  - ${tool.name}: ${tool.description}`);
        });
        console.log(`\n  Total Genesis tools: ${genesisTools.length}`);
        
        // List available prompts
        const listPromptsMessage = {
          jsonrpc: '2.0',
          id: 3,
          method: 'prompts/list',
          params: {}
        };
        mcp.stdin.write(JSON.stringify(listPromptsMessage) + '\n');
      }
      
      if (response.id === 3) {
        console.log('\n📝 Available Genesis Prompts:');
        if (response.result && response.result.prompts) {
          response.result.prompts.forEach(prompt => {
            if (prompt.name.includes('genesis')) {
              console.log(`  - ${prompt.name}: ${prompt.description}`);
            }
          });
        }
        
        console.log('\n✨ Genesis MCP integration is working correctly!');
        process.exit(0);
      }
    } catch (e) {
      // Ignore parse errors for non-JSON output
    }
  });
});

mcp.stderr.on('data', (data) => {
  console.error('Error:', data.toString());
});

// Clean up on exit
process.on('SIGINT', () => {
  mcp.kill();
  process.exit(0);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('\n⏱️ Test timed out');
  mcp.kill();
  process.exit(1);
}, 10000);