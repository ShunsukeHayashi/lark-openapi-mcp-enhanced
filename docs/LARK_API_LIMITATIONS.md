# Lark API Limitations and Workarounds

## Overview

This document outlines known limitations, restrictions, and workarounds for the Lark/Feishu OpenAPI when using the MCP (Model Context Protocol) integration. Understanding these limitations is crucial for successful implementation and avoiding common pitfalls.

## 🚨 Critical Limitations

### 1. File Operations (Not Supported)

**Limitation**: File and image upload/download functionality is not supported in the current implementation.

**Impact**: 
- Cannot programmatically upload files to Lark Drive
- Cannot download files from Lark Drive
- Image processing operations are unavailable

**Workaround**: 
- Use Lark's web interface for file operations
- Plan for manual file uploads in workflows
- Future versions will support file operations

**Reference**: `README.md:408-409`

### 2. Link Field Creation Constraints

**Limitation**: Link fields cannot be created programmatically in certain contexts and require specific setup order.

**Impact**:
- Link fields must be created **after** target tables exist
- Cannot create bidirectional links in a single API call
- Complex relationship setup requires multiple API calls

**Workaround**:
```typescript
// Step 1: Create base tables first
await createTable({ name: 'Customers' });
await createTable({ name: 'Orders' });

// Step 2: Create link field after both tables exist
await createField({
  tableId: 'customers_table_id',
  fieldName: 'orders',
  fieldType: 'link',
  linkedTableId: 'orders_table_id'
});
```

**Reference**: `error-handling-guide.md:89-103`

### 3. Relationship Field Manual Setup Requirements

**Limitation**: Complex relationship fields require manual configuration and cannot be fully automated.

**Impact**:
- One-to-many relationships need manual setup
- Many-to-many relationships require intermediate tables
- Rollup fields must be configured last
- Field creation order is critical

**Workaround**:
```typescript
// Recommended field creation order:
// 1. Basic fields (text, number, date)
// 2. Single select fields
// 3. Link fields (after target tables exist)
// 4. Rollup fields (last)

const fieldCreationOrder = [
  'text', 'number', 'datetime', 'single_select',
  'link', 'rollup'
];
```

**Manual Steps Required**:
1. Create base tables
2. Create basic fields
3. Manually configure link relationships in Lark UI
4. Set up rollup calculations
5. Configure view filters and sorting

## ⏱️ Rate Limiting and Performance

### API Rate Limits

**Default Limits**:
- General API calls: **50 requests per minute**
- Write operations: **10 writes per minute**  
- Read operations: **100 reads per minute**
- Administrative operations: **2 admin operations per minute**

**Error Handling**:
```typescript
// Rate limit exceeded errors handled with exponential backoff
const rateLimitConfig = {
  default: { capacity: 100, tokensPerInterval: 50, intervalMs: 60000 },
  write: { capacity: 20, tokensPerInterval: 10, intervalMs: 60000 },
  read: { capacity: 200, tokensPerInterval: 100, intervalMs: 60000 },
  admin: { capacity: 5, tokensPerInterval: 2, intervalMs: 60000 }
};
```

**Workarounds**:
- Implement request batching for bulk operations
- Use read-heavy operations during off-peak hours
- Cache frequently accessed data
- Monitor rate limit metrics: `client.getRateLimitMetrics()`

**Reference**: `src/utils/rate-limited-http.ts`

### Token Limit Exceeded

**Issue**: Large API tool sets can exceed token limits in AI models.

**Solution**: 
```bash
# Use selective API enabling
lark-mcp --tools preset.light  # 10 tools
lark-mcp --tools preset.default  # 19 tools

# Or use models with larger token limits
lark-mcp --model claude-3.5-sonnet  # Supports more tokens
```

**Reference**: `README.md:417-418`

## 🔐 Authentication and Permissions

### User Access Token Expiry

**Limitation**: User access tokens expire after **2 hours**.

**Impact**:
- Frequent token refresh required
- Operations may fail mid-process
- No automatic refresh mechanism

**Workaround**:
```typescript
// Implement token refresh logic
class TokenManager {
  async refreshUserToken() {
    if (this.isTokenExpired()) {
      this.userToken = await this.getNewUserToken();
    }
  }
  
  isTokenExpired() {
    return Date.now() > this.tokenExpiry;
  }
}
```

**Reference**: `README.md:402-404`

### Permission Configuration

**Limitation**: Many operations require manual permission approval in Lark Developer Console.

**Required Permissions**:
- `bitable:app` - Create and manage Base applications
- `im:message` - Send messages
- `im:chat` - Manage chats
- `contact:user.base:readonly` - Read user information
- `drive:drive` - File operations (when supported)

**Manual Steps**:
1. Visit Lark Developer Console
2. Configure required permissions
3. Submit for approval (may take 1-2 business days)
4. Wait for admin approval
5. Test permissions before production use

**Reference**: `README.md:405-407`

## 🏗️ Field Type Limitations

### Supported Field Types

**✅ Fully Supported**:
- Text (`text`)
- Number (`number`)
- Date (`datetime`)
- Single Select (`single_select`)
- Auto Number (`auto_number`)

**⚠️ Partially Supported**:
- Link (`link`) - Requires manual setup order
- Rollup (`rollup`) - Must be configured last

**❌ Not Supported**:
- Multiple Select (programmatic creation limited)
- Attachment fields
- Formula fields (complex formulas)
- Lookup fields across multiple bases

