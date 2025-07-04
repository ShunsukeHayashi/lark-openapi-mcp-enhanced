# Security Best Practices for Lark OpenAPI MCP

## Overview

This document outlines security best practices for managing tokens, credentials, and sensitive data in the Lark OpenAPI MCP integration. Following these practices is essential for protecting your organization's data and maintaining compliance with security standards.

## 🚨 Critical Security Issues (IMMEDIATE ACTION REQUIRED)

### 1. Remove Hardcoded Credentials

**❌ NEVER DO THIS:**
```json
// config.json - EXPOSED IN REPOSITORY
{
  "appId": "cli_a8d2fdb1f1f8d02d",
  "appSecret": "V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ",
  "userAccessToken": "u-feLBF4cHZbUqy4aO.uPPoRY05516542roO0w407w22ZI"
}
```

**✅ DO THIS INSTEAD:**
```json
// config.template.json
{
  "appId": "${LARK_APP_ID}",
  "appSecret": "${LARK_APP_SECRET}",
  "userAccessToken": "${LARK_USER_ACCESS_TOKEN}"
}
```

### 2. Secure Environment Variables

**❌ NEVER DO THIS:**
```bash
# .env with real secrets
APP_ID=cli_a8d2fdb1f1f8d02d
APP_SECRET=V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ
```

**✅ DO THIS INSTEAD:**
```bash
# .env.example with placeholders
APP_ID=your_app_id_here
APP_SECRET=your_app_secret_here
USER_ACCESS_TOKEN=your_user_access_token_here
```

## 🔐 Enhanced Token Management

### Using the Secure Token Manager

The project now includes a comprehensive `SecureTokenManager` class with encryption, rotation, and automatic refresh capabilities:

```typescript
import { SecureTokenManager } from '../src/security/token-manager';

const tokenManager = new SecureTokenManager({
  appId: process.env.LARK_APP_ID!,
  appSecret: process.env.LARK_APP_SECRET!,
  encryptionKey: process.env.ENCRYPTION_KEY, // Strong encryption key
  tokenExpiry: 7200, // 2 hours
}, {
  enabled: true,
  rotationInterval: 90, // 90 minutes
  maxTokenAge: 24, // 24 hours
  backupCount: 5
});

// Get tokens securely
const token = await tokenManager.getToken('userAccessToken');
```

### Key Security Features

1. **AES-256-GCM Encryption**: All tokens encrypted at rest
2. **PBKDF2 Key Derivation**: Strong key derivation from app secrets
3. **Automatic Token Rotation**: Configurable rotation intervals
4. **Token Integrity Validation**: Hash-based integrity checking
5. **Secure File Permissions**: 0o600 for credential files
6. **Automatic Backup Management**: Secure backup and cleanup

## 🔒 Credential Storage Best Practices

### 1. File-Based Storage

**Secure Credential Directory Structure:**
```
~/.lark-mcp/
├── secure-credentials.json (mode 0o600)
├── secure-credentials.json.backup.1640995200000
└── config.json (mode 0o600)
```

**File Permissions:**
```bash
# Set secure permissions
chmod 700 ~/.lark-mcp/
chmod 600 ~/.lark-mcp/secure-credentials.json
```

### 2. Environment Variable Security

**✅ Recommended Approach:**
```bash
# Use a secure environment file loader
export LARK_APP_ID=$(security find-generic-password -s "lark-app-id" -w)
export LARK_APP_SECRET=$(security find-generic-password -s "lark-app-secret" -w)
```

**macOS Keychain Integration:**
```bash
# Store in macOS Keychain
security add-generic-password -s "lark-app-id" -a "lark-mcp" -w "your_app_id"
security add-generic-password -s "lark-app-secret" -a "lark-mcp" -w "your_app_secret"
```

**Linux Secret Service:**
```bash
# Store using secret-tool (GNOME Keyring)
secret-tool store --label="Lark App ID" service lark-mcp username app-id
secret-tool store --label="Lark App Secret" service lark-mcp username app-secret
```

## 🐳 Docker Security

### Secure Docker Configuration

**❌ INSECURE:**
```yaml
# docker-compose.yml - INSECURE
services:
  lark-mcp:
    environment:
      - APP_ID=cli_a8d2fdb1f1f8d02d
      - APP_SECRET=V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ
```

**✅ SECURE:**
```yaml
# docker-compose.yml - SECURE
services:
  lark-mcp:
    secrets:
      - lark_app_id
      - lark_app_secret
    environment:
      - APP_ID_FILE=/run/secrets/lark_app_id
      - APP_SECRET_FILE=/run/secrets/lark_app_secret

secrets:
  lark_app_id:
    file: ./secrets/app_id.txt
  lark_app_secret:
    file: ./secrets/app_secret.txt
```

