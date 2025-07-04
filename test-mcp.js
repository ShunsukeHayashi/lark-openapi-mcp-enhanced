#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing Lark MCP Server...\n');

// Test configuration
const configs = [
  {
    name: 'lark-all-tools',
    args: [
      'node',
      path.join(__dirname, 'dist/cli.js'),
      'mcp',
      '--mode', 'stdio',
      '--domain', 'https://open.larksuite.com'
    ]
  },
  {
    name: 'lark-mcp-genesis',
    args: [
      'node',
      path.join(__dirname, 'dist/cli.js'),
      'mcp',
      '--mode', 'stdio',
      '--domain', 'https://open.larksuite.com',
      '--tools', 'preset.complete.all'
    ]
  },
  {
    name: 'lark-light',
    args: [
      'node',
      path.join(__dirname, 'dist/cli.js'),
      'mcp',
      '--mode', 'stdio',
      '--domain', 'https://open.larksuite.com',
      '--tools', 'preset.light'
    ]
  }
];

// Test each configuration
configs.forEach(config => {
  console.log(`\nTesting ${config.name}...`);
  console.log(`Command: ${config.args.join(' ')}`);
  
  const env = {
    ...process.env,
    APP_ID: 'cli_a8d2fdb1f1f8d02d',
    APP_SECRET: 'V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ',
    NODE_ENV: 'production'
  };
  
  const proc = spawn(config.args[0], config.args.slice(1), {
    env,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Send initialize request
  const initRequest = JSON.stringify({
    jsonrpc: "2.0",
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      }
    },
    id: 1
  }) + '\n';
  
  proc.stdin.write(initRequest);
  
  let output = '';
  proc.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  proc.stderr.on('data', (data) => {
    console.error(`❌ Error: ${data.toString()}`);
  });
  
  setTimeout(() => {
    proc.kill();
    if (output.includes('"result"')) {
      console.log(`✅ ${config.name} - Working!`);
      const result = JSON.parse(output.split('\n')[0]);
      console.log(`   Tools: ${result.result.capabilities.tools?.length || 0}`);
    } else {
      console.log(`❌ ${config.name} - Failed`);
      console.log(`   Output: ${output.substring(0, 100)}...`);
    }
  }, 1000);
});

setTimeout(() => {
  console.log('\n\n📝 Summary:');
  console.log('If any configuration failed, check:');
  console.log('1. APP_ID and APP_SECRET are correct');
  console.log('2. Node.js version >= 16.20.0');
  console.log('3. All dependencies installed (yarn install)');
  console.log('4. Project built (yarn build)');
  process.exit(0);
}, 5000);