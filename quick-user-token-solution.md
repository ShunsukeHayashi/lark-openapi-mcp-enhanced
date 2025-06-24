# ⚡ 緊急解決策: User Access Token 問題

## 🚨 現在の問題

**エラー**: "アクセストークンがない"  
**原因**: Base操作にはUser Access Tokenが必要  
**現状**: Tenant Access Tokenのみでは権限不足

## 🎯 最速解決方法

### Step 1: Lark開発者コンソールでUser Token取得

1. **[開発者コンソール](https://open.feishu.cn)** にアクセス
2. **App ID**: `cli_a8d2fdb1f1f8d02d` を選択
3. **「開発とテスト」** → **「API Explorer」** をクリック
4. **「User Access Token」** セクションを探す
5. **「Generate Token」** または **「トークン生成」** をクリック
6. 生成されたTokenをコピー

### Step 2: MCP設定を即座に更新

#### 一時的なテスト用設定
```bash
# User Tokenを使用してMCP起動
node dist/cli.js mcp \
  --app-id cli_a8d2fdb1f1f8d02d \
  --app-secret V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ \
  --user-access-token YOUR_USER_ACCESS_TOKEN \
  --mode stdio
```

#### config.json の緊急更新
```json
{
  "appId": "cli_a8d2fdb1f1f8d02d",
  "appSecret": "V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ",
  "userAccessToken": "u-YOUR_USER_ACCESS_TOKEN",
  "tokenMode": "user",
  "mode": "stdio"
}
```

### Step 3: Claude Desktop設定の更新

現在の設定を以下に変更：

```json
"lark-mcp": {
  "command": "node",
  "args": [
    "/Users/shunsukehayashi/Dev/lark/lark-openapi-mcp/dist/cli.js",
    "mcp",
    "--app-id", "cli_a8d2fdb1f1f8d02d",
    "--app-secret", "V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ",
    "--user-access-token", "YOUR_USER_ACCESS_TOKEN",
    "--mode", "stdio"
  ],
  "env": {}
}
```

## 🔧 権限確認が必要な場合

### 開発者コンソールでの権限追加

1. **「権限とスコープ」** タブ
2. **「OAuth権限設定」** セクション
3. 以下の権限を追加：
   ```
   ✅ bitable:app
   ✅ bitable:table  
   ✅ bitable:record
   ✅ im:message:send_as_bot
   ```
4. **「バージョン作成と公開」**

## 💡 代替案（User Token取得が困難な場合）

### Option A: 既存の有効なアプリを使用
```bash
# 既に動作しているアプリ認証情報に戻す
node dist/cli.js mcp \
  --app-id cli_a8d2e0082978902e \
  --app-secret SQkCdptYmzrNa3MIfwmN2f7V5BXR2Ghz \
  --mode stdio
```

### Option B: 組織管理者に権限確認
- アプリ利用許可の確認
- Base作成権限の付与
- ユーザー権限レベルの確認

## 🚀 動作確認テスト

User Access Token設定後、以下でテスト：

```
「User Access Token を使用してBase作成をテストしてください」
```

## 📋 User Access Token の特徴

### ✅ User Token の利点
- ユーザーレベルの完全権限
- Base作成・編集が可能
- 高度な操作に対応

### ⚠️ User Token の注意点
- 有効期限あり（通常7140秒）
- 定期的な更新が必要
- ユーザー認証が前提

### 🔄 Token管理
- **有効期限**: 約2時間
- **更新方法**: 開発者コンソールで再生成
- **自動化**: Refresh Tokenの利用

## 🎯 解決後の確認事項

1. **Base作成テスト** - 正常に動作するか
2. **権限スコープ** - 必要な権限が有効か
3. **Token有効期限** - 定期更新スケジュール
4. **エラーログ** - 問題の完全解決確認

---

⚡ **User Access Tokenの取得により、Base作成問題が即座に解決されます。開発者コンソールでのToken生成を最優先で実行してください。**