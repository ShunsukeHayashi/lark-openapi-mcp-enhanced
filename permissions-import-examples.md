# 🔧 Lark Permission Import Examples

## 📥 Import Format

Lark開発者コンソールで権限をインポートする際の形式です：

```json
{
  "scopes": {
    "tenant": [
      "権限1",
      "権限2"
    ],
    "user": [
      "権限3",
      "権限4"
    ]
  }
}
```

## 🎯 Ready-to-Import Permission Sets

### 1. 🟢 Starter Set (Basic Bot)
```json
{
  "scopes": {
    "tenant": [
      "im:message:send_as_bot",
      "im:chat:readonly",
      "docx:document:readonly"
    ],
    "user": []
  }
}
```

### 2. 🟡 Standard Set (Read + Message)
```json
{
  "scopes": {
    "tenant": [
      "im:message:send_as_bot",
      "im:message",
      "im:chat:readonly",
      "im:chat",
      "docx:document:readonly",
      "docs:doc:readonly",
      "bitable:app:readonly",
      "bitable:table:readonly",
      "bitable:record:readonly",
      "contact:user.base:readonly",
      "calendar:calendar:readonly"
    ],
    "user": [
      "docx:document:readonly",
      "bitable:app:readonly"
    ]
  }
}
```

### 3. 🔴 Professional Set (Full CRM Automation)
```json
{
  "scopes": {
    "tenant": [
      "im:message:send_as_bot",
      "im:message", 
      "im:chat",
      "im:chat:readonly",
      "im:resource",
      "docx:document",
      "docs:doc",
      "bitable:app",
      "bitable:table",
      "bitable:record",
      "bitable:field:readonly",
      "contact:user.base:readonly",
      "contact:contact:readonly",
      "calendar:calendar",
      "calendar:event",
      "task:task",
      "drive:drive"
    ],
    "user": [
      "docx:document",
      "bitable:app",
      "bitable:table",
      "bitable:record"
    ]
  }
}
```

### 4. 📊 Base Specialist Set
```json
{
  "scopes": {
    "tenant": [
      "bitable:app",
      "bitable:table", 
      "bitable:record",
      "bitable:field:readonly",
      "im:message:send_as_bot",
      "docx:document",
      "contact:user.base:readonly"
    ],
    "user": [
      "bitable:app",
      "bitable:table",
      "bitable:record"
    ]
  }
}
```

### 5. 📝 Document Manager Set
```json
{
  "scopes": {
    "tenant": [
      "docx:document",
      "docs:doc", 
      "wiki:wiki",
      "drive:drive",
      "im:message:send_as_bot",
      "contact:user.base:readonly"
    ],
    "user": [
      "docx:document",
      "docs:doc",
      "wiki:wiki"
    ]
  }
}
```

## 🔄 How to Import

1. **Lark開発者コンソール**を開く
2. **アプリ** → **権限とスコープ**へ移動
3. **インポート**ボタンをクリック
4. 上記JSONをコピー&ペースト
5. **インポート実行**

## ⚠️ Important Notes

- **tenant**: アプリケーション権限（Botとして実行）
- **user**: ユーザー権限（ユーザーとして実行、要認証）
- インポート後は**バージョン作成→公開**が必要
- 既存権限は**上書きされません**（追加のみ）

## 🎯 Current Recommended

あなたの用途（Base作成 + メッセージ）には**Professional Set**を推奨：

```json
{
  "scopes": {
    "tenant": [
      "im:message:send_as_bot",
      "im:message", 
      "im:chat",
      "docx:document",
      "bitable:app",
      "bitable:table",
      "bitable:record",
      "contact:user.base:readonly"
    ],
    "user": [
      "bitable:app",
      "bitable:table", 
      "bitable:record"
    ]
  }
}
```

この設定でBase作成・管理が完全に可能になります！