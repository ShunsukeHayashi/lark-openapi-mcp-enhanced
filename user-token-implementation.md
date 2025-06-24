# 🔑 User Access Token 実装ガイド

## ✅ User Access Token 確認

**取得済みToken**: `u-feLBF4cHZbUqy4aO.uPPoRY05516542roO0w407w22ZI`  
**Token Type**: User Access Token  
**用途**: ユーザーレベルの操作（Base作成含む）

## 🚀 MCP設定への適用

### 1. config.json の更新

```json
{
  "appId": "cli_a8d2fdb1f1f8d02d",
  "appSecret": "V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ",
  "userAccessToken": "u-feLBF4cHZbUqy4aO.uPPoRY05516542roO0w407w22ZI",
  "language": "en",
  "domain": "https://open.feishu.cn",
  "tokenMode": "user",
  "mode": "stdio"
}
```

### 2. MCP起動コマンド（User Token使用）

```bash
node dist/cli.js mcp \
  --app-id cli_a8d2fdb1f1f8d02d \
  --app-secret V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ \
  --user-access-token u-feLBF4cHZbUqy4aO.uPPoRY05516542roO0w407w22ZI \
  --mode stdio
```

### 3. Claude Desktop設定の更新

`~/.../Claude/claude_desktop_config.json` の `lark-mcp` セクション：

```json
"lark-mcp": {
  "command": "node",
  "args": [
    "/Users/shunsukehayashi/Dev/lark/lark-openapi-mcp/dist/cli.js",
    "mcp",
    "--app-id", "cli_a8d2fdb1f1f8d02d",
    "--app-secret", "V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ",
    "--user-access-token", "u-feLBF4cHZbUqy4aO.uPPoRY05516542roO0w407w22ZI",
    "--mode", "stdio"
  ],
  "env": {}
}
```

## 🔧 動作確認テスト

### Token有効性確認
```bash
curl -H "Authorization: Bearer u-feLBF4cHZbUqy4aO.uPPoRY05516542roO0w407w22ZI" \
     "https://open.feishu.cn/open-apis/authen/v1/user_info"
```

### Base操作権限確認
```bash
curl -H "Authorization: Bearer u-feLBF4cHZbUqy4aO.uPPoRY05516542roO0w407w22ZI" \
     "https://open.feishu.cn/open-apis/bitable/v1/apps"
```

## 📊 Enhanced MCP Agent での使用

### User Token対応版エージェント作成
```python
class EnhancedMCPAgent:
    def __init__(self):
        self.lark_config = {
            "app_id": "cli_a8d2fdb1f1f8d02d",
            "app_secret": "V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ",
            "user_access_token": "u-feLBF4cHZbUqy4aO.uPPoRY05516542roO0w407w22ZI",
            "domain": "https://open.feishu.cn"
        }
    
    def get_headers(self):
        return {
            "Authorization": f"Bearer {self.lark_config['user_access_token']}",
            "Content-Type": "application/json"
        }
```

## 🎯 Base作成テスト実行

### Claude Desktopテストコマンド
```
「User Access Token (u-feLBF4cHZbUqy4aO...) を使用して、
新しいBase 'UserToken-Test-Base' を作成してください。
テーブル構成: Products, Customers」
```

### 直接API テスト
```bash
curl -X POST "https://open.feishu.cn/open-apis/bitable/v1/apps" \
     -H "Authorization: Bearer u-feLBF4cHZbUqy4aO.uPPoRY05516542roO0w407w22ZI" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "UserToken-Test-Base",
       "description": "User Access Token test base"
     }'
```

## ⚠️ User Token 管理上の注意

### Token有効期限
- **通常**: 約2時間（7140秒）
- **更新**: 開発者コンソールで再生成
- **Refresh Token**: 長期利用時に活用

### セキュリティ考慮事項
- Token の適切な保管
- 最小権限での運用
- 定期的なローテーション

## 🔄 Token更新自動化

### Refresh Token使用例
```python
def refresh_user_token(refresh_token):
    url = "https://open.feishu.cn/open-apis/authen/v1/refresh_access_token"
    data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token
    }
    # Implementation details...
```

## 📋 実行チェックリスト

### 即座実行
- [ ] config.json にUser Token追加
- [ ] MCP起動コマンド実行
- [ ] Claude Desktop設定更新
- [ ] Claude Desktop再起動

### 動作確認
- [ ] Token有効性確認
- [ ] Base作成権限テスト
- [ ] 完全なBase作成実行
- [ ] エラーログ確認

### 成功確認
- [ ] Base作成成功
- [ ] テーブル作成動作
- [ ] レコード追加可能
- [ ] MCP tools正常動作

## 🚀 期待される結果

User Access Token使用により：
- ✅ Base作成権限の完全解決
- ✅ "アクセストークンがない" エラーの解消
- ✅ 全機能の正常動作
- ✅ Enhanced MCP Agent の完全活用

---

🔑 **User Access Token `u-feLBF4cHZbUqy4aO.uPPoRY05516542roO0w407w22ZI` を即座にMCP設定に適用してください。これによりBase作成問題が完全に解決されます。**