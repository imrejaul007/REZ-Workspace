/**
 * REZ Atlas v2 - Winston Logger
 * Standardized logging for qualification agent
 */

import winston from 'winston';
import path from 'path';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const simpleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

const logLevel = process.env.LOG_LEVEL || 'info';
const isProduction = process.env.NODE_ENV === 'production';

const transports: winston.transport[] = [
  new winston.transports.Console({
    level: logLevel,
    format: isProduction ? logFormat : simpleFormat,
    handleExceptions: true,
  }),
];

if (isProduction) {
  const logDir = process.env.LOG_DIR || '/app/logs';
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: logFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
    })
  );
}

export const logger = winston.createLogger({
  level: logLevel,
  defaultMeta: {
    service: 'atlas-qualification-agent',
    version: process.env.SERVICE_VERSION || '2.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
  transports,
  exitOnError: false,
});

export default logger;