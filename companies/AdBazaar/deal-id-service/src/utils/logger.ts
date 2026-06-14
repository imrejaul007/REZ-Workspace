import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level.toUpperCase()}] ${message} ${metaStr}`;
  })
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

// Create logs directory if it doesn't exist
import fs from 'fs';
const logsDir = 'logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export function logRequest(req: any): void {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: (req as any).requestId,
  });
}

export function logResponse(req: any, res: any, duration: number): void {
  logger.info('Outgoing response', {
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    requestId: (req as any).requestId,
  });
}

export function logError(error: Error, context?: any): void {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    ...context,
  });
}

export function logServiceCall(service: string, method: string, params?: any): void {
  logger.debug(`Service call: ${service}.${method}`, { params });
}

export function logServiceResponse(service: string, method: string, result: any, duration: number): void {
  logger.debug(`Service response: ${service}.${method}`, {
    duration: `${duration}ms`,
    resultSize: JSON.stringify(result).length,
  });
}

export function logDealEvent(event: string, dealId: string, data?: any): void {
  logger.info(`Deal event: ${event}`, { dealId, ...data });
}

export function logNegotiationEvent(event: string, dealId: string, party: string, data?: any): void {
  logger.info(`Negotiation event: ${event}`, { dealId, party, ...data });
}

export function logAnalyticsEvent(event: string, dealId: string, metrics?: any): void {
  logger.info(`Analytics event: ${event}`, { dealId, metrics });
}

export function logPacingEvent(event: string, dealId: string, pacing?: any): void {
  logger.info(`Pacing event: ${event}`, { dealId, pacing });
}