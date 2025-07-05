# MCP All Tools Activation Guide

This guide shows you how to activate and use all available MCP tools in the Lark OpenAPI MCP Enhanced system.

## 🚀 Quick Start - Activate All Tools

### Method 1: Use the Complete All Preset (Recommended)
```bash
# Using CLI with all tools preset
yarn build && node dist/cli.js mcp --mode stdio \
  --app-id YOUR_APP_ID \
  --app-secret YOUR_APP_SECRET \
  --tools preset.complete.all
```

### Method 2: Use Wildcard Pattern
```bash
# Activate all tools using wildcard
yarn build && node dist/cli.js mcp --mode stdio \
  --app-id YOUR_APP_ID \
  --app-secret YOUR_APP_SECRET \
  --tools "*"
```

### Method 3: Programmatic Activation
```typescript
import { LarkMcpTool, LarkMcpToolOptions } from '@larksuiteoapi/lark-mcp';

const options: LarkMcpToolOptions = {
  appId: process.env.APP_ID!,
  appSecret: process.env.APP_SECRET!,
  toolsOptions: {
    language: 'en',
    allowTools: ['*'], // Activate all tools
    // OR use complete preset
    // allowTools: ['preset.complete.all']
  }
};

const mcpTool = new LarkMcpTool(options);
```

## 📦 Available Tool Presets

### 1. **preset.complete.all** - All Tools Combined
Includes ALL available tools from every category:
- All IM/Chat tools
- All Bitable/Base tools
- All Document/Wiki tools
- All Task management tools
- All Calendar tools
- Genesis AI tools
- Cached tools
- Security tools
- Complete function tools

### 2. Individual Presets
- `preset.light` - Minimal set (10 tools)
- `preset.default` - Common operations (19 tools)
- `preset.im.default` - Chat/messaging (5 tools)
- `preset.base.default` - Bitable operations (7 tools)
- `preset.base.batch` - Batch operations (7 tools)
- `preset.doc.default` - Documents/wiki (6 tools)
- `preset.task.default` - Task management (4 tools)
- `preset.calendar.default` - Calendar events (5 tools)
- `preset.genesis.default` - AI generation (14 tools)
- `preset.cache.default` - Cached operations (9 tools)
- `preset.security.default` - Security audit (2 tools)

## 🛠️ Complete Tool List (136 Tools)

### Auto-generated Tools (from OpenAPI)
```
# IM/Chat Tools
im.v1.chat.create
im.v1.chat.update
im.v1.chat.delete
im.v1.chat.get
im.v1.chat.list
im.v1.chat.search
im.v1.chat.moderation.update
im.v1.chatMembers.create
im.v1.chatMembers.delete
im.v1.chatMembers.get
im.v1.message.create
im.v1.message.delete
im.v1.message.get
im.v1.message.list
im.v1.message.patch
im.v1.message.update
im.v1.messageReaction.create
im.v1.messageReaction.delete
im.v1.messageReaction.list

# Bitable/Base Tools
bitable.v1.app.create
bitable.v1.app.update
bitable.v1.app.get
bitable.v1.appDashboard.copy
bitable.v1.appTable.create
bitable.v1.appTable.patch
bitable.v1.appTable.list
bitable.v1.appTableField.create
bitable.v1.appTableField.update
bitable.v1.appTableField.list
bitable.v1.appTableRecord.create
bitable.v1.appTableRecord.update
bitable.v1.appTableRecord.delete
bitable.v1.appTableRecord.get
bitable.v1.appTableRecord.search
bitable.v1.appTableRecord.batchCreate
bitable.v1.appTableRecord.batchUpdate
bitable.v1.appTableRecord.batchDelete
bitable.v1.appTableView.create
bitable.v1.appTableView.patch
bitable.v1.appTableView.list
bitable.v1.appWorkflow.list

# Document/Wiki Tools
docx.v1.document.create
docx.v1.document.get
docx.v1.document.rawContent
docx.v1.documentBlock.list
docx.v1.documentBlock.batchUpdate
wiki.v1.node.search
wiki.v2.space.create
wiki.v2.space.getNode
wiki.v2.space.list
wiki.v2.spaceNode.create
wiki.v2.spaceNode.move

# Drive/Permission Tools
drive.v1.file.uploadAll
drive.v1.file.uploadFinish
drive.v1.file.uploadPrepare
drive.v1.media.uploadAll
drive.v1.media.uploadFinish
drive.v1.media.uploadPrepare
drive.v1.permissionMember.create
drive.v1.permissionMember.delete
drive.v1.permissionMember.list
drive.v1.permissionPublic.patch

# Task Management Tools
task.v2.task.create
task.v2.task.get
task.v2.task.patch
task.v2.task.addMembers
task.v2.task.removeMembers
task.v2.task.addReminders
task.v2.task.removeReminders
task.v2.taskComment.create
task.v2.taskComment.list

# Calendar Tools
calendar.v4.calendar.list
calendar.v4.calendar.primary
calendar.v4.calendar.get
calendar.v4.calendarEvent.create
calendar.v4.calendarEvent.patch
calendar.v4.calendarEvent.delete
calendar.v4.calendarEvent.get
calendar.v4.calendarEvent.list
calendar.v4.calendarEvent.search
calendar.v4.calendarEventAttendee.create
calendar.v4.calendarEventAttendee.list
calendar.v4.freebusy.list

# Sheets/Spreadsheet Tools
sheets.v3.spreadsheet.create
sheets.v3.spreadsheet.get
sheets.v3.spreadsheet.patch
sheets.v3.spreadsheetSheet.get
sheets.v3.spreadsheetSheetFilterView.create
sheets.v3.spreadsheetSheetFilterView.patch
sheets.v3.spreadsheetSheetFilterView.delete

# Contact/User Tools
contact.v3.user.get
contact.v3.user.list
contact.v3.user.batchGetId
contact.v3.department.create
contact.v3.department.get
contact.v3.department.list
contact.v3.group.create
contact.v3.group.get
contact.v3.group.list

# Admin/Approval Tools
approval.v4.approval.create
approval.v4.instance.create
approval.v4.instance.get
approval.v4.instance.list

# Meeting Room Tools
vc.v1.meetingRoom.book
vc.v1.meetingRoom.reply
vc.v1.reserve.apply
vc.v1.reserve.get
```

