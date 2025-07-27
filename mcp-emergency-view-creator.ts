#!/usr/bin/env node

/**
 * MCP Tool Script for Creating Emergency Order Alert View
 * 
 * Usage:
 * 1. Set environment variables or pass credentials
 * 2. Run: node mcp-emergency-view-creator.ts
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const APP_TOKEN = 'KgFMw2G2Yiphx7kxNz0jA8DFpqd';
const TABLE_ID = 'blkaRu69SEx1D08B';
const VIEW_NAME = '🚨緊急発注アラート';

// MCP Tool definitions for the emergency view
const mcpTools = [
  {
    tool: 'bitable.v1.appTableView.create',
    params: {
      path: { app_token: APP_TOKEN, table_id: TABLE_ID },
      data: { view_name: VIEW_NAME, view_type: 'grid' }
    }
  },
  {
    tool: 'bitable.v1.appTableField.list',
    params: {
      path: { app_token: APP_TOKEN, table_id: TABLE_ID },
      params: { page_size: 100 }
    }
  }
];

// Create MCP command script
const createMcpScript = () => {
  const script = `
#!/bin/bash

# Emergency Order Alert View Creation Script
# Using Lark MCP Tools

echo "🚀 Creating Emergency Order Alert View..."

# Step 1: Create the view
echo "1️⃣ Creating new view..."
npx -y @larksuiteoapi/lark-mcp mcp \\
  --mode stdio \\
  --app-id \${APP_ID} \\
  --app-secret \${APP_SECRET} \\
  --tools "bitable.v1.appTableView.create" \\
  --input '{
    "tool": "bitable.v1.appTableView.create",
    "arguments": {
      "path": { "app_token": "${APP_TOKEN}", "table_id": "${TABLE_ID}" },
      "data": { "view_name": "${VIEW_NAME}", "view_type": "grid" }
    }
  }'

# Step 2: Get field information
echo "2️⃣ Getting field information..."
npx -y @larksuiteoapi/lark-mcp mcp \\
  --mode stdio \\
  --app-id \${APP_ID} \\
  --app-secret \${APP_SECRET} \\
  --tools "bitable.v1.appTableField.list" \\
  --input '{
    "tool": "bitable.v1.appTableField.list",
    "arguments": {
      "path": { "app_token": "${APP_TOKEN}", "table_id": "${TABLE_ID}" },
      "params": { "page_size": 100 }
    }
  }'

echo "✅ View creation process initiated!"
echo "📍 Please check your Lark Base app for the new view"
`;

  return script;
};

// Create configuration file for MCP
const createMcpConfig = () => {
  const config = {
    appToken: APP_TOKEN,
    tableId: TABLE_ID,
    viewConfig: {
      name: VIEW_NAME,
      type: 'grid',
      filters: {
        conjunction: 'and',
        conditions: [
          { field: '緊急発注フラグ', operator: 'is', value: '🚩緊急' },
          { field: '発注残数', operator: 'is', value: '0' },
          { field: '在庫切れ予測', operator: 'isLess', value: '30' },
          { field: '30日販売数', operator: 'isGreater', value: '0' }
        ]
      },
      sort: [
        { field: '在庫切れ予測', order: 'asc' },
        { field: '30日販売数', order: 'desc' },
        { field: '利益率', order: 'desc' }
      ],
      columns: [
        '🏷️JANコード',
        '📝商品名',
        '🚨在庫切れ予測',
        '📊現在庫',
        '📈30日販売数',
        '📊発注推奨数',
        '🏭主要サプライヤー',
        '💰単価',
        '💹利益率'
      ],
      conditionalFormatting: {
        '在庫切れ予測': [
          { condition: '≤10', color: '#FF4444' },
          { condition: '11-20', color: '#FFD700' },
          { condition: '21-30', color: '#FFA500' }
        ],
        '利益率': [
          { condition: '≥50%', color: '#90EE90' },
          { condition: '30-49%', color: '#FFFFE0' },
          { condition: '<30%', color: '#FFE4E1' }
        ]
      }
    }
  };

  return config;
};

// Main execution
const main = async () => {
  console.log('📦 Emergency Order Alert View Creator');
  console.log('====================================');
  
  try {
    // Create script file
    const scriptPath = path.join(__dirname, 'create-emergency-view.sh');
    fs.writeFileSync(scriptPath, createMcpScript());
    fs.chmodSync(scriptPath, '755');
    console.log('✅ Created MCP script:', scriptPath);
    
    // Create config file
    const configPath = path.join(__dirname, 'emergency-view-config.json');
    fs.writeFileSync(configPath, JSON.stringify(createMcpConfig(), null, 2));
    console.log('✅ Created configuration:', configPath);
    
    // Instructions
    console.log('\n📋 Instructions:');
    console.log('1. Ensure you have proper credentials:');
    console.log('   export APP_ID=your_app_id');
    console.log('   export APP_SECRET=your_app_secret');
    console.log('   # OR use user access token');
    console.log('   export USER_ACCESS_TOKEN=your_token');
    console.log('\n2. Run the script:');
    console.log('   ./create-emergency-view.sh');
    console.log('\n3. Or use MCP directly:');
    console.log('   npx -y @larksuiteoapi/lark-mcp mcp --mode stdio --app-id $APP_ID --app-secret $APP_SECRET');
    
    // Alternative: Direct MCP command
    console.log('\n🔧 Alternative: Use built MCP server');
    console.log('yarn build && node dist/cli.js mcp --mode stdio --app-id $APP_ID --app-secret $APP_SECRET --tools "bitable.v1.appTableView.create,bitable.v1.appTableView.patch,bitable.v1.appTableField.list"');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

export { createMcpScript, createMcpConfig };