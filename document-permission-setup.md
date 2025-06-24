# 📄 Document Creation Permission Setup Guide

## 🚨 Current Status

**Issue**: Document creation requires additional permissions
- **Missing**: `docx:document` and `docx:document:create` scopes
- **Token**: User Access Token valid ✅
- **Domain**: https://open.larksuite.com ✅

## 🔧 Required Permissions for Document Creation

### Lark Developer Console Setup

1. **Navigate to**: [Lark Developer Console](https://open.larksuite.com/app/cli_a8d2fdb1f1f8d02d/auth)
2. **Add Permissions**:
   ```
   docx:document
   docx:document:create
   docx:document:read
   docx:document:write
   ```

### Permission Configuration Steps

1. **Open App Settings**
   - App ID: `cli_a8d2fdb1f1f8d02d`
   - Go to "Permissions & Scopes"

2. **Add Document Permissions**
   ```
   ✅ docx:document          (基本ドキュメント権限)
   ✅ docx:document:create   (ドキュメント作成)
   ✅ docx:document:read     (ドキュメント読み取り)
   ✅ docx:document:write    (ドキュメント編集)
   ```

3. **Publish Version**
   - Create new version after adding permissions
   - Publish for permission changes to take effect

4. **Re-generate User Access Token**
   - Current token may not include new scopes
   - Generate new User Access Token with document permissions

## 🔍 API Endpoint Discovery

### Document API Endpoints (LarkSuite)

Test these endpoints after permission setup:

```bash
# Document list
curl -H "Authorization: Bearer {new_token}" \
     "https://open.larksuite.com/open-apis/docx/v1/documents"

# Create document
curl -X POST "https://open.larksuite.com/open-apis/docx/v1/documents" \
     -H "Authorization: Bearer {new_token}" \
     -H "Content-Type: application/json" \
     -d '{"title": "Test Document"}'
```

### Base API Endpoints

Test these endpoints:

```bash
# Option 1: Bitable API
curl -H "Authorization: Bearer {token}" \
     "https://open.larksuite.com/open-apis/bitable/v1/apps"

# Option 2: Alternative endpoint
curl -H "Authorization: Bearer {token}" \
     "https://open.larksuite.com/open-apis/base/v1/apps"

# Option 3: Drive API for bases
curl -H "Authorization: Bearer {token}" \
     "https://open.larksuite.com/open-apis/drive/v1/files?folder_token=&page_size=50"
```

## 🚀 Updated Permission Matrix

### Complete Permission Set for MCP Agent

```
Base Operations:
✅ bitable:app              (Base作成・管理)
✅ drive:drive              (Drive access)

Document Operations:
🔄 docx:document           (基本ドキュメント権限)
🔄 docx:document:create    (ドキュメント作成)
🔄 docx:document:read      (ドキュメント読み取り)
🔄 docx:document:write     (ドキュメント編集)

User Operations:
✅ contact:user.id:read     (ユーザー情報)
✅ authen.identity          (認証)
```

## 📋 Permission Setup Checklist

### Immediate Actions
- [ ] Add document permissions in Developer Console
- [ ] Publish new app version
- [ ] Generate new User Access Token with document scopes
- [ ] Test document creation API
- [ ] Update MCP configuration with new token

### Testing Sequence
1. **Permission Verification**
   ```bash
   curl -H "Authorization: Bearer {new_token}" \
        "https://open.larksuite.com/open-apis/docx/v1/documents"
   ```

2. **Document Creation Test**
   ```bash
   curl -X POST "https://open.larksuite.com/open-apis/docx/v1/documents" \
        -H "Authorization: Bearer {new_token}" \
        -H "Content-Type: application/json" \
        -d '{"title": "MCP Agent Test Document"}'
   ```

3. **Base API Discovery**
   ```bash
   # Test multiple endpoints to find working one
   curl -H "Authorization: Bearer {new_token}" \
        "https://open.larksuite.com/open-apis/bitable/v1/apps"
   ```

## 🎯 Expected Resolution

After adding document permissions:
- ✅ Document creation API access
- ✅ Full MCP document functionality  
- ✅ Base + Document integration tests
- ✅ Complete CRM documentation workflow

## 🔄 Next Steps

1. **Add Permissions**: Configure document permissions in Developer Console
2. **New Token**: Generate User Access Token with extended scopes
3. **Test APIs**: Verify both Base and Document endpoint functionality
4. **Update Config**: Apply new token to MCP configuration
5. **Full Test**: Execute complete document creation workflow

---

📄 **Document creation blocked by missing permissions. Add `docx:document` and `docx:document:create` scopes in Lark Developer Console to enable full functionality.**