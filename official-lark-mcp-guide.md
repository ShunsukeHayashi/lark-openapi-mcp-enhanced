# Official Lark OpenAPI MCP Integration Guide

Based on the official Lark documentation, here's the complete guide for your MCP Integration Tool.

## 公式情報 / Official Information

Your app is using the **Official Lark OpenAPI MCP Tool** which follows Lark's standard MCP integration pattern.

### Tool Naming Scheme (Official)
- Format: `biz.version.resource.method`
- Example: `im.v1.message.create` (Send Message API)
- This matches the server-side Node SDK naming

### Supported APIs
- You can check which APIs are supported by looking for the **"Try it out"** button in the API documentation
- APIs in grayscale (Limited access) are not supported
- Image/file upload/download APIs are temporarily not supported

## 典型的なユースケース / Typical Use Cases

Based on the official documentation, here are common scenarios and their required permissions:

### 1. Base App Project Management / Base アプリプロジェクト管理
**Required Capabilities:**
- Bot capability

**Required Permissions:**
- View, comment, edit and manage Base apps
- Create Group Chat, Add Members and Send Lark Card

**Your current status:** ❌ Missing Base permissions

### 2. Group Chat Management / グループチャット管理  
**Required Capabilities:**
- Bot capability ✅ (You have this)

**Required Permissions:**
- Retrieve and update group information
- Send messages as an application ✅ (You have `im:message:send_as_bot`)

**Your current status:** ⚠️ Partially configured

### 3. Message Summarization / メッセージ要約
**Required Capabilities:**
- Bot capability ✅ (You have this)

**Required Permissions:**
- Retrieve all messages in the group (sensitive permission)
- Create Base apps
- Add new data tables
- Add new records

**Your current status:** ❌ Missing message reading permissions

### 4. Base Permission Management / Base権限管理
**Required Capabilities:**
- Bot capability ✅ (You have this)

**Required Permissions:**
- View group members
- View, comment, edit and manage Base apps

**Your current status:** ❌ Missing group and Base permissions

## 現在の設定分析 / Current Configuration Analysis

### ✅ 設定済み / Currently Configured:
```json
{  
  "tenant": [
    "im:message:send_as_bot",    // メッセージ送信
    "docx:document:readonly"     // ドキュメント読み取り
  ],
  "user": [
    "docx:document:readonly"     // ドキュメント読み取り (ユーザー)
  ]
}
```

### 🔧 追加推奨 / Recommended Additions:

#### 基本メッセージング / Basic Messaging:
```json
{
  "tenant": [
    "im:message",              // メッセージ読み取り (重要)
    "im:chat",                 // チャット情報
    "im:resource"              // メッセージリソース
  ]
}
```

#### 連絡先情報 / Contact Information:
```json  
{
  "tenant": [
    "contact:user:readonly",   // ユーザー情報
    "contact:group:readonly"   // グループ情報
  ]
}
```

#### Base アプリ (オプション) / Base Apps (Optional):
```json
{
  "tenant": [
    "bitable:app",             // Base アプリ管理
    "bitable:app:readonly"     // Base アプリ読み取り
  ]
}
```

## 公式使用例との対応 / Alignment with Official Examples

### Case 1: Document Processing / ドキュメント処理
**現在の対応状況:** ✅ 可能
- `docx:document:readonly` で基本的なドキュメント読み取りが可能

### Case 2: Conversation Management / 会話管理  
**現在の対応状況:** ⚠️ 一部制限
- メッセージ送信は可能
- メッセージ読み取りには `im:message` が必要

### Case 3: Calendar Scheduling / カレンダー管理
**現在の対応状況:** ❌ 未対応
- カレンダー権限が未設定

## 次のステップ / Next Steps

### 1. 最優先で追加すべき権限 / High Priority Permissions:
開発者コンソールで以下を追加:
```
im:message
im:chat  
contact:user:readonly
```

### 2. 公式テスト方法 / Official Testing Method:
1. API文書で **"Try it out"** ボタンをクリック
2. Node SDK サンプルコードを確認
3. 関数名を MCP Tool で使用

### 3. 推奨設定パターン / Recommended Configuration Pattern:

**最小構成 (文書処理中心):**
```json
{
  "tenant": [
    "im:message:send_as_bot",    // 既存
    "im:message",                // 追加
    "docx:document:readonly",    // 既存
    "contact:user:readonly"      // 追加
  ]
}
```

**標準構成 (オフィス業務全般):**
```json
{
  "tenant": [
    "im:message:send_as_bot",
    "im:message", 
    "im:chat",
    "contact:user:readonly",
    "docx:document:readonly",
    "sheets:spreadsheet:readonly",
    "calendar:calendar:readonly",
    "task:task:readonly"
  ]
}
```

## API確認方法 / How to Check API Support

1. **Lark Open Platform** にアクセス
2. **API Documentation** を開く
3. **"Try it out"** ボタンがあるかチェック
4. **Node SDK sample code** で関数名を確認
5. その関数名をMCPツールで使用

例: `im.v1.message.create` → MCP Tool で使用可能

これで公式ガイダンスに従った設定が可能です！