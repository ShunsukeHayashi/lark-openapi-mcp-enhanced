# Lark MCP CLI Usage Guide

**バージョン**: 1.0.0  
**対象**: 開発者、システム管理者、パワーユーザー  
**最終更新**: 2025-06-24

## 🖥️ 概要

Lark OpenAPI MCP プロジェクトは、複数のCLI（コマンドライン）インターフェースを提供しています：

1. **MCP Server CLI** - Model Context Protocol サーバー
2. **Chat Agent CLI** - 対話型AIアシスタント
3. **Genesis CLI** - Lark Base アプリケーション生成
4. **Workspace Bot CLI** - Lark Webhookサーバー

## 🚀 インストールと基本セットアップ

### 前提条件
```bash
# Node.js バージョン確認
node --version  # >=16.20.0 が必要

# プロジェクトのクローンとセットアップ
git clone https://github.com/your-org/lark-openapi-mcp.git
cd lark-openapi-mcp
yarn install
yarn build
```

### 環境変数設定
```bash
# 必須環境変数
export APP_ID="cli_xxxxxxxxxxxxxxxxx"
export APP_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"

# オプション環境変数
export NODE_ENV="development"
export LOG_LEVEL="info"
```

## 🔧 1. MCP Server CLI

### 基本的な使用方法

#### stdio モード (AI tool 統合用)
```bash
# 基本的な起動
node dist/cli.js mcp --mode stdio

# 特定のツールプリセットで起動
node dist/cli.js mcp --mode stdio --tools preset.default

# カスタム設定で起動
node dist/cli.js mcp --mode stdio --tools preset.light --rate-limit-requests 100
```

#### SSE (Server-Sent Events) モード
```bash
# HTTP サーバーとして起動
node dist/cli.js mcp --mode sse --port 3000

# カスタムホストとポートで起動
node dist/cli.js mcp --mode sse --host 0.0.0.0 --port 8080

# HTTPS 対応
node dist/cli.js mcp --mode sse --port 443 --ssl-cert ./cert.pem --ssl-key ./key.pem
```

### 高度なオプション

#### レート制限設定
```bash
# デフォルトのレート制限
node dist/cli.js mcp --mode stdio --rate-limit-requests 50 --rate-limit-writes 10

# レート制限を無効化 (開発時のみ)
node dist/cli.js mcp --mode stdio --disable-rate-limit

# カスタムレート制限
node dist/cli.js mcp --mode stdio --rate-limit-requests 200 --rate-limit-writes 20
```

#### ツールプリセット
```bash
# 軽量プリセット (10ツール)
node dist/cli.js mcp --mode stdio --tools preset.light

# デフォルトプリセット (19ツール)
node dist/cli.js mcp --mode stdio --tools preset.default

# Base専用プリセット
node dist/cli.js mcp --mode stdio --tools preset.base.default

# メッセージング専用プリセット
node dist/cli.js mcp --mode stdio --tools preset.im.default

# 複数プリセットの組み合わせ
node dist/cli.js mcp --mode stdio --tools preset.base.default,preset.im.default
```

#### ログとデバッグ
```bash
# 詳細ログ出力
LOG_LEVEL=debug node dist/cli.js mcp --mode stdio

# JSON形式のログ
LOG_FORMAT=json node dist/cli.js mcp --mode stdio

# ログファイルに出力
node dist/cli.js mcp --mode stdio 2>&1 | tee mcp-server.log
```

### 設定ファイルの使用
```bash
# 設定ファイルから読み込み
node dist/cli.js mcp --mode stdio -c config.json

# config.json の例
cat > config.json << 'EOF'
{
  "appId": "cli_xxxxxxxxxxxxxxxxx",
  "appSecret": "xxxxxxxxxxxxxxxxxxxxxxxx",
  "mode": "stdio",
  "tools": ["preset.default"],
  "rateLimiting": {
    "enabled": true,
    "requestsPerMinute": 100,
    "writeRequestsPerMinute": 20
  }
}
EOF
```

