/**
 * AI Concierge Agent - Logger Utility
 * Winston-based structured logging
 */

import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `${timestamp} [${level}]: ${message} ${metaStr}`;
});

const jsonFormat = printf(({ level, message, timestamp, ...meta }) => {
  return JSON.stringify({
    timestamp,
    level,
    message,
    ...meta,
  });
});

const nodeEnv = process.env.NODE_ENV || 'development';
const logFormatType = process.env.LOG_FORMAT || (nodeEnv === 'production' ? 'json' : 'pretty');

const createLogger = (serviceName: string) => {
  const formats = [
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  ];

  if (logFormatType === 'json') {
    formats.push(jsonFormat);
  } else {
    formats.push(colorize(), logFormat);
  }

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(...formats),
    defaultMeta: { service: serviceName },
    transports: [
      new winston.transports.Console(),
    ],
  });
};

export const logger = createLogger(process.env.SERVICE_NAME || 'ai-concierge');

export const createRequestLogger = (requestId: string, endpoint: string, method: string) => {
  const startTime = Date.now();
  return {
    requestId,
    endpoint,
    method,
    startTime,
    info: (message: string, meta?: object) => {
      logger.info(message, { requestId, endpoint, method, ...meta });
    },
    error: (message: string, error?: Error, meta?: object) => {
      logger.error(message, { requestId, endpoint, method, error: error?.message, stack: error?.stack, ...meta });
    },
    warn: (message: string, meta?: object) => {
      logger.warn(message, { requestId, endpoint, method, ...meta });
    },
    debug: (message: string, meta?: object) => {
      logger.debug(message, { requestId, endpoint, method, ...meta });
    },
    complete: (statusCode: number, meta?: object) => {
      const duration = Date.now() - startTime;
      logger.info('Request completed', {
        requestId,
        endpoint,
        method,
        statusCode,
        durationMs: duration,
        ...meta,
      });
    },
  };
};

export const generateRequestId = (): string => {
  return `req_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
};

export default logger;
