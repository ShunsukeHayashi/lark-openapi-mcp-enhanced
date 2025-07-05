# Lark API Error Codes & Solutions

Complete reference guide for Lark/Feishu API error codes with practical solutions and code examples.

## 📋 Table of Contents
- [Authentication Errors (999xx)](#-authentication-errors-999xx)
- [Rate Limiting Errors (190xx)](#-rate-limiting-errors-190xx)
- [Permission Errors (992xx)](#-permission-errors-992xx)
- [Validation Errors (124xx)](#-validation-errors-124xx)
- [Resource Errors (230xx)](#-resource-errors-230xx)
- [System Errors (999xx)](#-system-errors-999xx)
- [Business Logic Errors (100xx)](#-business-logic-errors-100xx)
- [Network & Connectivity](#-network--connectivity)
- [Error Handling Patterns](#-error-handling-patterns)

## 🔐 Authentication Errors (999xx)

### **99991663 - Invalid App Access Token**
**Cause**: App access token is expired, invalid, or malformed.

**Common Scenarios**:
- Token expired after 2 hours
- Invalid app credentials
- Token corruption during storage

**Solution**:
```javascript
// Automatic token refresh
async function handleInvalidToken(error, client) {
  if (error.code === 99991663) {
    console.log('Token expired, refreshing...');
    
    try {
      // Force token refresh
      await client.auth.v3.appAccessToken.internal();
      
      // Retry original operation
      return await retryOperation();
    } catch (refreshError) {
      throw new Error('Token refresh failed: Check app credentials');
    }
  }
}

// Proactive token management
setInterval(async () => {
  await client.auth.v3.appAccessToken.internal();
}, 110 * 60 * 1000); // Refresh every 110 minutes
```

### **99991664 - Invalid App Secret**
**Cause**: App secret is incorrect or app doesn't exist.

**Solution**:
```javascript
// Validate credentials
function validateCredentials(appId, appSecret) {
  if (!appId || !appId.startsWith('cli_')) {
    throw new Error('Invalid APP_ID format. Must start with "cli_"');
  }
  
  if (!appSecret || appSecret.length < 32) {
    throw new Error('Invalid APP_SECRET format');
  }
  
  return true;
}

// Environment variable validation
const appId = process.env.APP_ID;
const appSecret = process.env.APP_SECRET;

if (!appId || !appSecret) {
  console.error('Missing credentials. Set APP_ID and APP_SECRET environment variables.');
  console.error('Get credentials from: https://open.larksuite.com/app');
  process.exit(1);
}
```

### **99991665 - Invalid User Access Token**
**Cause**: User access token is expired or invalid.

**Solution**:
```javascript
// User token refresh flow
async function refreshUserToken(refreshToken) {
  try {
    const response = await client.auth.v3.userAccessToken.refresh({
      refresh_token: refreshToken
    });
    
    return {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in
    };
  } catch (error) {
    if (error.code === 99991665) {
      // Refresh token also expired - need re-authorization
      throw new Error('User re-authorization required');
    }
    throw error;
  }
}
```

### **99991660 - App Not Found**
**Cause**: App ID doesn't exist or app is disabled.

**Solution**:
```javascript
// App status validation
async function validateAppStatus(appId) {
  try {
    await client.auth.v3.appAccessToken.internal();
    console.log('✅ App is active and accessible');
    return true;
  } catch (error) {
    if (error.code === 99991660) {
      console.error('❌ App not found or disabled');
      console.error('Solutions:');
      console.error('1. Verify APP_ID is correct');
      console.error('2. Check app status in Lark Admin Console');
      console.error('3. Ensure app is published/enabled');
      return false;
    }
    throw error;
  }
}
```

## ⚡ Rate Limiting Errors (190xx)

### **19001 - Rate Limited**
**Cause**: Too many requests within the time window.

**Response Structure**:
```json
{
  "code": 19001,
  "msg": "rate limited",
  "data": {
    "retry_after": 60
  }
}
```

**Solution**:
```javascript
// Exponential backoff with rate limit handling
async function handleRateLimit(apiCall, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.code === 19001) {
        const retryAfter = error.data?.retry_after || Math.pow(2, attempt);
        console.log(`Rate limited. Waiting ${retryAfter}s before retry ${attempt + 1}/${maxRetries}`);
        
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded for rate limited request');
}

// Built-in rate limiting (recommended)
const client = new LarkMcpTool({
  appId: 'your_app_id',
  appSecret: 'your_app_secret',
  rateLimiting: {
    enabled: true,
    rateLimits: {
      default: { capacity: 80, tokensPerInterval: 40, intervalMs: 60000 },
      write: { capacity: 15, tokensPerInterval: 8, intervalMs: 60000 }
    }
  }
});
```

### **19002 - QPS Exceeded**
**Cause**: Queries per second limit exceeded.

**Solution**:
```javascript
// Request queue with QPS control
class QPSController {
  constructor(maxQPS = 10) {
    this.maxQPS = maxQPS;
    this.requests = [];
    this.processing = false;
  }
  
  async execute(apiCall) {
    return new Promise((resolve, reject) => {
      this.requests.push({ apiCall, resolve, reject });
      this.processQueue();
    });
  }
  
  async processQueue() {
    if (this.processing || this.requests.length === 0) return;
    
    this.processing = true;
    
    while (this.requests.length > 0) {
      const { apiCall, resolve, reject } = this.requests.shift();
      
      try {
        const result = await apiCall();
        resolve(result);
      } catch (error) {
        reject(error);
      }
      
      // QPS delay
      await new Promise(resolve => setTimeout(resolve, 1000 / this.maxQPS));
    }
    
    this.processing = false;
  }
}

const qpsController = new QPSController(10);
const result = await qpsController.execute(() => client.someApi.call());
```

## 🔒 Permission Errors (992xx)

### **99991664 - Insufficient Permissions**
**Cause**: App or user lacks required permissions for the operation.

**Solution**:
```javascript
// Permission checker
const PERMISSION_MAP = {
  'contact.v3.user.get': 'contact:user.base:readonly',
  'im.v1.message.create': 'im:message',
  'bitable.v1.app.create': 'bitable:app',
  'calendar.v4.event.create': 'calendar:calendar'
};

async function checkPermission(operation) {
  const requiredPermission = PERMISSION_MAP[operation];
  
  try {
    // Test with minimal API call
    await client[operation.split('.').slice(0, -1).join('.')].list({ page_size: 1 });
    return true;
  } catch (error) {
    if (error.code === 99991664) {
      console.error(`Missing permission: ${requiredPermission}`);
      console.error(`Add permission at: https://open.larksuite.com/app`);
      return false;
    }
    throw error;
  }
}

// Graceful permission degradation
async function getUserInfoWithFallback(userId) {
  try {
    // Try full user info
    return await client.contact.v3.user.get({ user_id: userId });
  } catch (error) {
    if (error.code === 99991664) {
      // Fallback to basic info
      console.warn('Using basic user info due to permission limitations');
      return await client.contact.v3.user.batchGetId({ user_ids: [userId] });
    }
    throw error;
  }
}
```

### **99991662 - Access Denied**
**Cause**: User doesn't have access to specific resource.

**Solution**:
```javascript
// Resource access validation
async function validateResourceAccess(resourceType, resourceId, userId) {
  try {
    switch (resourceType) {
      case 'chat':
        await client.im.v1.chat.get({ chat_id: resourceId });
        break;
      case 'base':
        await client.bitable.v1.app.get({ app_token: resourceId });
        break;
      case 'space':
        await client.wiki.v2.space.get({ space_id: resourceId });
        break;
    }
    return true;
  } catch (error) {
    if (error.code === 99991662) {
      console.error(`User ${userId} cannot access ${resourceType}:${resourceId}`);
      return false;
    }
    throw error;
  }
}
```

## ✅ Validation Errors (124xx)

### **12400 - Invalid Parameters**
**Cause**: Request parameters are invalid or malformed.

**Solution**:
```javascript
// Parameter validation
function validateMessageParams(params) {
  const errors = [];
  
  if (!params.receive_id_type || !['open_id', 'union_id', 'email', 'chat_id'].includes(params.receive_id_type)) {
    errors.push('receive_id_type must be one of: open_id, union_id, email, chat_id');
  }
  
  if (!params.receive_id) {
    errors.push('receive_id is required');
  }
  
  if (!params.content) {
    errors.push('content is required');
  }
  
  if (params.content?.text && params.content.text.length > 30000) {
    errors.push('text content exceeds 30,000 character limit');
  }
  
  if (errors.length > 0) {
    throw new Error(`Validation errors: ${errors.join(', ')}`);
  }
  
  return true;
}

// Use validation before API calls
async function sendMessage(params) {
  validateMessageParams(params);
  return await client.im.v1.message.create(params);
}
```

### **12401 - Missing Required Field**
**Cause**: Required field is missing from request.

**Solution**:
```javascript
// Required field checker
function ensureRequiredFields(data, requiredFields) {
  const missing = requiredFields.filter(field => {
    const value = getNestedValue(data, field);
    return value === undefined || value === null || value === '';
  });
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Example usage
const requiredFields = ['receive_id_type', 'receive_id', 'content.text'];
ensureRequiredFields(messageParams, requiredFields);
```

### **12402 - Invalid Field Format**
**Cause**: Field value doesn't match expected format.

**Solution**:
```javascript
// Format validators
const FORMAT_VALIDATORS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  open_id: /^ou_[a-f0-9]+$/,
  chat_id: /^oc_[a-f0-9]+$/,
  app_token: /^[a-zA-Z0-9]+$/,
  phone: /^\+?[\d\s\-\(\)]+$/
};

function validateFormat(value, type) {
  const validator = FORMAT_VALIDATORS[type];
  if (validator && !validator.test(value)) {
    throw new Error(`Invalid ${type} format: ${value}`);
  }
  return true;
}

// Format-aware API calls
async function getUserByEmail(email) {
  validateFormat(email, 'email');
  
  return await client.contact.v3.user.batchGetId({
    user_id_type: 'email',
    user_ids: [email]
  });
}
```

## 📁 Resource Errors (230xx)

### **23001 - Resource Not Found**
**Cause**: Requested resource doesn't exist.

**Solution**:
```javascript
// Resource existence checker
async function checkResourceExists(resourceType, resourceId) {
  try {
    switch (resourceType) {
      case 'user':
        await client.contact.v3.user.get({ user_id: resourceId });
        break;
      case 'chat':
        await client.im.v1.chat.get({ chat_id: resourceId });
        break;
      case 'base':
        await client.bitable.v1.app.get({ app_token: resourceId });
        break;
      default:
        throw new Error(`Unknown resource type: ${resourceType}`);
    }
    return true;
  } catch (error) {
    if (error.code === 23001) {
      return false;
    }
    throw error;
  }
}

// Safe resource operations
async function safeGetUser(userId) {
  const exists = await checkResourceExists('user', userId);
  if (!exists) {
    console.warn(`User ${userId} not found`);
    return null;
  }
  
  return await client.contact.v3.user.get({ user_id: userId });
}
```

### **23002 - Resource Deleted**
**Cause**: Resource was deleted and is no longer accessible.

**Solution**:
```javascript
// Handle deleted resources
async function handleDeletedResource(error, resourceType, resourceId) {
  if (error.code === 23002) {
    console.warn(`${resourceType} ${resourceId} has been deleted`);
    
    // Clean up references
    await cleanupResourceReferences(resourceType, resourceId);
    
    return null;
  }
  throw error;
}

async function cleanupResourceReferences(resourceType, resourceId) {
  // Remove from cache
  cache.delete(resourceType, resourceId);
  
  // Update local storage/database
  await updateLocalStorage(resourceType, resourceId, { deleted: true });
}
```

## 🔧 System Errors (999xx)

### **99999 - Internal Server Error**
**Cause**: Lark server internal error.

**Solution**:
```javascript
// Retry with exponential backoff
async function handleSystemError(apiCall, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.code === 99999) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        console.log(`System error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('System error persists after maximum retries');
}
```

### **99998 - Service Unavailable**
**Cause**: Lark service is temporarily unavailable.

**Solution**:
```javascript
// Service availability checker
async function checkServiceAvailability() {
  try {
    await client.auth.v3.appAccessToken.internal();
    return true;
  } catch (error) {
    if (error.code === 99998) {
      console.warn('Lark service temporarily unavailable');
      return false;
    }
    throw error;
  }
}

// Circuit breaker pattern
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }
  
  async execute(apiCall) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await apiCall();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
  
  recordFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
  
  reset() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
}
```

## 📊 Business Logic Errors (100xx)

### **10001 - Operation Not Allowed**
**Cause**: Business rule prevents the operation.

**Solution**:
```javascript
// Business rule validation
async function validateBusinessRules(operation, params) {
  switch (operation) {
    case 'create_department':
      // Check department depth limit
      const depth = await getDepartmentDepth(params.parent_department_id);
      if (depth >= 10) {
        throw new Error('Department hierarchy cannot exceed 10 levels');
      }
      break;
      
    case 'add_chat_member':
      // Check group size limit
      const memberCount = await getChatMemberCount(params.chat_id);
      if (memberCount >= 500) {
        throw new Error('Chat group cannot exceed 500 members');
      }
      break;
      
    case 'create_base':
      // Check base count limit
      const baseCount = await getSpaceBaseCount(params.space_id);
      if (baseCount >= 100) {
        throw new Error('Space cannot exceed 100 bases');
      }
      break;
  }
}
```

### **10002 - Resource Limit Exceeded**
**Cause**: Operation would exceed resource limits.

**Solution**:
```javascript
// Resource limit monitoring
async function checkResourceLimits(resourceType, operation) {
  const limits = {
    'table_records': 1000000,
    'file_size': 200 * 1024 * 1024, // 200MB
    'message_length': 30000,
    'batch_size': 500
  };
  
  const currentUsage = await getCurrentUsage(resourceType);
  const limit = limits[resourceType];
  
  if (currentUsage >= limit * 0.9) { // 90% threshold
    console.warn(`Approaching ${resourceType} limit: ${currentUsage}/${limit}`);
  }
  
  if (currentUsage >= limit) {
    throw new Error(`${resourceType} limit exceeded: ${currentUsage}/${limit}`);
  }
}
```

## 🌐 Network & Connectivity

### **Connection Timeout**
**Cause**: Network connectivity issues or slow response.

**Solution**:
```javascript
// Robust network configuration
const client = new LarkMcpTool({
  appId: 'your_app_id',
  appSecret: 'your_app_secret',
  httpInstance: axios.create({
    timeout: 30000, // 30 second timeout
    retry: 3,
    retryDelay: (retryCount) => retryCount * 1000
  })
});

// Connection health check
async function healthCheck() {
  try {
    const start = Date.now();
    await client.auth.v3.appAccessToken.internal();
    const latency = Date.now() - start;
    
    console.log(`✅ Lark API healthy (${latency}ms)`);
    return { healthy: true, latency };
  } catch (error) {
    console.error('❌ Lark API health check failed:', error.message);
    return { healthy: false, error: error.message };
  }
}
```

### **DNS Resolution Errors**
**Cause**: Cannot resolve Lark API domain.

**Solution**:
```javascript
// Domain fallback strategy
const LARK_DOMAINS = [
  'https://open.larksuite.com',
  'https://open.feishu.cn',
  'https://lark-api-backup.com' // Hypothetical backup
];

async function findAvailableDomain() {
  for (const domain of LARK_DOMAINS) {
    try {
      const response = await fetch(`${domain}/open-apis/auth/v3/app_access_token/internal`, {
        method: 'HEAD',
        timeout: 5000
      });
      
      if (response.ok) {
        console.log(`✅ Using domain: ${domain}`);
        return domain;
      }
    } catch (error) {
      console.warn(`❌ Domain unavailable: ${domain}`);
    }
  }
  
  throw new Error('No available Lark API domains');
}
```

## 🛠️ Error Handling Patterns

### **Comprehensive Error Handler**
```javascript
// Universal error handler
async function handleLarkApiError(error, context = {}) {
  const { operation, resourceId, userId, retryCount = 0 } = context;
  
  console.error(`Lark API Error [${error.code}]: ${error.msg}`, {
    operation,
    resourceId,
    userId,
    retryCount
  });
  
  switch (error.code) {
    // Authentication
    case 99991663:
      return await handleTokenRefresh(error, context);
    case 99991664:
      throw new Error('Invalid credentials - check APP_ID and APP_SECRET');
    case 99991665:
      return await handleUserTokenRefresh(error, context);
    
    // Rate limiting
    case 19001:
      return await handleRateLimit(error, context);
    case 19002:
      return await handleQPSLimit(error, context);
    
    // Permissions
    case 99991664:
      return await handlePermissionError(error, context);
    case 99991662:
      return await handleAccessDenied(error, context);
    
    // Validation
    case 12400:
    case 12401:
    case 12402:
      throw new ValidationError(error.msg, error.data);
    
    // Resources
    case 23001:
      return await handleResourceNotFound(error, context);
    case 23002:
      return await handleResourceDeleted(error, context);
    
    // System
    case 99999:
    case 99998:
      return await handleSystemError(error, context);
    
    // Business logic
    case 10001:
    case 10002:
      throw new BusinessLogicError(error.msg, error.data);
    
    default:
      throw new UnknownLarkApiError(error);
  }
}

// Usage
try {
  const result = await client.im.v1.message.create(params);
  return result;
} catch (error) {
  return await handleLarkApiError(error, {
    operation: 'send_message',
    resourceId: params.chat_id,
    userId: params.user_id
  });
}
```

### **Error Recovery Strategies**
```javascript
// Multi-layer error recovery
class ErrorRecoveryManager {
  constructor(client) {
    this.client = client;
    this.retryStrategies = new Map();
    this.setupDefaultStrategies();
  }
  
  setupDefaultStrategies() {
    this.retryStrategies.set(19001, this.rateLimitRetry);
    this.retryStrategies.set(99991663, this.tokenRefreshRetry);
    this.retryStrategies.set(99999, this.exponentialBackoffRetry);
  }
  
  async executeWithRecovery(apiCall, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;
        
        const strategy = this.retryStrategies.get(error.code);
        if (strategy && attempt < maxRetries - 1) {
          await strategy.call(this, error, attempt);
          continue;
        }
        
        break;
      }
    }
    
    throw lastError;
  }
  
  async rateLimitRetry(error, attempt) {
    const delay = error.data?.retry_after || Math.pow(2, attempt);
    await new Promise(resolve => setTimeout(resolve, delay * 1000));
  }
  
  async tokenRefreshRetry(error, attempt) {
    await this.client.auth.v3.appAccessToken.internal();
  }
  
  async exponentialBackoffRetry(error, attempt) {
    const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Usage
const recoveryManager = new ErrorRecoveryManager(client);
const result = await recoveryManager.executeWithRecovery(
  () => client.im.v1.message.create(params)
);
```

### **Error Monitoring & Alerting**
```javascript
// Error monitoring system
class ErrorMonitor {
  constructor() {
    this.errorCounts = new Map();
    this.alertThresholds = {
      19001: 10, // Rate limit
      99999: 5,  // System error
      99991663: 3 // Token error
    };
  }
  
  recordError(error) {
    const code = error.code;
    const count = this.errorCounts.get(code) || 0;
    this.errorCounts.set(code, count + 1);
    
    // Check alert threshold
    const threshold = this.alertThresholds[code];
    if (threshold && count + 1 >= threshold) {
      this.sendAlert(code, count + 1);
    }
  }
  
  sendAlert(errorCode, count) {
    console.error(`🚨 ALERT: Error ${errorCode} occurred ${count} times`);
    
    // Send to monitoring system
    // this.notificationService.send({
    //   level: 'error',
    //   message: `High error rate detected: ${errorCode}`,
    //   count: count
    // });
  }
  
  getErrorStats() {
    return Object.fromEntries(this.errorCounts);
  }
}

const errorMonitor = new ErrorMonitor();

// Use in error handlers
catch (error) {
  errorMonitor.recordError(error);
  // ... handle error
}
```

This comprehensive error code guide helps developers quickly identify, understand, and resolve Lark API errors with practical, tested solutions! 🔧