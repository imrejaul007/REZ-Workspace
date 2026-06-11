/**
 * @module logger
 * @description PII-safe logging utility for FleetIQ WhatsApp AI with phone number masking
 * @author HOJAI AI Team
 * @version 1.0.0
 */

/**
 * Log levels in order of severity
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log entry structure
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  data?: Record<string, unknown>;
  requestId?: string;
}

/**
 * Configuration for the logger
 */
interface LoggerConfig {
  serviceName: string;
  minLevel: LogLevel;
  redactEmails: boolean;
  redactPhones: boolean;
  redactNames: boolean;
  redactIPs: boolean;
}

/**
 * Redacts PII from a value
 * @param value - The value to redact
 * @returns The redacted value
 */
function REDACT(value: unknown): unknown {
  if (typeof value === 'string') {
    // Redact email addresses
    let redacted = value.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
    // Redact phone numbers (international format) - CRITICAL for WhatsApp
    // Format: +1234567890 -> +1******90 (show country code and last 2 digits)
    redacted = redacted.replace(/(\+\d{1,3})(\d{4})(\d{2})(\d{4})/g, (_, cca, mid, _) => {
      return `${cca}******${mid.slice(-2)}`;
    });
    // Also catch shorter formats
    redacted = redacted.replace(/(\+\d{1,3})[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g, (match) => {
      // More aggressive masking for WhatsApp numbers
      const plusMatch = match.match(/^(\+\d{1,3})/);
      if (plusMatch) {
        return `${plusMatch[1]}****${match.slice(-2)}`;
      }
      return '[PHONE_REDACTED]';
    });
    // Redact IP addresses
    redacted = redacted.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP_REDACTED]');
    return redacted;
  }
  return value;
}

/**
 * Masks a phone number for safe logging
 * Shows only country code and last 2 digits
 * @param phone - The phone number to mask
 * @returns The masked phone number
 * @example +1234567890 -> +1******90
 */
export function maskPhone(phone: string | undefined): string {
  if (!phone) return '[PHONE_UNKNOWN]';

  // Match international phone format
  const match = phone.match(/^(\+\d{1,3})[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}$/);
  if (!match) {
    return '[PHONE_INVALID]';
  }

  const countryCode = match[1];

  // For +1 (US/Canada), show country code and last 2 digits
  if (countryCode === '+1') {
    const digits = phone.replace(/\D/g, '');
    const lastTwo = digits.slice(-2);
    return `${countryCode}******${lastTwo}`;
  }

  // For other country codes, show code and last 2 digits
  const digits = phone.replace(/\D/g, '');
  const lastTwo = digits.slice(-2);
  const maskedMiddle = '*'.repeat(Math.min(digits.length - (countryCode.length - 1) - 2, 6));
  return `${countryCode}${maskedMiddle}${lastTwo}`;
}

/**
 * Recursively redacts PII from an object
 * @param obj - The object to redact
 * @returns A new object with PII redacted
 */
function redactObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return REDACT(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactObject(item));
  }

  if (typeof obj === 'object') {
    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      // Skip known PII fields
      const piiFields = ['password', 'secret', 'token', 'apiKey', 'api_key', 'auth'];
      const isPIIField = piiFields.some(field => key.toLowerCase().includes(field));

      // Special handling for phone-related fields
      const isPhoneField = ['phone', 'mobile', 'tel', 'whatsapp', 'from', 'to'].some(
        field => key.toLowerCase().includes(field)
      );

      if (isPIIField) {
        redacted[key] = '[REDACTED]';
      } else if (isPhoneField && typeof value === 'string') {
        redacted[key] = maskPhone(value);
      } else if (typeof value === 'string') {
        redacted[key] = REDACT(value);
      } else if (typeof value === 'object') {
        redacted[key] = redactObject(value);
      } else {
        redacted[key] = value;
      }
    }
    return redacted;
  }

  return obj;
}

/**
 * Format a log entry for output
 */
function formatLog(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.service}]`;
  const requestPart = entry.requestId ? ` [${entry.requestId}]` : '';
  const message = `${base}${requestPart} ${entry.message}`;
  return entry.data ? `${message} | ${JSON.stringify(entry.data)}` : message;
}

/**
 * Log level priority for filtering
 */
const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Creates a logger instance for FleetIQ WhatsApp AI
 */
export function createLogger(config?: Partial<LoggerConfig>): {
  debug: (message: string, data?: Record<string, unknown>) => void;
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
  log: (level: LogLevel, message: string, data?: Record<string, unknown>, requestId?: string) => void;
  REDACT: (value: unknown) => unknown;
  maskPhone: (phone: string | undefined) => string;
} {
  const finalConfig: LoggerConfig = {
    serviceName: config?.serviceName ?? 'fleetiq-whatsapp-ai',
    minLevel: config?.minLevel ?? 'info',
    redactEmails: config?.redactEmails ?? true,
    redactPhones: config?.redactPhones ?? true,
    redactNames: config?.redactNames ?? false,
    redactIPs: config?.redactIPs ?? true,
  };

  const shouldLog = (level: LogLevel): boolean => {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[finalConfig.minLevel];
  };

  const log = (
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    requestId?: string
  ): void => {
    if (!shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: finalConfig.serviceName,
      message,
      data: data ? (redactObject(data) as Record<string, unknown>) : undefined,
      requestId,
    };

    const formatted = formatLog(entry);

    switch (level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  };

  return {
    debug: (message: string, data?: Record<string, unknown>) => log('debug', message, data),
    info: (message: string, data?: Record<string, unknown>) => log('info', message, data),
    warn: (message: string, data?: Record<string, unknown>) => log('warn', message, data),
    error: (message: string, data?: Record<string, unknown>) => log('error', message, data),
    log,
    REDACT: redactObject,
    maskPhone,
  };
}

// Default logger instance with phone masking enabled
export const logger = createLogger({
  serviceName: 'fleetiq-whatsapp-ai',
  minLevel: 'info',
});

export { REDACT, redactObject };
