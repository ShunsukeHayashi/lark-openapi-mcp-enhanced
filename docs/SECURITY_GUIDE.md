# Security Guide - Token Management & System Security

This comprehensive security guide covers enhanced token management, input validation, security auditing, and best practices for the Lark OpenAPI MCP Enhanced system.

## 📋 Table of Contents
- [Overview](#overview)
- [Token Security Management](#token-security-management)
- [Input Validation & Sanitization](#input-validation--sanitization)
- [Security Auditing](#security-auditing)
- [Environment Security](#environment-security)
- [Best Practices](#best-practices)
- [Security Presets](#security-presets)
- [Compliance & Monitoring](#compliance--monitoring)

## 🔒 Overview

The enhanced security system provides:
- **Token Encryption**: AES-256-GCM encryption for sensitive tokens
- **Input Validation**: Comprehensive validation against XSS, SQL injection, and other attacks
- **Security Auditing**: Real-time security monitoring and audit logging
- **Environment Validation**: Secure environment variable management
- **Compliance Checking**: GDPR, ISO 27001, and SOC 2 compliance validation

## 🔐 Token Security Management

### Enhanced Token Security Features

#### 1. Token Encryption
```typescript
import { TokenSecurityManager } from './src/mcp-tool/security/token-manager';

const tokenManager = new TokenSecurityManager({
  enableEncryption: true,
  enableTokenRotation: true,
  enableAuditLogging: true,
  tokenRotationInterval: 110 // minutes
});

// Store encrypted token
const secureToken = tokenManager.storeToken('app', appSecret, expiresAt);

// Retrieve and decrypt token
const decryptedToken = tokenManager.retrieveToken('app');
```

#### 2. Token Validation
- **Format Validation**: Ensures tokens match expected patterns
- **Integrity Checking**: SHA-256 checksums prevent tampering
- **Expiration Management**: Automatic token expiration handling
- **Usage Tracking**: Monitor token access patterns

#### 3. Audit Logging
```typescript
// Get security audit logs
const auditLogs = tokenManager.getAuditLogs();

// Security status overview
const status = tokenManager.getSecurityStatus();
console.log('Security Status:', status);
```

### Token Storage Security

#### Secure Token Storage
- **Encrypted Storage**: Tokens encrypted at rest using AES-256-GCM
- **Memory Protection**: Tokens cleared from memory after use
- **File Permissions**: Secure storage with 0700 permissions
- **Cache Integration**: Secure token caching with TTL management

#### Environment Variable Security
```bash
# Secure environment configuration
export APP_ID="cli_your_app_id"
export APP_SECRET="your_secure_app_secret"
export NODE_ENV="production"

# Validate environment security
node -e "
const { TokenSecurityManager } = require('./dist/mcp-tool/security/token-manager');
const validation = TokenSecurityManager.validateEnvironmentSecurity();
console.log('Environment Security:', validation);
"
```

## 🛡️ Input Validation & Sanitization

### Comprehensive Input Validation

#### 1. Security Risk Assessment
```typescript
import { InputValidator } from './src/mcp-tool/security/input-validator';

// Validate user input
const result = InputValidator.validate(userInput, {
  type: 'string',
  maxLength: 1000,
  sanitize: true,
  pattern: /^[a-zA-Z0-9\s._-]+$/
});

console.log('Validation Result:', result);
// { valid: true, errors: [], sanitized: "clean_input", securityRisk: "low" }
```

#### 2. Attack Pattern Detection
The system automatically detects:
- **XSS Attacks**: `<script>`, `javascript:`, event handlers
- **SQL Injection**: SQL keywords, comment patterns, quotes
- **Path Traversal**: `../`, encoded traversal attempts
- **Command Injection**: Shell metacharacters, dangerous commands

#### 3. Lark-Specific Validation
```typescript
// Validate Lark identifiers
const appIdValidation = InputValidator.validateLarkInput(appId, 'app_id');
const chatIdValidation = InputValidator.validateLarkInput(chatId, 'chat_id');
const userIdValidation = InputValidator.validateLarkInput(userId, 'user_id');
```

### File Upload Security
```typescript
// Secure file upload validation
const fileValidation = InputValidator.validateFileUpload({
  name: 'document.pdf',
  size: 1024000, // 1MB
  type: 'application/pdf'
});

if (!fileValidation.valid) {
  console.error('File upload rejected:', fileValidation.errors);
}
```

## 🔍 Security Auditing

### Security Audit Tool

#### Running Security Audits
```bash
# Full security audit
node dist/cli.js mcp --mode stdio --tools preset.security.default

# Use security audit tool via MCP
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "security.builtin.audit",
    "arguments": {
      "audit_type": "full",
      "include_recommendations": true,
      "export_format": "json"
    }
  },
  "id": 1
}
```

#### Audit Coverage
1. **Token Security**: Encryption status, rotation, audit logs
2. **Environment Security**: Variable validation, file permissions
3. **Input Validation**: XSS/injection protection testing
4. **File Permissions**: Critical file security analysis
5. **Network Security**: SSL, rate limiting, domain validation
6. **Compliance**: GDPR, ISO 27001, SOC 2 assessment

### Real-time Security Monitoring
```typescript
// Monitor security metrics
setInterval(() => {
  const securityStatus = tokenManager.getSecurityStatus();
  const auditLogs = tokenManager.getAuditLogs();
  
  // Check for security alerts
  const recentFailures = auditLogs.filter(log => 
    !log.success && 
    Date.now() - log.timestamp < 60000 // Last minute
  );
  
  if (recentFailures.length > 5) {
    console.warn('🚨 Security Alert: Multiple authentication failures detected');
  }
}, 60000); // Check every minute
```

## 🌍 Environment Security

### Secure Environment Configuration

#### 1. Environment Variable Validation
```typescript
// Validate environment security
const envValidation = TokenSecurityManager.validateEnvironmentSecurity();

if (!envValidation.secure) {
  console.error('Environment Security Issues:');
  envValidation.issues.forEach(issue => console.error(`  - ${issue}`));
}
```

#### 2. Secure .env File Management
```bash
# Set proper permissions
chmod 600 .env
chown user:user .env

# Check file permissions
ls -la .env
# Should show: -rw------- 1 user user ... .env
```

#### 3. Production Environment Checklist
- ✅ `NODE_ENV=production`
- ✅ Strong `APP_SECRET` (>32 characters)
- ✅ Valid `APP_ID` format (`cli_` prefix)
- ✅ No test/demo tokens in production
- ✅ Secure file permissions (600 for .env)
- ✅ Rate limiting enabled
- ✅ HTTPS domains only

### Environment Sanitization
```typescript
// Sanitize environment for logging
const sanitizedEnv = TokenSecurityManager.sanitizeEnvironment(process.env);
console.log('Environment (sanitized):', sanitizedEnv);
// Outputs: { APP_ID: "cli_****", APP_SECRET: "****", ... }
```

## 📋 Best Practices

### 1. Token Management
```typescript
// ✅ Good: Use secure token manager
const tokenManager = new TokenSecurityManager({
  enableEncryption: true,
  enableAuditLogging: true
});

// ❌ Bad: Store tokens in plain text
const unsafeToken = process.env.APP_SECRET; // Avoid direct access
```

### 2. Input Validation
```typescript
// ✅ Good: Validate all inputs
const validation = InputValidator.validate(userInput, {
  type: 'string',
  maxLength: 100,
  sanitize: true
});

if (!validation.valid) {
  throw new Error('Invalid input');
}

// ❌ Bad: Use raw user input
const directInput = request.body.message; // Dangerous
```

### 3. Error Handling
```typescript
// ✅ Good: Secure error handling
try {
  const result = await larkApiCall();
  return result;
} catch (error) {
  // Log error securely (without sensitive data)
  console.error('API call failed:', error.code);
  throw new Error('Operation failed');
}

// ❌ Bad: Expose sensitive information
catch (error) {
  throw error; // May expose tokens/secrets
}
```

### 4. Rate Limiting
```typescript
// ✅ Good: Implement rate limiting
const rateLimitValidator = InputValidator.createRateLimitValidator(100, 60000);

app.use((req, res, next) => {
  const clientId = req.ip;
  const validation = rateLimitValidator(clientId);
  
  if (!validation.valid) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  
  next();
});
```

## 🔧 Security Presets

### Security Tool Preset
```bash
# Use security preset for comprehensive security tools
yarn build && node dist/cli.js mcp --mode stdio --tools preset.security.default
```

### Preset Configuration
```json
{
  "mcpServers": {
    "lark-security": {
      "command": "npx",
      "args": [
        "-y",
        "@larksuiteoapi/lark-mcp@0.4.0",
        "mcp",
        "--mode", "stdio",
        "--tools", "preset.security.default"
      ],
      "env": {
        "APP_ID": "your_app_id",
        "APP_SECRET": "your_app_secret",
        "NODE_ENV": "production",
        "ENABLE_SECURITY_AUDIT": "true"
      }
    }
  }
}
```

### Available Security Tools
- `security.builtin.audit` - Comprehensive security audit
- `contact.v3.user.batchGetId` - Secure user lookup
- `system.builtin.healthCheck` - System health monitoring

## 📊 Compliance & Monitoring

### Compliance Frameworks

#### GDPR Compliance
- **Data Encryption**: All sensitive data encrypted at rest
- **Audit Logging**: Comprehensive access logging
- **Data Retention**: Configurable retention policies
- **User Consent**: Required for data processing

#### ISO 27001 Compliance
- **Access Control**: Role-based access management
- **Incident Response**: Automated security incident detection
- **Risk Assessment**: Regular security assessments
- **Security Training**: Security best practices documentation

#### SOC 2 Compliance
- **Security**: Multi-layer security controls
- **Availability**: System health monitoring
- **Processing Integrity**: Input validation and sanitization
- **Confidentiality**: Token encryption and secure storage

### Security Metrics Dashboard
```typescript
// Generate security metrics
const metrics = {
  tokenSecurity: tokenManager.getSecurityStatus(),
  environmentSecurity: TokenSecurityManager.validateEnvironmentSecurity(),
  inputValidation: await performInputValidationTests(),
  overallScore: calculateSecurityScore()
};

console.log('Security Dashboard:', metrics);
```

### Monitoring Alerts
```typescript
// Set up security monitoring
function setupSecurityMonitoring() {
  // Check for failed authentication attempts
  setInterval(() => {
    const auditLogs = tokenManager.getAuditLogs();
    const recentFailures = auditLogs.filter(log => 
      !log.success && 
      Date.now() - log.timestamp < 300000 // Last 5 minutes
    );
    
    if (recentFailures.length > 10) {
      sendSecurityAlert('High number of authentication failures detected');
    }
  }, 60000);
  
  // Monitor file permission changes
  // Monitor suspicious input patterns
  // Monitor rate limit violations
}
```

## 🚨 Security Incident Response

### Automated Response
```typescript
// Automated security incident handling
class SecurityIncidentHandler {
  handleIncident(incident: SecurityIncident) {
    switch (incident.severity) {
      case 'high':
        this.lockDownSystem();
        this.notifyAdministrators();
        this.logIncident(incident);
        break;
      case 'medium':
        this.increaseMonitoring();
        this.logIncident(incident);
        break;
      case 'low':
        this.logIncident(incident);
        break;
    }
  }
}
```

### Manual Response Procedures
1. **Identify**: Use security audit tools to identify threats
2. **Contain**: Isolate affected systems/tokens
3. **Analyze**: Review audit logs and security metrics
4. **Remediate**: Apply fixes and security patches
5. **Monitor**: Increase monitoring for related threats

This comprehensive security system ensures enterprise-grade protection for the Lark OpenAPI MCP Enhanced platform! 🔒