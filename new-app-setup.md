# New App Setup - Updated Credentials

## 新しいアプリ情報 / New App Information

### App Credentials (Updated):
- **App ID**: `cli_a8d2e0082978902e`
- **App Secret**: `SQkCdptYmzrNa3MIfwmN2f7V5BXR2Ghz`

## 設定の更新状況 / Configuration Update Status

### ✅ 更新済みファイル / Updated Files:
- `config.json` - メイン設定ファイル
- `.env.example` - 環境変数テンプレート  
- `run-mcp.sh` - 実行スクリプト

### 🔧 次のステップ / Next Steps:

#### 1. **開発者コンソールで権限設定**
新しいアプリの権限を設定:
```
https://open.feishu.cn/app/cli_a8d2e0082978902e/dev-config/permission
```

#### 2. **推奨権限セット追加**
最小限の権限セット:
```
im:message
im:message:send_as_bot
im:chat
im:chat:readonly
im:resource
contact:user.base:readonly
contact:contact:readonly
```

#### 3. **Bot機能有効化**
- Bot feature を enable
- Custom bot menu を設定（オプション）

#### 4. **テスト実行**
新しい認証情報でテスト:
```bash
./run-mcp.sh
```

## クイックスタート / Quick Start

### Step 1: 権限追加
開発者コンソールで権限を追加:
1. https://open.feishu.cn/app/cli_a8d2e0082978902e/dev-config/permission
2. 上記の最小権限セットを追加
3. 保存

### Step 2: Bot設定
1. Features → Bot を有効化
2. Bot settings でメニュー設定（オプション）

### Step 3: アプリ公開
1. Version を作成 (1.0.0)
2. 公開申請を提出
3. 組織管理者の承認を待つ

### Step 4: テスト
承認後、MCP tool をテスト:
```bash
# 基本テスト
./run-mcp.sh

# 特定ツールのテスト
node dist/cli.js mcp --config config.json --tools "im,docs"
```

## 新しいアプリのURL / New App URLs

### 開発設定 / Development Configuration:
```
https://open.feishu.cn/app/cli_a8d2e0082978902e/dev-config
```

### 権限設定 / Permissions:
```
https://open.feishu.cn/app/cli_a8d2e0082978902e/dev-config/permission
```

### アプリ情報 / App Info:
```
https://open.feishu.cn/app/cli_a8d2e0082978902e/info
```

## セキュリティ注意事項 / Security Notes

- 新しい App Secret を安全に保管
- .gitignore で config.json が除外されていることを確認
- 本番環境では環境変数を使用推奨

## トラブルシューティング / Troubleshooting

### 認証エラーが出る場合:
1. App ID/Secret が正しく設定されているか確認
2. アプリが公開されているか確認
3. 必要な権限が追加されているか確認

### 権限エラーが出る場合:
1. 開発者コンソールで権限を確認
2. アプリの再公開が必要かチェック
3. 該当APIに必要な権限が追加されているか確認

準備完了です！新しいアプリで権限設定を進めてください。