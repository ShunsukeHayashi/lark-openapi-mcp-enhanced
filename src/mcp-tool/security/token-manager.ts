/**
 * Enhanced Token Security Manager
 * Provides secure token storage, validation, and management
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { CacheCategory, globalCache } from '../utils/cache-manager';

export interface TokenSecurityOptions {
  enableEncryption?: boolean;
  encryptionKey?: string;
  enableTokenRotation?: boolean;
  tokenRotationInterval?: number; // minutes
  enableTokenMasking?: boolean;
  enableAuditLogging?: boolean;
  secureStoragePath?: string;
}

export interface SecureToken {
  value: string;
  encrypted: boolean;
  createdAt: number;
  lastUsed: number;
  expiresAt?: number;
  rotationCount: number;
  checksum: string;
}

export interface TokenAuditLog {
  timestamp: number;
  action: 'created' | 'accessed' | 'rotated' | 'expired' | 'invalid';
  tokenType: 'app' | 'user' | 'tenant';
  masked: string;
  source?: string;
  success: boolean;
}

export class TokenSecurityManager {
  private encryptionKey: string;
  private options: Required<TokenSecurityOptions>;
  private auditLogs: TokenAuditLog[] = [];

  constructor(options: TokenSecurityOptions = {}) {
    // Determine secure storage path based on environment
    let defaultSecurePath: string;
    if (process.env.HOME) {
      // Use user's home directory
      defaultSecurePath = path.join(process.env.HOME, '.lark-mcp', '.secure');
    } else if (process.env.TMPDIR) {
      // Use temp directory as fallback
      defaultSecurePath = path.join(process.env.TMPDIR, 'lark-mcp', '.secure');
    } else {
      // Last resort: use current directory
      defaultSecurePath = path.join(process.cwd(), '.secure');
    }

    this.options = {
      enableEncryption: true,
      encryptionKey: options.encryptionKey || this.generateEncryptionKey(),
      enableTokenRotation: false,
      tokenRotationInterval: 110, // Just before token expiry
      enableTokenMasking: true,
      enableAuditLogging: true,
      secureStoragePath: options.secureStoragePath || defaultSecurePath,
      ...options,
    };

    this.encryptionKey = this.options.encryptionKey;
    
    // Only try to create directory if not in read-only environment
    try {
      this.ensureSecureStorage();
    } catch (error: any) {
      if (error.code === 'EROFS' || error.code === 'EACCES') {
        // Running in read-only or restricted environment, disable file-based storage
        console.warn('Unable to create secure storage directory, using memory-only storage');
      } else {
        throw error;
      }
    }
  }

  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private ensureSecureStorage(): void {
    if (!fs.existsSync(this.options.secureStoragePath)) {
      fs.mkdirSync(this.options.secureStoragePath, { mode: 0o700, recursive: true });
    }
  }

  /**
   * Securely store a token with encryption and validation
   */
  storeToken(tokenType: 'app' | 'user' | 'tenant', token: string, expiresAt?: number): SecureToken {
    if (!this.validateTokenFormat(tokenType, token)) {
      throw new Error(`Invalid ${tokenType} token format`);
    }

    const secureToken: SecureToken = {
      value: this.options.enableEncryption ? this.encryptToken(token) : token,
      encrypted: this.options.enableEncryption,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      expiresAt,
      rotationCount: 0,
      checksum: this.generateChecksum(token),
    };

    // Store in secure cache
    globalCache.set(
      CacheCategory.APP_TOKENS,
      `secure_${tokenType}_token`,
      secureToken,
      expiresAt ? expiresAt - Date.now() : undefined,
    );

    this.auditLog({
      action: 'created',
      tokenType,
      masked: this.maskToken(token),
      success: true,
    });

    return secureToken;
  }

  /**
   * Retrieve and decrypt a token securely
   */
  retrieveToken(tokenType: 'app' | 'user' | 'tenant'): string | null {
    const secureToken = globalCache.get(CacheCategory.APP_TOKENS, `secure_${tokenType}_token`) as SecureToken;

    if (!secureToken) {
      this.auditLog({
        action: 'accessed',
        tokenType,
        masked: 'TOKEN_NOT_FOUND',
        success: false,
      });
      return null;
    }

    // Check expiration
    if (secureToken.expiresAt && Date.now() > secureToken.expiresAt) {
      this.auditLog({
        action: 'expired',
        tokenType,
        masked: this.maskToken(secureToken.value),
        success: false,
      });
      this.removeToken(tokenType);
      return null;
    }

    const token = secureToken.encrypted ? this.decryptToken(secureToken.value) : secureToken.value;

    // Validate integrity
    if (!this.validateChecksum(token, secureToken.checksum)) {
      this.auditLog({
        action: 'invalid',
        tokenType,
        masked: this.maskToken(token),
        success: false,
      });
      throw new Error('Token integrity check failed - possible tampering detected');
    }

    // Update last used
    secureToken.lastUsed = Date.now();
    globalCache.set(CacheCategory.APP_TOKENS, `secure_${tokenType}_token`, secureToken);

    this.auditLog({
      action: 'accessed',
      tokenType,
      masked: this.maskToken(token),
      success: true,
    });

    return token;
  }

  /**
   * Remove a token from secure storage
   */
  removeToken(tokenType: 'app' | 'user' | 'tenant'): void {
    globalCache.delete(CacheCategory.APP_TOKENS, `secure_${tokenType}_token`);
  }

  /**
   * Rotate token (for user tokens that support rotation)
   */
  async rotateToken(tokenType: 'user', refreshToken: string): Promise<string> {
    // This would integrate with Lark's token refresh API
    // Implementation depends on specific Lark OAuth flow

    const currentToken = this.retrieveToken(tokenType);
    if (!currentToken) {
      throw new Error('No current token to rotate');
    }

    // Simulate token rotation (actual implementation would call Lark API)
    const newToken = await this.performTokenRotation(refreshToken);

    // Store new token
    const secureToken = this.storeToken(tokenType, newToken);
    secureToken.rotationCount++;

    this.auditLog({
      action: 'rotated',
      tokenType,
      masked: this.maskToken(newToken),
      success: true,
    });

    return newToken;
  }

  private async performTokenRotation(refreshToken: string): Promise<string> {
    // Placeholder for actual Lark token refresh API call
    // Would use the refresh token to get a new access token
    throw new Error('Token rotation not implemented - requires Lark OAuth integration');
  }

  /**
   * Validate token format based on type
   */
  private validateTokenFormat(tokenType: 'app' | 'user' | 'tenant', token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    switch (tokenType) {
      case 'app':
        // App tokens typically start with 't-' or similar
        return token.length > 20 && /^[a-zA-Z0-9_-]+$/.test(token);
      case 'user':
        // User tokens have different format
        return token.length > 20 && /^[a-zA-Z0-9_-]+$/.test(token);
      case 'tenant':
        // Tenant tokens have different format
        return token.length > 20 && /^[a-zA-Z0-9_-]+$/.test(token);
      default:
        return false;
    }
  }

  /**
   * Encrypt token using AES-256-GCM
   */
  private encryptToken(token: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt token using AES-256-GCM
   */
  private decryptToken(encryptedToken: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedToken.split(':');

    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted token format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate checksum for token integrity
   */
  private generateChecksum(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Validate token checksum
   */
  private validateChecksum(token: string, expectedChecksum: string): boolean {
    const actualChecksum = this.generateChecksum(token);
    return crypto.timingSafeEqual(Buffer.from(actualChecksum), Buffer.from(expectedChecksum));
  }

  /**
   * Mask token for logging (show first 4 and last 4 characters)
   */
  private maskToken(token: string): string {
    if (!this.options.enableTokenMasking || token.length < 8) {
      return '***MASKED***';
    }

    return `${token.substring(0, 4)}****${token.substring(token.length - 4)}`;
  }

  /**
   * Log security audit events
   */
  private auditLog(event: Omit<TokenAuditLog, 'timestamp'>): void {
    if (!this.options.enableAuditLogging) {
      return;
    }

    const auditEvent: TokenAuditLog = {
      timestamp: Date.now(),
      ...event,
    };

    this.auditLogs.push(auditEvent);

    // Keep only last 1000 audit logs
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }

    // Optionally write to secure file
    this.writeAuditLog(auditEvent);
  }

  /**
   * Write audit log to secure file
   */
  private writeAuditLog(event: TokenAuditLog): void {
    const logFile = path.join(this.options.secureStoragePath, 'token-audit.log');
    const logEntry = `${new Date(event.timestamp).toISOString()} [${event.action.toUpperCase()}] ${event.tokenType} ${event.masked} success=${event.success}\\n`;

    try {
      fs.appendFileSync(logFile, logEntry, { mode: 0o600 });
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  /**
   * Get audit logs for security monitoring
   */
  getAuditLogs(): TokenAuditLog[] {
    return [...this.auditLogs];
  }

  /**
   * Get security status and metrics
   */
  getSecurityStatus() {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;

    const recent = this.auditLogs.filter((log) => log.timestamp > last24h);
    const failed = recent.filter((log) => !log.success);

    return {
      encryption: {
        enabled: this.options.enableEncryption,
        algorithm: 'AES-256-GCM',
      },
      tokenRotation: {
        enabled: this.options.enableTokenRotation,
        interval: this.options.tokenRotationInterval,
      },
      audit: {
        enabled: this.options.enableAuditLogging,
        totalLogs: this.auditLogs.length,
        recentEvents: recent.length,
        failedEvents: failed.length,
        failureRate: recent.length > 0 ? failed.length / recent.length : 0,
      },
      storage: {
        secure: true,
        path: this.options.secureStoragePath,
        permissions: '0700',
      },
    };
  }

  /**
   * Validate environment variable security
   */
  static validateEnvironmentSecurity(): { secure: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for tokens in environment variables
    const sensitiveVars = ['APP_SECRET', 'USER_ACCESS_TOKEN', 'DISCORD_TOKEN'];
    const envVars = Object.keys(process.env);

    for (const sensitiveVar of sensitiveVars) {
      if (process.env[sensitiveVar]) {
        // Check if running in production
        if (process.env.NODE_ENV === 'production') {
          issues.push(`${sensitiveVar} found in environment variables in production mode`);
        }

        // Check token length (should be substantial)
        const value = process.env[sensitiveVar]!;
        if (value.length < 20) {
          issues.push(`${sensitiveVar} appears to be too short (${value.length} characters)`);
        }

        // Check for common insecure patterns
        if (value.includes('test') || value.includes('demo') || value === 'your_token_here') {
          issues.push(`${sensitiveVar} appears to contain placeholder or test values`);
        }
      }
    }

    // Check for .env files in inappropriate locations
    const dangerousLocations = ['/tmp/.env', '/var/tmp/.env', process.cwd() + '/.env'];
    for (const location of dangerousLocations) {
      if (fs.existsSync(location)) {
        try {
          const stats = fs.statSync(location);
          const mode = stats.mode & parseInt('777', 8);
          if (mode !== parseInt('600', 8)) {
            issues.push(`${location} has insecure permissions (${mode.toString(8)})`);
          }
        } catch (error) {
          // Ignore permission errors
        }
      }
    }

    return {
      secure: issues.length === 0,
      issues,
    };
  }

  /**
   * Sanitize environment variables for logging
   */
  static sanitizeEnvironment(env: Record<string, string | undefined>): Record<string, string> {
    const sensitiveKeys = ['SECRET', 'TOKEN', 'PASSWORD', 'KEY', 'AUTH'];
    const sanitized: Record<string, string> = {};

    for (const [key, value] of Object.entries(env)) {
      if (!value) continue;

      const isSensitive = sensitiveKeys.some((sensitive) => key.toUpperCase().includes(sensitive));

      if (isSensitive) {
        sanitized[key] =
          value.length > 4 ? `${value.substring(0, 4)}****${value.substring(value.length - 4)}` : '***MASKED***';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

// Global token security manager instance
// Create with disabled file storage for environments like Claude Desktop
export const globalTokenManager = new TokenSecurityManager({
  enableAuditLogging: false, // Disable file-based audit logging
  secureStoragePath: process.env.TMPDIR ? path.join(process.env.TMPDIR, 'lark-mcp-secure') : undefined,
});
