/**
 * Security logging service
 * Implements MA-SEC-002: Sanitized sensitive data logging for development
 * Ensures PII and sensitive fields are not logged in production
 */

// Simple logger implementation for this service
const logger = {
  info: (msg: string, ...args: unknown[]) => console.log('[Security]', msg, ...args),
  warn: (msg: string, ...args: unknown[]) => console.warn('[Security]', msg, ...args),
  error: (msg: string, ...args: unknown[]) => console.error('[Security]', msg, ...args),
  log: (msg: string, ...args: unknown[]) => console.log('[Security]', msg, ...args),
};

interface LogEntry {
  level: 'log' | 'warn' | 'error';
  message: string;
  details?;
  timestamp: Date;
}

class SecurityLoggingService {
  private logs: LogEntry[] = [];
  private readonly MAX_LOG_ENTRIES = 100;

  // Fields that should never be logged
  private readonly SENSITIVE_FIELDS = [
    'password',
    'token',
    'refreshToken',
    'accessToken',
    'authToken',
    'apiKey',
    'secret',
    'creditCard',
    'cvv',
    'ssn',
    'aadhar',
    'accountNumber',
    'ifscCode',
    'pin',
  ];

  // Patterns that indicate sensitive data
  private readonly SENSITIVE_PATTERNS = [
    /password/i,
    /token/i,
    /key/i,
    /secret/i,
    /auth/i,
    /credit/i,
    /cvv/i,
    /ssn/i,
    /otp/i,
  ];

  /**
   * MA-SEC-002: Sanitize sensitive fields from an object
   */
  private sanitizeObject(obj, depth: number = 0): unknown {
    if (depth > 3) return '[object]'; // Prevent deep logging
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item, depth + 1));
    }

    const sanitized: unknown = {};
    for (const key in obj) {
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        const value = obj[key];
        if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeObject(value, depth + 1);
        } else {
          sanitized[key] = value;
        }
      }
    }
    return sanitized;
  }

  /**
   * Check if a field name is sensitive
   */
  private isSensitiveField(fieldName: string): boolean {
    return (
      this.SENSITIVE_FIELDS.some((field) =>
        fieldName.toLowerCase().includes(field.toLowerCase())
      ) || this.SENSITIVE_PATTERNS.some((pattern) => pattern.test(fieldName))
    );
  }

  /**
   * MA-SEC-002: Safe error logging
   * Sanitizes error messages and details before logging
   */
  public logError(message: string, error?, context?): void {
    if (!__DEV__) {
      // In production, only log safe error messages
      logger.error(`[ERROR] ${message}`);
      return;
    }

    // In development, sanitize sensitive data
    const sanitizedError = error && typeof error === 'object' ? this.sanitizeObject(error) : error;
    const sanitizedContext = context ? this.sanitizeObject(context) : undefined;

    logger.error(`[ERROR] ${message}`, {
      error: sanitizedError,
      context: sanitizedContext,
    });

    this.addLog('error', message, { error: sanitizedError, context: sanitizedContext });
  }

  /**
   * MA-SEC-002: Safe warning logging
   */
  public logWarn(message: string, details?): void {
    if (!__DEV__) {
      // Suppress detailed warnings in production
      return;
    }

    const sanitized = details ? this.sanitizeObject(details) : undefined;
    logger.warn(`[WARN] ${message}`, sanitized);
    this.addLog('warn', message, sanitized);
  }

  /**
   * MA-SEC-002: Safe general logging
   */
  public logDebug(message: string, details?): void {
    if (!__DEV__) {
      // Suppress debug logs in production
      return;
    }

    const sanitized = details ? this.sanitizeObject(details) : undefined;
    logger.log(`[DEBUG] ${message}`, sanitized);
    this.addLog('log', message, sanitized);
  }

  /**
   * Log authentication event safely (MA-AUT-028)
   */
  public logAuthEvent(eventType: string, success: boolean, details?): void {
    const message = `[AUTH] ${eventType} - ${success ? 'SUCCESS' : 'FAILED'}`;

    if (!__DEV__) {
      // In production, log minimally
      logger.error(message);
      return;
    }

    // In development, log with sanitized details
    const sanitized = details ? this.sanitizeObject(details) : undefined;
    logger.log(message, sanitized);
    this.addLog('log', message, sanitized);
  }

  /**
   * Get recent logs (for debugging)
   */
  public getRecentLogs(count: number = 10): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear logs
   */
  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * Add entry to local log buffer
   */
  private addLog(level: 'log' | 'warn' | 'error', message: string, details?): void {
    if (this.logs.length >= this.MAX_LOG_ENTRIES) {
      this.logs.shift(); // Remove oldest entry
    }

    this.logs.push({
      level,
      message,
      details,
      timestamp: new Date(),
    });
  }
}

// Export singleton
export const securityLoggingService = new SecurityLoggingService();
export default securityLoggingService;