**Workaround**:
```typescript
// Create fields in specific order
async function createTableWithFields(tableConfig) {
  const table = await createTable(tableConfig.name);
  
  // Step 1: Basic fields
  for (const field of tableConfig.basicFields) {
    await createField(table.id, field);
  }
  
  // Step 2: Link fields (after target tables exist)
  for (const linkField of tableConfig.linkFields) {
    await createField(table.id, linkField);
  }
  
  // Step 3: Rollup fields (last)
  for (const rollupField of tableConfig.rollupFields) {
    await createField(table.id, rollupField);
  }
}
```

## 🤖 Genesis System Limitations

### Simulation Mode Only

**Limitation**: Genesis AI tools currently operate in simulation mode and don't make actual API calls.

**Impact**:
- Generated responses are examples only
- Cannot create real Lark Base structures
- Requires manual implementation of generated designs

**Current Capabilities**:
- Plan base structure
- Design views and dashboards
- Prototype automation workflows
- Generate documentation

**Workaround**:
```typescript
// Use Genesis for planning, then implement manually
const plan = await genesis.generateBasePlan(requirements);
// Manual implementation required:
const base = await larkClient.createBase(plan.baseSchema);
```

**Reference**: `GENESIS_USAGE_GUIDE.md:125-137`

## 🔄 Error Recovery and Rollback

### Limited Automated Rollback

**Limitation**: No comprehensive rollback mechanism for failed operations.

**Error Types**:
- `timeout` - Network timeout issues
- `rate_limit` - API rate limiting
- `permission_error` - Authorization failures
- `validation_error` - Data validation issues
- `api_error` - General API failures

**Recovery Strategies**:
```typescript
// Implement checkpoint system
class OperationCheckpoint {
  async executeWithCheckpoint(operation) {
    const checkpoint = await this.createCheckpoint();
    try {
      return await operation();
    } catch (error) {
      await this.rollbackToCheckpoint(checkpoint);
      throw error;
    }
  }
}
```

**Manual Intervention Required**:
- Permission errors need admin approval
- Complex relationship failures require manual cleanup
- Data corruption requires manual data recovery

**Reference**: `src/genesis/systems/error-recovery.ts`

## 🌐 Cross-Platform Issues

### Windows UTF-8 Encoding

**Issue**: Command line displays garbled characters in Windows environment.

**Solution**: 
```cmd
chcp 65001
```

**Reference**: `README.md:411-413`

### macOS Spotlight Conflicts

**Issue**: Spotlight indexing conflicts with `.claude*` files.

**Solution**: Add `.claude*` files to Spotlight Privacy settings.

## 💡 Best Practices and Workarounds

### 1. Batch Operations

```typescript
// Instead of individual API calls
for (const item of items) {
  await createItem(item);  // ❌ Slow, hits rate limits
}

// Use batch operations
await createItemsBatch(items);  // ✅ Faster, fewer API calls
```

### 2. Error Handling Pattern

```typescript
async function robustApiCall(operation) {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      if (error.code === 'rate_limit') {
        await delay(Math.pow(2, attempt) * 1000);  // Exponential backoff
        attempt++;
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

### 3. Field Creation Order

```typescript
const FIELD_CREATION_ORDER = [
  'text', 'number', 'datetime', 'single_select',
  'auto_number', 'link', 'rollup'
];

async function createFieldsInOrder(tableId, fields) {
  const sortedFields = fields.sort((a, b) => 
    FIELD_CREATION_ORDER.indexOf(a.type) - FIELD_CREATION_ORDER.indexOf(b.type)
  );
  
  for (const field of sortedFields) {
    await createField(tableId, field);
  }
}
```

### 4. Token Management

```typescript
class TokenManager {
  constructor() {
    this.tokenRefreshInterval = 90 * 60 * 1000; // 90 minutes
    this.startTokenRefresh();
  }
  
  startTokenRefresh() {
    setInterval(async () => {
      await this.refreshUserToken();
    }, this.tokenRefreshInterval);
  }
}
```

## 📊 Monitoring and Debugging

### Rate Limit Monitoring

```typescript
// Monitor API usage
const metrics = client.getRateLimitMetrics();
console.log('API calls remaining:', metrics.remaining);
console.log('Reset time:', metrics.resetTime);
```

### Error Logging

```typescript
// Structured error logging
const errorLogger = {
  logApiError(error, context) {
    console.error({
      type: 'api_error',
      code: error.code,
      message: error.message,
      context: context,
      timestamp: new Date().toISOString()
    });
  }
};
```

## 🔮 Future Improvements

### Planned Features

1. **File Operations**: Upload/download support in future versions
2. **Enhanced Genesis**: Real API implementation (not simulation)
3. **Automated Rollback**: Comprehensive error recovery
4. **Token Auto-refresh**: Automatic user token renewal
5. **Batch Operations**: More efficient bulk operations
6. **Advanced Field Types**: Support for complex field types

### Version Roadmap

- **v0.5.0**: File operations support
- **v0.6.0**: Genesis real API implementation
- **v0.7.0**: Enhanced error recovery
- **v1.0.0**: Full feature parity with Lark web interface

## 📞 Support and Troubleshooting

### Common Issues and Solutions

1. **"Permission denied"** → Check Developer Console permissions
2. **"Rate limit exceeded"** → Implement rate limiting and retries
3. **"Invalid field type"** → Check supported field types list
4. **"Token expired"** → Implement token refresh mechanism
5. **"Base creation failed"** → Follow step-by-step creation order

### Getting Help

- Check the troubleshooting guide: `README.md` section
- Review error handling guide: `error-handling-guide.md`
- Submit issues on GitHub with detailed error logs
- Join the community discussions for best practices

---

*This document is maintained alongside the codebase. Please update when new limitations are discovered or workarounds are developed.*