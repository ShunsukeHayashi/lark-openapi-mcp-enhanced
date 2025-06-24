# 🚀 Lark Base Implementation Guide

## Overview
Baseの実装には2つのアプローチがあります：現在のlark-openapi-mcpツールの使用と、専用のLark Base MCP serverの使用です。

## 🔧 Setup Options

### Option 1: Current lark-openapi-mcp (Recommended)
あなたの既存セットアップを使用：

```bash
# 既にインストール済みのツールを使用
cd /Users/shunsukehayashi/Dev/lark/lark-openapi-mcp
./run-mcp.sh
```

**利点：**
- 統一された認証（app-id + app-secret）
- 48+ Base関連ツール
- 他のLark機能との統合

### Option 2: Specialized Lark Base MCP Server
Base専用の最適化されたサーバー：

```bash
# インストール済み
npm install -g @lark-base-open/mcp-node-server

# 使用方法
lark-base-mcp-node-server \
  --personal-base-token="YOUR_PERSONAL_BASE_TOKEN" \
  --app-token="YOUR_APP_TOKEN"
```

**利点：**
- Base専用の13ツール
- 最適化されたパフォーマンス
- シンプルなAPI

## 🎯 Hybrid Configuration for Claude Desktop

Claude Desktopで両方を使用する設定：

```json
{
  "mcpServers": {
    "lark-comprehensive": {
      "command": "node",
      "args": [
        "/Users/shunsukehayashi/Dev/lark/lark-openapi-mcp/dist/cli.js",
        "mcp",
        "--app-id", "cli_a8d2e0082978902e",
        "--app-secret", "SQkCdptYmzrNa3MIfwmN2f7V5BXR2Ghz",
        "--mode", "stdio"
      ],
      "env": {}
    },
    "lark-base-specialized": {
      "command": "npx",
      "args": [
        "-y", "@lark-base-open/mcp-node-server",
        "--personal-base-token", "NEED_TO_OBTAIN",
        "--app-token", "NEED_TO_OBTAIN"
      ],
      "env": {}
    }
  }
}
```

## 📝 Required Tokens for Base MCP Server

**Personal Base Token の取得方法：**
1. Feishu/Larkアプリを開く
2. Baseアプリに移動
3. プラグイン → 開発者ツール
4. Personal Base Tokenを生成

**App Token の取得方法：**
1. Baseアプリで拡張機能メニューを開く
2. 開発者ツール → 設定
3. App Tokenをコピー

## 🔐 Current Permissions Status

あなたのアプリは既に以下の重要なBase権限を持っています：

```yaml
Base Operations:
  ✅ bitable:app:readonly    # Base読み取り
  ✅ bitable:app            # Base作成・管理
  ✅ bitable:table:readonly # テーブル読み取り
  ✅ bitable:table          # テーブル管理
  ✅ bitable:record:readonly # レコード読み取り
  ✅ bitable:record         # レコード管理
  ✅ bitable:field:readonly # フィールド読み取り

Supporting Permissions:
  ✅ im:message:send_as_bot # Bot通知
  ✅ docx:document          # ドキュメント生成
  ✅ contact:user.base:readonly # ユーザー情報
```

## 🚀 Quick Test Commands

### 基本的なBaseテスト
```
「新しいBase '顧客管理' を作成して、顧客情報のテーブルを追加してください」
```

### CRM Base作成
```
「CRM用のBaseを作成してください。顧客テーブル、案件テーブル、活動記録テーブルを含めてください」
```

### データ入力テスト
```
「顧客管理Baseに新しい顧客レコードを追加してください。会社名：Example Corp、担当者：田中太郎」
```

## 🔧 Troubleshooting

### よくある問題
1. **Permission denied**: アプリが公開されているか確認
2. **Token invalid**: App SecretとApp IDが正しいか確認
3. **Base creation failed**: ユーザートークンが必要な場合があります

### デバッグモード
```bash
# デバッグ情報付きで実行
cd /Users/shunsukehayashi/Dev/lark/lark-openapi-mcp
node dist/cli.js mcp --app-id cli_a8d2e0082978902e --app-secret SQkCdptYmzrNa3MIfwmN2f7V5BXR2Ghz --debug
```

## 📚 Next Steps

1. **現在のセットアップでテスト** - 既存のツールでBase操作を確認
2. **Specialized serverの評価** - 必要に応じて専用サーバーを追加
3. **プロンプトチェーンの実装** - 自動CRM作成ワークフロー
4. **ドキュメント統合** - Base データからレポート生成

---

✨ **準備完了！** Claude Desktopを再起動して、Baseの作成・管理を開始できます。