### Docker Secrets Implementation

```typescript
// Load secrets from files in container
function loadDockerSecrets(): TokenConfig {
  const appIdFile = process.env.APP_ID_FILE;
  const appSecretFile = process.env.APP_SECRET_FILE;
  
  return {
    appId: appIdFile ? fs.readFileSync(appIdFile, 'utf8').trim() : process.env.APP_ID!,
    appSecret: appSecretFile ? fs.readFileSync(appSecretFile, 'utf8').trim() : process.env.APP_SECRET!
  };
}
```

## 🔄 Token Rotation Strategy

### Automatic Token Rotation

```typescript
// Configure automatic token rotation
const rotationConfig = {
  enabled: true,
  rotationInterval: 90, // Rotate every 90 minutes
  maxTokenAge: 24, // Max token age: 24 hours
  backupCount: 5 // Keep 5 backup copies
};

// Monitor rotation events
tokenManager.on('tokensRotated', (event) => {
  console.log('Tokens rotated successfully at:', event.timestamp);
});

tokenManager.on('tokenRotationError', (event) => {
  console.error('Token rotation failed:', event.error);
  // Implement alerting mechanism
});
```

### Manual Token Rotation

```typescript
// Force immediate token rotation
await tokenManager.rotateTokens();

// Revoke all tokens (emergency)
await tokenManager.revokeAllTokens();
```

## 🔍 Security Monitoring and Auditing

### Implement Security Event Logging

```typescript
class SecurityAuditLogger {
  private logPath = path.join(process.env.HOME!, '.lark-mcp', 'security.log');
  
  logSecurityEvent(event: SecurityEvent): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType: event.type,
      severity: event.severity,
      details: event.details,
      userId: event.userId,
      sourceIp: event.sourceIp
    };
    
    fs.appendFileSync(this.logPath, JSON.stringify(logEntry) + '\n');
  }
}

// Usage
const auditLogger = new SecurityAuditLogger();

tokenManager.on('tokensAccessed', (event) => {
  auditLogger.logSecurityEvent({
    type: 'TOKEN_ACCESS',
    severity: 'INFO',
    details: { tokenType: event.tokenType },
    userId: event.userId,
    sourceIp: event.sourceIp
  });
});
```

### Token Usage Monitoring

```typescript
// Monitor token usage patterns
const stats = tokenManager.getTokenStats();
console.log('Token Statistics:', {
  totalTokens: stats.totalTokens,
  expiredTokens: stats.expiredTokens,
  validTokens: stats.validTokens,
  lastRotation: stats.lastRotation
});

// Security validation
const security = tokenManager.validateTokenSecurity();
if (!security.isSecure) {
  console.warn('Security Issues Found:', security.issues);
  console.log('Recommendations:', security.recommendations);
}
```

## 🛡️ Network Security

### API Request Security

```typescript
// Implement request signing for additional security
class SecureApiClient {
  private signRequest(request: ApiRequest): string {
    const timestamp = Date.now().toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    const signature = crypto
      .createHmac('sha256', this.appSecret)
      .update(`${timestamp}${nonce}${JSON.stringify(request)}`)
      .digest('hex');
    
    return `timestamp=${timestamp}&nonce=${nonce}&signature=${signature}`;
  }
  
  async makeSecureRequest(endpoint: string, data: any): Promise<any> {
    const signature = this.signRequest({ endpoint, data });
    
    return fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await this.getToken()}`,
        'X-Lark-Signature': signature,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  }
}
```

### Rate Limiting for Security

```typescript
// Enhanced rate limiting with security features
const secureRateLimiter = {
  // Detect and prevent abuse
  detectSuspiciousActivity: (clientId: string, requests: RequestLog[]) => {
    const recentRequests = requests.filter(r => 
      Date.now() - r.timestamp < 60000 // Last minute
    );
    
    if (recentRequests.length > 100) {
      // Potential abuse detected
      return {
        suspicious: true,
        action: 'RATE_LIMIT',
        reason: 'Excessive requests'
      };
    }
    
    return { suspicious: false };
  },
  
  // Implement progressive delays
  calculateDelay: (violationCount: number) => {
    return Math.min(1000 * Math.pow(2, violationCount), 30000); // Max 30s
  }
};
```

## 🚀 Production Deployment Security

### Environment-Specific Configurations

**Development Environment:**
```typescript
// dev.config.ts
export const devSecurityConfig = {
  encryption: {
    algorithm: 'aes-256-gcm',
    keyDerivation: 'pbkdf2',
    iterations: 10000 // Lower for dev
  },
  tokenRotation: {
    enabled: true,
    interval: 30 // 30 minutes for testing
  },
  logging: {
    level: 'debug',
    auditEnabled: true
  }
};
```

**Production Environment:**
```typescript
// prod.config.ts
export const prodSecurityConfig = {
  encryption: {
    algorithm: 'aes-256-gcm',
    keyDerivation: 'pbkdf2',
    iterations: 100000 // Higher for production
  },
  tokenRotation: {
    enabled: true,
    interval: 90 // 90 minutes
  },
  logging: {
    level: 'warn',
    auditEnabled: true,
    remoteLogging: true
  }
};
```

### Kubernetes Secrets Management

```yaml
# kubernetes-secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: lark-mcp-secrets
type: Opaque
data:
  app-id: <base64-encoded-app-id>
  app-secret: <base64-encoded-app-secret>
  encryption-key: <base64-encoded-encryption-key>
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lark-mcp
spec:
  template:
    spec:
      containers:
      - name: lark-mcp
        env:
        - name: LARK_APP_ID
          valueFrom:
            secretKeyRef:
              name: lark-mcp-secrets
              key: app-id
        - name: LARK_APP_SECRET
          valueFrom:
            secretKeyRef:
              name: lark-mcp-secrets
              key: app-secret
