import winston from 'winston';
import { config } from '../config';

// Custom format for production
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Custom format for development
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Create transports array
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    level: config.logLevel,
    format: config.isProduction ? productionFormat : developmentFormat,
  }),
];

// Add file transports for production
if (config.isProduction) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      format: productionFormat,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      format: productionFormat,
    })
  );
}

// Create the logger instance
export const logger = winston.createLogger({
  level: config.logLevel,
  defaultMeta: {
    service: 'rez-mind-spa-service',
    version: '1.0.0',
  },
  transports,
  exitOnError: false,
});

// Helper methods for structured logging
export const logInfo = (message: string, meta?: Record<string, unknown>): void => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: Error | unknown, meta?: Record<string, unknown>): void => {
  if (error instanceof Error) {
    logger.error(message, {
      ...meta,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
    });
  } else {
    logger.error(message, { ...meta, error });
  }
};

export const logWarn = (message: string, meta?: Record<string, unknown>): void => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: Record<string, unknown>): void => {
  logger.debug(message, meta);
};

// Request logging helper
export const logRequest = (
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  meta?: Record<string, unknown>
): void => {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  logger.log(level, `${method} ${path} ${statusCode} - ${duration}ms`, {
    http: { method, path, statusCode, duration },
    ...meta,
  });
};

// Export logger as default export as well
export default logger;
