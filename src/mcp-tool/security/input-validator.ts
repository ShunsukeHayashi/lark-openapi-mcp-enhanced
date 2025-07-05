/**
 * Enhanced Input Validation and Sanitization
 * Provides comprehensive input validation for security
 */

import * as crypto from 'crypto';

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'json' | 'base64';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  whitelist?: string[];
  blacklist?: string[];
  sanitize?: boolean;
  customValidator?: (value: any) => boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: any;
  securityRisk?: 'low' | 'medium' | 'high';
  riskDetails?: string[];
}

export class InputValidator {
  private static readonly XSS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^>]*>/gi,
    /<link\b[^>]*>/gi,
    /<meta\b[^>]*>/gi,
  ];

  private static readonly SQL_INJECTION_PATTERNS = [
    /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|UNION( +ALL){0,1})\b)/gi,
    /(;|\s)(exec|execute)(\s|\()/gi,
    /('\s*(or|and)\s*')/gi,
    /('\s*=\s*')/gi,
    /(--|\#)/g,
    /\/\*[\s\S]*?\*\//g,
  ];

  private static readonly PATH_TRAVERSAL_PATTERNS = [
    /\.\.\//g,
    /\.\.\\/g,
    /%2e%2e%2f/gi,
    /%2e%2e%5c/gi,
    /\.\.%2f/gi,
    /\.\.%5c/gi,
  ];

  /**
   * Validate input against rules
   */
  static validate(input: any, rules: ValidationRule): ValidationResult {
    const errors: string[] = [];
    const riskDetails: string[] = [];
    let securityRisk: 'low' | 'medium' | 'high' = 'low';
    let sanitized = input;

    // Required check
    if (rules.required && (input === undefined || input === null || input === '')) {
      errors.push('Value is required');
    }

    // Skip further validation if input is empty and not required
    if (!rules.required && (input === undefined || input === null || input === '')) {
      return { valid: true, errors: [], sanitized: input };
    }

    // Type validation
    if (rules.type) {
      const typeValid = this.validateType(input, rules.type);
      if (!typeValid.valid) {
        errors.push(...typeValid.errors);
      }
    }

    // Length validation
    if (rules.minLength !== undefined && String(input).length < rules.minLength) {
      errors.push(`Minimum length is ${rules.minLength}`);
    }

    if (rules.maxLength !== undefined && String(input).length > rules.maxLength) {
      errors.push(`Maximum length is ${rules.maxLength}`);
      securityRisk = 'medium';
      riskDetails.push('Input exceeds maximum length - potential buffer overflow');
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(String(input))) {
      errors.push('Value does not match required pattern');
    }

    // Whitelist validation
    if (rules.whitelist && !rules.whitelist.includes(String(input))) {
      errors.push('Value is not in allowed list');
      securityRisk = 'medium';
      riskDetails.push('Input not in whitelist - potential injection attempt');
    }

    // Blacklist validation
    if (rules.blacklist && rules.blacklist.includes(String(input))) {
      errors.push('Value is not allowed');
      securityRisk = 'high';
      riskDetails.push('Input matches blacklisted pattern');
    }

    // Custom validation
    if (rules.customValidator && !rules.customValidator(input)) {
      errors.push('Custom validation failed');
    }

    // Security risk assessment
    const securityCheck = this.assessSecurityRisk(String(input));
    if (securityCheck.risk === 'high') {
      securityRisk = 'high';
      riskDetails.push(...securityCheck.details);
    } else if (securityCheck.risk === 'medium' && securityRisk === 'low') {
      securityRisk = 'medium';
      riskDetails.push(...securityCheck.details);
    }

    // Sanitization
    if (rules.sanitize) {
      sanitized = this.sanitizeInput(input);
    }

    return {
      valid: errors.length === 0 && securityRisk !== 'high',
      errors,
      sanitized,
      securityRisk,
      riskDetails: riskDetails.length > 0 ? riskDetails : undefined,
    };
  }

  /**
   * Validate multiple inputs
   */
  static validateSchema(
    inputs: Record<string, any>,
    schema: Record<string, ValidationRule>,
  ): {
    valid: boolean;
    errors: Record<string, string[]>;
    sanitized: Record<string, any>;
    securityRisks: Record<string, 'low' | 'medium' | 'high'>;
  } {
    const errors: Record<string, string[]> = {};
    const sanitized: Record<string, any> = {};
    const securityRisks: Record<string, 'low' | 'medium' | 'high'> = {};
    let overallValid = true;

    for (const [field, rules] of Object.entries(schema)) {
      const result = this.validate(inputs[field], rules);

      if (!result.valid) {
        overallValid = false;
        errors[field] = result.errors;
      }

      sanitized[field] = result.sanitized;
      securityRisks[field] = result.securityRisk || 'low';
    }

    return {
      valid: overallValid,
      errors,
      sanitized,
      securityRisks,
    };
  }

  /**
   * Validate type
   */
  private static validateType(input: any, type: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (type) {
      case 'string':
        if (typeof input !== 'string') {
          errors.push('Value must be a string');
        }
        break;

      case 'number':
        if (typeof input !== 'number' || isNaN(input)) {
          errors.push('Value must be a number');
        }
        break;

      case 'boolean':
        if (typeof input !== 'boolean') {
          errors.push('Value must be a boolean');
        }
        break;

      case 'email':
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(String(input))) {
          errors.push('Value must be a valid email address');
        }
        break;

      case 'url':
        try {
          new URL(String(input));
        } catch {
          errors.push('Value must be a valid URL');
        }
        break;

      case 'json':
        try {
          JSON.parse(String(input));
        } catch {
          errors.push('Value must be valid JSON');
        }
        break;

      case 'base64':
        const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Pattern.test(String(input))) {
          errors.push('Value must be valid base64');
        }
        break;

      default:
        errors.push(`Unknown type: ${type}`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Assess security risk of input
   */
  private static assessSecurityRisk(input: string): { risk: 'low' | 'medium' | 'high'; details: string[] } {
    const details: string[] = [];
    let risk: 'low' | 'medium' | 'high' = 'low';

    // Check for XSS patterns
    for (const pattern of this.XSS_PATTERNS) {
      if (pattern.test(input)) {
        risk = 'high';
        details.push('Potential XSS attack detected');
        break;
      }
    }

    // Check for SQL injection patterns
    for (const pattern of this.SQL_INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        risk = 'high';
        details.push('Potential SQL injection detected');
        break;
      }
    }

    // Check for path traversal
    for (const pattern of this.PATH_TRAVERSAL_PATTERNS) {
      if (pattern.test(input)) {
        risk = 'high';
        details.push('Potential path traversal attack detected');
        break;
      }
    }

    // Check for command injection
    const commandPatterns = [/[;&|`$()]/g, /\b(rm|del|format|shutdown|reboot)\b/gi];
    for (const pattern of commandPatterns) {
      if (pattern.test(input)) {
        risk = 'high';
        details.push('Potential command injection detected');
        break;
      }
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /eval\s*\(/gi,
      /Function\s*\(/gi,
      /setTimeout\s*\(/gi,
      /setInterval\s*\(/gi,
      /<\s*script/gi,
      /document\s*\./gi,
      /window\s*\./gi,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(input)) {
        if (risk === 'low') risk = 'medium';
        details.push('Suspicious code pattern detected');
        break;
      }
    }

    // Check for data exfiltration patterns
    const exfiltrationPatterns = [/fetch\s*\(/gi, /XMLHttpRequest/gi, /ajax/gi, /\.send\s*\(/gi];

    for (const pattern of exfiltrationPatterns) {
      if (pattern.test(input)) {
        if (risk === 'low') risk = 'medium';
        details.push('Potential data exfiltration pattern detected');
        break;
      }
    }

    return { risk, details };
  }

  /**
   * Sanitize input
   */
  private static sanitizeInput(input: any): any {
    if (typeof input !== 'string') {
      return input;
    }

    let sanitized = input;

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Escape HTML entities
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    // Remove potentially dangerous characters
    sanitized = sanitized.replace(/[<>"`]/g, '');

    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    return sanitized;
  }

  /**
   * Validate Lark-specific inputs
   */
  static validateLarkInput(
    input: any,
    type: 'app_id' | 'app_secret' | 'user_id' | 'chat_id' | 'token',
  ): ValidationResult {
    const rules: Record<string, ValidationRule> = {
      app_id: {
        required: true,
        type: 'string',
        pattern: /^cli_[a-f0-9]+$/,
        minLength: 20,
        maxLength: 50,
      },
      app_secret: {
        required: true,
        type: 'string',
        minLength: 32,
        maxLength: 100,
        pattern: /^[a-zA-Z0-9]+$/,
      },
      user_id: {
        required: true,
        type: 'string',
        pattern: /^(ou_|on_)[a-f0-9]+$/,
        maxLength: 50,
      },
      chat_id: {
        required: true,
        type: 'string',
        pattern: /^oc_[a-f0-9]+$/,
        maxLength: 50,
      },
      token: {
        required: true,
        type: 'string',
        minLength: 20,
        maxLength: 2000,
      },
    };

    return this.validate(input, rules[type]);
  }

  /**
   * Create rate limiting validation
   */
  static createRateLimitValidator(maxRequests: number, windowMs: number) {
    const requestCounts = new Map<string, { count: number; resetTime: number }>();

    return (clientId: string): ValidationResult => {
      const now = Date.now();
      const client = requestCounts.get(clientId);

      if (!client || now > client.resetTime) {
        requestCounts.set(clientId, { count: 1, resetTime: now + windowMs });
        return { valid: true, errors: [] };
      }

      if (client.count >= maxRequests) {
        return {
          valid: false,
          errors: ['Rate limit exceeded'],
          securityRisk: 'medium',
          riskDetails: ['Client exceeded rate limit - potential DoS attempt'],
        };
      }

      client.count++;
      return { valid: true, errors: [] };
    };
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(file: { name: string; size: number; type: string }): ValidationResult {
    const errors: string[] = [];
    const riskDetails: string[] = [];
    let securityRisk: 'low' | 'medium' | 'high' = 'low';

    // File size validation (200MB max)
    if (file.size > 200 * 1024 * 1024) {
      errors.push('File size exceeds 200MB limit');
      securityRisk = 'medium';
      riskDetails.push('Large file upload - potential resource exhaustion');
    }

    // File type validation
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.type)) {
      errors.push('File type not allowed');
      securityRisk = 'high';
      riskDetails.push('Potentially dangerous file type');
    }

    // File name validation
    const nameValidation = this.validate(file.name, {
      pattern: /^[a-zA-Z0-9._-]+$/,
      maxLength: 255,
      blacklist: ['..', '/', '\\', '<', '>', ':', '"', '|', '?', '*'],
    });

    if (!nameValidation.valid) {
      errors.push('Invalid file name');
      securityRisk = 'high';
      riskDetails.push('File name contains dangerous characters');
    }

    return {
      valid: errors.length === 0 && securityRisk !== 'high',
      errors,
      securityRisk,
      riskDetails: riskDetails.length > 0 ? riskDetails : undefined,
    };
  }

  /**
   * Generate secure random string
   */
  static generateSecureRandom(
    length: number = 32,
    charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  ): string {
    const randomBytes = crypto.randomBytes(length);
    let result = '';

    for (let i = 0; i < length; i++) {
      result += charset[randomBytes[i] % charset.length];
    }

    return result;
  }
}

// Pre-configured validators for common use cases
export const CommonValidators = {
  larkAppId: (input: any) => InputValidator.validateLarkInput(input, 'app_id'),
  larkAppSecret: (input: any) => InputValidator.validateLarkInput(input, 'app_secret'),
  larkUserId: (input: any) => InputValidator.validateLarkInput(input, 'user_id'),
  larkChatId: (input: any) => InputValidator.validateLarkInput(input, 'chat_id'),
  larkToken: (input: any) => InputValidator.validateLarkInput(input, 'token'),

  safeString: (input: any) =>
    InputValidator.validate(input, {
      type: 'string',
      maxLength: 1000,
      sanitize: true,
    }),

  restrictedString: (input: any) =>
    InputValidator.validate(input, {
      type: 'string',
      pattern: /^[a-zA-Z0-9_-]+$/,
      maxLength: 100,
    }),
};