```

## ⚠️ Security Checklist

### Before Deployment

- [ ] Remove all hardcoded credentials from code
- [ ] Enable token encryption with strong encryption key
- [ ] Configure automatic token rotation
- [ ] Set secure file permissions (0o600)
- [ ] Implement security event logging
- [ ] Configure proper environment variable management
- [ ] Set up secrets management (Keychain/Vault/K8s Secrets)
- [ ] Enable rate limiting with security features
- [ ] Implement request signing for sensitive operations
- [ ] Configure secure Docker containers (if using)
- [ ] Set up monitoring and alerting for security events

### Regular Security Maintenance

- [ ] Rotate credentials quarterly
- [ ] Review access logs monthly
- [ ] Update encryption keys annually
- [ ] Audit token usage patterns
- [ ] Monitor for suspicious activity
- [ ] Update dependencies for security patches
- [ ] Review and update security configurations
- [ ] Conduct security assessments

## 🔧 Configuration Templates

### Secure Environment Template

```bash
# .env.secure.template
# Copy to .env and fill in your values

# Lark Application Credentials
LARK_APP_ID=your_app_id_here
LARK_APP_SECRET=your_app_secret_here
LARK_USER_ACCESS_TOKEN=your_user_access_token_here

# Security Configuration
ENCRYPTION_KEY=your_strong_encryption_key_here
TOKEN_ROTATION_ENABLED=true
TOKEN_ROTATION_INTERVAL=90

# Logging and Monitoring
SECURITY_LOGGING_ENABLED=true
AUDIT_LOG_LEVEL=info
REMOTE_LOGGING_ENDPOINT=https://your-logging-service.com/api/logs

# Network Security
API_REQUEST_SIGNING=true
RATE_LIMITING_ENABLED=true
MAX_REQUESTS_PER_MINUTE=50
```

### CLI Security Configuration

```typescript
// security.config.ts
export const cliSecurityConfig = {
  // Token management
  tokenManager: {
    encryptionEnabled: true,
    rotationEnabled: true,
    backupEnabled: true,
    maxTokenAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  
  // File security
  filePermissions: {
    credentialsFile: 0o600,
    configFile: 0o600,
    logFile: 0o644
  },
  
  // Network security
  network: {
    tlsEnabled: true,
    certificateValidation: true,
    requestSigning: true
  },
  
  // Monitoring
  monitoring: {
    auditLogging: true,
    performanceLogging: true,
    securityEventLogging: true
  }
};
```

## 🆘 Incident Response

### Security Incident Procedures

1. **Token Compromise Detection:**
   ```typescript
   // Immediate response
   await tokenManager.revokeAllTokens();
   await tokenManager.rotateTokens();
   
   // Log incident
   auditLogger.logSecurityEvent({
     type: 'TOKEN_COMPROMISE',
     severity: 'CRITICAL',
     details: { reason: 'Suspicious activity detected' }
   });
   ```

2. **Emergency Token Revocation:**
   ```bash
   # Emergency CLI command
   lark-mcp security revoke-all-tokens --confirm
   lark-mcp security rotate-credentials --force
   ```

3. **Security Audit:**
   ```typescript
   // Generate security report
   const auditReport = await generateSecurityAuditReport();
   console.log('Security Audit Results:', auditReport);
   ```

---

**Remember**: Security is an ongoing process, not a one-time setup. Regularly review and update your security practices as your application evolves and new threats emerge.