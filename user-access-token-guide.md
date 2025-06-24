# 🔐 Lark User Access Token 取得ガイド

## ⚠️ 問題の概要

**エラー**: "アクセストークンがない"  
**原因**: Base作成にはUser Access Tokenが必要な場合がある  
**現状**: Tenant Access Tokenのみ利用中

## 📊 Lark Token Types

### 1. Tenant Access Token (現在使用中)
```bash
✅ 取得済み: t-g2076ncjC5S7YKJMVNPPOWPL4I4CGKIHUPPLG2QP
✅ 用途: アプリレベルの操作
❌ 制限: 一部のBase操作で権限不足
```

### 2. User Access Token (必要)
```bash
🔄 要取得: ユーザー認証が必要
✅ 用途: ユーザーレベルの操作
✅ 機能: Base作成・編集の完全権限
```

## 🔧 User Access Token 取得方法

### Option 1: OAuth認証フロー（推奨）

#### Step 1: 認証URL作成
```
https://open.feishu.cn/open-apis/authen/v1/index?app_id=cli_a8d2fdb1f1f8d02d&redirect_uri=YOUR_REDIRECT_URI&scope=bitable:app&state=STATE
```

#### Step 2: ユーザー認証
1. 上記URLをブラウザで開く
2. Larkアカウントでログイン
3. アプリ権限を承認
4. 認証コードを取得

#### Step 3: Access Token交換
```bash
curl -X POST "https://open.larksuite.com/open-apis/authen/v1/access_token" \
     -H "Authorization: Bearer cli_a8d2fdb1f1f8d02d" \
     -H "Content-Type: application/json" \
     -d '{
       "grant_type": "authorization_code",
       "code": "AUTHORIZATION_CODE"
     }'
```

### Option 2: 手動取得（簡易版）

#### Lark開発者コンソールで取得
1. [開発者コンソール](https://open.feishu.cn) にログイン
2. App: `cli_a8d2fdb1f1f8d02d` を選択
3. **「開発とテスト」** → **「API Explorer」**
4. **「User Access Token」** を生成
5. トークンをコピー

## 🚀 MCP設定の更新

### config.json の更新
```json
{
  "appId": "cli_a8d2fdb1f1f8d02d",
  "appSecret": "V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ",
  "userAccessToken": "u-YOUR_USER_ACCESS_TOKEN",
  "language": "en",
  "domain": "https://open.feishu.cn",
  "tokenMode": "user",
  "mode": "stdio"
}
```

### MCP起動コマンド（User Token使用）
```bash
node dist/cli.js mcp \
  --app-id cli_a8d2fdb1f1f8d02d \
  --app-secret V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ \
  --user-access-token YOUR_USER_ACCESS_TOKEN \
  --mode stdio
```

### Claude Desktop設定更新
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

## 🔍 権限スコープ設定

### 必要なスコープ
User Access Token取得時に以下のスコープが必要：

```
✅ bitable:app - Base作成・管理
✅ bitable:table - テーブル操作
✅ bitable:record - レコード操作
```

### Lark開発者コンソールでの設定
1. **「権限とスコープ」** → **「OAuth権限設定」**
2. 以下のスコープを追加：
   ```
   bitable:app
   im:message:send_as_bot
   ```
3. **「バージョン作成と公開」**

## 🛠️ トラブルシューティング

### Case 1: "Redirect URI mismatch"
**解決策**: 
```
開発者コンソール → セキュリティ設定 → リダイレクトURI追加
例: http://localhost:3000/callback
```

### Case 2: "Insufficient scope"
**解決策**:
```
権限とスコープ → OAuth設定 → 必要スコープ追加
```

### Case 3: "User not authorized"
**解決策**:
```
1. アプリが組織内で利用可能か確認
2. ユーザーがアプリ使用権限を持っているか確認
```

## 🎯 代替解決策

### Option A: Tenant Token + 適切な権限
現在のTenant Tokenでも、適切な権限があれば動作する可能性：

```bash
# 権限確認
curl -H "Authorization: Bearer t-g2076ncjC5S7YKJMVNPPOWPL4I4CGKIHUPPLG2QP" \
     "https://open.feishu.cn/open-apis/bitable/v1/apps"
```

### Option B: 組織管理者による設定
組織の管理者に以下を依頼：
1. アプリの組織内利用許可
2. Base作成権限の付与
3. ユーザー権限の確認

## 📋 実行手順まとめ

### 今すぐ実行
1. **開発者コンソール**でUser Access Token取得
2. **MCP設定**にUser Tokenを追加
3. **権限スコープ**の確認・追加
4. **Claude Desktop**設定更新
5. **動作テスト**実行

### 簡易版手順
1. [開発者コンソール](https://open.feishu.cn) → App選択
2. **API Explorer** → **User Access Token生成**
3. 生成されたTokenをMCP設定に追加
4. Claude Desktop再起動

## ⚡ 緊急対応

Tenant Tokenで可能な限り試す：
```bash
# 現在のTokenでBase一覧取得テスト
curl -H "Authorization: Bearer t-g2076ncjC5S7YKJMVNPPOWPL4I4CGKIHUPPLG2QP" \
     "https://open.feishu.cn/open-apis/bitable/v1/apps"
```

---

🔐 **User Access Tokenの取得により、Base作成権限の問題が解決されます。まずは開発者コンソールでのToken生成から始めてください。**