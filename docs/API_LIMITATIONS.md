# Lark API Limitations and Workarounds

This comprehensive guide documents known limitations, constraints, and practical workarounds for the Lark/Feishu OpenAPI when using the MCP enhanced tools.

## 📋 Table of Contents
- [Rate Limiting](#-rate-limiting)
- [Authentication & Tokens](#-authentication--tokens)
- [Data Size & Volume](#-data-size--volume)
- [API Endpoint Limitations](#-api-endpoint-limitations)
- [Permissions & Scopes](#-permissions--scopes)
- [Regional & Network](#-regional--network)
- [File & Media Operations](#-file--media-operations)
- [Business Logic Constraints](#-business-logic-constraints)
- [Performance Considerations](#-performance-considerations)
- [Best Practices Summary](#-best-practices-summary)

## 🚫 Rate Limiting

### **API Request Limits**
Lark APIs have strict rate limiting to prevent abuse and ensure service stability.

#### **Default Limits**
| Operation Type | Limit | Time Window | Recovery |
|---------------|-------|-------------|----------|
| **General API** | 100 requests | 1 minute | Linear |
| **Write Operations** | 20 requests | 1 minute | Linear |
| **Admin Operations** | 5 requests | 1 minute | Linear |
| **File Upload** | 10 uploads | 1 minute | Linear |
| **Batch Operations** | 5 batches | 1 minute | Linear |

#### **Rate Limit Headers**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95  
X-RateLimit-Reset: 1640995200
X-Tt-Logid: 20211231120000123456789
```

#### **Error Responses**
```json
{
  "code": 19001,
  "msg": "rate limited",
  "data": {
    "retry_after": 60
  }
}
```

### **🔧 Workarounds**

#### **1. Built-in Rate Limiting** (Recommended)
```javascript
// Enable intelligent rate limiting
const client = new LarkMcpTool({
  appId: 'your_app_id',
  appSecret: 'your_app_secret',
  rateLimiting: {
    enabled: true,
    rateLimits: {
      default: { capacity: 80, tokensPerInterval: 40, intervalMs: 60000 },
      write: { capacity: 15, tokensPerInterval: 8, intervalMs: 60000 },
      admin: { capacity: 3, tokensPerInterval: 2, intervalMs: 60000 }
    }
  }
});
```

#### **2. Exponential Backoff**
```javascript
async function apiCallWithBackoff(apiCall, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.code === 19001 && i < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, i), 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

#### **3. Request Batching**
```javascript
// Instead of individual calls
const users = await Promise.all([
  client.contact.v3.user.get({ user_id: "user1" }),
  client.contact.v3.user.get({ user_id: "user2" }),
  client.contact.v3.user.get({ user_id: "user3" })
]);

// Use batch operation
const users = await client.contact.v3.user.batchGetId({
  user_ids: ["user1", "user2", "user3"]
});
```

## 🔐 Authentication & Tokens

### **Token Limitations**

#### **App Access Token**
- **Lifetime**: 2 hours
- **Scope**: App-level permissions only
- **Auto-refresh**: Handled automatically by SDK
- **Concurrent Limit**: No explicit limit

#### **User Access Token**  
- **Lifetime**: 2 hours (some regions: 24 hours)
- **Refresh Token**: 30 days lifetime
- **Scope**: User-level permissions
- **Concurrent Sessions**: Limited per user

#### **Tenant Access Token**
- **Lifetime**: 2 hours
- **Scope**: Tenant-wide operations
- **Usage**: High-privilege operations

### **🔧 Workarounds**

#### **1. Token Caching with TTL**
```javascript
// Built-in token caching (110-minute TTL)
import { cache, CacheCategory } from './utils/cache-manager';

// Cache app tokens near expiration
cache.setAppToken(appId, tokenData);
const cachedToken = cache.getAppToken(appId);
```

#### **2. Proactive Token Refresh**
```javascript
// Refresh tokens before expiration
setInterval(async () => {
  try {
    await client.auth.v3.appAccessToken.internal();
    console.log('Token refreshed proactively');
  } catch (error) {
    console.error('Token refresh failed:', error);
  }
}, 110 * 60 * 1000); // Refresh after 110 minutes
```

#### **3. Token Validation**
```javascript
async function validateToken(client) {
  try {
    await client.auth.v3.appAccessToken.internal();
    return true;
  } catch (error) {
    if (error.code === 99991663) {
      // Token expired, refresh needed
      return false;
    }
    throw error;
  }
}
```

## 📊 Data Size & Volume

### **Size Limitations**

#### **Message Content**
- **Text Messages**: 30,000 characters max
- **Rich Text**: 100KB max (including formatting)
- **Card Messages**: 50KB max JSON payload
- **File Attachments**: 200MB max per file

#### **Bitable Operations**
- **Records per Request**: 500 max for batch operations
- **Field Value Size**: 50KB max per field
- **Table Size**: 1 million records max per table
- **Base Size**: 100 tables max per base

#### **API Response Size**
- **General Response**: 10MB max
- **File Download**: No explicit limit
- **Pagination**: 200 items max per page

### **🔧 Workarounds**

#### **1. Chunked Processing**
```javascript
// Process large datasets in chunks
async function processLargeDataset(data, chunkSize = 100) {
  const results = [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const chunkResults = await processBatch(chunk);
    results.push(...chunkResults);
    
    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}
```

#### **2. Content Truncation**
```javascript
function truncateMessage(content, maxLength = 29000) {
  if (content.length <= maxLength) return content;
  
  return content.substring(0, maxLength - 100) + 
         '\n\n[Content truncated due to size limit]';
}
```

#### **3. Pagination Handling**
```javascript
async function getAllRecords(client, params) {
  const allRecords = [];
  let pageToken = '';
  
  do {
    const response = await client.bitable.v1.appTableRecord.list({
      ...params,
      page_token: pageToken,
      page_size: 200  // Maximum allowed
    });
    
    allRecords.push(...response.data.items);
    pageToken = response.data.page_token;
  } while (pageToken);
  
  return allRecords;
}
```

## 🔌 API Endpoint Limitations

### **Unavailable Operations**

#### **File Management**
- **Direct file upload via API**: Limited file type support
- **File preview generation**: Not available via API
- **Bulk file operations**: Not supported
- **File versioning**: Limited API access

#### **Advanced Calendar Features**
- **Calendar sync with external systems**: Limited
- **Complex recurring event patterns**: Partial support
- **Meeting room resource management**: Basic API only

#### **Real-time Features**
- **WebSocket connections**: Not provided
- **Push notifications**: Limited to webhook events
- **Live collaboration**: Read-only API access

### **🔧 Workarounds**

#### **1. Alternative File Handling**
```javascript
// Use external file storage with Lark references
async function handleLargeFile(fileData) {
  // Upload to external storage (S3, etc.)
  const externalUrl = await uploadToExternalStorage(fileData);
  
  // Store reference in Lark
  await client.im.v1.message.create({
    receive_id_type: 'chat_id',
    receive_id: chatId,
    content: {
      text: `File uploaded: ${externalUrl}`
    }
  });
}
```

#### **2. Webhook Event Handling**
```javascript
// Set up webhook for real-time events
app.post('/lark-webhook', (req, res) => {
  const event = req.body;
  
  switch (event.header.event_type) {
    case 'im.message.receive_v1':
      handleMessageReceived(event.event);
      break;
    case 'application.bot.menu_v6':
      handleBotMenu(event.event);
      break;
  }
  
  res.json({ code: 0 });
});
```

#### **3. Polling for Updates**
```javascript
// Poll for changes when real-time isn't available
async function pollForUpdates(lastCheckTime) {
  const messages = await client.im.v1.message.list({
    container_id_type: 'chat',
    container_id: chatId,
    start_time: lastCheckTime
  });
  
  return messages.data.items.filter(
    msg => msg.create_time > lastCheckTime
  );
}
```

## 🔒 Permissions & Scopes

### **Permission Hierarchy**

#### **App Permissions**
- **im:message**: Send/receive messages
- **bitable:app**: Create/modify bases
- **contact:user.base:readonly**: Read user info
- **drive:drive**: File operations
- **calendar:calendar**: Calendar access

#### **User Permissions**
- **Inherits from app**: Plus user-specific access
- **Org restrictions**: Limited by admin policies
- **Resource ownership**: Access to owned resources only

#### **Admin Permissions**
- **Organization management**: Full admin access required
- **Security settings**: Super admin only
- **Billing operations**: Financial admin access

### **🔧 Workarounds**

#### **1. Permission Checking**
```javascript
async function checkPermissions(client, requiredPermissions) {
  try {
    // Test API call that requires permission
    await client.contact.v3.user.list({ page_size: 1 });
    return true;
  } catch (error) {
    if (error.code === 99991664) {
      console.error('Insufficient permissions:', requiredPermissions);
      return false;
    }
    throw error;
  }
}
```

#### **2. Graceful Degradation**
```javascript
async function getUserInfoWithFallback(userId) {
  try {
    // Try full user info (requires higher permissions)
    return await client.contact.v3.user.get({ user_id: userId });
  } catch (error) {
    if (error.code === 99991664) {
      // Fall back to basic info
      return await client.contact.v3.user.batchGetId({
        user_ids: [userId]
      });
    }
    throw error;
  }
}
```

#### **3. Permission Request Guidance**
```javascript
const REQUIRED_PERMISSIONS = {
  messaging: ['im:message', 'im:chat'],
  contacts: ['contact:user.base:readonly'],
  calendar: ['calendar:calendar', 'calendar:calendar.event'],
  files: ['drive:drive', 'drive:file:readonly'],
  admin: ['contact:contact', 'admin:admin']
};

function getPermissionUrl(permissions) {
  const baseUrl = 'https://open.larksuite.com/app';
  return `${baseUrl}?tab=permission&permissions=${permissions.join(',')}`;
}
```

## 🌐 Regional & Network

### **Regional Limitations**

#### **Domain Differences**
- **Global**: `open.larksuite.com`
- **China**: `open.feishu.cn`  
- **Custom/Enterprise**: Custom domains
- **API Compatibility**: 95% compatible across regions

#### **Feature Availability**
- **AI Features**: Limited in some regions
- **Third-party Integrations**: Regional restrictions
- **File Storage**: Local data residency requirements

### **🔧 Workarounds**

#### **1. Automatic Domain Detection**
```javascript
function getDomainForRegion(region = 'auto') {
  const domains = {
    'global': 'https://open.larksuite.com',
    'china': 'https://open.feishu.cn',
    'auto': detectRegionDomain()
  };
  
  return domains[region] || domains.global;
}

function detectRegionDomain() {
  // Check user's timezone or IP-based detection
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return timezone.includes('Asia/Shanghai') ? 
    'https://open.feishu.cn' : 'https://open.larksuite.com';
}
```

#### **2. Network Proxy Configuration**
```javascript
// Configure proxy for corporate networks
const client = new LarkMcpTool({
  appId: 'your_app_id',
  appSecret: 'your_app_secret',
  httpInstance: axios.create({
    proxy: {
      host: 'proxy.company.com',
      port: 8080,
      auth: {
        username: 'user',
        password: 'pass'
      }
    }
  })
});
```

#### **3. Connectivity Testing**
```javascript
async function testConnectivity(domain) {
  try {
    const response = await fetch(`${domain}/open-apis/auth/v3/app_access_token/internal`, {
      method: 'HEAD',
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}
```

## 📁 File & Media Operations

### **File Operation Constraints**

#### **Upload Limitations**
- **File Size**: 200MB max per file
- **File Types**: Whitelist-based filtering
- **Concurrent Uploads**: 5 max simultaneous
- **Daily Quota**: Varies by subscription

#### **Download Limitations**
- **Expiring URLs**: 24-hour validity
- **Access Control**: Owner/permission based
- **Bandwidth**: Throttled for large files

#### **Processing Limitations**
- **Image Processing**: Basic resize/crop only
- **Document Preview**: Limited format support
- **Video Processing**: Not available

### **🔧 Workarounds**

#### **1. Chunked File Upload**
```javascript
async function uploadLargeFile(file, chunkSize = 10 * 1024 * 1024) {
  if (file.size <= chunkSize) {
    return await standardUpload(file);
  }
  
  // Implement chunked upload logic
  const chunks = Math.ceil(file.size / chunkSize);
  const uploadId = generateUploadId();
  
  for (let i = 0; i < chunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    
    await uploadChunk(uploadId, i, chunk);
  }
  
  return await finalizeUpload(uploadId);
}
```

#### **2. External File Storage**
```javascript
// Use external storage for large/unsupported files
async function handleUnsupportedFile(file) {
  // Upload to S3/CloudFlare/etc.
  const externalUrl = await uploadToExternal(file);
  
  // Create Lark message with link
  return await client.im.v1.message.create({
    receive_id_type: 'chat_id',
    receive_id: chatId,
    content: {
      text: `📎 File: ${file.name}\n🔗 Download: ${externalUrl}`
    }
  });
}
```

#### **3. File Type Validation**
```javascript
const SUPPORTED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif',
  'application/pdf', 'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

function validateFileType(file) {
  if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }
  return true;
}
```

## 🏢 Business Logic Constraints

### **Organizational Limits**

#### **User Management**
- **Maximum Users**: Varies by subscription
- **Department Depth**: 10 levels max
- **Group Size**: 500 members max for regular groups
- **Admin Roles**: Limited custom role creation

#### **Content Limits**
- **Spaces per User**: 1000 max
- **Bases per Space**: 100 max  
- **Tables per Base**: 100 max
- **Records per Table**: 1 million max

#### **Integration Limits**
- **Apps per Tenant**: 100 max
- **Webhooks per App**: 10 max
- **API Keys**: 5 max per app

### **🔧 Workarounds**

#### **1. Hierarchical Data Management**
```javascript
// Implement virtual hierarchy for deep structures
async function createVirtualDepartment(parentId, depth, name) {
  if (depth > 10) {
    // Store deep hierarchy in custom field
    return await storeInCustomField(parentId, {
      virtualPath: `${getPath(parentId)}/${name}`,
      level: depth
    });
  }
  
  return await client.contact.v3.department.create({
    parent_department_id: parentId,
    name: name
  });
}
```

#### **2. Data Archiving Strategy**
```javascript
// Archive old records to stay within limits
async function archiveOldRecords(tableId, archiveAfterDays = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - archiveAfterDays);
  
  const oldRecords = await client.bitable.v1.appTableRecord.search({
    app_token: appToken,
    table_id: tableId,
    filter: {
      conditions: [{
        field_name: 'created_time',
        operator: 'isLess',
        value: [cutoffDate.getTime()]
      }]
    }
  });
  
  // Export to external storage
  await exportToArchive(oldRecords.data.items);
  
  // Delete from Lark
  await batchDeleteRecords(oldRecords.data.items);
}
```

## ⚡ Performance Considerations

### **Performance Limitations**

#### **API Response Times**
- **Simple Queries**: 100-300ms typical
- **Complex Queries**: 500-2000ms
- **Batch Operations**: 1-5 seconds
- **File Operations**: 2-30 seconds

#### **Concurrent Operations**
- **Per App**: 10 concurrent requests recommended
- **Per User**: 5 concurrent requests max
- **Global**: Subject to rate limiting

### **🔧 Optimization Strategies**

#### **1. Intelligent Caching** (Implemented)
```javascript
// Use built-in caching for performance
import { cache } from './utils/cache-manager';

// Cache frequently accessed data
const userData = await cache.getOrFetch(
  CacheCategory.USER_INFO,
  userId,
  () => client.contact.v3.user.get({ user_id: userId }),
  30 * 60 * 1000  // 30-minute TTL
);
```

#### **2. Request Batching**
```javascript
// Batch multiple operations
async function batchOperations(operations) {
  const batches = chunk(operations, 10);  // 10 per batch
  const results = [];
  
  for (const batch of batches) {
    const batchResults = await Promise.allSettled(
      batch.map(op => executeOperation(op))
    );
    results.push(...batchResults);
    
    // Rate limiting delay
    await delay(1000);
  }
  
  return results;
}
```

#### **3. Connection Pooling**
```javascript
// Reuse HTTP connections
const client = new LarkMcpTool({
  appId: 'your_app_id',
  appSecret: 'your_app_secret',
  httpInstance: axios.create({
    timeout: 30000,
    keepAlive: true,
    maxSockets: 10
  })
});
```

## 📋 Best Practices Summary

### **🔧 Implementation Guidelines**

#### **1. Error Handling**
```javascript
// Comprehensive error handling
try {
  const result = await apiCall();
  return result;
} catch (error) {
  switch (error.code) {
    case 19001:  // Rate limited
      await delay(error.data.retry_after * 1000);
      return await apiCallWithBackoff(apiCall);
    case 99991663:  // Invalid token
      await refreshToken();
      return await apiCall();
    case 99991664:  // Insufficient permissions
      throw new PermissionError('Contact admin for required permissions');
    default:
      throw error;
  }
}
```

#### **2. Resource Management**
```javascript
// Monitor and manage resources
setInterval(async () => {
  const metrics = client.getCacheMetrics();
  const rateLimits = client.getRateLimitMetrics();
  
  console.log('Cache hit ratio:', metrics.metrics.hitRatio);
  console.log('Rate limit status:', rateLimits);
  
  // Cleanup if needed
  if (metrics.stats.size > 1800) {
    client.clearCache(CacheCategory.API_RESPONSES);
  }
}, 60000);
```

#### **3. Configuration Management**
```javascript
// Environment-based configuration
const config = {
  domain: process.env.LARK_DOMAIN || 'https://open.larksuite.com',
  rateLimit: {
    enabled: process.env.NODE_ENV === 'production',
    requests: parseInt(process.env.RATE_LIMIT_REQUESTS) || 50,
    writes: parseInt(process.env.RATE_LIMIT_WRITES) || 10
  },
  cache: {
    size: parseInt(process.env.CACHE_SIZE) || 2000,
    ttl: parseInt(process.env.CACHE_TTL) || 900000
  }
};
```

### **📊 Monitoring & Alerting**
```javascript
// Set up monitoring
function setupMonitoring(client) {
  // Monitor rate limits
  setInterval(() => {
    const metrics = client.getRateLimitMetrics();
    Object.entries(metrics).forEach(([tier, data]) => {
      if (data.tokensRemaining < data.capacity * 0.1) {
        console.warn(`Rate limit warning: ${tier} tier at ${data.tokensRemaining}/${data.capacity}`);
      }
    });
  }, 30000);
  
  // Monitor cache performance
  setInterval(() => {
    const cache = client.getCacheMetrics();
    if (cache.metrics.hitRatio < 0.7) {
      console.warn(`Low cache hit ratio: ${cache.metrics.hitRatio}`);
    }
  }, 300000);
}
```

### **🎯 Quick Reference**

#### **Rate Limits**
- General: 100/min
- Writes: 20/min  
- Admin: 5/min
- Use built-in rate limiting: `rateLimiting: { enabled: true }`

#### **Token Management**
- Refresh before 2-hour expiration
- Cache tokens with 110-minute TTL
- Handle 99991663 error code for expired tokens

#### **Data Constraints**
- Messages: 30K characters max
- Files: 200MB max
- Batch operations: 500 records max
- API responses: 10MB max

#### **Performance**
- Use caching for frequently accessed data
- Batch operations when possible
- Implement exponential backoff for retries
- Monitor hit ratios and response times

This comprehensive guide helps developers understand and work effectively within Lark API constraints while maximizing performance and reliability! 🚀