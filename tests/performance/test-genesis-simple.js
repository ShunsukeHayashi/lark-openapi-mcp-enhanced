#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('Testing Genesis MCP...\n');

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

let buffer = '';

mcp.stdout.on('data', (data) => {
  buffer += data.toString();
  
  // Try to extract complete JSON messages
  const lines = buffer.split('\n');
  buffer = lines.pop() || ''; // Keep incomplete line in buffer
  
  lines.forEach(line => {
    if (line.trim()) {
      try {
        const msg = JSON.parse(line);
        if (msg.id === 1 && msg.result) {
          console.log('✅ Initialized');
          // List tools
          mcp.stdin.write(JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/list',
            params: {}
          }) + '\n');
        }
        if (msg.id === 2 && msg.result) {
          const genesisTools = msg.result.tools.filter(t => t.name.includes('genesis'));
          console.log(`\n🛠️ Found ${genesisTools.length} Genesis tools:`);
          genesisTools.forEach(t => console.log(`  - ${t.name}`));
          
          // List prompts
          mcp.stdin.write(JSON.stringify({
            jsonrpc: '2.0',
            id: 3,
            method: 'prompts/list',
            params: {}
          }) + '\n');
        }
        if (msg.id === 3 && msg.result) {
          const prompts = msg.result.prompts || [];
          const genesisPrompts = prompts.filter(p => p.name.includes('genesis'));
          console.log(`\n📝 Found ${genesisPrompts.length} Genesis prompts:`);
          genesisPrompts.forEach(p => console.log(`  - ${p.name}`));
          
          console.log('\n✨ Genesis MCP integration working!');
          process.exit(0);
        }
      } catch (e) {
        // Ignore
      }
    }
  });
});

// Initialize
mcp.stdin.write(JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '1.0.0',
    capabilities: {},
    clientInfo: {
      name: 'test',
      version: '1.0.0'
    }
  }
}) + '\n');

setTimeout(() => {
  console.log('\nTimeout');
  process.exit(1);
}, 5000);