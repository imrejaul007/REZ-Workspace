import winston from 'winston';
import path from 'path';

// ============================================================================
// LOGGING CONFIGURATION
// ============================================================================

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `[${timestamp}] ${level.toUpperCase()} ${message} ${metaStr}`;
  })
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level} ${message}${metaStr}`;
  })
);

// ============================================================================
// LOGGER INSTANCE
// ============================================================================

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

// ============================================================================
// LOGGING HELPERS
// ============================================================================

export function logRequest(req: any): void {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  });
}

export function logResponse(req: any, res: any, duration: number): void {
  logger.info('Request completed', {
    method: req.method,
    path: req.path,
    status: res.statusCode,
    duration: `${duration}ms`,
  });
}

export function logError(error: Error, context?: Record<string, any>): void {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    ...context,
  });
}

export function logServiceEvent(service: string, event: string, data?: Record<string, any>): void {
  logger.info(`[${service}] ${event}`, data || {});
}