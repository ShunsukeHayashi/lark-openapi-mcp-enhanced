const { spawn } = require('child_process');

console.log('Testing Recall Developer Documents (Fixed)...\n');

const mcp = spawn('node', [
  'dist/cli.js', 
  'recall-developer-documents',
  '--mode', 'stdio',
  '--domain', 'https://open.feishu.cn'
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
          console.log(`\n🛠️ Found ${tools.length} recall tools:`);
          tools.forEach(t => console.log(`  - ${t.name}: ${t.description}`));
          
          // Try to search docs
          console.log('\n📚 Testing recall search...');
          mcp.stdin.write(JSON.stringify({
            jsonrpc: '2.0',
            id: 3,
            method: 'tools/call',
            params: {
              name: 'openplatform_developer_document_recall',
              arguments: {
                query: 'MCP integration',
                lang: 'en'
              }
            }
          }) + '\n');
        }
        if (msg.id === 3) {
          if (msg.result) {
            console.log('\n✅ Recall Response:');
            const content = msg.result.content || [];
            content.forEach(item => {
              if (item.type === 'text') {
                const text = item.text || '';
                if (text.includes('search results')) {
                  console.log('Search completed successfully\!');
                } else {
                  console.log(text.substring(0, 200) + '...');
                }
              }
            });
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
}, 10000);
