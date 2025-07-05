/**
 * Unified error handling utilities for MCP tools
 * Provides consistent error formatting and response structures across all tools
 */

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Error categories for better error classification and handling
 */
export enum ErrorCategory {
  /** Authentication and authorization errors */
  AUTHENTICATION = 'auth',
  /** Input validation and parameter errors */
  VALIDATION = 'validation',
  /** Lark/Feishu API specific errors */
  API_ERROR = 'api',
  /** Network connectivity and timeout errors */
  NETWORK = 'network',
  /** System and configuration errors */
  SYSTEM = 'system',
  /** Permission and access control errors */
  PERMISSION = 'permission',
  /** Rate limiting and quota errors */
  RATE_LIMIT = 'rate_limit',
  /** Genesis AI system errors */
  GENESIS = 'genesis',
  /** Unknown or unclassified errors */
  UNKNOWN = 'unknown',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Standard error response structure
 */
export interface StandardErrorResponse extends CallToolResult {
  isError: true;
  content: [
    {
      type: 'text';
      text: string;
    },
  ];
  errorCode?: string;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  retryable?: boolean;
  timestamp?: string;
}

/**
 * Error context for better debugging and user guidance
 */
export interface ErrorContext {
  /** Operation being performed (e.g., "send message", "create base") */
  operation: string;
  /** Tool name (e.g., "im.v1.message.create") */
  toolName?: string;
  /** Language for error messages */
  language?: 'en' | 'zh';
  /** Additional context data */
  metadata?: Record<string, any>;
}

/**
 * Known error patterns and their classifications
 */
const ERROR_PATTERNS = {
  // Authentication errors
  'invalid app_id': { category: ErrorCategory.AUTHENTICATION, severity: ErrorSeverity.HIGH, retryable: false },
  'invalid app_secret': { category: ErrorCategory.AUTHENTICATION, severity: ErrorSeverity.HIGH, retryable: false },
  'app access token invalid': {
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
  },
  'user access token invalid': {
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
  },

  // Permission errors
  'insufficient permissions': { category: ErrorCategory.PERMISSION, severity: ErrorSeverity.MEDIUM, retryable: false },
  'permission denied': { category: ErrorCategory.PERMISSION, severity: ErrorSeverity.MEDIUM, retryable: false },

  // Rate limiting
  'rate limited': { category: ErrorCategory.RATE_LIMIT, severity: ErrorSeverity.LOW, retryable: true },
  'too many requests': { category: ErrorCategory.RATE_LIMIT, severity: ErrorSeverity.LOW, retryable: true },

  // Network errors
  econnrefused: { category: ErrorCategory.NETWORK, severity: ErrorSeverity.MEDIUM, retryable: true },
  timeout: { category: ErrorCategory.NETWORK, severity: ErrorSeverity.MEDIUM, retryable: true },
  'network error': { category: ErrorCategory.NETWORK, severity: ErrorSeverity.MEDIUM, retryable: true },

  // Validation errors
  'invalid parameter': { category: ErrorCategory.VALIDATION, severity: ErrorSeverity.LOW, retryable: false },
  'missing required field': { category: ErrorCategory.VALIDATION, severity: ErrorSeverity.LOW, retryable: false },
  'invalid format': { category: ErrorCategory.VALIDATION, severity: ErrorSeverity.LOW, retryable: false },

  // System errors
  'client not initialized': { category: ErrorCategory.SYSTEM, severity: ErrorSeverity.HIGH, retryable: false },
  'configuration error': { category: ErrorCategory.SYSTEM, severity: ErrorSeverity.HIGH, retryable: false },
};

/**
 * Extract error message from various error types
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const errorObj = error as any;

    // Lark API error response format
    if (errorObj?.response?.data) {
      const responseData = errorObj.response.data;
      if (responseData.msg) {
        return responseData.msg;
      }
      if (responseData.error) {
        return responseData.error;
      }
      return JSON.stringify(responseData);
    }

    // Standard error object
    if (errorObj.message) {
      return errorObj.message;
    }

    // Fallback to JSON representation
    return JSON.stringify(error);
  }

  return String(error);
}

/**
 * Classify error based on content and patterns
 */
function classifyError(errorMessage: string): {
  category: ErrorCategory;
  severity: ErrorSeverity;
  retryable: boolean;
} {
  const lowerMessage = errorMessage.toLowerCase();

  for (const [pattern, classification] of Object.entries(ERROR_PATTERNS)) {
    if (lowerMessage.includes(pattern)) {
      return classification;
    }
  }

  // Default classification for unknown errors
  return {
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
  };
}

/**
 * Format error message with appropriate language and context
 */
function formatErrorMessage(
  errorMessage: string,
  context: ErrorContext,
  classification: { category: ErrorCategory; severity: ErrorSeverity },
): string {
  const { operation, language = 'en' } = context;

  // Multilingual error prefixes
  const prefixes = {
    en: {
      [ErrorCategory.AUTHENTICATION]: 'Authentication Error',
      [ErrorCategory.VALIDATION]: 'Validation Error',
      [ErrorCategory.API_ERROR]: 'API Error',
      [ErrorCategory.NETWORK]: 'Network Error',
      [ErrorCategory.SYSTEM]: 'System Error',
      [ErrorCategory.PERMISSION]: 'Permission Error',
      [ErrorCategory.RATE_LIMIT]: 'Rate Limit Error',
      [ErrorCategory.GENESIS]: 'Genesis AI Error',
      [ErrorCategory.UNKNOWN]: 'Error',
    },
    zh: {
      [ErrorCategory.AUTHENTICATION]: '身份验证错误',
      [ErrorCategory.VALIDATION]: '参数验证错误',
      [ErrorCategory.API_ERROR]: 'API错误',
      [ErrorCategory.NETWORK]: '网络错误',
      [ErrorCategory.SYSTEM]: '系统错误',
      [ErrorCategory.PERMISSION]: '权限错误',
      [ErrorCategory.RATE_LIMIT]: '频率限制错误',
      [ErrorCategory.GENESIS]: 'Genesis AI错误',
      [ErrorCategory.UNKNOWN]: '错误',
    },
  };

  const prefix = prefixes[language][classification.category];
  const operationText = language === 'zh' ? `操作: ${operation}` : `Operation: ${operation}`;

  return `${prefix} (${operationText}): ${errorMessage}`;
}

/**
 * Generate user-friendly suggestions based on error type
 */
function generateErrorSuggestions(category: ErrorCategory, language: 'en' | 'zh' = 'en'): string[] {
  const suggestions: Record<'en' | 'zh', Record<ErrorCategory, string[]>> = {
    en: {
      [ErrorCategory.AUTHENTICATION]: [
        'Verify your APP_ID and APP_SECRET are correct',
        'Check if your app is online in the Lark Admin Console',
        'Refresh your access token',
      ],
      [ErrorCategory.VALIDATION]: [
        'Check the input parameters format',
        'Ensure all required fields are provided',
        'Verify data types match the API specification',
      ],
      [ErrorCategory.API_ERROR]: [
        'Check API documentation for this endpoint',
        'Verify request format and parameters',
        'Check API rate limits and quotas',
      ],
      [ErrorCategory.NETWORK]: [
        'Check your internet connection',
        'Verify proxy settings if behind a corporate firewall',
        'Try again in a few moments',
      ],
      [ErrorCategory.PERMISSION]: [
        'Grant required permissions in Lark Admin Console',
        'Contact your administrator for access',
        'Check if the resource exists and you have access',
      ],
      [ErrorCategory.RATE_LIMIT]: [
        'Wait a moment before retrying',
        'Reduce the frequency of API calls',
        'Use batch operations when available',
      ],
      [ErrorCategory.SYSTEM]: [
        'Check your configuration',
        'Ensure all required environment variables are set',
        'Restart the MCP server',
      ],
      [ErrorCategory.GENESIS]: [
        'Check Genesis AI configuration',
        'Verify template selection',
        'Try with simulation mode first',
      ],
      [ErrorCategory.UNKNOWN]: [
        'Check logs for more details',
        'Contact support if the issue persists',
        'Try restarting the application',
      ],
    },
    zh: {
      [ErrorCategory.AUTHENTICATION]: [
        '请验证您的APP_ID和APP_SECRET是否正确',
        '检查您的应用在飞书管理后台是否在线',
        '刷新您的访问令牌',
      ],
      [ErrorCategory.VALIDATION]: ['检查输入参数格式', '确保提供了所有必需字段', '验证数据类型是否符合API规范'],
      [ErrorCategory.API_ERROR]: ['查看此端点的API文档', '验证请求格式和参数', '检查API频率限制和配额'],
      [ErrorCategory.NETWORK]: ['检查您的网络连接', '如果在企业防火墙后，请验证代理设置', '稍后重试'],
      [ErrorCategory.PERMISSION]: [
        '在飞书管理后台授予所需权限',
        '联系管理员获取访问权限',
        '检查资源是否存在且您有访问权限',
      ],
      [ErrorCategory.RATE_LIMIT]: ['稍等片刻后重试', '减少API调用频率', '使用批量操作（如可用）'],
      [ErrorCategory.SYSTEM]: ['检查您的配置', '确保设置了所有必需的环境变量', '重启MCP服务器'],
      [ErrorCategory.GENESIS]: ['检查Genesis AI配置', '验证模板选择', '先尝试模拟模式'],
      [ErrorCategory.UNKNOWN]: ['查看日志获取更多详情', '如果问题持续存在请联系支持', '尝试重启应用程序'],
    },
  };

  return suggestions[language][category] || [];
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: unknown, context: ErrorContext): StandardErrorResponse {
  const errorMessage = extractErrorMessage(error);
  const classification = classifyError(errorMessage);
  const formattedMessage = formatErrorMessage(errorMessage, context, classification);
  const suggestions = generateErrorSuggestions(classification.category, context.language);

  // Include suggestions in the error message if available
  let fullMessage = formattedMessage;
  if (suggestions.length > 0) {
    const suggestionHeader = context.language === 'zh' ? '\n\n建议:' : '\n\nSuggestions:';
    fullMessage += suggestionHeader + '\n• ' + suggestions.join('\n• ');
  }

  return {
    isError: true,
    content: [
      {
        type: 'text' as const,
        text: fullMessage,
      },
    ],
    errorCode: `${classification.category}.${Date.now()}`,
    category: classification.category,
    severity: classification.severity,
    retryable: classification.retryable,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a simple error response without suggestions (for backward compatibility)
 */
export function createSimpleErrorResponse(
  error: unknown,
  operation: string,
  toolName?: string,
  language: 'en' | 'zh' = 'en',
): StandardErrorResponse {
  return createErrorResponse(error, {
    operation,
    toolName,
    language,
  });
}

/**
 * Validate client initialization and return error if not initialized
 */
export function validateClient(
  client: any,
  operation: string,
  language: 'en' | 'zh' = 'en',
): StandardErrorResponse | null {
  if (!client) {
    const message =
      language === 'zh' ? '客户端未初始化，请检查配置' : 'Client not initialized. Please check your configuration.';

    return createErrorResponse(new Error(message), {
      operation,
      language,
    });
  }
  return null;
}

/**
 * Wrap tool execution with standardized error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
): Promise<T | StandardErrorResponse> {
  try {
    return await operation();
  } catch (error) {
    return createErrorResponse(error, context);
  }
}

/**
 * Check if a result is an error response
 */
export function isErrorResponse(result: any): result is StandardErrorResponse {
  return result && result.isError === true;
}

/**
 * Extract error details from an error response
 */
export function getErrorDetails(errorResponse: StandardErrorResponse): {
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  retryable: boolean;
} {
  return {
    message: errorResponse.content[0].text,
    category: errorResponse.category || ErrorCategory.UNKNOWN,
    severity: errorResponse.severity || ErrorSeverity.MEDIUM,
    retryable: errorResponse.retryable || false,
  };
}
