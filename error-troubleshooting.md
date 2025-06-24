# 🔧 Base作成エラー トラブルシューティング

## ✅ 確認済み状況
- **認証**: App ID/Secret は正常 ✅
- **トークン取得**: 成功 ✅
- **MCPサーバー**: 起動可能 ✅

## 🚨 よくあるエラーと解決策

### 1. Permission Denied
```
エラー: "Permission denied" または "insufficient_scope"
```
**解決策**: Base作成権限を追加

```json
{
  "scopes": {
    "tenant": [
      "bitable:app"
    ],
    "user": []
  }
}
```

### 2. User Access Token Required
```
エラー: "User access token required for this operation"
```
**解決策**: ユーザートークンでMCP起動

```bash
# 1. ユーザートークンを取得（手動）
# 2. ユーザートークンでMCP起動
node dist/cli.js mcp \
  --app-id cli_a8d2e0082978902e \
  --app-secret SQkCdptYmzrNa3MIfwmN2f7V5BXR2Ghz \
  --user-access-token YOUR_USER_TOKEN \
  --mode stdio
```

### 3. Base Creation Failed
```
エラー: "Failed to create bitable"
```
**解決策**: 権限スコープの確認と追加

### 4. Claude Desktop Connection Error
```
エラー: MCP server not responding
```
**解決策**: Claude Desktop設定確認

## 🔍 エラー詳細確認方法

### デバッグモードで起動
```bash
node dist/cli.js mcp \
  --app-id cli_a8d2e0082978902e \
  --app-secret SQkCdptYmzrNa3MIfwmN2f7V5BXR2Ghz \
  --mode stdio 2>&1 | tee debug.log
```

### 権限確認
1. [Lark開発者コンソール](https://open.feishu.cn)を開く
2. アプリ選択 → **権限とスコープ**
3. 現在の権限を確認
4. `bitable:app` があるか確認

## 🚀 解決ステップ

### Step 1: 権限追加
```json
{
  "scopes": {
    "tenant": [
      "bitable:app",
      "im:message:send_as_bot"
    ],
    "user": []
  }
}
```

### Step 2: バージョン公開
1. **バージョン作成** → **公開申請** → **承認**
2. 権限反映まで5-10分待機

### Step 3: MCP再起動
```bash
# Claude Desktopを再起動
# または
node dist/cli.js mcp --app-id cli_a8d2e0082978902e --app-secret SQkCdptYmzrNa3MIfwmN2f7V5BXR2Ghz --mode stdio
```

### Step 4: テスト実行
```
「Lark MCPの接続状態を確認してください」
```

## 📞 サポート情報

**エラーの詳細を教えてください：**
1. どのタイミングでエラーが発生？
2. エラーメッセージの内容は？
3. Claude Desktopの🔧アイコンは表示されている？

この情報があれば具体的な解決策を提案できます！

## 🔗 参考リンク
- [権限設定ガイド](./base-permissions-final.md)
- [設定ファイル](./config.json)
- [Claude Desktop設定](../../../Library/Application Support/Claude/claude_desktop_config.json)