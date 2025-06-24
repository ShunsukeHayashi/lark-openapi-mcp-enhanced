# 🌐 Lark API Domain 修正ガイド

## ✅ Domain確認結果

**正しいドメイン**: `https://open.larksuite.com`  
**User Token**: ✅ 正常動作確認済み  
**Base API**: 🔄 エンドポイント要確認

## 🔧 修正済み設定

### Updated config.json
```json
{
  "appId": "cli_a8d2fdb1f1f8d02d",
  "appSecret": "V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ",
  "userAccessToken": "u-feLBF4cHZbUqy4aO.uPPoRY05516542roO0w407w22ZI",
  "language": "en",
  "domain": "https://open.larksuite.com",
  "tokenMode": "user",
  "mode": "stdio"
}
```

### 正しいMCP起動コマンド
```bash
node dist/cli.js mcp \
  --app-id cli_a8d2fdb1f1f8d02d \
  --app-secret V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ \
  --user-access-token u-feLBF4cHZbUqy4aO.uPPoRY05516542roO0w407w22ZI \
  --domain https://open.larksuite.com \
  --mode stdio
```

## 🌍 Domain違いの説明

### Feishu vs LarkSuite
| Service | Domain | Region |
|---------|--------|--------|
| **Feishu** (飞书) | `https://open.feishu.cn` | 中国版 |
| **LarkSuite** | `https://open.larksuite.com` | 国際版 |

### API エンドポイント確認
```bash
# User Info API (✅ 動作確認済み)
https://open.larksuite.com/open-apis/authen/v1/user_info

# Base API (要確認)
https://open.larksuite.com/open-apis/bitable/v1/apps
```

## 🔍 Base API エンドポイント調査

### 可能な正しいエンドポイント
1. `https://open.larksuite.com/open-apis/bitable/v1/apps`
2. `https://open.larksuite.com/open-apis/base/v1/apps` 
3. `https://open.larksuite.com/open-apis/sheets/v1/spreadsheets`

### API ドキュメント確認
[LarkSuite API Documentation](https://open.larksuite.com/document/)で正確なエンドポイントを確認

## 🚀 Updated Claude Desktop設定

```json
"lark-mcp": {
  "command": "node",
  "args": [
    "/Users/shunsukehayashi/Dev/lark/lark-openapi-mcp/dist/cli.js",
    "mcp",
    "--app-id", "cli_a8d2fdb1f1f8d02d",
    "--app-secret", "V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ",
    "--user-access-token", "u-feLBF4cHZbUqy4aO.uPPoRY05516542roO0w407w22ZI",
    "--domain", "https://open.larksuite.com",
    "--mode", "stdio"
  ],
  "env": {}
}
```

## 📊 動作確認状況

| API | Status | Details |
|-----|--------|---------|
| **User Info** | ✅ 正常 | Token有効、ユーザー情報取得成功 |
| **Base Apps** | ❌ 404 | エンドポイント要確認 |
| **Authentication** | ✅ 正常 | User Access Token動作中 |

## 🔧 Next Steps

### 1. Base API エンドポイント特定
```bash
# Test different endpoints
curl -H "Authorization: Bearer u-feLBF4cHZbUqy4aO.uPPoRY05516542roO0w407w22ZI" \
     "https://open.larksuite.com/open-apis/base/v1/apps"
```

### 2. API Documentation確認
- LarkSuite公式ドキュメントでBase API確認
- 正確なエンドポイントとパラメータ取得

### 3. MCP Tool更新
- 正しいドメインとエンドポイントでMCP更新
- Enhanced Agent設定修正

## ⚡ 緊急対応

### 動作するドメインでテスト
User Tokenが正常に動作するため、正しいBase APIエンドポイントを特定すれば解決：

```bash
# MCP restart with correct domain
pkill -f "lark-openapi-mcp"
node dist/cli.js mcp \
  --app-id cli_a8d2fdb1f1f8d02d \
  --app-secret V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ \
  --user-access-token u-feLBF4cHZbUqy4aO.uPPoRY05516542roO0w407w22ZI \
  --domain https://open.larksuite.com \
  --mode stdio
```

## 🎯 期待される結果

Domain修正により：
- ✅ User Token正常動作継続
- ✅ 正しいAPI エンドポイント利用
- ✅ Base作成機能の完全実装
- ✅ MCP Tools正常動作

---

🌐 **Domain修正完了。User Tokenは正常動作中。Base APIエンドポイントの特定により完全解決されます。**