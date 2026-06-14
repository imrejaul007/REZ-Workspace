/**
 * ReZ Upsell - Structured Logger
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  requestId?: string;
  shop?: string;
  duration?: number;
}

class Logger {
  private service: string;
  private version: string;

  constructor(service: string = 'rez-upsell', version: string = '1.0.0') {
    this.service = service;
    this.version = version;
  }

  private format(entry: LogEntry): string {
    return JSON.stringify({
      ...entry,
      service: this.service,
      version: this.version,
    });
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    // Console output
    const output = this.format(entry);

    if (level === 'error') {
      console.error(output);
    } else if (level === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }

    // In production, send to logging service (e.g., Datadog, CloudWatch)
    if (process.env.NODE_ENV === 'production') {
      // Send to external logging
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context);
  }

  // Request logging
  request(req: any, res: any, duration: number) {
    this.info('HTTP Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      shop: req.headers['x-shopify-shop-domain'],
    });
  }

  // Security events
  security(event: string, details: LogContext) {
    this.warn(`Security: ${event}`, details);
  }

  // Business events
  business(event: string, details: LogContext) {
    this.info(`Business: ${event}`, details);
  }
}

export const logger = new Logger();

// Request ID middleware
export function requestId(req: any, res: any, next: any) {
  req.requestId = req.headers['x-request-id'] || generateId();
  res.setHeader('X-Request-ID', req.requestId);
  next();
}

// FIX: Use crypto for secure ID generation instead of Math.random()
function generateId(): string {
  return `${Date.now().toString(36)}-${crypto.randomUUID().replace(/-/g, '')}`;
}

// Error handler
export function errorHandler(err: any, req: any, res: any, next: any) {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    requestId: req.requestId,
    path: req.path,
    method: req.method,
  });

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    requestId: req.requestId,
  });
}
