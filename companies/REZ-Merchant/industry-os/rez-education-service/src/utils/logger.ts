/**
 * Winston Logger Configuration for Education Service
 */

import winston from 'winston';
import path from 'path';

// Log level from environment or default to info
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]`;

    // Add context metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }

    // Add stack trace for errors
    if (stack) {
      logMessage += `\n${stack}`;
    } else if (message) {
      logMessage += ` ${message}`;
    }

    return logMessage;
  })
);

// Console format with colors for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let logMessage = `${timestamp} ${level}: ${message}`;
    if (Object.keys(meta).length > 0 && level !== 'info') {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    return logMessage;
  })
);

// Create transports array
const transports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
    level: LOG_LEVEL
  })
];

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(process.env.LOG_DIR || './logs', 'education-service-error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(process.env.LOG_DIR || './logs', 'education-service-combined.log'),
      format: logFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: logFormat,
  transports,
  exitOnError: false
});

// Create a child logger with service context
export default logger;