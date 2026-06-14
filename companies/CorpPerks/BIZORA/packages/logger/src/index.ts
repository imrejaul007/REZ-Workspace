/**
 * BIZORA Logger
 * Structured logging with levels, context, and transport support
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  requestId?: string;
  userId?: string;
  duration?: number;
  statusCode?: number;
  method?: string;
  path?: string;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface LoggerConfig {
  service: string;
  level: LogLevel;
  format: 'json' | 'pretty';
  redact?: string[];
}

const LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
};

const REDACT_PATTERNS = [
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'apiKey',
  'api_key',
  'accessToken',
  'refreshToken',
];

export class Logger {
  private service: string;
  private level: LogLevel;
  private format: 'json' | 'pretty';
  private redact: string[];

  constructor(config: Partial<LoggerConfig> = {}) {
    this.service = config.service || 'bizora';
    this.level = config.level || LogLevel.INFO;
    this.format = config.format || (process.env.NODE_ENV === 'production' ? 'json' : 'pretty');
    this.redact = config.redact || REDACT_PATTERNS;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private redactObject(obj: unknown): unknown {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.redactObject(item));
    }

    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (this.redact.some(pattern => key.toLowerCase().includes(pattern))) {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        redacted[key] = this.redactObject(value);
      } else {
        redacted[key] = value;
      }
    }
    return redacted;
  }

  private formatEntry(entry: LogEntry): string {
    const redactedEntry = {
      ...entry,
      metadata: entry.metadata ? this.redactObject(entry.metadata) : undefined,
    };

    if (this.format === 'json') {
      return JSON.stringify(redactedEntry);
    }

    const parts = [
      `[${entry.timestamp}]`,
      `${entry.level.padEnd(5)}`,
      `[${entry.service}]`,
      entry.requestId ? `[${entry.requestId}]` : '',
      entry.message,
    ];

    let output = parts.filter(Boolean).join(' ');

    if (entry.duration) {
      output += ` (${entry.duration}ms)`;
    }

    if (entry.statusCode) {
      output += ` ${entry.statusCode}`;
    }

    if (entry.error) {
      output += `\n  Error: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\n  Stack: ${entry.error.stack.split('\n').slice(0, 3).join('\n  ')}`;
      }
    }

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      output += `\n  Meta: ${JSON.stringify(redactedEntry.metadata)}`;
    }

    return output;
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Partial<LogEntry>
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LEVEL_NAMES[level],
      message,
      service: this.service,
      ...context,
    };

    const output = this.formatEntry(entry);

    switch (level) {
      case LogLevel.DEBUG:
        logger.debug(output);
        break;
      case LogLevel.INFO:
        logger.info(output);
        break;
      case LogLevel.WARN:
        logger.warn(output);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        logger.error(output);
        break;
    }
  }

  debug(message: string, context?: Partial<LogEntry>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Partial<LogEntry>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Partial<LogEntry>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Partial<LogEntry>): void {
    this.log(LogLevel.ERROR, message, {
      ...context,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : undefined,
    });
  }

  fatal(message: string, error?: Error, context?: Partial<LogEntry>): void {
    this.log(LogLevel.FATAL, message, {
      ...context,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : undefined,
    });
  }

  // HTTP request logging
  logRequest(req: { method: string; path: string; ip?: string; headers?: Record<string, string> }, res: { statusCode: number }, duration: number): void {
    const context: Partial<LogEntry> = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      metadata: {
        ip: req.ip,
        userAgent: req.headers?.['user-agent'],
      },
    };

    if (res.statusCode >= 500) {
      this.error(`${req.method} ${req.path}`, undefined, context);
    } else if (res.statusCode >= 400) {
      this.warn(`${req.method} ${req.path}`, context);
    } else {
      this.info(`${req.method} ${req.path}`, context);
    }
  }
}

// Default logger instance
let defaultLogger: Logger | null = null;

export function getLogger(service?: string): Logger {
  if (!defaultLogger) {
    defaultLogger = new Logger({
      service: service || 'bizora',
      level: process.env.LOG_LEVEL as LogLevel
        ? LogLevel[process.env.LOG_LEVEL as keyof typeof LogLevel]
        : LogLevel.INFO,
    });
  }
  return defaultLogger;
}

export function createLogger(service: string, level?: LogLevel): Logger {
  return new Logger({ service, level });
}

// Express middleware for request logging
export function requestLogger(logger: Logger) {
  return (
    req: { method: string; path: string; ip?: string; headers?: Record<string, string>; requestId?: string },
    res: { statusCode: number; on: (event: string, fn: () => void) => void },
    next: () => void
  ) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.logRequest(req, res, duration);
    });

    next();
  };
}

export default Logger;