## 🤖 2. Chat Agent CLI

### 直接実行
```bash
# 基本的な対話モード
node -e "
const { Agent, AgentRunner } = require('./dist/agents/agent');
const agent = new Agent({
  name: 'CLI Assistant',
  instructions: 'あなたはCLIアシスタントです',
  language: 'ja'
});

AgentRunner.run(agent, 'こんにちは', { chatId: 'cli_001' })
  .then(result => console.log('Response:', result.response));
"

# ワンライナーでの質問
node -e "
const { Agent, AgentRunner } = require('./dist/agents/agent');
const agent = new Agent({ name: 'Helper', instructions: 'Helper bot', language: 'ja' });
AgentRunner.run(agent, process.argv[1], { chatId: 'cli' })
  .then(r => console.log(r.response));
" "Lark Baseの使い方を教えて"
```

### インタラクティブモード
```bash
# インタラクティブChat Agent起動
node -e "
const readline = require('readline');
const { Agent, AgentRunner } = require('./dist/agents/agent');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const agent = new Agent({
  name: 'CLI Agent',
  instructions: 'あなたはLark MCP CLIアシスタントです',
  language: 'ja'
});

console.log('🤖 Chat Agent CLI モード (exit で終了)');
console.log('');

const chat = () => {
  rl.question('あなた: ', async (input) => {
    if (input.toLowerCase() === 'exit') {
      rl.close();
      return;
    }
    
    try {
      const result = await AgentRunner.run(agent, input, { chatId: 'cli_interactive' });
      console.log('Agent:', result.response);
      console.log('');
    } catch (error) {
      console.error('Error:', error.message);
    }
    
    chat();
  });
};

chat();
"
```

### スクリプトファイルでの使用
```bash
# chat-cli.js を作成
cat > chat-cli.js << 'EOF'
#!/usr/bin/env node

const { Agent, AgentRunner } = require('./dist/agents/agent');
const readline = require('readline');

async function main() {
  const agent = new Agent({
    name: 'CLI Assistant',
    instructions: 'あなたはLark MCPのCLIアシスタントです。ユーザーの質問に日本語で親切に答えてください。',
    language: 'ja',
    temperature: 0.7
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('🤖 Lark MCP Chat Agent CLI');
  console.log('📝 "help" でヘルプ、"exit" で終了');
  console.log('');

  const chat = () => {
    rl.question('💬 ', async (input) => {
      if (input.toLowerCase() === 'exit') {
        console.log('👋 さようなら！');
        rl.close();
        return;
      }

      try {
        const result = await AgentRunner.run(agent, input, {
          chatId: 'cli_session',
          conversationId: 'cli_conv_001'
        });

        console.log('🤖', result.response);
        
        if (result.toolCalls && result.toolCalls.length > 0) {
          console.log('🛠️ 実行されたツール:', result.toolCalls.map(t => t.name).join(', '));
        }
        
        console.log('');
      } catch (error) {
        console.error('❌ エラー:', error.message);
      }

      chat();
    });
  };

  chat();
}

main().catch(console.error);
EOF

chmod +x chat-cli.js

# 実行
./chat-cli.js
```

## 🏗️ 3. Genesis CLI

### Lark Base アプリケーション生成
```bash
# 要件ファイルから生成
node dist/genesis/cli/genesis-cli.js generate -r requirements.md -o output.json

# インタラクティブモード
node dist/genesis/cli/genesis-cli.js generate -i

# 特定のテンプレートを使用
node dist/genesis/cli/genesis-cli.js generate -t crm -o crm-base.json

# 詳細ログ付きで実行
node dist/genesis/cli/genesis-cli.js generate -r requirements.md -v

# テンプレート一覧表示
node dist/genesis/cli/genesis-cli.js templates

# ヘルプ表示
node dist/genesis/cli/genesis-cli.js --help
```

