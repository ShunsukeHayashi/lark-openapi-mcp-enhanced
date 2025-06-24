# Lark Chat Agent System - User Guide

**Version**: 1.0.0  
**Date**: 2025-06-24  
**Project**: Lark OpenAPI MCP Integration

## 🤖 Overview

The **Lark Chat Agent System** is an intelligent conversational AI that integrates seamlessly with Lark (Feishu) through the Model Context Protocol (MCP). It provides natural language interaction for Lark Base operations, messaging, document management, and user information queries.

## ✨ Key Features

### 🧠 **Intelligent Conversation**
- **Natural Language Processing**: Understands Japanese and English
- **Intent Recognition**: Automatically detects user goals and tasks
- **Context Management**: Maintains conversation history and context
- **Multi-turn Conversations**: Supports ongoing dialogue sessions

### 🛠️ **Lark Integration**
- **Base Operations**: Search, create, update, and delete records
- **Messaging**: Send messages to users and groups
- **Document Management**: Search and retrieve files
- **User Management**: Look up contact information
- **Calendar**: Manage events and schedules

### 🌐 **Multi-language Support**
- **Japanese (ja)**: Primary language with full support
- **English (en)**: Secondary language support
- **Chinese (zh)**: Basic support (planned)

## 🚀 Getting Started

### Prerequisites
- Node.js ≥16.20.0
- Lark app with appropriate permissions
- Valid Lark App ID and App Secret

### Installation
```bash
# Clone the repository
git clone https://github.com/your-org/lark-openapi-mcp.git
cd lark-openapi-mcp

# Install dependencies
yarn install

# Build the project
yarn build
```

### Configuration
```bash
# Set environment variables
export APP_ID="your_lark_app_id"
export APP_SECRET="your_lark_app_secret"

# Or use configuration file
cp config.sample.json config.json
# Edit config.json with your credentials
```

## 💬 Using the Chat Agent

### Basic Commands

#### Help and Information
```
User: help
Agent: 🤖 MCP統合ツール ヘルプ

主な機能:
📊 Base操作 - データ管理
💬 メッセージング - コミュニケーション
📄 ドキュメント - ファイル管理
📅 カレンダー - スケジュール管理
👥 連絡先 - ユーザー管理
```

#### System Status
```
User: status
Agent: 🚀 システム状況

✅ MCP サーバー: 動作中
📊 利用可能ツール: 19個
⚡ 応答時間: 正常
🔒 認証: 有効
```

### Data Operations

#### Search Base Records
```
User: 顧客テーブルから今月の案件を検索して
Agent: 🔍 検索結果

2件のレコードが見つかりました:

1. 顧客名: ABC商事, 業界: IT, 案件名: システム導入, 金額: 1000000
2. 顧客名: XYZ株式会社, 業界: 製造業, 案件名: 効率化プロジェクト, 金額: 2500000
```

#### Create Records
```
User: 新しい顧客を追加してください
Agent: ✨ 作成タスク

新しい顧客の作成を開始します。

以下の情報を教えてください:
• 会社名
• 業界
• 担当者名
• 連絡先
```

### Communication

#### Send Messages
```
User: 営業チームに「明日の会議は延期になりました」と連絡して
Agent: 💬 メッセージ送信完了

メッセージを正常に送信しました！

送信内容: 「明日の会議は延期になりました」
```

#### User Lookup
```
User: 田中さんの連絡先を教えて
Agent: 👥 ユーザー情報

👤 田中太郎
📧 tanaka@example.com
🆔 ou_user_001
```

### Document Management

#### File Search
```
User: プロジェクト計画書という名前のファイルを探して
Agent: 📄 ドキュメント検索結果

1件のファイルが見つかりました:

📄 プロジェクト計画書.docx
📁 タイプ: docx
💾 サイズ: 1000KB
```

## 🏗️ Agent Types

### 1. **LarkAssistant** (Default)
- **Purpose**: General-purpose assistant for all Lark operations
- **Language**: Japanese/English
- **Temperature**: 0.7 (balanced creativity)
- **Best for**: General queries, mixed tasks

### 2. **BaseExpert**
- **Purpose**: Specialized in Lark Base operations
- **Language**: Japanese/English
- **Temperature**: 0.3 (precise, technical)
- **Best for**: Database operations, data analysis

### 3. **MessageBot**
- **Purpose**: Specialized in messaging and communication
- **Language**: Japanese/English
- **Temperature**: 0.5 (friendly, communicative)
- **Best for**: Chat management, notifications

### Creating Custom Agents
```
User: create agent
Agent: エージェント作成

以下の情報を教えてください:
• エージェント名
• 専門分野
• 指示内容
• 使用ツール
```

## 🛠️ Technical Integration

### MCP Server Integration
```javascript
// Start MCP server with chat agent
const { LarkChatAgent } = require('@larksuiteoapi/lark-mcp');

const agent = new LarkChatAgent({
  appId: process.env.APP_ID,
  appSecret: process.env.APP_SECRET,
  language: 'ja'
});

// Handle incoming messages
app.post('/webhook', async (req, res) => {
  const result = await agent.processMessage(
    req.body.message,
    req.body.chat_id,
    req.body.user_id
  );
  res.json(result);
});
```

