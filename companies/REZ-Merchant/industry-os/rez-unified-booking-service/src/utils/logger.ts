import winston from 'winston';
import { getConfig } from '../config';

const config = getConfig();

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  config.LOG_FORMAT === 'json'
    ? winston.format.json()
    : winston.format.printf(({ level, message, timestamp, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `${timestamp} [${level.toUpperCase()}] ${message} ${metaStr}`;
      })
);

export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: logFormat,
  defaultMeta: {
    service: 'rez-unified-booking-service',
    version: '1.0.0',
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // Add file transports for production
    // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
  exitOnError: false,
});

// Create child logger for specific components
export function createLogger(component: string): winston.Logger {
  return logger.child({ component });
}

export default logger;