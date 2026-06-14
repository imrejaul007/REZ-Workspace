import winston from 'winston';
import { config } from '../config/index.js';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;

  if (Object.keys(metadata).length > 0 && metadata.stack === undefined) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  if (metadata.stack) {
    msg += `\n${metadata.stack}`;
  }

  return msg;
});

// JSON format for file/logging services
const jsonFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  errors({ stack: true }),
  json()
);

// Console format
const consoleErrorFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  consoleFormat
);

// Create the logger
export const logger = winston.createLogger({
  level: config?.service?.logLevel || process.env.LOG_LEVEL || 'info',
  defaultMeta: {
    service: 'privacy-preserving-compute',
    version: '1.0.0',
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        consoleFormat
      ),
    }),
  ],
  exceptionHandlers: [
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        errors({ stack: true }),
        consoleFormat
      ),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        errors({ stack: true }),
        consoleFormat
      ),
    }),
  ],
  exitOnError: false,
});

// Create child logger for specific components
export const createComponentLogger = (component: string) => {
  return logger.child({ component });
};

// Audit logger for compliance
export const auditLogger = winston.createLogger({
  level: 'info',
  defaultMeta: {
    service: 'privacy-preserving-compute',
    category: 'audit',
  },
  format: jsonFormat,
  transports: [
    new winston.transports.Console({
      format: jsonFormat,
    }),
  ],
});

// Security logger for security events
export const securityLogger = winston.createLogger({
  level: 'warn',
  defaultMeta: {
    service: 'privacy-preserving-compute',
    category: 'security',
  },
  format: jsonFormat,
  transports: [
    new winston.transports.Console({
      format: jsonFormat,
    }),
  ],
});

// Privacy logger for privacy-related events
export const privacyLogger = winston.createLogger({
  level: 'info',
  defaultMeta: {
    service: 'privacy-preserving-compute',
    category: 'privacy',
  },
  format: jsonFormat,
  transports: [
    new winston.transports.Console({
      format: jsonFormat,
    }),
  ],
});

export default logger;