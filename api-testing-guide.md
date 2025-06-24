# API Testing Guide - Lark MCP Tool

## 公式のAPI確認方法 / Official API Verification Method

Based on the official Lark documentation, here's how to verify which APIs are available in the MCP Tool:

### 1. API Documentation Check / API文書での確認

1. **Lark Open Platform にアクセス**
   - https://open.larksuite.com/document/

2. **API文書を開く**
   - 例: "Send Message" API

3. **"Try it out" ボタンを確認**
   - ✅ ボタンがある → MCP Tool で利用可能
   - ❌ ボタンがない → MCP Tool で利用不可

4. **Node SDK サンプルコードを確認**
   - `client.im.v1.message.create()` → MCP名: `im.v1.message.create`

### 2. Current API Status with Your Permissions / 現在の権限でのAPI状況

#### ✅ 利用可能 / Available:
```bash
# Document APIs
docx.v1.document.get
docx.v1.document.raw_content

# Bot messaging (outbound only)  
im.v1.message.create
```

#### ❌ 権限不足 / Permission Required:
```bash
# Message reading (need im:message)
im.v1.message.list
im.v1.message.get

# Chat info (need im:chat)
im.v1.chat.get
im.v1.chat.members

# User info (need contact permissions)
contact.v3.user.get
contact.v3.user.list
```

### 3. Testing Your Current Setup / 現在の設定でのテスト

#### Test Script:
```bash
# Test available APIs with current permissions
node dist/cli.js mcp --config config.json --tools "docs,im" --mode stdio
```

#### Expected Results:
- **Document tools**: ✅ Should work
- **Bot message sending**: ✅ Should work  
- **Message reading**: ❌ Will fail (need im:message)
- **User info**: ❌ Will fail (need contact permissions)

### 4. Gradual Permission Testing / 段階的権限テスト

#### Phase 1: Current State
```json
{
  "tenant": ["im:message:send_as_bot", "docx:document:readonly"]
}
```

Test:
```bash
# Should work
curl -X POST https://open.feishu.cn/open-apis/im/v1/messages \
  -H "Authorization: Bearer YOUR_TENANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"receive_id":"user_id","msg_type":"text","content":"{\"text\":\"test\"}"}'
```

#### Phase 2: Add Message Reading
Add: `im:message`, `im:chat`

Test:
```bash
# Should now work
curl -X GET https://open.feishu.cn/open-apis/im/v1/messages/msg_id \
  -H "Authorization: Bearer YOUR_TENANT_TOKEN"
```

#### Phase 3: Add Contact Info  
Add: `contact:user:readonly`

Test:
```bash
# Should now work
curl -X GET https://open.feishu.cn/open-apis/contact/v3/users/user_id \
  -H "Authorization: Bearer YOUR_TENANT_TOKEN"
```

### 5. MCP Tool Specific Testing / MCP ツール固有のテスト

#### List Available Tools:
```bash
node dist/cli.js mcp --config config.json --help
```

#### Test with Different Tool Sets:
```bash
# Documents only
node dist/cli.js mcp --config config.json --tools "docs"

# Messaging only  
node dist/cli.js mcp --config config.json --tools "im"

# Mixed
node dist/cli.js mcp --config config.json --tools "docs,im,contact"
```

#### Check Tool Names:
The MCP tool should list available tools in format:
- `docx.v1.document.get`
- `im.v1.message.create`
- `contact.v3.user.get` (if permissions allow)

### 6. Error Diagnosis / エラー診断

#### Common Errors and Solutions:

**Error: "Permission denied"**
- Solution: Add required scope in Lark console
- Check: API documentation for required permissions

**Error: "API not found"**  
- Solution: Check if API has "Try it out" button
- Verify: API is not in grayscale (Limited access)

**Error: "Token invalid"**
- Solution: Regenerate app secret
- Check: App is published and approved

### 7. Progressive Setup Recommendation / 段階的設定の推奨

#### Week 1: Basic Setup
```json
{
  "tenant": [
    "im:message:send_as_bot",  // ✅ Current
    "im:message",              // Add
    "docx:document:readonly"   // ✅ Current
  ]
}
```

#### Week 2: Enhanced Features
```json
{
  "tenant": [
    "im:message:send_as_bot",
    "im:message", 
    "im:chat",                 // Add
    "contact:user:readonly",   // Add
    "docx:document:readonly"
  ]
}
```

#### Week 3: Full Features
```json
{
  "tenant": [
    "im:message:send_as_bot",
    "im:message",
    "im:chat",
    "contact:user:readonly", 
    "docx:document:readonly",
    "calendar:calendar:readonly",  // Add
    "sheets:spreadsheet:readonly", // Add
    "task:task:readonly"          // Add
  ]
}
```

This progressive approach allows you to test each permission addition incrementally!