### Custom Built-in Tools
```
# Genesis AI Tools
genesis.builtin.create_base
genesis.builtin.analyze_requirements
genesis.builtin.generate_er_diagram
genesis.builtin.optimize_base
genesis.builtin.create_view
genesis.builtin.create_dashboard
genesis.builtin.create_automation
genesis.builtin.create_filter_view
genesis.builtin.list_templates

# Document Tools
docx.builtin.import
docx.builtin.search

# Cached Tools (Performance Optimized)
contact.v3.user.get.cached
im.v1.chat.get.cached
contact.v3.department.list.cached
bitable.v1.app.get.cached
cache.builtin.manage

# Security Tools
security.builtin.audit

# Complete Function Tools
complete.user.get_info
complete.user.create
complete.department.create
complete.group.create
complete.approval.create_instance
complete.wiki.create_space
complete.meeting_room.book
complete.okr.create
complete.hr.create_employee
```

## 🔧 Configuration Examples

### Using Environment Variables
```bash
export APP_ID=your_app_id
export APP_SECRET=your_app_secret
export LARK_TOOLS="preset.complete.all"

yarn build && node dist/cli.js mcp --mode stdio
```

### Using Configuration File
Create `config.json`:
```json
{
  "appId": "your_app_id",
  "appSecret": "your_app_secret",
  "toolsOptions": {
    "language": "en",
    "allowTools": ["preset.complete.all"]
  },
  "rateLimiting": {
    "enabled": true,
    "rateLimits": {
      "default": { "capacity": 200, "tokensPerInterval": 100, "intervalMs": 60000 }
    }
  }
}
```

Then run:
```bash
yarn build && node dist/cli.js mcp --mode stdio -c config.json
```

### Docker with All Tools
```bash
docker run -it --rm \
  -e APP_ID=your_app_id \
  -e APP_SECRET=your_app_secret \
  -e LARK_TOOLS="preset.complete.all" \
  lark-mcp:latest
```

## ⚡ Performance Considerations

When activating all tools:

1. **Memory Usage**: ~300-400MB with all tools loaded
2. **Startup Time**: ~2-3 seconds to initialize all tools
3. **Rate Limiting**: Adjust limits for high tool usage:
   ```bash
   --rate-limit-requests 200 --rate-limit-writes 50
   ```

4. **Caching**: Enable caching for better performance:
   ```bash
   --enable-cache
   ```

## 🔒 Required Permissions

Ensure your Lark/Feishu app has ALL necessary permissions:

### Essential Permissions
- `im:message` - Send messages
- `im:chat` - Manage chats
- `contact:user.base:readonly` - Read user information
- `bitable:app` - Create and manage bases
- `drive:drive` - File operations
- `docs:doc` - Document operations
- `wiki:wiki` - Wiki operations
- `calendar:calendar` - Calendar access
- `task:task` - Task management

### Advanced Permissions
- `approval:approval` - Approval workflows
- `vc:meeting_room` - Meeting room booking
- `hr:employee` - HR operations
- `okr:okr` - OKR management
- Admin permissions for enterprise features

## 📊 Monitoring Tool Usage

### View Active Tools
```typescript
const activeTool = mcpTool.getTools();
console.log(`Total active tools: ${activeTools.length}`);
```

### Tool Execution Metrics
```typescript
const metrics = coordinator.getToolExecutionMetrics();
console.log('Tool usage statistics:', metrics);
```

### ML Tool Recommendations
```typescript
const recommendations = await coordinator.getToolRecommendations({
  task: 'Your task description',
  topK: 10
});
```

## 🚨 Troubleshooting

### Issue: "Tool not found"
- Ensure the tool name is correct
- Check if app has required permissions
- Verify tool is included in selected preset

### Issue: "Rate limit exceeded"
- Increase rate limits: `--rate-limit-requests 500`
- Enable caching for repeated operations
- Use batch operations where available

### Issue: "Permission denied"
- Check app permissions in Lark/Feishu console
- Some tools require admin approval
- Verify user token has necessary scopes

## 🎯 Best Practices

1. **Start with Presets**: Use appropriate presets instead of all tools
2. **Enable Caching**: Use cached tools for frequently accessed data
3. **Monitor Performance**: Track tool execution metrics
4. **Use ML Recommendations**: Let the system suggest optimal tools
5. **Implement Circuit Breakers**: Protect against tool failures

## 📚 Additional Resources

- [Tool Documentation](docs/tools-en.md)
- [API Reference](docs/API_REFERENCE.md)
- [Performance Guide](docs/PERFORMANCE_TUNING.md)
- [Security Guide](docs/SECURITY_GUIDE.md)

---

**Note**: Activating all tools requires comprehensive app permissions. Ensure your Lark/Feishu app is properly configured with all necessary scopes before attempting to use all tools.