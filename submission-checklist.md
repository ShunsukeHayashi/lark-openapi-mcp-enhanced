# App Submission Checklist - MCP Integration Tool

## 提出前チェックリスト / Pre-Submission Checklist

### ✅ 完了済み / Completed
- [x] **Basic Info** - App name, description, icon configured
- [x] **Features** - Bot feature enabled
- [x] **Credentials** - App ID and Secret generated
- [x] **MCP Tool** - Built and tested locally

### 🔧 進行中 / In Progress
- [ ] **Permissions** - Add required scopes
- [ ] **Version Details** - Fill submission form
- [ ] **Submit for Review** - Submit to organization admin

### 📋 提出フォーム記入内容 / Submission Form Content

#### Version Information:
- **App version**: `1.0.0`
- **Default feature (mobile)**: `Bot`
- **Default feature (desktop)**: `Bot`

#### Update Notes (Copy this):
```
Initial release of MCP Integration Tool for AI assistant integration with Lark OpenAPI.

Features:
- Bot messaging capabilities for AI agents
- Document reading and processing
- Secure API access using official Lark MCP protocol
- Compatible with Claude, Cursor, and other AI tools

This tool enables automated workflows such as document processing, conversation management, and API integrations through the standardized Model Context Protocol (MCP).
```

#### Reason for Request (Copy this):
```
This MCP Integration Tool is designed to enable AI assistants to interact securely with Lark's OpenAPI through the official Model Context Protocol (MCP).

Purpose:
- Enable AI-powered automation workflows within Lark environment
- Provide secure, controlled access to Lark APIs for AI agents
- Support document processing, messaging, and other productivity tasks

Requested Permissions Justification:
1. im:message:send_as_bot - Required for AI agents to send notifications and responses
2. docx:document:readonly - Needed for AI to process and analyze documents
3. Additional messaging/contact permissions - Essential for full AI assistant functionality

Availability Scope:
- Initially limited to development team member (ハヤシ シュンスケ) for testing and validation
- Will be expanded to organization after successful testing phase
- Follows security best practices by starting with minimal user scope

This tool follows Lark's official MCP integration guidelines and is built using the recommended OpenAPI MCP framework.
```

## 提出後の流れ / Post-Submission Process

### 1. **Review Process** / レビュープロセス
- Organization administrator review
- Security and compliance check
- Functionality verification

### 2. **Expected Timeline** / 予想タイムライン
- Review: 1-3 business days
- Approval notification via Lark
- App becomes available to selected members

### 3. **After Approval** / 承認後
- Test MCP tool with full permissions
- Verify all API endpoints work correctly
- Document any issues for future updates

### 4. **Monitoring** / モニタリング
- Check Operations & Monitoring section
- Monitor API usage and errors
- Plan for broader rollout if successful

## トラブルシューティング / Troubleshooting

### If Review is Rejected:
1. **Check feedback** from organization admin
2. **Address concerns** mentioned in rejection
3. **Update permissions** if needed
4. **Resubmit** with explanations

### Common Rejection Reasons:
- Insufficient justification for permissions
- Security concerns about API access
- Missing documentation about app purpose
- Unclear benefits to organization

### How to Address:
- Provide detailed technical documentation
- Explain specific AI use cases
- Demonstrate security measures
- Show alignment with organization goals

## Next Steps After Submission

1. **Wait for approval** (1-3 business days)
2. **Test immediately** after approval
3. **Document results** for future reference
4. **Plan Phase 2** permissions if needed
5. **Prepare for broader rollout**

Remember: This is Phase 1 with minimal permissions. You can always request additional permissions later after demonstrating successful usage.