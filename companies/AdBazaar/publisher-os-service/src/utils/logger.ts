import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log level from environment
const logLevel = process.env.LOG_LEVEL || 'info';

// Custom format for console
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Custom format for file
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  defaultMeta: {
    service: 'publisher-os-service',
    version: '1.0.0'
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
      handleExceptions: true
    }),

    // Error log file
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),

    // Combined log file
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),

    // Daily rotating file
    new winston.transports.DailyRotateFile({
      filename: path.join(__dirname, '../../logs/%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: 50 * 1024 * 1024, // 50MB
      maxFiles: 30
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/exceptions.log'),
      format: fileFormat
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/rejections.log'),
      format: fileFormat
    })
  ]
});

// Create child logger for specific contexts
export const createChildLogger = (context: Record<string, unknown>) => {
  return logger.child(context);
};

export default logger;
