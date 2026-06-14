import winston from 'winston';
import path from 'path';

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `[${timestamp}] ${level}: ${message} ${metaStr}`;
  })
);

// Custom format for file output (JSON)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'pace-management-service' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat
    }),
    // Error log file
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Pacing specific log
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'pacing.log'),
      format: fileFormat,
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Create child logger for pacing operations
export const pacingLogger = logger.child({ component: 'pacing' });
export const statusLogger = logger.child({ component: 'status' });
export const forecastLogger = logger.child({ component: 'forecast' });
export const alertLogger = logger.child({ component: 'alert' });
export const optimizationLogger = logger.child({ component: 'optimization' });

// Ensure logs directory exists
import fs from 'fs';
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export default logger;