### 要件ファイルの例
```bash
# requirements.md を作成
cat > requirements.md << 'EOF'
# CRM システム要件

## 概要
営業チーム向けの顧客管理システム

## 機能要件
- 顧客情報管理
- 案件管理
- 活動履歴記録
- 売上予測

## データ構造
### 顧客テーブル
- 会社名 (必須)
- 業界
- 担当者名
- 連絡先

### 案件テーブル
- 案件名 (必須)
- 顧客ID (リンク)
- 金額
- 進捗状況
- 完了予定日
EOF

# 生成実行
node dist/genesis/cli/genesis-cli.js generate -r requirements.md -o crm-output.json
```

## 🌐 4. Workspace Bot CLI

### 開発モード
```bash
# 開発環境でWebhookサーバー起動
yarn bot:dev

# または
NODE_ENV=development node deploy-lark-workspace-bot.js

# カスタムポートで起動
PORT=8080 yarn bot:dev
```

### 本番モード
```bash
# 本番環境で起動
yarn bot:prod

# PM2 で起動
pm2 start deploy-lark-workspace-bot.js --name lark-bot

# systemd サービスとして起動
sudo systemctl start lark-workspace-bot
```

### デバッグモード
```bash
# 詳細ログ付きで起動
DEBUG=* yarn bot:dev

# 特定のログレベル
LOG_LEVEL=debug yarn bot:dev

# テスト無効で起動
RUN_TESTS=false yarn bot:dev
```

## 🧪 5. テスト・診断CLI

### Chat Agent テスト
```bash
# 基本テスト実行
yarn test:agent

# 高度なツール統合テスト
yarn test:agent-tools

# ワークスペース統合テスト
yarn test:integration

# カスタムメッセージでテスト
node -e "
const { testChatAgent } = require('./test-chat-agent');
testChatAgent().then(() => console.log('Test completed'));
"
```

### システム診断
```bash
# ヘルスチェック
curl http://localhost:3000/health

# システム情報取得
curl http://localhost:3000/info

# メトリクス取得
curl http://localhost:3000/metrics

# MCP ツール一覧確認
node -e "
const tools = require('./dist/mcp-tool/tools/en/builtin-tools/system/builtin');
console.log('Available tools:', tools.systemBuiltinTools.length);
tools.systemBuiltinTools.forEach(t => console.log('-', t.name));
"
```

## 📊 6. ログとモニタリング

### ログ監視
```bash
# リアルタイムログ (systemd)
sudo journalctl -u lark-workspace-bot -f

# PM2 ログ
pm2 logs lark-bot

# ファイルログ監視
tail -f lark-bot.log

# エラーログのみ
sudo journalctl -u lark-workspace-bot -p err
```

### パフォーマンス監視
```bash
# プロセス監視
ps aux | grep node

# メモリ使用量
node -e "console.log('Memory:', Math.round(process.memoryUsage().heapUsed / 1024 / 1024), 'MB')"

# CPU 使用率 (top)
top -p $(pgrep -f deploy-lark-workspace-bot)
```

## 🛠️ 7. よく使用される CLI コマンド集

### 日常運用
```bash
# システム起動チェック
curl -s http://localhost:3000/health | jq '.'

# Chat Agent 動作確認
echo "こんにちは" | node -e "
const { Agent, AgentRunner } = require('./dist/agents/agent');
const agent = new Agent({name: 'Test', instructions: 'Test agent', language: 'ja'});
process.stdin.on('data', async (data) => {
  const result = await AgentRunner.run(agent, data.toString().trim(), {chatId: 'test'});
  console.log(result.response);
  process.exit(0);
});
"

# 統合テスト実行
yarn test:integration && echo "✅ 統合テスト成功" || echo "❌ 統合テスト失敗"
```

### デバッグ
```bash
# 詳細デバッグログ
DEBUG=lark:* LOG_LEVEL=debug yarn bot:dev

# メモリリーク検出
node --inspect deploy-lark-workspace-bot.js

# プロファイリング
node --prof deploy-lark-workspace-bot.js
```

### メンテナンス
```bash
# 依存関係更新
yarn upgrade

# ビルド再実行
yarn build

# キャッシュクリア
yarn cache clean

# 設定ファイル検証
node -e "console.log(JSON.parse(require('fs').readFileSync('.env.production', 'utf8')))"
```

