/**
 * LEDGERAI - Winston Logger Configuration
 * Production-ready logging with rotation and multiple transports
 */

import winston from 'winston';
import path from 'path';
import config from '../config';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom log format for development
const devFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  if (stack) {
    log += `\n${stack}`;
  }
  if (Object.keys(metadata).length > 0) {
    log += `\n${JSON.stringify(metadata, null, 2)}`;
  }
  return log;
});

// JSON format for production
const prodFormat = combine(
  errors({ stack: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  json()
);

// Development format
const devLogFormat = combine(
  errors({ stack: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  colorize({ all: true }),
  devFormat
);

// Create the logger
const logger = winston.createLogger({
  level: config.logging.level,
  defaultMeta: { service: 'LEDGERAI', version: '1.0.0' },
  format: config.nodeEnv === 'production' ? prodFormat : devLogFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true
    })
  ],
  exitOnError: false,
  exceptionHandlers: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  rejectionHandlers: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Create stream for Morgan HTTP logging (if needed)
export const logStream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};

export default logger;