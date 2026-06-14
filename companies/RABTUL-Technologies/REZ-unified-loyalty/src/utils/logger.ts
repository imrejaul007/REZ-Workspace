import winston from 'winston';
import path from 'path';

const logDir = process.env.LOG_DIR || 'logs';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    if (Object.keys(metadata).length > 0) {
      logMessage += ` ${JSON.stringify(metadata)}`;
    }

    if (stack) {
      logMessage += `\n${stack}`;
    }

    return logMessage;
  })
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let logMessage = `${timestamp} [${level}]: ${message}`;

    if (Object.keys(metadata).length > 0) {
      logMessage += ` ${JSON.stringify(metadata)}`;
    }

    return logMessage;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.LOG_LEVEL || 'info'
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    })
  ],
  exitOnError: false
});

// Create a stream for Morgan-like HTTP request logging
export const httpLogStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  }
};

export default logger;
