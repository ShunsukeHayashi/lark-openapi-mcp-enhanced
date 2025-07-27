/**
 * Lark MCP Enhanced - Unified Logging Implementation
 * Integrates with the standardized MCP logging system
 */

import { createMCPLogger, createRequestLogger, LogLevel, LogContext } from '../../../logging-config';

// Create logger instance for Lark MCP Enhanced
export const larkLogger = createMCPLogger('lark-mcp-enhanced');

// Create request/response logger for MCP operations
export const requestLogger = createRequestLogger(larkLogger);

/**
 * Specialized logging functions for Lark MCP operations
 */
export class LarkMCPLogger {
  static logToolExecution(toolName: string, params: any, requestId: string) {
    larkLogger.info('Lark tool execution started', {
      toolName,
      requestId,
      paramsCount: Object.keys(params).length,
      hasUserToken: !!params.userAccessToken
    });
  }

  static logToolSuccess(toolName: string, result: any, requestId: string, duration: number) {
    larkLogger.info('Lark tool execution completed', {
      toolName,
      requestId,
      duration: `${duration}ms`,
      success: true,
      resultSize: JSON.stringify(result).length
    });
  }

  static logToolError(toolName: string, error: Error, requestId: string, duration: number) {
    larkLogger.error('Lark tool execution failed', {
      toolName,
      requestId,
      duration: `${duration}ms`,
      success: false
    }, error);
  }

  static logAPICall(endpoint: string, method: string, statusCode?: number) {
    const context: LogContext = {
      apiEndpoint: endpoint,
      httpMethod: method
    };

    if (statusCode) {
      context.statusCode = statusCode.toString();
    }

    if (statusCode && statusCode >= 400) {
      larkLogger.warn('Lark API call returned error status', context);
    } else {
      larkLogger.debug('Lark API call completed', context);
    }
  }

  static logGenesisOperation(operation: string, sessionId: string, stage?: string) {
    larkLogger.info('Genesis operation', {
      genesisOperation: operation,
      sessionId,
      stage
    });
  }

  static logRateLimit(clientId: string, requestsRemaining: number, resetTime: string) {
    if (requestsRemaining < 10) {
      larkLogger.warn('Rate limit approaching', {
        securityEvent: 'rate_limit_warning',
        clientId,
        requestsRemaining,
        resetTime
      });
    }
  }

  static logPerformanceMetrics(metrics: {
    activeConnections: number;
    memoryUsage: string;
    requestsPerMinute: number;
    averageResponseTime: number;
  }) {
    larkLogger.info('Performance metrics', {
      metrics: {
        active_connections: metrics.activeConnections,
        memory_usage: metrics.memoryUsage,
        requests_per_minute: metrics.requestsPerMinute,
        average_response_time: `${metrics.averageResponseTime}ms`
      }
    });
  }
}

/**
 * Legacy console replacement for gradual migration
 */
export const console = {
  log: (message: string, ...args: any[]) => {
    const fullMessage = [message, ...args].join(' ');
    larkLogger.info(fullMessage);
  },
  error: (message: string, ...args: any[]) => {
    const fullMessage = [message, ...args].join(' ');
    larkLogger.error(fullMessage);
  },
  warn: (message: string, ...args: any[]) => {
    const fullMessage = [message, ...args].join(' ');
    larkLogger.warn(fullMessage);
  },
  info: (message: string, ...args: any[]) => {
    const fullMessage = [message, ...args].join(' ');
    larkLogger.info(fullMessage);
  },
  debug: (message: string, ...args: any[]) => {
    const fullMessage = [message, ...args].join(' ');
    larkLogger.debug(fullMessage);
  }
};

// Export default logger for direct use
export default larkLogger;