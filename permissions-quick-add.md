# 権限の一括追加ガイド / Quick Permissions Guide

## コピー&ペースト用権限リスト / Copy & Paste Permission List

### 最小限の権限セット / Minimal Permission Set
MCPツールの基本動作に必要 / Required for basic MCP operation:

```
im:message
im:message:send_as_bot
im:chat
im:chat:readonly
im:resource
contact:user.base:readonly
contact:contact:readonly
```

### 推奨権限セット / Recommended Permission Set
一般的な用途向け / For general use:

```
im:message
im:message:send_as_bot
im:chat
im:chat:readonly
im:resource
contact:user.base:readonly
contact:contact:readonly
contact:department.base:readonly
calendar:calendar
calendar:calendar:readonly
calendar:event
docs:doc
docs:doc:readonly
drive:drive
drive:drive:readonly
```

### フル権限セット / Full Permission Set
すべてのMCP機能を使用 / For all MCP features:

```
im:message
im:message:send_as_bot
im:chat
im:chat:readonly
im:resource
contact:user.base:readonly
contact:contact:readonly
contact:department.base:readonly
contact:user.email:readonly
contact:user.employee_id:readonly
calendar:calendar
calendar:calendar:readonly
calendar:event
docs:doc
docs:doc:readonly
sheets:spreadsheet
drive:drive
drive:drive:readonly
task:task
bitable:app
wiki:wiki
approval:approval
approval:approval:readonly
attendance:attendance
```

## 権限追加の手順 / How to Add Permissions

1. **開発者コンソールにアクセス** / Access Developer Console
   - https://open.feishu.cn/app/cli_a8d2fdb1f1f8d02d/dev-config

2. **「権限とスコープ」を選択** / Select "Permissions & Scopes"

3. **「権限を追加」をクリック** / Click "Add Permission"

4. **検索またはカテゴリから選択** / Search or select from categories

5. **必要な権限を選択して追加** / Select and add required permissions

6. **保存** / Save

## 権限カテゴリ別ガイド / Permissions by Category

### メッセージング機能を使う場合 / For Messaging Features:
- `im:message` ✅
- `im:message:send_as_bot` ✅
- `im:chat` ✅
- `im:resource` ✅

### カレンダー機能を使う場合 / For Calendar Features:
- `calendar:calendar` ✅
- `calendar:event` ✅

### ドキュメント機能を使う場合 / For Document Features:
- `docs:doc` ✅
- `sheets:spreadsheet` ✅
- `drive:drive` ✅

### タスク管理を使う場合 / For Task Management:
- `task:task` ✅

### ユーザー情報を取得する場合 / For User Information:
- `contact:user.base:readonly` ✅
- `contact:contact:readonly` ✅
- `contact:department.base:readonly` ✅