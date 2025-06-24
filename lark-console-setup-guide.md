# Lark Developer Console 設定ガイド / Setup Guide

## 1. 基本情報 / Basic Info ✅
既に設定済み / Already configured:
- App Name: MCP Integration Tool
- App ID: `cli_a8d2fdb1f1f8d02d`
- App Secret: `V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ`

## 2. 機能 / Features ✅
有効化済み / Enabled:
- **Bot** ✅

## 3. 開発設定 / Development Configuration 🔧

### 3.1 権限とスコープ / Permissions & Scopes

以下の権限を追加してください / Add these permissions:

#### 必須権限 / Required Permissions:

**メッセージング / Messaging:**
- [ ] `im:message` - メッセージの読み取りと送信 / Read and send messages
- [ ] `im:message:send_as_bot` - Botとしてメッセージ送信 / Send messages as bot
- [ ] `im:chat` - チャット情報へのアクセス / Access chat information
- [ ] `im:chat:readonly` - チャット情報の読み取り / Read chat information
- [ ] `im:resource` - メッセージリソースへのアクセス / Access message resources

**連絡先 / Contacts:**
- [ ] `contact:user.base:readonly` - ユーザー基本情報の読み取り / Read user basic info
- [ ] `contact:contact:readonly` - 連絡先の読み取り / Read contacts
- [ ] `contact:department.base:readonly` - 部門情報の読み取り / Read department info

#### オプション権限 / Optional Permissions:

**カレンダー / Calendar:**
- [ ] `calendar:calendar` - カレンダーへのアクセス / Access calendars
- [ ] `calendar:calendar:readonly` - カレンダーの読み取り / Read calendars
- [ ] `calendar:event` - イベント管理 / Manage events

**ドキュメント / Documents:**
- [ ] `docs:doc` - ドキュメントへのアクセス / Access documents
- [ ] `docs:doc:readonly` - ドキュメントの読み取り / Read documents
- [ ] `sheets:spreadsheet` - スプレッドシートへのアクセス / Access spreadsheets
- [ ] `drive:drive` - ドライブへのアクセス / Access drive
- [ ] `drive:drive:readonly` - ドライブの読み取り / Read drive

**その他 / Others:**
- [ ] `task:task` - タスク管理 / Manage tasks
- [ ] `bitable:app` - Bitableへのアクセス / Access Bitable
- [ ] `wiki:wiki` - Wikiへのアクセス / Access Wiki

### 3.2 イベントとコールバック / Events & Callbacks

#### イベント購読URL / Event Subscription URL:
MCP toolはスタンドアロンで動作するため、通常は不要です。
Not required for standalone MCP operation.

インタラクティブ機能を追加する場合のみ設定 / Only if adding interactive features:
```
https://your-server.com/webhook/events
```

#### 購読するイベント / Events to Subscribe (オプション/Optional):

**メッセージイベント / Message Events:**
- [ ] `im.message.receive_v1` - メッセージ受信 / Receive messages
- [ ] `im.chat.member.bot.added_v1` - Botがチャットに追加 / Bot added to chat
- [ ] `im.chat.member.bot.deleted_v1` - Botがチャットから削除 / Bot removed from chat

### 3.3 Bot設定 / Bot Settings

#### Botメニュー / Bot Menu (推奨/Recommended):
カスタムBotメニューを有効化 / Enable custom bot menu

メニュー項目の例 / Example menu items:
```json
[
  {
    "name": "ヘルプ / Help",
    "command": "/help",
    "description": "利用可能なコマンドを表示 / Show available commands"
  },
  {
    "name": "ツール一覧 / List Tools",
    "command": "/tools",
    "description": "利用可能なAPIツールを表示 / Show available API tools"
  },
  {
    "name": "ステータス / Status",
    "command": "/status",
    "description": "接続状態を確認 / Check connection status"
  }
]
```

## 4. バージョン管理 / Version Management

### アプリバージョン作成 / Create App Version:
1. 「アプリバージョン」タブをクリック / Click "App Versions" tab
2. 「バージョンを作成」をクリック / Click "Create Version"
3. バージョン番号を入力 (例: 1.0.0) / Enter version number
4. 「作成して公開申請」をクリック / Click "Create and Submit"

## 5. 公開申請 / Publishing

### 申請手順 / Submission Steps:
1. すべての設定が完了したことを確認 / Verify all settings are complete
2. 「リリース」ボタンをクリック / Click "Release" button
3. 組織管理者の承認を待つ / Wait for organization admin approval

## 6. 設定チェックリスト / Configuration Checklist

- [x] Bot機能を有効化 / Enable Bot feature
- [ ] 必須権限を追加 / Add required permissions
- [ ] (オプション) イベントを購読 / Subscribe to events (optional)
- [ ] (オプション) Botメニューを設定 / Configure bot menu (optional)
- [ ] バージョンを作成 / Create version
- [ ] 公開申請 / Submit for publishing

## 7. テスト手順 / Testing Steps

設定完了後 / After configuration:

1. **アプリを公開** / Publish the app
2. **MCPツールを起動** / Start MCP tool:
   ```bash
   ./run-mcp.sh
   ```
3. **Botをテスト** / Test the bot:
   - Botをチャットに追加 / Add bot to a chat
   - MCPツールでメッセージ送信をテスト / Test sending messages via MCP

## 8. トラブルシューティング / Troubleshooting

### 「権限が不足しています」エラー / "Permission denied" error:
- 必要な権限がすべて追加されているか確認 / Check all required permissions are added
- アプリが公開されているか確認 / Verify app is published

### Botが動作しない / Bot not working:
- Bot機能が有効になっているか確認 / Check Bot feature is enabled
- アプリが承認されているか確認 / Verify app is approved

### APIが機能しない / API not functioning:
- 該当するAPIの権限が有効か確認 / Check specific API permissions
- トークンモードを確認 (tenant/user) / Verify token mode