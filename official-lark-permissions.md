# Official Lark App Scopes - 公式Larkアプリスコープ

Based on your current permissions and the official Lark documentation, here's the corrected permissions guide.

## 現在の権限 / Current Permissions

```json
{
  "scopes": {
    "tenant": [
      "im:message:send_as_bot",
      "docx:document:readonly"
    ],
    "user": [
      "docx:document:readonly"
    ]
  }
}
```

## Lark公式スコープ分類 / Official Lark Scope Categories

### 📨 メッセージング / Messaging (IM)

#### 現在設定済み / Currently Set:
- ✅ `im:message:send_as_bot` - Bot としてメッセージ送信

#### 追加推奨 / Recommended to Add:
- `im:message` - メッセージの読み書き
- `im:message:readonly` - メッセージ読み取り専用
- `im:chat` - チャット管理
- `im:chat:readonly` - チャット情報読み取り
- `im:resource` - メッセージ内リソース (画像、ファイル等)

### 👥 連絡先 / Contacts

#### 基本情報 / Basic Info:
- `contact:user:readonly` - ユーザー情報読み取り
- `contact:user.base:readonly` - ユーザー基本情報
- `contact:user.email:readonly` - ユーザーメール
- `contact:department:readonly` - 部門情報

### 📅 カレンダー / Calendar

- `calendar:calendar` - カレンダー管理
- `calendar:calendar:readonly` - カレンダー読み取り
- `calendar:event` - イベント管理
- `calendar:event:readonly` - イベント読み取り

### 📄 ドキュメント / Documents

#### 現在設定済み / Currently Set:
- ✅ `docx:document:readonly` - ドキュメント読み取り

#### 追加可能 / Available to Add:
- `docx:document` - ドキュメント読み書き
- `sheets:spreadsheet` - スプレッドシート
- `sheets:spreadsheet:readonly` - スプレッドシート読み取り
- `wiki:wiki` - Wiki
- `wiki:wiki:readonly` - Wiki読み取り

### 💾 ドライブ / Drive

- `drive:drive` - ドライブ管理
- `drive:drive:readonly` - ドライブ読み取り
- `drive:file` - ファイル操作
- `drive:file:readonly` - ファイル読み取り

### ✅ タスク / Tasks

- `task:task` - タスク管理
- `task:task:readonly` - タスク読み取り

### 📊 Bitable (データベース)

- `bitable:app` - Bitable管理
- `bitable:app:readonly` - Bitable読み取り

### 📝 承認 / Approval

- `approval:approval` - 承認管理
- `approval:approval:readonly` - 承認読み取り

## MCP機能別推奨スコープ / Recommended Scopes by MCP Feature

### 🚀 最小構成 / Minimal Configuration
基本的なBot機能とドキュメント読み取り:
```json
{
  "tenant": [
    "im:message:send_as_bot",     // ✅ 設定済み
    "im:message:readonly",        // 追加推奨
    "im:chat:readonly",           // 追加推奨
    "contact:user.base:readonly", // 追加推奨
    "docx:document:readonly"      // ✅ 設定済み
  ]
}
```

### 💪 標準構成 / Standard Configuration
一般的なオフィス業務に対応:
```json
{
  "tenant": [
    "im:message:send_as_bot",
    "im:message:readonly",
    "im:chat:readonly",
    "im:resource",
    "contact:user:readonly",
    "contact:department:readonly",
    "calendar:calendar:readonly",
    "calendar:event:readonly",
    "docx:document:readonly",
    "sheets:spreadsheet:readonly",
    "drive:drive:readonly",
    "task:task:readonly"
  ]
}
```

### 🔥 フル構成 / Full Configuration
すべてのMCP機能を利用:
```json
{
  "tenant": [
    "im:message:send_as_bot",
    "im:message",
    "im:chat",
    "im:resource",
    "contact:user:readonly",
    "contact:department:readonly",
    "calendar:calendar",
    "calendar:event", 
    "docx:document",
    "sheets:spreadsheet",
    "wiki:wiki:readonly",
    "drive:drive:readonly",
    "task:task",
    "bitable:app:readonly",
    "approval:approval:readonly"
  ]
}
```

## 権限追加の手順 / How to Add Permissions

1. **開発者コンソールにアクセス:**
   ```
   https://open.feishu.cn/app/cli_a8d2fdb1f1f8d02d/dev-config/permission
   ```

2. **「権限を追加」をクリック**

3. **カテゴリ別に選択:**
   - **Messaging** → `im:message:readonly`, `im:chat:readonly`
   - **Contact** → `contact:user.base:readonly`
   - **Calendar** → `calendar:calendar:readonly` (必要に応じて)

4. **保存してアプリを再公開**

## 注意事項 / Important Notes

- 権限は必要最小限にとどめることを推奨
- 読み取り専用権限 (`:readonly`) から始めることを推奨
- ユーザートークンが必要な機能は別途 `user` スコープに追加
- アプリ公開後、権限変更には再承認が必要