## 🔧 8. トラブルシューティング

### よくある問題と解決方法

#### 1. ポートが既に使用中
```bash
# ポート使用状況確認
sudo lsof -i :3000

# プロセス終了
sudo kill -9 $(sudo lsof -t -i:3000)

# 別のポートで起動
PORT=3001 yarn bot:dev
```

#### 2. 環境変数が設定されていない
```bash
# 環境変数確認
echo "APP_ID: $APP_ID"
echo "APP_SECRET: ${APP_SECRET:0:10}..."

# .env ファイルから読み込み
set -a && source .env.production && set +a
```

#### 3. Lark API 接続エラー
```bash
# API 接続テスト
curl -X POST "https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal" \
  -H "Content-Type: application/json" \
  -d '{
    "app_id": "'$APP_ID'",
    "app_secret": "'$APP_SECRET'"
  }'
```

#### 4. Chat Agent 応答しない
```bash
# Agent 設定確認
node -e "
const { Agent } = require('./dist/agents/agent');
const agent = new Agent({name: 'Test', instructions: 'Test', language: 'ja'});
console.log('Agent created:', agent.name);
console.log('Tools available:', agent.tools.size);
"

# ツール実行テスト
yarn test:agent-tools
```

## 📋 9. CLI スクリプト例

### 一括処理スクリプト
```bash
#!/bin/bash
# bulk-operations.sh

set -e

echo "🚀 Lark MCP 一括処理開始"

# 1. システムヘルスチェック
echo "📊 ヘルスチェック実行中..."
if curl -s http://localhost:3000/health > /dev/null; then
  echo "✅ システム正常"
else
  echo "❌ システム異常 - 処理を中断"
  exit 1
fi

# 2. テスト実行
echo "🧪 テスト実行中..."
yarn test:agent > /dev/null && echo "✅ Agentテスト成功" || echo "❌ Agentテスト失敗"
yarn test:integration > /dev/null && echo "✅ 統合テスト成功" || echo "❌ 統合テスト失敗"

# 3. ログローテーション
echo "📝 ログローテーション実行中..."
if [ -f "lark-bot.log" ]; then
  mv lark-bot.log "lark-bot-$(date +%Y%m%d).log"
  echo "✅ ログローテーション完了"
fi

echo "🎉 一括処理完了"
```

### モニタリングスクリプト
```bash
#!/bin/bash
# monitor.sh

while true; do
  HEALTH=$(curl -s http://localhost:3000/health | jq -r '.status' 2>/dev/null || echo "error")
  MEMORY=$(curl -s http://localhost:3000/health | jq -r '.memory.used' 2>/dev/null || echo "unknown")
  
  echo "$(date): Status=$HEALTH, Memory=${MEMORY}MB"
  
  if [ "$HEALTH" != "healthy" ]; then
    echo "⚠️ システム異常検出"
    # アラート処理 (メール送信など)
  fi
  
  sleep 60
done
```

## 🎯 10. 実用的な使用例

### 日常的なワークフロー
```bash
# 1. 朝のシステムチェック
curl -s http://localhost:3000/health && echo "✅ System OK"

# 2. Chat Agent でタスク確認
echo "今日のタスクを教えて" | node chat-cli.js

# 3. Base データチェック
yarn test:integration

# 4. ログ確認
tail -n 50 lark-bot.log | grep ERROR
```

### 開発時のワークフロー
```bash
# 1. 開発環境起動
yarn bot:dev &

# 2. 変更をテスト
yarn test:agent

# 3. 統合テスト
yarn test:integration

# 4. ビルドと本番テスト
yarn build && yarn bot:prod
```

---

**📞 サポート**: 問題が発生した場合は、`docs/CHAT_AGENT_GUIDE.md` のトラブルシューティングセクションを参照してください。

**🎉 CLI マスターになりました！これらのコマンドでLark MCPシステムを効率的に運用できます。**