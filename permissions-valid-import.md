# ✅ Valid Lark Permissions Import

## 🚨 Corrected Permission Sets

### 1. 🟢 Starter Set (Basic Bot + Documents)
```json
{
  "scopes": {
    "tenant": [
      "im:message:send_as_bot",
      "im:chat:readonly",
      "docx:document:readonly",
      "contact:user.base:readonly"
    ],
    "user": []
  }
}
```

### 2. 🟡 Standard Set (Read Operations)
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
      "contact:user.base:readonly",
      "calendar:calendar:readonly"
    ],
    "user": []
  }
}
```

### 3. 🔴 Professional Set (Full CRM - CORRECTED)
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
      "contact:user.base:readonly",
      "contact:contact:readonly",
      "calendar:calendar",
      "calendar:calendar.event:create",
      "calendar:calendar.event:read",
      "drive:drive"
    ],
    "user": []
  }
}
```

### 4. 📊 Base Specialist (CORRECTED)
```json
{
  "scopes": {
    "tenant": [
      "bitable:app",
      "im:message:send_as_bot",
      "docx:document",
      "contact:user.base:readonly"
    ],
    "user": []
  }
}
```

## ⚠️ Key Corrections Made

**Invalid → Valid:**
- ❌ `bitable:table` → ✅ Use `bitable:app` (includes table operations)
- ❌ `bitable:record` → ✅ Use `bitable:app` (includes record operations)
- ❌ `bitable:field:readonly` → ✅ Use `bitable:app:readonly`
- ❌ `calendar:event` → ✅ `calendar:calendar.event:create` + `calendar:calendar.event:read`
- ❌ `task:task` → ✅ `task:task:read` + `task:task:write`

## 🎯 Recommended for Your Base Implementation

```json
{
  "scopes": {
    "tenant": [
      "bitable:app",
      "im:message:send_as_bot",
      "im:message",
      "im:chat",
      "docx:document",
      "docs:doc", 
      "contact:user.base:readonly",
      "drive:drive"
    ],
    "user": []
  }
}
```

## 📋 Available Base Permissions

Based on the valid values, for Base operations you can use:
- ✅ `bitable:app` - Full Base management (create, read, update, delete)
- ✅ `bitable:app:readonly` - Read-only Base access

Note: `bitable:app` includes all table, record, and field operations.

## 🔧 Import Instructions

1. Copy the **recommended JSON** above
2. Go to [Lark Developer Console](https://open.feishu.cn)
3. Select your app → **Permissions & Scopes**
4. Click **Import** → Paste JSON → Execute
5. **Create Version** → **Publish**

This will give you complete Base creation and management capabilities!