#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('Testing Extended Genesis MCP Tools...\n');

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
  
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';
  
  lines.forEach(line => {
    if (line.trim()) {
      try {
        const msg = JSON.parse(line);
        if (msg.id === 1 && msg.result) {
          console.log('✅ MCP Server initialized');
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
          console.log(`\n🛠️ Genesis Tools (${genesisTools.length} total):`);
          
          // Group tools by category
          const baseTools = genesisTools.filter(t => 
            t.name.includes('create_base') || 
            t.name.includes('analyze') || 
            t.name.includes('optimize')
          );
          const viewTools = genesisTools.filter(t => 
            t.name.includes('view') || 
            t.name.includes('dashboard') || 
            t.name.includes('automation')
          );
          
          console.log('\n📊 Base Management:');
          baseTools.forEach(t => console.log(`  - ${t.name}`));
          
          console.log('\n🎨 Views & Automation:');
          viewTools.forEach(t => console.log(`  - ${t.name}`));
          
          // Also check for the actual APIs
          const apiTools = msg.result.tools.filter(t => 
            t.name.includes('appTableView.create') ||
            t.name.includes('appDashboard.copy') ||
            t.name.includes('appWorkflow.list') ||
            t.name.includes('spreadsheetSheetFilterView.create')
          );
          
          console.log('\n🔧 Supporting APIs:');
          apiTools.forEach(t => console.log(`  - ${t.name}`));
          
          console.log('\n✨ Extended Genesis tools loaded successfully!');
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