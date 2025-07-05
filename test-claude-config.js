#!/usr/bin/env node

/**
 * Test Claude Desktop Configuration
 * Verifies that the Lark MCP configurations work correctly
 */

const { spawn } = require('child_process');
const path = require('path');

const configs = [
  {
    name: 'lark-all-tools',
    args: [
      path.join(__dirname, 'dist/cli.js'),
      'mcp',
      '--mode', 'stdio',
      '--tools', '*'
    ],
    env: {
      APP_ID: 'cli_a8d2fdb1f1f8d02d',
      APP_SECRET: 'V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ'
    }
  },
  {
    name: 'lark-enhanced-v4',
    args: [
      path.join(__dirname, 'dist/cli.js'),
      'mcp',
      '--mode', 'stdio',
      '--tools', 'preset.complete.all'
    ],
    env: {
      APP_ID: 'cli_a8d2fdb1f1f8d02d',
      APP_SECRET: 'V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ'
    }
  },
  {
    name: 'lark-ml-enhanced',
    args: [
      path.join(__dirname, 'dist/cli.js'),
      'mcp',
      '--mode', 'stdio',
      '--tools', 'preset.complete.all',
      '--rate-limit-requests', '200'
    ],
    env: {
      APP_ID: 'cli_a8d2fdb1f1f8d02d',
      APP_SECRET: 'V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ',
      NODE_OPTIONS: '--max-old-space-size=4096'
    }
  }
];

async function testConfig(config) {
  console.log(`\n🧪 Testing ${config.name}...`);
  
  return new Promise((resolve) => {
    const child = spawn('node', config.args, {
      env: { ...process.env, ...config.env },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';
    
    // Send a test message to stdio
    setTimeout(() => {
      child.stdin.write(JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1
      }) + '\n');
    }, 1000);

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    setTimeout(() => {
      child.kill();
      
      if (errorOutput.includes('Error') || errorOutput.includes('error')) {
        console.log(`❌ ${config.name}: Failed`);
        console.log('Error:', errorOutput);
        resolve(false);
      } else if (output.includes('tools') || output.includes('jsonrpc')) {
        console.log(`✅ ${config.name}: Success`);
        const matches = output.match(/"tools":\s*\[([^\]]*)\]/);
        if (matches) {
          const toolCount = matches[1].split(',').filter(t => t.trim()).length;
          console.log(`   Tools loaded: ${toolCount}`);
        }
        resolve(true);
      } else {
        console.log(`⚠️  ${config.name}: No response`);
        resolve(false);
      }
    }, 3000);
  });
}

async function runTests() {
  console.log('🚀 Testing Claude Desktop Lark MCP Configurations\n');
  
  const results = [];
  for (const config of configs) {
    const success = await testConfig(config);
    results.push({ name: config.name, success });
  }
  
  console.log('\n📊 Summary:');
  results.forEach(r => {
    console.log(`${r.success ? '✅' : '❌'} ${r.name}`);
  });
  
  const allSuccess = results.every(r => r.success);
  if (allSuccess) {
    console.log('\n✨ All configurations are working correctly!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart Claude Desktop');
    console.log('2. Select any of the Lark MCP servers from the menu');
    console.log('3. Start using Lark tools in your conversations');
  } else {
    console.log('\n⚠️  Some configurations failed. Please check the errors above.');
    console.log('\nTroubleshooting:');
    console.log('1. Run: yarn build');
    console.log('2. Check APP_ID and APP_SECRET are correct');
    console.log('3. Ensure Node.js version >= 16.20.0');
  }
}

if (require.main === module) {
  runTests().catch(console.error);
}