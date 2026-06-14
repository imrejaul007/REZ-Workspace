/**
 * Winston Logger Configuration
 */

import winston from 'winston';

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

export function createLogger(serviceName: string = 'rez-atlas-maps') {
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
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: logFormat,
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5,
      })
    );
    transports.push(
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: logFormat,
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5,
      })
    );
  }

  return winston.createLogger({
    level: logLevel,
    defaultMeta: {
      service: serviceName,
      version: process.env.SERVICE_VERSION || '1.0.0',
    },
    transports,
    exitOnError: false,
  });
}

export const logger = createLogger();