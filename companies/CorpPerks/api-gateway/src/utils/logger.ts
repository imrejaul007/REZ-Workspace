import winston from 'winston';
import { RequestContext, SecurityLogContext } from '../types';

// Custom format for structured logging
const structuredFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  const log = {
    timestamp,
    level,
    message,
    ...meta,
  };
  return JSON.stringify(log);
});

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    structuredFormat
  ),
  defaultMeta: { service: 'corpperks-api-gateway' },
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length > 1
            ? ` ${JSON.stringify(meta)}`
            : '';
          return `[${timestamp}] ${level}: ${message}${metaStr}`;
        })
      ),
    }),
  ],
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    })
  );
}

// Request logging helper
export function logRequest(context: RequestContext): void {
  const { requestId, method, path, ip, latency, userId } = context;

  logger.info('Incoming request', {
    requestId,
    method,
    path,
    ip,
    userId: userId || 'anonymous',
    latencyMs: latency,
    type: 'incoming_request',
  });
}

// Response logging helper
export function logResponse(context: RequestContext, statusCode: number): void {
  const { requestId, method, path, ip, latency, userId } = context;

  const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

  logger[logLevel]('Outgoing response', {
    requestId,
    method,
    path,
    ip,
    userId: userId || 'anonymous',
    statusCode,
    latencyMs: latency,
    type: 'outgoing_response',
  });
}

// Error logging helper
export function logError(
  error: Error,
  context: Partial<RequestContext>,
  additionalInfo?: Record<string, unknown>
): void {
  logger.error('Request error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    requestId: context.requestId,
    method: context.method,
    path: context.path,
    ip: context.ip,
    userId: context.userId,
    ...additionalInfo,
    type: 'error',
  });
}

// Service health logging
export function logServiceHealth(
  serviceName: string,
  status: 'healthy' | 'unhealthy' | 'unknown',
  latency?: number,
  error?: string
): void {
  const logLevel = status === 'healthy' ? 'info' : status === 'unhealthy' ? 'error' : 'warn';

  logger[logLevel](`Service health check: ${serviceName}`, {
    serviceName,
    status,
    latencyMs: latency,
    error,
    type: 'health_check',
  });
}

// Security event logging
export function logSecurityEvent(
  event: 'auth_failure' | 'rate_limit_exceeded' | 'invalid_token' | 'suspicious_activity',
  context: SecurityLogContext,
  details?: Record<string, unknown>
): void {
  logger.warn('Security event', {
    event,
    requestId: context.requestId,
    method: context.method,
    path: context.path,
    ip: context.ip,
    userId: context.userId,
    ...context,
    ...details,
    type: 'security',
  });
}

// Proxy event logging
export function logProxyEvent(
  action: 'proxy_start' | 'proxy_end' | 'proxy_error',
  target: string,
  context: Partial<RequestContext>,
  details?: Record<string, unknown>
): void {
  logger.debug(`Proxy ${action}`, {
    target,
    requestId: context.requestId,
    method: context.method,
    path: context.path,
    ...details,
    type: 'proxy',
  });
}

export default logger;
