const { spawn } = require('child_process');

console.log('Testing Genesis Templates...\n');

const mcp = spawn('node', [
  'dist/cli.js', 
  'mcp',
  '--mode', 'stdio',
  '--app-id', 'test_app',
  '--app-secret', 'test_secret',
  '--tools', 'genesis.builtin.list_templates'
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
          const tools = msg.result.tools || [];
          console.log(`\n🛠️ Found ${tools.length} Genesis template tools:`);
          tools.forEach(t => console.log(`  - ${t.name}: ${t.description}`));
          
          // Try to call list_templates
          if (tools.find(t => t.name === 'genesis_builtin_list_templates')) {
            console.log('\n📋 Calling list_templates...');
            mcp.stdin.write(JSON.stringify({
              jsonrpc: '2.0',
              id: 3,
              method: 'tools/call',
              params: {
                name: 'genesis_builtin_list_templates',
                arguments: {}
              }
            }) + '\n');
          } else {
            console.log('\n⚠️ list_templates tool not found');
            process.exit(0);
          }
        }
        if (msg.id === 3) {
          if (msg.result) {
            console.log('\n📋 Available Templates:');
            console.log(JSON.stringify(msg.result, null, 2));
          } else if (msg.error) {
            console.log('\n❌ Error:', msg.error.message);
          }
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
