import winston from 'winston';
import path from 'path';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

const logDirectory = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'incrementality-testing-engine' },
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
      handleExceptions: true
    }),
    new winston.transports.File({
      filename: path.join(logDirectory, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(logDirectory, 'combined.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5
    })
  ],
  exitOnError: false
});

// Create stream for Morgan HTTP logging
export const httpLogStream = {
  write: (message: string) => {
    logger.http(message.trim());
  }
};

// Helper methods for structured logging
export const logInfo = (message: string, meta?: Record<string, unknown>) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
  if (error instanceof Error) {
    logger.error(message, { error: error.message, stack: error.stack, ...meta });
  } else {
    logger.error(message, { error, ...meta });
  }
};

export const logWarn = (message: string, meta?: Record<string, unknown>) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: Record<string, unknown>) => {
  logger.debug(message, meta);
};

export default logger;