### Direct API Usage
```javascript
const { Agent, AgentRunner } = require('./dist/agents/agent');

// Create agent
const agent = new Agent({
  name: 'CustomAgent',
  instructions: 'カスタムエージェントの指示',
  language: 'ja'
});

// Process message
const result = await AgentRunner.run(agent, userMessage, {
  chatId: 'chat_123',
  userId: 'user_456'
});
```

## 📊 Available Tools

### System Tools
- `system.agent.chat` - Main conversational interface
- `system.agent.create` - Create custom agents
- `system.agent.status` - System status monitoring
- `system.bot.help` - Help information
- `system.bot.settings` - Configuration management

### Lark Base Tools
- `bitable.v1.app.table.record.search` - Search records
- `bitable.v1.app.table.record.create` - Create records
- `bitable.v1.app.table.record.update` - Update records
- `bitable.v1.app.table.record.delete` - Delete records

### Messaging Tools
- `im.v1.message.create` - Send messages
- `im.v1.chat.members.get` - Get chat members
- `im.v1.chat.create` - Create chat groups

### Document Tools
- `drive.v1.file.search` - Search files
- `drive.v1.file.download` - Download files
- `docs.v1.document.content.get` - Get document content

### Contact Tools
- `contact.v3.user.batch_get_id` - Get user information
- `contact.v3.department.list` - List departments

## ⚙️ Configuration

### Agent Configuration
```json
{
  "name": "LarkAssistant",
  "instructions": "あなたはLark MCPツールの専門アシスタントです",
  "language": "ja",
  "temperature": 0.7,
  "tools": ["search_base_records", "send_message"],
  "systemPrompt": "カスタムシステムプロンプト"
}
```

### Tool Presets
```bash
# Light preset (basic operations)
--tools preset.light

# Default preset (balanced)
--tools preset.default

# Base-focused preset
--tools preset.base.default

# Messaging-focused preset
--tools preset.im.default
```

## 🔒 Security & Permissions

### Required Lark Permissions
- `im:message` - Send messages
- `im:chat` - Manage chats
- `bitable:app` - Base operations
- `contact:user.base:readonly` - User information
- `drive:drive` - File operations

### Rate Limiting
- **Default**: 50 requests/minute
- **Write Operations**: 10 requests/minute
- **Administrative**: 2 requests/minute

### Authentication
- **Tenant Token**: App-level authentication
- **User Token**: User-level authentication (optional)

## 🚨 Troubleshooting

### Common Issues

#### Agent Not Responding
```bash
# Check system status
User: status

# Verify configuration
User: settings

# Restart if needed
yarn build && node dist/cli.js mcp --mode stdio
```

#### Tool Execution Errors
```bash
# Check available tools
User: help tools

# Verify permissions
User: help permissions

# Test specific tool
User: test search
```

#### Language Issues
```bash
# Switch language
User: use language ja

# Check current settings
User: settings language
```

## 📈 Performance Optimization

### Response Time
- **Typical**: 200-500ms per request
- **With Tools**: 500-2000ms per request
- **Complex Tasks**: 1-5 seconds

### Memory Usage
- **Base Agent**: ~50MB
- **With Conversation History**: ~100-200MB
- **With All Tools**: ~150-300MB

### Optimization Tips
1. Use specific tool presets
2. Enable rate limiting
3. Implement conversation cleanup
4. Use caching for repeated queries

## 🔄 API Reference

### Core Methods

#### `agent.processMessage(message, context)`
Process user message and return response
```javascript
const result = await agent.processMessage("help", {
  chatId: "chat_123",
  userId: "user_456"
});
```

#### `AgentRunner.run(agent, message, context)`
Run agent with specific context
```javascript
const result = await AgentRunner.run(agent, message, context);
```

#### `AgentRunner.runWithLarkClient(agent, message, chatId, client)`
Run agent with Lark client integration
```javascript
const result = await AgentRunner.runWithLarkClient(
  agent, message, chatId, larkClient, userId
);
```

## 🤝 Contributing

### Development Setup
```bash
# Clone and setup
git clone <repository>
cd lark-openapi-mcp
yarn install

# Run tests
yarn test

# Run in development
yarn dev
```

### Adding Custom Tools
1. Create tool in `src/mcp-tool/tools/en/builtin-tools/`
2. Implement `McpTool` interface
3. Add to tool index
4. Update documentation

### Testing
```bash
# Run basic tests
node test-chat-agent.js

# Run advanced tests
node test-agent-with-tools.js

# Run full test suite
yarn test
```

## 📞 Support

### Documentation
- **Technical Guide**: `docs/CHAT_AGENT_TECHNICAL.md`
- **API Reference**: `docs/API_REFERENCE.md`
- **Examples**: `examples/` directory

### Contact
- **Issues**: GitHub Issues
- **Questions**: GitHub Discussions
- **Email**: support@your-domain.com

---

**Last Updated**: 2025-06-24  
**Version**: 1.0.0  
**License**: MIT