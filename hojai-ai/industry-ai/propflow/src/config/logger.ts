/**
 * PROPFLOW - Real Estate AI Operating System
 * Winston Logger Configuration
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure log directory exists
const logDir = process.env.LOG_DIR || 'logs';
const logPath = path.resolve(process.cwd(), logDir);
if (!fs.existsSync(logPath)) {
  fs.mkdirSync(logPath, { recursive: true });
}

// Custom format for console
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Custom format for file
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports
const transports: winston.transport[] = [
  // Console transport for all environments
  new winston.transports.Console({
    format: consoleFormat,
    handleExceptions: true,
    handleRejections: true
  })
];

// Add file transports only in production or when LOG_LEVEL is set
if (process.env.NODE_ENV === 'production' || process.env.LOG_FILE === 'true') {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 30,
      handleExceptions: true
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 30,
      handleExceptions: true
    })
  );

  // Access log file (for HTTP requests)
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'access.log'),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 30
    })
  );
}

// Create the logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: {
    service: 'PROPFLOW',
    version: '1.0.0',
    port: process.env.PORT || 4807
  },
  transports,
  exitOnError: false
});

// Create child logger for specific modules
export const createModuleLogger = (module: string) => {
  return logger.child({ module });
};

// Log stream for Morgan (HTTP logging)
export const logStream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};

export default logger;