import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    const logEntry = {
      timestamp,
      level,
      service: 'yield-platform-service',
      requestId: uuidv4(),
      message,
      ...metadata
    };
    return JSON.stringify(logEntry);
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'yield-platform-service' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        logFormat
      )
    })
  ]
});

// Create child logger with request context
export const createRequestLogger = (requestId: string) => {
  return logger.child({ requestId });
};

// Export logger instance
export default logger;