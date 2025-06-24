# 🚨 Lark MCP Error Handling Guide

## 🔧 Common Errors & Solutions

### 1. Base Creation Errors

#### Error: "Permission denied"
```
原因: bitable:app 権限が不足
解決策:
1. Lark開発者コンソール → 権限とスコープ
2. 以下をインポート:
{
  "scopes": {
    "tenant": ["bitable:app", "im:message:send_as_bot"],
    "user": []
  }
}
3. バージョン作成 → 公開
```

#### Error: "User access token required"
```
原因: Base作成にユーザー認証が必要
解決策:
1. ユーザートークン取得
2. MCPサーバー再起動:
   node dist/cli.js mcp \
     --app-id cli_a8d2e0082978902e \
     --app-secret SQkCdptYmzrNa3MIfwmN2f7V5BXR2Ghz \
     --user-access-token YOUR_USER_TOKEN \
     --mode stdio
```

#### Error: "Table creation failed"
```
原因: フィールド設定やリレーション設定エラー
解決策:
1. 段階的作成に切り替え
2. まず基本テーブルのみ作成
3. 後からフィールドとリレーション追加
```

### 2. MCP Connection Errors

#### Error: "MCP server not responding"
```
診断手順:
1. プロセス確認: ps aux | grep mcp
2. ポート確認: lsof -i :3000
3. ログ確認: tail -f debug.log

解決策:
1. MCPサーバー再起動
2. Claude Desktop再起動
3. 設定ファイル確認
```

#### Error: "Unknown tool or command"
```
原因: MCP toolsが正しく登録されていない
解決策:
1. Claude Desktop設定確認:
   ~/.../Claude/claude_desktop_config.json
2. lark-mcp セクションの確認
3. 設定修正後、Claude Desktop再起動
```

### 3. Authentication Errors

#### Error: "Invalid app_id or app_secret"
```
確認手順:
1. config.json の認証情報確認
2. 手動認証テスト:
   curl -H "Content-Type: application/json" \
        -d '{"app_id":"cli_a8d2e0082978902e","app_secret":"SQkCdptYmzrNa3MIfwmN2f7V5BXR2Ghz"}' \
        https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal

解決策:
1. 新しいApp Secret生成
2. config.json更新
3. MCPサーバー再起動
```

### 4. Field Type Errors

#### Error: "Invalid field type or configuration"
```
対応フィールドタイプ:
✅ テキスト (text)
✅ 数値 (number) 
✅ 日付 (datetime)
✅ 単一選択 (single_select)
✅ リンク (link)
✅ ロールアップ (rollup)
✅ 自動採番 (auto_number)

エラー回避:
1. サポートされているタイプのみ使用
2. リンクフィールドは対象テーブル作成後に設定
3. ロールアップは最後に設定
```

## 🔄 Error Recovery Workflow

### Step 1: Diagnosis
```bash
# MCP status check
ps aux | grep -E "(mcp|lark)"

# Authentication test
curl -s "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal" \
     -H "Content-Type: application/json" \
     -d '{"app_id":"cli_a8d2e0082978902e","app_secret":"SQkCdptYmzrNa3MIfwmN2f7V5BXR2Ghz"}'

# Permission check
# → Lark Developer Console
```

### Step 2: Basic Recovery
```bash
# Restart MCP server
pkill -f "lark-openapi-mcp"
cd /Users/shunsukehayashi/Dev/lark/lark-openapi-mcp
./run-mcp.sh

# Restart Claude Desktop
# → Claude Desktop → Restart
```

### Step 3: Fallback Options

#### Option A: Simplified Creation
```
「基本的なBaseを作成してください。テーブル名: TestCRM」
```

#### Option B: Manual Step-by-step
```
「Productsテーブルのみ作成してください:
- プロダクト名 (テキスト)
- 価格 (数値)
- プロダクトタイプ (単一選択)」
```

#### Option C: Use Alternative MCP Server
```bash
# Specialized Base MCP server
npm install -g @lark-base-open/mcp-node-server
lark-base-mcp-node-server --help
```

## 🚨 Emergency Commands

### Quick MCP Restart
```bash
cd /Users/shunsukehayashi/Dev/lark/lark-openapi-mcp && ./run-mcp.sh
```

### Permission Quick Fix
```json
{
  "scopes": {
    "tenant": ["bitable:app"],
    "user": []
  }
}
```

### Minimal Test Command
```
「MCPツールの接続をテストしてください」
```

## 📞 Support Information

**エラー報告時に含める情報:**
1. エラーメッセージの全文
2. 実行したコマンド
3. 発生タイミング
4. MCP server status (running/stopped)
5. 権限設定状況

**ログファイル位置:**
- MCP logs: `/tmp/lark-mcp.log`
- Claude Desktop logs: `~/Library/Logs/Claude/`

## 🎯 Success Indicators

正常動作時の確認項目:
- ✅ Claude Desktop に 🔧 アイコン表示
- ✅ "lark-mcp" がavailable tools に表示
- ✅ 認証トークン取得成功
- ✅ Base作成コマンドが実行開始

エラーハンドリング準備完了！問題発生時はこのガイドを参照してください。