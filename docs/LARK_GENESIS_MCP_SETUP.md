# Lark Genesis MCP Server セットアップガイド

## 🚀 概要

Lark Genesis MCP Serverは、自然言語からLark Baseアプリケーションを生成する革新的なツールです。Claude DesktopのMCPサーバーとして統合できます。

## 📋 前提条件

- Node.js >=16.20.0
- Larkアプリの認証情報（App ID、App Secret）
- Claude Desktop（MCP対応版）

## ⚙️ セットアップ手順

### 1. プロジェクトのビルド

```bash
cd /Users/shunsuke/Dev/lark-openapi-mcp-enhanced
yarn install
yarn build
```

### 2. 環境変数の設定

`.env`ファイルを作成:
```bash
# Lark App認証情報
APP_ID=cli_your_app_id_here
APP_SECRET=your_app_secret_here

# オプション: ユーザーアクセストークン
USER_ACCESS_TOKEN=your_user_token_here

# サーバー設定
PORT=3000
HOST=localhost
```

### 3. Claude Desktop設定ファイルの更新

Claude Desktopの設定ファイルに以下を追加:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "streamable-mcp-server": {
      "type": "streamable-http", 
      "url": "http://127.0.0.1:12306/mcp"
    },
    "lark-genesis": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/lark-openapi-mcp-enhanced/dist/cli.js",
        "mcp",
        "--mode", "stdio",
        "--tools", "preset.genesis.default"
      ],
      "env": {
        "APP_ID": "cli_your_app_id_here",
        "APP_SECRET": "your_app_secret_here"
      }
    }
  }
}
```

### 4. SSEモード（推奨）を使用する場合

SSEサーバーを起動:
```bash
yarn build && node dist/cli.js mcp --mode sse --port 3000
```

Claude Desktop設定:
```json
{
  "mcpServers": {
    "streamable-mcp-server": {
      "type": "streamable-http",
      "url": "http://127.0.0.1:12306/mcp"
    },
    "lark-genesis-sse": {
      "type": "sse",
      "url": "http://localhost:3000/sse"
    }
  }
}
```

## 🛠️ 利用可能なツールプリセット

### Genesis Tools (preset.genesis.default)

1. **genesis.builtin.create_base** - AI-powered Lark Base creation
2. **genesis.builtin.analyze_requirements** - Requirements analysis
3. **genesis.builtin.generate_er_diagram** - ER diagram generation
4. **genesis.builtin.optimize_base** - Base structure optimization
5. **genesis.builtin.create_view** - Custom view creation
6. **genesis.builtin.create_dashboard** - Dashboard generation
7. **genesis.builtin.create_automation** - Workflow automation
8. **genesis.builtin.create_filter_view** - Filter view creation
9. **genesis.builtin.list_templates** - Available templates
10. **base.v1.app.table.record.create** - Record creation
11. **base.v1.app.table.record.get** - Record retrieval

### その他のプリセット

- `preset.light` - 軽量版（10ツール）
- `preset.default` - 標準版（19ツール）
- `preset.base.default` - Base操作特化（7ツール）
- `preset.im.default` - メッセージング特化（5ツール）

## 💡 使用例

Claude Desktopで以下のように指示できます：

### Lark Base生成
```
「顧客管理システムのLark Baseを作成してください。顧客情報、連絡履歴、商談管理ができるようにしたいです。」
```

### 要件分析
```
「ECサイトの受注管理システムの要件を分析して、必要なテーブル構造を提案してください。」
```

### テンプレート確認
```
「利用可能なLark Baseテンプレートを教えてください。」
```

### ER図生成
```
「プロジェクト管理システムのER図を生成してください。プロジェクト、タスク、メンバーの関係性を含めてください。」
```

## 🔧 高度な設定

### 1. レート制限の調整

```bash
node dist/cli.js mcp --mode stdio --rate-limit-requests 100 --rate-limit-writes 20
```

### 2. 特定ツールのみ使用

```bash
node dist/cli.js mcp --mode stdio --tools genesis.builtin.create_base,genesis.builtin.analyze_requirements
```

### 3. 設定ファイル使用

`config.json`を作成:
```json
{
  "appId": "cli_your_app_id",
  "appSecret": "your_app_secret",
  "rateLimiting": {
    "enabled": true,
    "rateLimits": {
      "default": { "capacity": 100, "tokensPerInterval": 50, "intervalMs": 60000 }
    }
  }
}
```

実行:
```bash
node dist/cli.js mcp --mode stdio -c config.json
```

## 🐳 Dockerを使用する場合

### ビルド
```bash
./scripts/docker-build.sh production
```

### 実行
```bash
docker run -it --rm --env-file .env \
  -p 3000:3000 \
  lark-mcp:latest \
  node dist/cli.js mcp --mode sse --host 0.0.0.0
```

Claude Desktop設定:
```json
{
  "mcpServers": {
    "lark-genesis-docker": {
      "type": "sse",
      "url": "http://localhost:3000/sse"
    }
  }
}
```

## 🔍 トラブルシューティング

### 1. 接続エラー
- App IDとApp Secretが正しいか確認
- Larkアプリが有効になっているか確認
- ネットワーク接続を確認

### 2. 権限エラー
必要な権限がLarkアプリに付与されているか確認:
- `bitable:app` - Base操作
- `im:message` - メッセージング
- `contact:user.id:readonly` - ユーザー情報

### 3. ツールが表示されない
- プリセット名が正しいか確認
- ビルドが成功しているか確認
- Claude Desktopを再起動

### 4. パフォーマンス問題
- レート制限を調整
- SSEモードを使用
- 不要なツールを除外

## 📚 関連ドキュメント

- [Genesis System Overview](./docs/GENESIS_VIDEO_TUTORIAL.md)
- [Security Guide](./docs/SECURITY_GUIDE.md)
- [Integration Guide](./docs/INTEGRATION_GUIDE.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)

## 🎯 サポート

問題が発生した場合:
1. ログを確認（`yarn dev`で詳細ログ表示）
2. [GitHub Issues](https://github.com/ShunsukeHayashi/lark-openapi-mcp-enhanced/issues)で報告
3. ドキュメントを参照

これで、Claude DesktopからLark Genesisの強力なAI機能を直接利用できます！